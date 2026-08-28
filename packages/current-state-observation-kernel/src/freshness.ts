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

export function verifyGateFreshness(input: {
  state: KernelState;
  verification: GateFreshnessVerificationV1;
  requiredEvidence: readonly GateCriticalEvidenceItem[];
  observedEvidence: readonly GateCriticalEvidenceItem[];
  sourceObservation?: GateBoundObservationV1;
}): StructuredResult<{ record: GateFreshnessVerificationV1; state: KernelState }> {
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

  if (input.requiredEvidence.length === 0) {
    return fail("HOLD", {
      classification: "AMBIGUOUS_REQUIRED_EVIDENCE",
      message: "ambiguous required evidence → HOLD"
    });
  }

  const observed = evidenceMap(input.observedEvidence);
  let status: GateFreshnessVerificationV1["freshnessStatus"] = "FRESH";

  for (const required of input.requiredEvidence) {
    const found = observed.get(required.key);
    if (found === undefined) {
      status = "UNVERIFIABLE";
      break;
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

  if (status === "FRESH" && input.verification.ttlExpired === true) {
    status = "EXPIRED";
  }

  if (status === "FRESH" && input.verification.freshnessStatus === "EXPIRED" && input.verification.ttlExpired === true) {
    status = "EXPIRED";
  }

  const record: GateFreshnessVerificationV1 = {
    ...input.verification,
    freshnessStatus: status,
    gateCriticalEvidence: [...input.observedEvidence]
  };

  if (status !== "FRESH") {
    const mappedStatus = status === "UNVERIFIABLE" ? "UNVERIFIABLE" : status === "INVALIDATED" ? "INVALIDATED" : "HOLD";
    return fail(mappedStatus === "HOLD" ? "HOLD" : mappedStatus, {
      classification: `FRESHNESS_${status}`,
      message: "technical freshness != authority; FRESH is not granted",
      value: { record, state: appendRecord(input.state, record) }
    });
  }

  return ok({ record, state: appendRecord(input.state, record) });
}

export function freshnessGrantsAuthority(_record: GateFreshnessVerificationV1): boolean {
  return false;
}

export function ttlAloneIsFresh(_ttlExpired: boolean): boolean {
  return false;
}
