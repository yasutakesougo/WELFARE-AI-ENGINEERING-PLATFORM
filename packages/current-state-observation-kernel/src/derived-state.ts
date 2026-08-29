import type { KernelState, TerminalOutcomeV1 } from "./types.js";
import { CONTRACT, TERMINAL_STATES } from "./types.js";

export function terminalsForObservation(
  state: KernelState,
  sourceObservationId: string
): readonly TerminalOutcomeV1[] {
  return state.records.filter(
    (record): record is TerminalOutcomeV1 =>
      record.contractType === CONTRACT.TerminalOutcome && record.sourceObservationId === sourceObservationId
  );
}

export function observationHasTerminalState(state: KernelState, sourceObservationId: string): boolean {
  return terminalsForObservation(state, sourceObservationId).some((terminal) =>
    (TERMINAL_STATES as readonly string[]).includes(terminal.claimState)
  );
}

export function derivedConsumed(state: KernelState, sourceObservationId: string): boolean {
  return terminalsForObservation(state, sourceObservationId).some(
    (terminal) => terminal.claimState === "TERMINAL_CONSUMED_SUCCESS"
  );
}
