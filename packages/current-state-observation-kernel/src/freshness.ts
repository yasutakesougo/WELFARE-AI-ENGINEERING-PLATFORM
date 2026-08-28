import { fail, mapFail, ok, type StructuredResult } from "./result.js";
import type {
  GateBoundObservationV1,
  GateCriticalEvidenceItem,
  GateFreshnessVerificationV1,
  KernelState
} from "./types.js";
import { CONTRACT } from "./types.js";
import { rejectObservationIdReuse } from "./identity.js";
import { appendRecord } from "./state.js";

function itemKey(item: GateCriticalEvidenceItem): string {
  return item.key;
}

function evidenceMap(items: readonly GateCriticalEvidenceItem[]): Map<string, GateCriticalEvidenceItem> {
  return new Map(items.map((item) => [itemKey(item), item]));
}

function bindMismatch(
  field: string,
  bound: string,
  provided: string | undefined
): boolean {
  return provided !== undefined && provided.length > 0 && provided !== bound;
}

export function verifyGateFreshness(input: {
  state: KernelState;
  verification: GateFreshnessVerificationV1;
  observedEvidence: readonly GateCriticalEvidenceItem[];
  sourceObservation?: GateBoundObservationV1;
}): StructuredResult<{ record: GateFreshnessVerificationV1; state: KernelState }> {
  if (input.sourceObservation === undefined) {
    return fail("HOLD", {
      classification: "MISSING_BOUND_OBSERVATION",
      message: "verifyGateFreshness MUST derive the required evidence set from GateBoundObservation@v1"
    });
  }

  const bound = input.sourceObservation;
  const reuse = rejectObservationIdReuse(input.state, input.verification.observationId);
  if (reuse.status !== "PASS") {
    return mapFail(reuse);
  }

  const previous = input.state.records.find(
    (record): record is GateFreshnessVerificationV1 =>
      record.contractType === CONTRACT.GateFreshnessVerification &&
      record.observationId === input.verification.observationId
  );
  if (previous !== undefined) {
    return fail("HOLD", {
      classification: "FRESHNESS_RECORD_IMMUTABLE",
      message: "earlier verification records remain byte-for-byte unchanged"
    });
  }

  if (bindMismatch("sourceObservationId", bound.observationId, input.verification.sourceObservationId)) {
    return fail("HOLD", {
      classification: "FRESHNESS_BINDING_MISMATCH",
      field: "sourceObservationId",
      message: "freshness verification MUST bind to the GateBoundObservation@v1 identity"
    });
  }
  if (bindMismatch("logicalMutationId", bound.logicalMutationId, input.verification.logicalMutationId)) {
    return fail("HOLD", {
      classification: "FRESHNESS_BINDING_MISMATCH",
      field: "logicalMutationId"
    });
  }
  if (bindMismatch("attemptGeneration", bound.attemptGeneration, input.verification.attemptGeneration)) {
    return fail("HOLD", {
      classification: "FRESHNESS_BINDING_MISMATCH",
      field: "attemptGeneration"
    });
  }

  const requiredEvidence = bound.gateCriticalEvidence;
  if (requiredEvidence.length === 0) {
    return fail("HOLD", {
      classification: "AMBIGUOUS_REQUIRED_EVIDENCE",
      message: "ambiguous required evidence → HOLD"
    });
  }

  const observed = evidenceMap(input.observedEvidence);
  const missingRequiredMembers: string[] = [];
  let status: GateFreshnessVerificationV1["freshnessStatus"] = "FRESH";

  for (const required of requiredEvidence) {
    const found = observed.get(required.key);
    if (found === undefined) {
      missingRequiredMembers.push(required.key);
      status = "UNVERIFIABLE";
      continue;
    }
    if (status === "UNVERIFIABLE") {
      continue;
    }
    if (found.value !== required.value) {
      status = "INVALIDATED";
      break;
    }
    if (required.versionToken !== undefined) {
      if (found.versionToken === undefined || found.versionToken !== required.versionToken) {
        status = "INVALIDATED";
        break;
      }
    }
  }

  if (missingRequiredMembers.length > 0) {
    status = "UNVERIFIABLE";
  }

  if (status === "FRESH" && input.verification.ttlExpired === true) {
    status = "EXPIRED";
  }

  const record: GateFreshnessVerificationV1 = {
    ...input.verification,
    sourceObservationId: bound.observationId,
    logicalMutationId: bound.logicalMutationId,
    attemptGeneration: bound.attemptGeneration,
    verificationPurpose: input.verification.verificationPurpose,
    freshnessStatus: status,
    gateCriticalEvidence: [...input.observedEvidence],
    sourceNativeBindings: input.verification.sourceNativeBindings,
    evidenceComparison: {
      requiredEvidence: [...requiredEvidence],
      observedEvidence: [...input.observedEvidence],
      missingRequiredMembers
    }
  };

  const nextState = appendRecord(input.state, record);
  if (status !== "FRESH") {
    const resultStatus = status === "UNVERIFIABLE" ? "UNVERIFIABLE" : status === "INVALIDATED" ? "INVALIDATED" : "HOLD";
    return fail(resultStatus === "HOLD" ? "HOLD" : resultStatus, {
      classification: `FRESHNESS_${status}`,
      message: "technical freshness != authority; FRESH is not granted",
      value: { record, state: nextState }
    });
  }

  return ok({ record, state: nextState });
}

export function freshnessGrantsAuthority(_record: GateFreshnessVerificationV1): boolean {
  return false;
}

export function ttlAloneIsFresh(_ttlExpired: boolean): boolean {
  return false;
}
