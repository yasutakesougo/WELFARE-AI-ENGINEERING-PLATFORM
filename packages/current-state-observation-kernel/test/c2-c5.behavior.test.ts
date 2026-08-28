import { describe, expect, it } from "vitest";
import {
  acceptRecord,
  appendRecord,
  attemptGateUseClaim,
  canStartExecutableAttempt,
  derivedConsumed,
  emptyKernelState,
  evaluateAuthority,
  evaluateMutationEligibility,
  freshnessGrantsAuthority,
  isImmediateRetryAuthorized,
  newObservationRequiredMeansImmediateRetry,
  originalRecordPreserved,
  parseGateBoundObservation,
  parseGateUseClaim,
  parseTerminalOutcome,
  recordTerminalOutcome,
  rejectObservationIdReuse,
  resolveLatestApplicableFreshness,
  ttlAloneIsFresh,
  verifyGateFreshness
} from "../src/index.js";
import { REQUIRED_MUTATION_VERIFICATION_PURPOSE, VERIFICATION_PURPOSE } from "../src/types.js";
import {
  CI_EVIDENCE,
  COMPLETE_EVIDENCE,
  HEAD_EVIDENCE,
  POLICY_EVIDENCE,
  REVIEW_EVIDENCE,
  T1,
  T2,
  claimRecord,
  evidenceItem,
  freshnessRecord,
  gateBound,
  seedFreshState,
  terminalRecord
} from "./helpers.js";
import { PARENT_SCENARIO_IDS, PARENT_SCENARIO_TITLES, type ParentScenarioId } from "./parent-scenarios.js";

interface Scenario {
  id: ParentScenarioId;
  title: string;
  path: "positive" | "fail-closed";
  run: () => void;
}

function withChanged(item: (typeof COMPLETE_EVIDENCE)[number], observedValue: string) {
  return COMPLETE_EVIDENCE.map((entry) => (entry.key === item.key ? { ...entry, observedValue } : entry));
}

