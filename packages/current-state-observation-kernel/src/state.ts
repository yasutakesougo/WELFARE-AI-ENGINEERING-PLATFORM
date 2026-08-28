import { CONTRACT, type KernelState, type VersionedRecord } from "./types.js";

export function emptyKernelState(): KernelState {
  return { records: [] };
}

export function appendRecord(
  state: KernelState,
  record: VersionedRecord
): KernelState {
  return { records: [...state.records, record] };
}

export function recordsOfType<T extends VersionedRecord>(
  state: KernelState,
  contractType: T["contractType"]
): readonly T[] {
  return state.records.filter((record): record is T => record.contractType === contractType);
}

export function findByObservationId(
  state: KernelState,
  observationId: string
): VersionedRecord | undefined {
  return state.records.find((record) => record.observationId === observationId);
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
