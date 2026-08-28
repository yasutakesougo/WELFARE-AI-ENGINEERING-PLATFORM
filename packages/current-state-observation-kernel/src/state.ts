import { fail, ok, type StructuredResult } from "./result.js";
import { CONTRACT, type GateUseClaimV1, type KernelState, type TerminalOutcomeV1, type VersionedRecord } from "./types.js";

export function emptyKernelState(): KernelState {
  return { records: [] };
}

function commitRecord(state: KernelState, record: VersionedRecord): KernelState {
  return { records: [...state.records, record] };
}

export function findByObservationId(
  state: KernelState,
  observationId: string
): VersionedRecord | undefined {
  return state.records.find((record) => record.observationId === observationId);
}

function activeActionClaims(
  state: KernelState,
  logicalMutationId: string,
  attemptGeneration: string
): readonly GateUseClaimV1[] {
  return state.records.filter((record): record is GateUseClaimV1 => {
    if (record.contractType !== CONTRACT.GateUseClaim) {
      return false;
    }
    if (record.logicalMutationId !== logicalMutationId || record.attemptGeneration !== attemptGeneration) {
      return false;
    }
    if (record.claimResult === "CLAIM_REJECTED") {
      return false;
    }
    return record.claimState === "CLAIMED" || record.claimState === "AVAILABLE";
  });
}

export function acceptRecord(
  state: KernelState,
  record: VersionedRecord
): StructuredResult<KernelState> {
  if (findByObservationId(state, record.observationId) !== undefined) {
    return fail("HOLD", {
      classification: "OBSERVATION_ID_REUSE",
      field: "observationId",
      message: "same observationId reuse is PROHIBITED; original record is preserved"
    });
  }

  if (record.contractType === CONTRACT.GateUseClaim) {
    const claim = record;
    if (
      (claim.claimResult === "CLAIMED" || claim.claimState === "CLAIMED" || claim.claimState === "AVAILABLE") &&
      claim.claimResult !== "CLAIM_REJECTED" &&
      activeActionClaims(state, claim.logicalMutationId, claim.attemptGeneration).length >= 1
    ) {
      return fail("HOLD", {
        classification: "CLAIM_REJECTED",
        code: "CLAIM_REJECTED",
        retryability: "WAIT",
        message: "logicalMutationId + attemptGeneration uniqueness is global across observations"
      });
    }
  }

  if (record.contractType === CONTRACT.TerminalOutcome) {
    const outcome = record;
    if (outcome.mutationAttempts !== 0 && outcome.mutationAttempts !== 1) {
      return fail("FAILED", {
        field: "mutationAttempts",
        classification: "INVALID_FIELD",
        message: "mutation attempts per observation <= 1; only integer 0 or 1 is permitted"
      });
    }
    const priorTrue = state.records.some(
      (existing): existing is TerminalOutcomeV1 =>
        existing.contractType === CONTRACT.TerminalOutcome &&
        existing.sourceObservationId === outcome.sourceObservationId &&
        existing.mutationPerformed === true
    );
    if (priorTrue && outcome.mutationPerformed === true) {
      return fail("HOLD", {
        classification: "MUTATION_ATTEMPTS_EXCEEDED",
        message: "mutation attempts per observation <= 1"
      });
    }
  }

  return ok(commitRecord(state, record));
}

export function appendRecord(state: KernelState, record: VersionedRecord): KernelState {
  const accepted = acceptRecord(state, record);
  if (accepted.status !== "PASS" || accepted.value === undefined) {
    throw new Error(
      `CSOC kernel invariant rejected appendRecord: ${accepted.classification ?? accepted.status}`
    );
  }
  return accepted.value;
}

export function recordsOfType<T extends VersionedRecord>(
  state: KernelState,
  contractType: T["contractType"]
): readonly T[] {
  return state.records.filter((record): record is T => record.contractType === contractType);
}

export function observationIds(state: KernelState): readonly string[] {
  return state.records.map((record) => record.observationId);
}

export const VERSIONED_CONTRACTS = [
  CONTRACT.RepositoryObservation,
  CONTRACT.PullRequestObservation,
  CONTRACT.BranchRelationObservation,
  CONTRACT.GateBoundObservation,
  CONTRACT.GateFreshnessVerification,
  CONTRACT.GateUseClaim,
  CONTRACT.TerminalOutcome
] as const;