const parentScenarios: Scenario[] = [
  {
    id: "CSOC-C2-V25",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V25"],
    path: "fail-closed",
    run: () => {
      const observation = gateBound();
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-ci-changed" }),
        sourceObservation: observation,
        observedEvidence: withChanged(CI_EVIDENCE, "FAILURE")
      });
      expect(observation.identityBefore.headSha).toBe(observation.identityAfter.headSha);
      expect(result.status).toBe("INVALIDATED");
      expect(result.value?.record.freshnessStatus).toBe("INVALIDATED");
      const eligibility = evaluateMutationEligibility({
        state: result.value!.state,
        observation,
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(eligibility.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C2-V25",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V25"],
    path: "positive",
    run: () => {
      const seeded = seedFreshState();
      expect(seeded.verificationResult.status).toBe("PASS");
      expect(seeded.observation.identityBefore.headSha).toBe(seeded.observation.identityAfter.headSha);
      expect(seeded.freshness?.freshnessStatus).toBe("FRESH");
    }
  },
  {
    id: "CSOC-C2-V26",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V26"],
    path: "fail-closed",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-review-dismissed" }),
        sourceObservation: gateBound(),
        observedEvidence: withChanged(REVIEW_EVIDENCE, "DISMISSED")
      });
      expect(result.status).toBe("INVALIDATED");
    }
  },
  {
    id: "CSOC-C2-V26",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V26"],
    path: "positive",
    run: () => {
      expect(seedFreshState().verificationResult.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V27",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V27"],
    path: "fail-closed",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-policy" }),
        sourceObservation: gateBound(),
        observedEvidence: withChanged(POLICY_EVIDENCE, "required-reviews=2")
      });
      expect(result.status).toBe("INVALIDATED");
    }
  },
  {
    id: "CSOC-C2-V27",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V27"],
    path: "positive",
    run: () => {
      expect(seedFreshState().verificationResult.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V28",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V28"],
    path: "fail-closed",
    run: () => {
      const seeded = seedFreshState();
      const result = evaluateMutationEligibility({
        state: seeded.state,
        observation: seeded.observation,
        authority: { decision: "NONE" }
      });
      expect(seeded.verificationResult.status).toBe("PASS");
      expect(result.status).toBe("NOT_AUTHORIZED");
      expect(result.classification).toBe("AUTHORITY_FAILURE");
    }
  },
  {
    id: "CSOC-C2-V28",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V28"],
    path: "positive",
    run: () => {
      const seeded = seedFreshState();
      expect(
        evaluateMutationEligibility({
          state: seeded.state,
          observation: seeded.observation,
          authority: { decision: "GO", authorityDecisionRef: "auth-1" }
        }).status
      ).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V29",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V29"],
    path: "fail-closed",
    run: () => {
      const observation = gateBound();
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-unavail" }),
        sourceObservation: observation,
        observedEvidence: COMPLETE_EVIDENCE.filter((item) => item.key !== CI_EVIDENCE.key)
      });
      expect(result.status).toBe("UNVERIFIABLE");
      const eligibility = evaluateMutationEligibility({
        state: result.value!.state,
        observation,
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(eligibility.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C2-V29",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V29"],
    path: "positive",
    run: () => {
      expect(seedFreshState().verificationResult.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V30",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V30"],
    path: "fail-closed",
    run: () => {
      expect("consumed" in gateBound()).toBe(false);
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({
          observationId: "fresh-expired",
          freshnessVerifiedAt: T1,
          freshnessExpiresAt: "2026-08-28T00:59:00Z"
        }),
        sourceObservation: gateBound(),
        observedEvidence: COMPLETE_EVIDENCE
      });
      expect(result.status).toBe("HOLD");
      expect(result.value?.record.freshnessStatus).toBe("EXPIRED");
      expect(result.value?.record.freshnessExpiresAt).toBe("2026-08-28T00:59:00Z");
      expect(ttlAloneIsFresh(false)).toBe(false);
    }
  },
  {
    id: "CSOC-C2-V30",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V30"],
    path: "positive",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({
          observationId: "fresh-unexpired",
          freshnessExpiresAt: "2026-08-28T02:00:00Z"
        }),
        sourceObservation: gateBound(),
        observedEvidence: COMPLETE_EVIDENCE
      });
      expect(result.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V31",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V31"],
    path: "fail-closed",
    run: () => {
      const observation = gateBound();
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-precondition" }),
        sourceObservation: observation,
        observedEvidence: COMPLETE_EVIDENCE.map((item) =>
          item.key === HEAD_EVIDENCE.key
            ? { ...item, observedValue: "head-moved", observedIdentity: "head-moved", versionToken: "v2" }
            : item
        )
      });
      expect(result.status).toBe("INVALIDATED");
      const eligibility = evaluateMutationEligibility({
        state: result.value!.state,
        observation,
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(eligibility.status).toBe("HOLD");
      expect(eligibility.value?.eligible).toBe(false);
    }
  },
  {
    id: "CSOC-C2-V31",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V31"],
    path: "positive",
    run: () => {
      const seeded = seedFreshState();
      expect(seeded.observation.observedHeadSha).toBe(HEAD_EVIDENCE.observedValue);
      expect(seeded.verificationResult.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V32",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V32"],
    path: "positive",
    run: () => {
      const seeded = seedFreshState();
      const result = evaluateMutationEligibility({
        state: seeded.state,
        observation: seeded.observation,
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(result.status).toBe("PASS");
      expect(result.value?.eligible).toBe(true);
    }
  },
  {
    id: "CSOC-C2-V32",
    title: PARENT_SCENARIO_TITLES["CSOC-C2-V32"],
    path: "fail-closed",
    run: () => {
      const observation = gateBound();
      const first = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-v1", observationCompletedAt: T1 }),
        sourceObservation: observation,
        observedEvidence: COMPLETE_EVIDENCE
      });
      const second = verifyGateFreshness({
        state: first.value!.state,
        verification: freshnessRecord({
          observationId: "fresh-v2",
          observationCompletedAt: T2,
          freshnessVerifiedAt: T2
        }),
        sourceObservation: observation,
        observedEvidence: withChanged(CI_EVIDENCE, "FAILURE")
      });
      expect(second.value?.record.freshnessStatus).toBe("INVALIDATED");
      const eligibility = evaluateMutationEligibility({
        state: second.value!.state,
        observation,
        freshness: first.value!.record,
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(eligibility.status).toBe("HOLD");
      expect(eligibility.classification).toBe("OLDER_FRESH_UNUSABLE");
    }
  },
  {
    id: "CSOC-C3-V33",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V33"],
    path: "fail-closed",
    run: () => {
      const first = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord({ claimantId: "claimant-a", claimId: "claim-event-a" })
      });
      expect(first.status).toBe("PASS");
      const second = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({
          observationId: "claim-2",
          claimId: "claim-event-b",
          claimantId: "claimant-b",
          claimedAt: T2
        })
      });
      expect(second.status).toBe("HOLD");
      expect(second.classification).toBe("CLAIM_REJECTED");
      expect(second.retryability).toBe("WAIT");
      expect(second.value?.mutationPerformed).toBe(false);
      expect(second.value?.mutationAttempts).toBe(0);
      expect(second.value?.record?.claimResult).toBe("CLAIM_REJECTED");
      expect(second.value?.record?.claimId).toBe("claim-event-b");
      expect(second.value?.record?.claimantId).toBe("claimant-b");
      expect(second.value?.record?.sourceObservationId).toBe("obs-gate-1");
      expect(second.value?.record?.logicalMutationId).toBe("mut-1");
      expect(second.value?.record?.attemptGeneration).toBe("gen-1");
    }
  },
  {
    id: "CSOC-C3-V33",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V33"],
    path: "positive",
    run: () => {
      const result = attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() });
      expect(result.status).toBe("PASS");
      expect(result.value?.record?.claimResult).toBe("CLAIMED");
    }
  },
  {
    id: "CSOC-C3-V34",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V34"],
    path: "fail-closed",
    run: () => {
      const first = attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() });
      const second = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({ observationId: "claim-lose", claimId: "claim-event-lose", attemptGeneration: "gen-2" })
      });
      expect(second.classification).toBe("CLAIM_REJECTED");
      expect(second.retryability).toBe("WAIT");
      expect(second.value?.record?.claimResult).toBe("CLAIM_REJECTED");
    }
  },
  {
    id: "CSOC-C3-V34",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V34"],
    path: "positive",
    run: () => {
      expect(attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V35",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V35"],
    path: "fail-closed",
    run: () => {
      const result = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord(),
        winningAttemptPhase: "IN_FLIGHT"
      });
      expect(result.classification).toBe("CLAIM_REJECTED");
      expect(result.value?.record?.claimResult).toBe("CLAIM_REJECTED");
      expect(canStartExecutableAttempt({ winningAttemptPhase: "IN_FLIGHT" }).status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C3-V35",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V35"],
    path: "positive",
    run: () => {
      expect(attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V36",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V36"],
    path: "fail-closed",
    run: () => {
      const result = recordTerminalOutcome({
        state: emptyKernelState(),
        outcome: terminalRecord(),
        ambiguous: true
      });
      expect(result.status).toBe("HOLD");
      expect(result.value?.record.claimState).toBe("TERMINAL_OUTCOME_UNKNOWN");
      expect(result.value?.record.mutationPerformed).toBe("UNKNOWN");
      expect(canStartExecutableAttempt({ lastTerminal: result.value?.record }).classification).toBe(
        "TERMINAL_OUTCOME_UNKNOWN"
      );
    }
  },
  {
    id: "CSOC-C3-V36",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V36"],
    path: "positive",
    run: () => {
      const result = recordTerminalOutcome({
        state: emptyKernelState(),
        outcome: terminalRecord({ claimState: "TERMINAL_NO_MUTATION", mutationPerformed: false, mutationAttempts: 0 })
      });
      expect(result.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V37",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V37"],
    path: "fail-closed",
    run: () => {
      const terminal = recordTerminalOutcome({
        state: emptyKernelState(),
        outcome: terminalRecord({ claimState: "TERMINAL_CONSUMED_SUCCESS" })
      });
      const again = attemptGateUseClaim({
        state: terminal.value!.state,
        claim: claimRecord({ observationId: "claim-after-terminal", claimId: "claim-event-after", attemptGeneration: "gen-9" })
      });
      expect(again.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C3-V37",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V37"],
    path: "positive",
    run: () => {
      expect(attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V38",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V38"],
    path: "fail-closed",
    run: () => {
      const result = canStartExecutableAttempt({});
      expect(result.classification).toBe("NEW_OBSERVATION_REQUIRED");
      expect(newObservationRequiredMeansImmediateRetry("NEW_OBSERVATION_REQUIRED")).toBe(false);
      expect(isImmediateRetryAuthorized(result)).toBe(false);
    }
  },
  {
    id: "CSOC-C3-V38",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V38"],
    path: "positive",
    run: () => {
      expect(canStartExecutableAttempt({ reconciliationProvesSafe: true }).status).toBe("PASS");
      expect(
        canStartExecutableAttempt({
          lastTerminal: terminalRecord({
            claimState: "TERMINAL_NO_MUTATION",
            mutationPerformed: false,
            mutationAttempts: 0
          })
        }).status
      ).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V39",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V39"],
    path: "fail-closed",
    run: () => {
      const first = attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() });
      const claim = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({ observationId: "claim-lose", claimId: "claim-event-lose" })
      });
      const authority = evaluateAuthority({ decision: "NONE" });
      expect(claim.classification).toBe("CLAIM_REJECTED");
      expect(claim.status).toBe("HOLD");
      expect(authority.status).toBe("NOT_AUTHORIZED");
      expect(claim.status).not.toBe(authority.status);
    }
  },
  {
    id: "CSOC-C3-V39",
    title: PARENT_SCENARIO_TITLES["CSOC-C3-V39"],
    path: "positive",
    run: () => {
      expect(evaluateAuthority({ decision: "GO", authorityDecisionRef: "auth-1" }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C4-V40",
    title: PARENT_SCENARIO_TITLES["CSOC-C4-V40"],
    path: "fail-closed",
    run: () => {
      const first = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord({
          observationId: "claim-o1",
          claimId: "claim-event-o1",
          sourceObservationId: "obs-O1",
          logicalMutationId: "M",
          attemptGeneration: "G"
        })
      });
      const second = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({
          observationId: "claim-o2",
          claimId: "claim-event-o2",
          claimantId: "claimant-o2",
          sourceObservationId: "obs-O2",
          logicalMutationId: "M",
          attemptGeneration: "G"
        })
      });
      expect(second.classification).toBe("CLAIM_REJECTED");
      expect(second.value?.mutationAttempts).toBe(0);
      expect(second.value?.record?.claimResult).toBe("CLAIM_REJECTED");
      expect(second.value?.record?.sourceObservationId).toBe("obs-O2");
    }
  },
  {
    id: "CSOC-C4-V40",
    title: PARENT_SCENARIO_TITLES["CSOC-C4-V40"],
    path: "positive",
    run: () => {
      const first = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord({
          observationId: "claim-o1",
          sourceObservationId: "obs-O1",
          logicalMutationId: "M",
          attemptGeneration: "G"
        })
      });
      const other = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({
          observationId: "claim-o2",
          claimId: "claim-event-o2",
          sourceObservationId: "obs-O2",
          logicalMutationId: "M-other",
          attemptGeneration: "G"
        })
      });
      expect(other.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C4-V41",
    title: PARENT_SCENARIO_TITLES["CSOC-C4-V41"],
    path: "fail-closed",
    run: () => {
      const parsed = parseGateUseClaim({ ...claimRecord(), attemptGeneration: "" });
      expect(parsed.status).toBe("FAILED");
      expect(parsed.field).toBe("attemptGeneration");
    }
  },
  {
    id: "CSOC-C4-V41",
    title: PARENT_SCENARIO_TITLES["CSOC-C4-V41"],
    path: "positive",
    run: () => {
      expect(parseGateUseClaim(claimRecord()).value?.attemptGeneration).toBe("gen-1");
    }
  },
  {
    id: "CSOC-C4-V42",
    title: PARENT_SCENARIO_TITLES["CSOC-C4-V42"],
    path: "fail-closed",
    run: () => {
      const first = gateBound();
      const state = appendRecord(emptyKernelState(), first);
      expect(rejectObservationIdReuse(state, first.observationId).status).toBe("HOLD");
      expect(acceptRecord(state, gateBound({ observationId: first.observationId })).classification).toBe(
        "OBSERVATION_ID_REUSE"
      );
      expect(originalRecordPreserved(state, first.observationId).value).toEqual(first);
    }
  },
  {
    id: "CSOC-C4-V42",
    title: PARENT_SCENARIO_TITLES["CSOC-C4-V42"],
    path: "positive",
    run: () => {
      const parsed = parseGateBoundObservation(gateBound());
      expect(parsed.status).toBe("PASS");
      expect(parsed.value).not.toHaveProperty("consumed");
    }
  },
  {
    id: "CSOC-C4-V43",
    title: PARENT_SCENARIO_TITLES["CSOC-C4-V43"],
    path: "fail-closed",
    run: () => {
      const observation = gateBound();
      const seeded = seedFreshState({ observation });
      const terminal = recordTerminalOutcome({
        state: seeded.state,
        outcome: terminalRecord({ sourceObservationId: observation.observationId })
      });
      expect(derivedConsumed(terminal.value!.state, observation.observationId)).toBe(true);
      const eligibility = evaluateMutationEligibility({
        state: terminal.value!.state,
        observation,
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(eligibility.status).toBe("HOLD");
      expect(["GATE_CONSUMED", "GATE_NOT_REUSABLE"]).toContain(eligibility.classification);
    }
  },
  {
    id: "CSOC-C4-V43",
    title: PARENT_SCENARIO_TITLES["CSOC-C4-V43"],
    path: "positive",
    run: () => {
      const seeded = seedFreshState();
      expect(derivedConsumed(seeded.state, seeded.observation.observationId)).toBe(false);
      expect(
        evaluateMutationEligibility({
          state: seeded.state,
          observation: seeded.observation,
          authority: { decision: "GO", authorityDecisionRef: "auth-1" }
        }).status
      ).toBe("PASS");
    }
  },
  {
    id: "CSOC-C5-V44",
    title: PARENT_SCENARIO_TITLES["CSOC-C5-V44"],
    path: "fail-closed",
    run: () => {
      const first = seedFreshState({ verification: { observationId: "fresh-1" } });
      const original = first.freshness;
      const second = verifyGateFreshness({
        state: first.state,
        verification: freshnessRecord({ observationId: "fresh-1", freshnessStatus: "EXPIRED" }),
        sourceObservation: first.observation,
        observedEvidence: COMPLETE_EVIDENCE
      });
      expect(second.status).toBe("HOLD");
      expect(first.state.records[0]).toEqual(original);
    }
  },
  {
    id: "CSOC-C5-V44",
    title: PARENT_SCENARIO_TITLES["CSOC-C5-V44"],
    path: "positive",
    run: () => {
      const first = seedFreshState({ verification: { observationId: "fresh-1" } });
      expect(first.state.records[0]).toEqual(first.freshness);
    }
  },
  {
    id: "CSOC-C5-V45",
    title: PARENT_SCENARIO_TITLES["CSOC-C5-V45"],
    path: "positive",
    run: () => {
      const first = seedFreshState({ verification: { observationId: "fresh-1" } });
      const second = verifyGateFreshness({
        state: first.state,
        verification: freshnessRecord({ observationId: "fresh-2", observationCompletedAt: T2, freshnessVerifiedAt: T2 }),
        sourceObservation: first.observation,
        observedEvidence: COMPLETE_EVIDENCE
      });
      expect(second.status).toBe("PASS");
      expect(second.value!.state.records).toHaveLength(2);
      expect(first.state.records[0]).toEqual(first.freshness);
    }
  },
  {
    id: "CSOC-C5-V45",
    title: PARENT_SCENARIO_TITLES["CSOC-C5-V45"],
    path: "fail-closed",
    run: () => {
      const first = seedFreshState({ verification: { observationId: "fresh-1" } });
      const replay = verifyGateFreshness({
        state: first.state,
        verification: freshnessRecord({ observationId: "fresh-1" }),
        sourceObservation: first.observation,
        observedEvidence: COMPLETE_EVIDENCE
      });
      expect(replay.status).toBe("HOLD");
      expect(replay.classification).toBe("OBSERVATION_ID_REUSE");
    }
  },
  {
    id: "CSOC-C5-V46",
    title: PARENT_SCENARIO_TITLES["CSOC-C5-V46"],
    path: "fail-closed",
    run: () => {
      const observation = gateBound();
      const v1 = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-v1", observationCompletedAt: T1 }),
        sourceObservation: observation,
        observedEvidence: COMPLETE_EVIDENCE
      });
      const v2 = verifyGateFreshness({
        state: v1.value!.state,
        verification: freshnessRecord({
          observationId: "fresh-v2",
          observationCompletedAt: T2,
          freshnessVerifiedAt: T2
        }),
        sourceObservation: observation,
        observedEvidence: withChanged(REVIEW_EVIDENCE, "DISMISSED")
      });
      const latest = resolveLatestApplicableFreshness(v2.value!.state, {
        gateBoundObservationId: observation.observationId,
        logicalMutationId: observation.logicalMutationId,
        attemptGeneration: observation.attemptGeneration,
        verificationPurpose: REQUIRED_MUTATION_VERIFICATION_PURPOSE
      });
      expect(latest?.observationId).toBe("fresh-v2");
      expect(latest?.freshnessStatus).toBe("INVALIDATED");
      const eligibility = evaluateMutationEligibility({
        state: v2.value!.state,
        observation,
        freshness: v1.value!.record,
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(eligibility.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C5-V46",
    title: PARENT_SCENARIO_TITLES["CSOC-C5-V46"],
    path: "positive",
    run: () => {
      const observation = gateBound();
      const v1 = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({
          observationId: "fresh-v1",
          verificationPurpose: VERIFICATION_PURPOSE.AUDIT,
          observationCompletedAt: T2,
          freshnessVerifiedAt: T2
        }),
        sourceObservation: observation,
        observedEvidence: COMPLETE_EVIDENCE
      });
      const v2 = verifyGateFreshness({
        state: v1.value!.state,
        verification: freshnessRecord({
          observationId: "fresh-pre-action",
          observationCompletedAt: T1,
          freshnessVerifiedAt: T1
        }),
        sourceObservation: observation,
        observedEvidence: COMPLETE_EVIDENCE
      });
      const latest = resolveLatestApplicableFreshness(v2.value!.state, {
        gateBoundObservationId: observation.observationId,
        logicalMutationId: observation.logicalMutationId,
        attemptGeneration: observation.attemptGeneration
      });
      expect(latest?.observationId).toBe("fresh-pre-action");
      expect(latest?.verificationPurpose).toBe(REQUIRED_MUTATION_VERIFICATION_PURPOSE);
      expect(
        evaluateMutationEligibility({
          state: v2.value!.state,
          observation,
          authority: { decision: "GO", authorityDecisionRef: "auth-1" }
        }).status
      ).toBe("PASS");
    }
  },
  {
    id: "CSOC-C5-V47",
    title: PARENT_SCENARIO_TITLES["CSOC-C5-V47"],
    path: "fail-closed",
    run: () => {
      const seeded = seedFreshState();
      expect(freshnessGrantsAuthority(seeded.freshness!)).toBe(false);
      expect(
        evaluateMutationEligibility({
          state: seeded.state,
          observation: seeded.observation,
          authority: { decision: "NONE" }
        }).status
      ).toBe("NOT_AUTHORIZED");
    }
  },
  {
    id: "CSOC-C5-V47",
    title: PARENT_SCENARIO_TITLES["CSOC-C5-V47"],
    path: "positive",
    run: () => {
      const seeded = seedFreshState();
      expect(seeded.verificationResult.status).toBe("PASS");
      expect(evaluateAuthority({ decision: "GO", authorityDecisionRef: "auth-1" }).status).toBe("PASS");
    }
  }
];

describe("CSOC-C2 through CSOC-C5 locked-parent behavioral tests", () => {
  it.each(parentScenarios)("$id $title [$path]", (scenario) => {
    expect(scenario.title).toBe(PARENT_SCENARIO_TITLES[scenario.id]);
    scenario.run();
  });

  it("covers every canonical parent ID and exact title from CSOC-C2-V25 through CSOC-C5-V47", () => {
    const ids = new Set(parentScenarios.map((scenario) => scenario.id));
    expect([...ids].sort()).toEqual([...PARENT_SCENARIO_IDS].sort());
    for (const id of PARENT_SCENARIO_IDS) {
      const titled = parentScenarios.filter((scenario) => scenario.id === id);
      expect(titled.some((scenario) => scenario.path === "positive")).toBe(true);
      expect(titled.some((scenario) => scenario.path === "fail-closed")).toBe(true);
      expect(titled.every((scenario) => scenario.title === PARENT_SCENARIO_TITLES[id])).toBe(true);
    }
  });
});

describe("CSOC-IMPL-KERNEL extra kernel tests (non-parent IDs)", () => {
  it("CSOC-IMPL-KERNEL-EVIDENCE-SOURCE-COLLAPSE rejects same key from a different source as a miss", () => {
    const observation = gateBound({ gateCriticalEvidence: [CI_EVIDENCE] });
    const otherSource = evidenceItem({
      key: CI_EVIDENCE.key,
      evidenceType: CI_EVIDENCE.evidenceType,
      sourceResource: "/repos/other/actions/runs/9",
      observedValue: CI_EVIDENCE.observedValue,
      versionToken: CI_EVIDENCE.versionToken
    });
    const result = verifyGateFreshness({
      state: emptyKernelState(),
      verification: freshnessRecord({ observationId: "fresh-collapse" }),
      sourceObservation: observation,
      observedEvidence: [otherSource]
    });
    expect(result.status).toBe("UNVERIFIABLE");
  });

  it("CSOC-IMPL-KERNEL-MUTATION-ATTEMPTS-RANGE accepts only integer 0 or 1", () => {
    for (const invalid of [2, -1, 1.5]) {
      expect(parseTerminalOutcome(terminalRecord({ mutationAttempts: invalid as 0 | 1 })).field).toBe("mutationAttempts");
    }
  });

  it("CSOC-IMPL-KERNEL-MISSING-BOUND-OBSERVATION holds when sourceObservation is absent", () => {
    const result = verifyGateFreshness({
      state: emptyKernelState(),
      verification: freshnessRecord({ observationId: "fresh-unbound" }),
      observedEvidence: COMPLETE_EVIDENCE
    });
    expect(result.status).toBe("HOLD");
    expect(result.classification).toBe("MISSING_BOUND_OBSERVATION");
  });

  it("CSOC-IMPL-KERNEL-REJECTED-CLAIM-IS-APPEND-ONLY retains losing claim evidence", () => {
    const first = attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() });
    const rejected = attemptGateUseClaim({
      state: first.value!.state!,
      claim: claimRecord({ observationId: "claim-lose", claimId: "claim-event-lose", claimantId: "loser" })
    });
    expect(rejected.value?.state?.records).toHaveLength(2);
    expect(rejected.value?.record?.claimResult).toBe("CLAIM_REJECTED");
    expect(first.value?.record).toEqual(rejected.value?.state?.records[0]);
  });
});
