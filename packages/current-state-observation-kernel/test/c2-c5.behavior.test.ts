import { describe, expect, it } from "vitest";
import {
  acceptRecord,
  appendRecord,
  attemptGateUseClaim,
  canStartExecutableAttempt,
  emptyKernelState,
  evaluateAuthority,
  evaluateMutationEligibility,
  freshnessGrantsAuthority,
  isImmediateRetryAuthorized,
  newObservationRequiredMeansImmediateRetry,
  parseBranchRelationObservation,
  parseGateBoundObservation,
  parseGateUseClaim,
  parsePullRequestObservation,
  parseTerminalOutcome,
  recordTerminalOutcome,
  rejectObservationIdReuse,
  requireTraceability,
  ttlAloneIsFresh,
  verifyGateFreshness
} from "../src/index.js";
import { CONTRACT } from "../src/types.js";
import {
  claimRecord,
  freshnessRecord,
  gateBound,
  PROVENANCE,
  pullRequestObservation,
  REPO,
  T0,
  T1,
  terminalRecord
} from "./helpers.js";

interface Scenario {
  id: string;
  title: string;
  path: "positive" | "fail-closed";
  run: () => void;
}

const completeEvidence = [
  { key: "headSha", value: "head-a", versionToken: "v1" },
  { key: "baseSha", value: "base-a", versionToken: "v1" }
];

function verifyBoundFreshness(input: {
  observationId?: string;
  sourceObservation?: ReturnType<typeof gateBound>;
  observedEvidence?: readonly { key: string; value: string; versionToken?: string }[];
  ttlExpired?: boolean;
  state?: ReturnType<typeof emptyKernelState>;
  verificationOverrides?: Parameters<typeof freshnessRecord>[0];
}) {
  return verifyGateFreshness({
    state: input.state ?? emptyKernelState(),
    verification: freshnessRecord({
      observationId: input.observationId ?? "fresh-1",
      ttlExpired: input.ttlExpired,
      ...input.verificationOverrides
    }),
    sourceObservation: input.sourceObservation ?? gateBound(),
    observedEvidence: input.observedEvidence ?? completeEvidence
  });
}

