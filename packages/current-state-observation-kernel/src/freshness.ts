import { fail, mapFail, ok, type StructuredResult } from "./result.js";
import type {
  GateBoundObservationV1,
  GateCriticalEvidenceItem,
  GateFreshnessVerificationV1,
  KernelState
} from "./types.js";
import { CONTRACT, REQUIRED_MUTATION_VERIFICATION_PURPOSE } from "./types.js";
import { rejectObservationIdReuse } from "./identity.js";
import { appendRecord } from "./state.js";

export function evidenceMemberId(item: GateCriticalEvidenceItem): string {
  return `${item.evidenceType}|${item.sourceResource}|${item.key}`;
}

function evidenceMap(items: readonly GateCriticalEvidenceItem[]): Map<string, GateCriticalEvidenceItem> {
  return new Map(items.map((item) => [evidenceMemberId(item), item]));
}

function membersEqual(required: GateCriticalEvidenceItem, observed: GateCriticalEvidenceItem): boolean {
  if (required.observedValue !== observed.observedValue) {
    return false;
  }
  if (required.observedIdentity !== undefined && required.observedIdentity !== observed.observedIdentity) {
    return false;
  }
  if (required.versionToken !== undefined) {
    return observed.versionToken !== undefined && observed.versionToken === required.versionToken;
  }
  return true;
}

function bindMismatch(bound: string, provided: string | undefined): boolean {
  return provided !== undefined && provided.length > 0 && provided !== bound;
}

export function isApplicableFreshness(
  record: GateFreshnessVerificationV1,
  input: {
    gateBoundObservationId: string;
    logicalMutationId: string;
    attemptGeneration: string;
    verificationPurpose: string;
  }
): boolean {
  const boundId = record.gateBoundObservationId || record.sourceObservationId;
  return (
    boundId === input.gateBoundObservationId &&
    record.logicalMutationId === input.logicalMutationId &&
    record.attemptGeneration === input.attemptGeneration &&
    record.verificationPurpose === input.verificationPurpose
  );
}

export function resolveLatestApplicableFreshness(
  state: KernelState,
  input: {
    gateBoundObservationId: string;
    logicalMutationId: string;
    attemptGeneration: string;
    verificationPurpose?: string;
  }
): GateFreshnessVerificationV1 | undefined {
  const purpose = input.verificationPurpose ?? REQUIRED_MUTATION_VERIFICATION_PURPOSE;
  const applicable: Array<{ record: GateFreshnessVerificationV1; index: number }> = [];
  state.records.forEach((record, index) => {
    if (record.contractType !== CONTRACT.GateFreshnessVerification) {
      return;
    }
    if (
      isApplicableFreshness(record, {
        gateBoundObservationId: input.gateBoundObservationId,
        logicalMutationId: input.logicalMutationId,
        attemptGeneration: input.attemptGeneration,
        verificationPurpose: purpose
      })
    ) {
      applicable.push({ record, index });
    }
  });
  if (applicable.length === 0) {
    return undefined;
  }
  applicable.sort((left, right) => {
    const byCompleted = left.record.observationCompletedAt.localeCompare(right.record.observationCompletedAt);
    if (byCompleted !== 0) {
      return byCompleted;
    }
    const byVerified = left.record.freshnessVerifiedAt.localeCompare(right.record.freshnessVerifiedAt);
    if (byVerified !== 0) {
      return byVerified;
    }
    return left.index - right.index;
  });
  return applicable[applicable.length - 1]?.record;
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

  if (bindMismatch(bound.observationId, input.verification.sourceObservationId)) {
    return fail("HOLD", {
      classification: "FRESHNESS_BINDING_MISMATCH",
      field: "sourceObservationId"
    });
  }
  if (bindMismatch(bound.observationId, input.verification.gateBoundObservationId)) {
    return fail("HOLD", {
      classification: "FRESHNESS_BINDING_MISMATCH",
      field: "gateBoundObservationId"
    });
  }
  if (bindMismatch(bound.logicalMutationId, input.verification.logicalMutationId)) {
    return fail("HOLD", {
      classification: "FRESHNESS_BINDING_MISMATCH",
      field: "logicalMutationId"
    });
  }
  if (bindMismatch(bound.attemptGeneration, input.verification.attemptGeneration)) {
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
    const found = observed.get(evidenceMemberId(required));
    if (found === undefined) {
      missingRequiredMembers.push(evidenceMemberId(required));
      status = "UNVERIFIABLE";
      continue;
    }
    if (status === "UNVERIFIABLE") {
      continue;
    }
    if (!membersEqual(required, found)) {
      status = "INVALIDATED";
      break;
    }
  }

  if (missingRequiredMembers.length > 0) {
    status = "UNVERIFIABLE";
  }

  const freshnessVerifiedAt = input.verification.freshnessVerifiedAt || input.verification.observationCompletedAt;
  if (status === "FRESH" && input.verification.freshnessExpiresAt !== undefined) {
    if (freshnessVerifiedAt >= input.verification.freshnessExpiresAt) {
      status = "EXPIRED";
    }
  }

  const record: GateFreshnessVerificationV1 = {
    ...input.verification,
    sourceObservationId: bound.observationId,
    gateBoundObservationId: bound.observationId,
    logicalMutationId: bound.logicalMutationId,
    attemptGeneration: bound.attemptGeneration,
    verificationPurpose: input.verification.verificationPurpose,
    freshnessVerifiedAt,
    freshnessStatus: status,
    gateCriticalEvidence: [...input.observedEvidence],
    gateCriticalEvidenceReferences:
      input.verification.gateCriticalEvidenceReferences.length > 0
        ? input.verification.gateCriticalEvidenceReferences
        : requiredEvidence.map((item) => evidenceMemberId(item)),
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