const parentScenarios: Scenario[] = [
  {
    id: "CSOC-C2-V25",
    title: "Gate-Bound Observation Evidence Set",
    path: "positive",
    run: () => {
      const result = parseGateBoundObservation(gateBound());
      expect(result.status).toBe("PASS");
      expect(result.value?.gateCriticalEvidence).toHaveLength(2);
    }
  },
  {
    id: "CSOC-C2-V25",
    title: "Gate-Bound Observation Evidence Set",
    path: "fail-closed",
    run: () => {
      const result = parseGateBoundObservation({ ...gateBound(), gateCriticalEvidence: undefined });
      expect(result.status).toBe("FAILED");
      expect(result.field).toBe("gateCriticalEvidence");
    }
  },
  {
    id: "CSOC-C2-V26",
    title: "Missing Observation Identity",
    path: "fail-closed",
    run: () => {
      const { observationId: _omit, ...rest } = gateBound();
      const result = parseGateBoundObservation(rest);
      expect(result.status).toBe("FAILED");
      expect(result.status).not.toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V26",
    title: "Missing Observation Identity",
    path: "positive",
    run: () => {
      expect(parseGateBoundObservation(gateBound()).value?.observationId).toBe("obs-gate-1");
    }
  },
  {
    id: "CSOC-C2-V27",
    title: "Logical Mutation Identity Binding",
    path: "fail-closed",
    run: () => {
      const { logicalMutationId: _omit, ...rest } = gateBound();
      expect(parseGateBoundObservation(rest).field).toBe("logicalMutationId");
    }
  },
  {
    id: "CSOC-C2-V27",
    title: "Logical Mutation Identity Binding",
    path: "positive",
    run: () => {
      const parsed = parseGateBoundObservation(gateBound());
      expect(parsed.value?.logicalMutationId).toBe("mut-1");
      expect(parsed.value?.attemptGeneration).toBe("gen-1");
    }
  },
  {
    id: "CSOC-C2-V28",
    title: "Observation Identifier Reuse",
    path: "fail-closed",
    run: () => {
      const first = gateBound();
      const state = appendRecord(emptyKernelState(), first);
      expect(rejectObservationIdReuse(state, first.observationId).status).toBe("HOLD");
      expect(acceptRecord(state, gateBound({ observationId: first.observationId })).status).toBe("HOLD");
      expect(state.records[0]).toEqual(first);
    }
  },
  {
    id: "CSOC-C2-V28",
    title: "Observation Identifier Reuse",
    path: "positive",
    run: () => {
      const state = appendRecord(emptyKernelState(), gateBound());
      expect(rejectObservationIdReuse(state, "obs-gate-2").status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V29",
    title: "Provenance Traceability",
    path: "fail-closed",
    run: () => {
      expect(requireTraceability({ sourceClass: "REMOTE_AUTHORITATIVE" }).status).toBe("UNVERIFIABLE");
    }
  },
  {
    id: "CSOC-C2-V29",
    title: "Provenance Traceability",
    path: "positive",
    run: () => {
      expect(
        requireTraceability({
          sourceClass: "COMPOSITE_VERIFIED",
          retrievalProvenance: PROVENANCE,
          evidenceReferences: ["ev"]
        }).status
      ).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V30",
    title: "Unavailable Field Non-Inference",
    path: "fail-closed",
    run: () => {
      const result = parseBranchRelationObservation({
        contractType: CONTRACT.BranchRelationObservation,
        observationId: "rel-1",
        observationStartedAt: T0,
        observationCompletedAt: T1,
        observationSource: "GITHUB_API",
        sourceClass: "REMOTE_AUTHORITATIVE",
        observationResult: "COMPLETE",
        identityBefore: { headSha: "h" },
        identityAfter: { headSha: "h" },
        consistencyResult: "PASS",
        evidenceReferences: ["ev"],
        retrievalProvenance: PROVENANCE,
        repositoryIdentity: REPO
      });
      expect(result.status).toBe("PARTIAL");
      expect(result.message).toMatch(/MUST NOT be guessed|MUST NOT become 0/);
    }
  },
  {
    id: "CSOC-C2-V30",
    title: "Unavailable Field Non-Inference",
    path: "positive",
    run: () => {
      const result = parseBranchRelationObservation({
        contractType: CONTRACT.BranchRelationObservation,
        observationId: "rel-2",
        observationStartedAt: T0,
        observationCompletedAt: T1,
        observationSource: "GITHUB_API",
        sourceClass: "REMOTE_AUTHORITATIVE",
        observationResult: "COMPLETE",
        identityBefore: { headSha: "h" },
        identityAfter: { headSha: "h" },
        consistencyResult: "PASS",
        evidenceReferences: ["ev"],
        retrievalProvenance: PROVENANCE,
        repositoryIdentity: REPO,
        mergeBaseSha: "mb",
        relation: "AHEAD",
        aheadBy: 1,
        behindBy: 0
      });
      expect(result.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V31",
    title: "Authority Decision Reference Required",
    path: "fail-closed",
    run: () => {
      const { authorityDecisionRef: _omit, ...rest } = gateBound();
      expect(parseGateBoundObservation(rest).field).toBe("authorityDecisionRef");
    }
  },
  {
    id: "CSOC-C2-V31",
    title: "Authority Decision Reference Required",
    path: "positive",
    run: () => {
      expect(parseGateBoundObservation(gateBound()).value?.authorityDecisionRef).toBe("auth-1");
    }
  },
  {
    id: "CSOC-C2-V32",
    title: "Attempt Generation On Gate-Bound Observation",
    path: "fail-closed",
    run: () => {
      const { attemptGeneration: _omit, ...rest } = gateBound();
      const result = parseGateBoundObservation(rest);
      expect(result.status).toBe("FAILED");
      expect(result.field).toBe("attemptGeneration");
    }
  },
  {
    id: "CSOC-C2-V32",
    title: "Attempt Generation On Gate-Bound Observation",
    path: "positive",
    run: () => {
      expect(parseGateBoundObservation(gateBound()).value?.attemptGeneration).toBe("gen-1");
    }
  },
  {
    id: "CSOC-C3-V33",
    title: "Bound Evidence Freshness Comparison",
    path: "positive",
    run: () => {
      const result = verifyBoundFreshness({});
      expect(result.status).toBe("PASS");
      expect(result.value?.record.freshnessStatus).toBe("FRESH");
      expect(result.value?.record.evidenceComparison.requiredEvidence).toHaveLength(2);
    }
  },
  {
    id: "CSOC-C3-V33",
    title: "Bound Evidence Freshness Comparison",
    path: "fail-closed",
    run: () => {
      const result = verifyBoundFreshness({
        observationId: "fresh-miss",
        observedEvidence: [{ key: "headSha", value: "head-a", versionToken: "v1" }]
      });
      expect(result.status).toBe("UNVERIFIABLE");
      expect(result.value?.record.evidenceComparison.missingRequiredMembers).toContain("baseSha");
    }
  },
  {
    id: "CSOC-C3-V34",
    title: "Optimistic Concurrency Token Mismatch",
    path: "fail-closed",
    run: () => {
      const result = verifyBoundFreshness({
        observationId: "fresh-token",
        observedEvidence: [
          { key: "headSha", value: "head-a", versionToken: "v2" },
          { key: "baseSha", value: "base-a", versionToken: "v1" }
        ]
      });
      expect(result.status).toBe("INVALIDATED");
    }
  },
  {
    id: "CSOC-C3-V34",
    title: "Optimistic Concurrency Token Mismatch",
    path: "positive",
    run: () => {
      const result = verifyBoundFreshness({ observationId: "fresh-token-ok" });
      expect(result.value?.record.freshnessStatus).toBe("FRESH");
    }
  },
  {
    id: "CSOC-C3-V35",
    title: "TTL Alone Is Not Fresh",
    path: "fail-closed",
    run: () => {
      expect(ttlAloneIsFresh(false)).toBe(false);
      const result = verifyBoundFreshness({ observationId: "fresh-ttl", ttlExpired: true });
      expect(result.value?.record.freshnessStatus).toBe("EXPIRED");
      expect(result.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C3-V35",
    title: "TTL Alone Is Not Fresh",
    path: "positive",
    run: () => {
      const result = verifyBoundFreshness({ observationId: "fresh-nottl" });
      expect(result.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V36",
    title: "Freshness Is Not Authority",
    path: "fail-closed",
    run: () => {
      expect(freshnessGrantsAuthority(freshnessRecord({ freshnessStatus: "FRESH" }))).toBe(false);
    }
  },
  {
    id: "CSOC-C3-V36",
    title: "Freshness Is Not Authority",
    path: "positive",
    run: () => {
      const fresh = verifyBoundFreshness({ observationId: "fresh-auth" });
      const authority = evaluateAuthority({ decision: "NONE" });
      expect(fresh.status).toBe("PASS");
      expect(authority.status).toBe("NOT_AUTHORIZED");
    }
  },
  {
    id: "CSOC-C3-V37",
    title: "Earlier Freshness Record Immutability",
    path: "fail-closed",
    run: () => {
      const first = verifyBoundFreshness({});
      const original = first.value!.record;
      const second = verifyBoundFreshness({
        state: first.value!.state,
        verificationOverrides: { freshnessStatus: "EXPIRED" }
      });
      expect(second.status).toBe("HOLD");
      expect(first.value!.state.records[0]).toEqual(original);
    }
  },
  {
    id: "CSOC-C3-V37",
    title: "Earlier Freshness Record Immutability",
    path: "positive",
    run: () => {
      const first = verifyBoundFreshness({});
      const second = verifyBoundFreshness({
        state: first.value!.state,
        observationId: "fresh-2"
      });
      expect(second.status).toBe("PASS");
      expect(second.value!.state.records).toHaveLength(2);
    }
  },
  {
    id: "CSOC-C3-V38",
    title: "Ambiguous Required Evidence",
    path: "fail-closed",
    run: () => {
      const result = verifyBoundFreshness({
        observationId: "fresh-empty",
        sourceObservation: gateBound({ gateCriticalEvidence: [] })
      });
      expect(result.status).toBe("HOLD");
      expect(result.classification).toBe("AMBIGUOUS_REQUIRED_EVIDENCE");
    }
  },
  {
    id: "CSOC-C3-V38",
    title: "Ambiguous Required Evidence",
    path: "positive",
    run: () => {
      expect(verifyBoundFreshness({ observationId: "fresh-explicit" }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V39",
    title: "Applicable Freshness Required For Eligibility",
    path: "fail-closed",
    run: () => {
      const missing = evaluateMutationEligibility({
        observation: gateBound(),
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(missing.status).toBe("HOLD");
      expect(missing.classification).toBe("MISSING_APPLICABLE_FRESHNESS");
      const stale = evaluateMutationEligibility({
        observation: gateBound(),
        freshness: freshnessRecord({ freshnessStatus: "EXPIRED" }),
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(stale.status).toBe("HOLD");
      const unbound = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-unbound" }),
        observedEvidence: completeEvidence
      });
      expect(unbound.status).toBe("HOLD");
      expect(unbound.classification).toBe("MISSING_BOUND_OBSERVATION");
    }
  },
  {
    id: "CSOC-C3-V39",
    title: "Applicable Freshness Required For Eligibility",
    path: "positive",
    run: () => {
      const result = evaluateMutationEligibility({
        observation: gateBound(),
        freshness: freshnessRecord(),
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(result.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C4-V40",
    title: "Duplicate Observation Same Logical Action",
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
      expect(first.status).toBe("PASS");
      const second = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({
          observationId: "claim-o2",
          claimId: "claim-event-o2",
          sourceObservationId: "obs-O2",
          logicalMutationId: "M",
          attemptGeneration: "G"
        })
      });
      expect(second.status).toBe("HOLD");
      expect(second.classification).toBe("CLAIM_REJECTED");
      expect(second.retryability).toBe("WAIT");
      expect(second.value).toEqual({ mutationPerformed: false, mutationAttempts: 0 });
    }
  },
  {
    id: "CSOC-C4-V40",
    title: "Duplicate Observation Same Logical Action",
    path: "positive",
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
      const otherAction = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({
          observationId: "claim-o2",
          claimId: "claim-event-o2",
          sourceObservationId: "obs-O2",
          logicalMutationId: "M-other",
          attemptGeneration: "G"
        })
      });
      expect(otherAction.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C4-V41",
    title: "Successful Claims Per Observation",
    path: "positive",
    run: () => {
      const result = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord()
      });
      expect(result.status).toBe("PASS");
      expect(result.value?.record?.claimState).toBe("CLAIMED");
      expect(result.value?.record?.claimResult).toBe("CLAIMED");
    }
  },
  {
    id: "CSOC-C4-V41",
    title: "Successful Claims Per Observation",
    path: "fail-closed",
    run: () => {
      const first = attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() });
      const second = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({ observationId: "claim-2", claimId: "claim-event-2", attemptGeneration: "gen-2" })
      });
      expect(second.status).toBe("HOLD");
      expect(second.classification).toBe("CLAIM_REJECTED");
      expect(second.value).toEqual({ mutationPerformed: false, mutationAttempts: 0 });
    }
  },
  {
    id: "CSOC-C4-V42",
    title: "Attempt Generation Must Be Explicit",
    path: "fail-closed",
    run: () => {
      const parsed = parseGateUseClaim({
        ...claimRecord(),
        attemptGeneration: ""
      });
      expect(parsed.status).toBe("FAILED");
      expect(parsed.field).toBe("attemptGeneration");
    }
  },
  {
    id: "CSOC-C4-V42",
    title: "Attempt Generation Must Be Explicit",
    path: "positive",
    run: () => {
      expect(parseGateUseClaim(claimRecord()).value?.attemptGeneration).toBe("gen-1");
    }
  },
  {
    id: "CSOC-C4-V43",
    title: "New Observation Required Is Not Immediate Retry",
    path: "fail-closed",
    run: () => {
      const result = canStartExecutableAttempt({});
      expect(result.classification).toBe("NEW_OBSERVATION_REQUIRED");
      expect(newObservationRequiredMeansImmediateRetry("NEW_OBSERVATION_REQUIRED")).toBe(false);
      expect(isImmediateRetryAuthorized(result)).toBe(false);
    }
  },
  {
    id: "CSOC-C4-V43",
    title: "New Observation Required Is Not Immediate Retry",
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
    id: "CSOC-C5-V44",
    title: "Ambiguous Terminal Outcome Unknown",
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
      expect(result.value?.record.mutationPerformed).not.toBe(false);
      expect(
        canStartExecutableAttempt({ lastTerminal: result.value?.record }).classification
      ).toBe("TERMINAL_OUTCOME_UNKNOWN");
    }
  },
  {
    id: "CSOC-C5-V44",
    title: "Ambiguous Terminal Outcome Unknown",
    path: "positive",
    run: () => {
      const result = recordTerminalOutcome({
        state: emptyKernelState(),
        outcome: terminalRecord({ claimState: "TERMINAL_NO_MUTATION", mutationPerformed: false, mutationAttempts: 0 })
      });
      expect(result.status).toBe("PASS");
      expect(result.value?.record.mutationPerformed).toBe(false);
    }
  },
  {
    id: "CSOC-C5-V45",
    title: "Terminal State Never Returns Available",
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
    id: "CSOC-C5-V45",
    title: "Terminal State Never Returns Available",
    path: "positive",
    run: () => {
      expect(attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C5-V46",
    title: "Claim Denial Versus Authority Denial",
    path: "fail-closed",
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
      const claim = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({
          observationId: "claim-o2",
          claimId: "claim-event-o2",
          sourceObservationId: "obs-O2",
          logicalMutationId: "M",
          attemptGeneration: "G"
        })
      });
      const authority = evaluateAuthority({ decision: "NONE" });
      expect(claim.classification).toBe("CLAIM_REJECTED");
      expect(claim.status).toBe("HOLD");
      expect(authority.status).toBe("NOT_AUTHORIZED");
      expect(claim.status).not.toBe(authority.status);
    }
  },
  {
    id: "CSOC-C5-V46",
    title: "Claim Denial Versus Authority Denial",
    path: "positive",
    run: () => {
      expect(evaluateAuthority({ decision: "GO", authorityDecisionRef: "auth-1" }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C5-V47",
    title: "Mutation Attempts Must Be Explicit",
    path: "fail-closed",
    run: () => {
      const { mutationAttempts: _omit, ...rest } = terminalRecord();
      const result = parseTerminalOutcome(rest);
      expect(result.status).toBe("FAILED");
      expect(result.field).toBe("mutationAttempts");
    }
  },
  {
    id: "CSOC-C5-V47",
    title: "Mutation Attempts Must Be Explicit",
    path: "positive",
    run: () => {
      expect(parseTerminalOutcome(terminalRecord({ mutationAttempts: 1 })).value?.mutationAttempts).toBe(1);
    }
  }
];

const kernelExtras: Scenario[] = [
  {
    id: "CSOC-IMPL-KERNEL-WINNING-ATTEMPT-PHASE-CLAIMED",
    title: "Non-terminal winning attempt rejects a new executable claim",
    path: "fail-closed",
    run: () => {
      const result = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord(),
        winningAttemptPhase: "CLAIMED"
      });
      expect(result.status).toBe("HOLD");
      expect(result.classification).toBe("CLAIM_REJECTED");
      expect(result.retryability).toBe("WAIT");
      expect(result.status).not.toBe("NOT_AUTHORIZED");
    }
  },
  {
    id: "CSOC-IMPL-KERNEL-MUTATION-ATTEMPTS-RANGE",
    title: "mutationAttempts accepts only integer 0 or 1",
    path: "fail-closed",
    run: () => {
      for (const invalid of [2, -1, 1.5]) {
        const result = parseTerminalOutcome(terminalRecord({ mutationAttempts: invalid as 0 | 1 }));
        expect(result.status).toBe("FAILED");
        expect(result.field).toBe("mutationAttempts");
      }
    }
  },
  {
    id: "CSOC-IMPL-KERNEL-PR-COMPLETE-COMPONENTS",
    title: "COMPLETE PullRequestObservation requires review, CI, and branch-policy evidence",
    path: "fail-closed",
    run: () => {
      const result = parsePullRequestObservation(
        pullRequestObservation({
          reviews: undefined,
          reviewThreads: undefined,
          ciWorkflowEvidence: undefined,
          branchPolicyEvidence: undefined
        })
      );
      expect(result.status).toBe("HOLD");
      expect(result.value?.observationResult).toBe("PARTIAL");
      expect(result.value?.unavailableFields).toEqual([
        "reviews",
        "reviewThreads",
        "ciWorkflowEvidence",
        "branchPolicyEvidence"
      ]);
    }
  },
  {
    id: "CSOC-IMPL-KERNEL-FAILURE-CONTRACT",
    title: "PARTIAL FAILED INVALIDATED require failure contract fields",
    path: "fail-closed",
    run: () => {
      const result = parsePullRequestObservation(
        pullRequestObservation({
          observationResult: "FAILED"
        })
      );
      expect(result.status).toBe("FAILED");
      expect(result.classification).toBe("MISSING_FAILURE_CONTRACT");
    }
  },
  {
    id: "CSOC-IMPL-KERNEL-TERMINAL-CLAIM-ID",
    title: "TerminalOutcome retains reverse claimId",
    path: "fail-closed",
    run: () => {
      const { claimId: _omit, ...rest } = terminalRecord();
      const result = parseTerminalOutcome(rest);
      expect(result.status).toBe("FAILED");
      expect(result.field).toBe("claimId");
    }
  },
  {
    id: "CSOC-IMPL-KERNEL-ACCEPT-RECORD-UNIQUENESS",
    title: "acceptRecord enforces observationId and logical-action uniqueness",
    path: "fail-closed",
    run: () => {
      const first = acceptRecord(emptyKernelState(), gateBound());
      expect(first.status).toBe("PASS");
      const reuse = acceptRecord(first.value!, gateBound());
      expect(reuse.status).toBe("HOLD");
      expect(reuse.classification).toBe("OBSERVATION_ID_REUSE");
      const claimed = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord({ sourceObservationId: "obs-O1" })
      });
      const bypass = acceptRecord(
        claimed.value!.state!,
        claimRecord({
          observationId: "claim-bypass",
          claimId: "claim-event-bypass",
          sourceObservationId: "obs-O2",
          claimState: "CLAIMED",
          claimResult: "CLAIMED"
        })
      );
      expect(bypass.status).toBe("HOLD");
      expect(bypass.classification).toBe("CLAIM_REJECTED");
    }
  }
];

describe("CSOC-C2 through CSOC-C5 runtime/domain behavioral tests", () => {
  it.each(parentScenarios)("$id $title [$path]", (scenario) => {
    scenario.run();
  });

  it("covers every parent ID from CSOC-C2-V25 through CSOC-C5-V47 with canonical ranges", () => {
    const ids = new Set(parentScenarios.map((scenario) => scenario.id));
    const expected = [
      "CSOC-C2-V25",
      "CSOC-C2-V26",
      "CSOC-C2-V27",
      "CSOC-C2-V28",
      "CSOC-C2-V29",
      "CSOC-C2-V30",
      "CSOC-C2-V31",
      "CSOC-C2-V32",
      "CSOC-C3-V33",
      "CSOC-C3-V34",
      "CSOC-C3-V35",
      "CSOC-C3-V36",
      "CSOC-C3-V37",
      "CSOC-C3-V38",
      "CSOC-C3-V39",
      "CSOC-C4-V40",
      "CSOC-C4-V41",
      "CSOC-C4-V42",
      "CSOC-C4-V43",
      "CSOC-C5-V44",
      "CSOC-C5-V45",
      "CSOC-C5-V46",
      "CSOC-C5-V47"
    ];
    expect([...ids].sort()).toEqual([...expected].sort());
    for (const id of expected) {
      expect(parentScenarios.some((scenario) => scenario.id === id && scenario.path === "positive")).toBe(true);
      expect(parentScenarios.some((scenario) => scenario.id === id && scenario.path === "fail-closed")).toBe(true);
    }
    expect(ids.has("CSOC-C4-V39")).toBe(false);
    expect(ids.has("CSOC-C2-V32")).toBe(true);
    expect(ids.has("CSOC-C3-V39")).toBe(true);
  });
});

describe("CSOC-IMPL-KERNEL extra kernel tests (non-parent IDs)", () => {
  it.each(kernelExtras)("$id $title [$path]", (scenario) => {
    scenario.run();
  });
});
