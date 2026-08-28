import { describe, expect, it } from "vitest";
import {
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
  REPO,
  T0,
  T1,
  terminalRecord
} from "./helpers.js";

interface Binding {
  id: string;
  kernelBinding: string;
  path: "positive" | "fail-closed";
  run: () => void;
}

const requiredEvidence = [
  { key: "headSha", value: "head-a", versionToken: "v1" },
  { key: "baseSha", value: "base-a", versionToken: "v1" }
];

const bindings: Binding[] = [
  {
    id: "CSOC-C2-V25",
    kernelBinding: "GateBoundObservation@v1 parse positive",
    path: "positive",
    run: () => {
      expect(parseGateBoundObservation(gateBound()).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V25",
    kernelBinding: "GateBoundObservation@v1 missing gateCriticalEvidence",
    path: "fail-closed",
    run: () => {
      const result = parseGateBoundObservation({ ...gateBound(), gateCriticalEvidence: undefined });
      expect(result.status).toBe("FAILED");
      expect(result.field).toBe("gateCriticalEvidence");
    }
  },
  {
    id: "CSOC-C2-V26",
    kernelBinding: "missing observationId is FAILED not PASS",
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
    kernelBinding: "required observation fields present",
    path: "positive",
    run: () => {
      expect(parseGateBoundObservation(gateBound()).value?.observationId).toBe("obs-gate-1");
    }
  },
  {
    id: "CSOC-C2-V27",
    kernelBinding: "logicalMutationId required on gate-bound records",
    path: "fail-closed",
    run: () => {
      const { logicalMutationId: _omit, ...rest } = gateBound();
      expect(parseGateBoundObservation(rest).field).toBe("logicalMutationId");
    }
  },
  {
    id: "CSOC-C2-V27",
    kernelBinding: "logicalMutationId retained",
    path: "positive",
    run: () => {
      expect(parseGateBoundObservation(gateBound()).value?.logicalMutationId).toBe("mut-1");
    }
  },
  {
    id: "CSOC-C2-V28",
    kernelBinding: "observationId reuse rejected; original preserved",
    path: "fail-closed",
    run: () => {
      const first = gateBound();
      const state = appendRecord(emptyKernelState(), first);
      expect(rejectObservationIdReuse(state, first.observationId).status).toBe("HOLD");
      expect(state.records[0]).toEqual(first);
    }
  },
  {
    id: "CSOC-C2-V28",
    kernelBinding: "new observationId accepted",
    path: "positive",
    run: () => {
      const state = appendRecord(emptyKernelState(), gateBound());
      expect(rejectObservationIdReuse(state, "obs-gate-2").status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C2-V29",
    kernelBinding: "missing provenance is not a complete observation",
    path: "fail-closed",
    run: () => {
      expect(requireTraceability({ sourceClass: "REMOTE_AUTHORITATIVE" }).status).toBe("UNVERIFIABLE");
    }
  },
  {
    id: "CSOC-C2-V29",
    kernelBinding: "sourceClass provenance evidence traceable",
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
    kernelBinding: "unavailable relation counts MUST NOT become 0",
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
    kernelBinding: "COMPLETE relation includes counts",
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
    kernelBinding: "authorityDecisionRef required on gate-bound observation",
    path: "fail-closed",
    run: () => {
      const { authorityDecisionRef: _omit, ...rest } = gateBound();
      expect(parseGateBoundObservation(rest).field).toBe("authorityDecisionRef");
    }
  },
  {
    id: "CSOC-C2-V31",
    kernelBinding: "authorityDecisionRef present",
    path: "positive",
    run: () => {
      expect(parseGateBoundObservation(gateBound()).value?.authorityDecisionRef).toBe("auth-1");
    }
  },
  {
    id: "CSOC-C3-V32",
    kernelBinding: "freshness status FRESH after complete evidence compare",
    path: "positive",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord(),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      expect(result.status).toBe("PASS");
      expect(result.value?.record.freshnessStatus).toBe("FRESH");
    }
  },
  {
    id: "CSOC-C3-V32",
    kernelBinding: "missing required evidence → UNVERIFIABLE / HOLD path",
    path: "fail-closed",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-miss" }),
        requiredEvidence,
        observedEvidence: [{ key: "headSha", value: "head-a", versionToken: "v1" }]
      });
      expect(result.status).toBe("UNVERIFIABLE");
    }
  },
  {
    id: "CSOC-C3-V33",
    kernelBinding: "optimistic-concurrency token mismatch INVALIDATED",
    path: "fail-closed",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-token" }),
        requiredEvidence,
        observedEvidence: [
          { key: "headSha", value: "head-a", versionToken: "v2" },
          { key: "baseSha", value: "base-a", versionToken: "v1" }
        ]
      });
      expect(result.status).toBe("INVALIDATED");
    }
  },
  {
    id: "CSOC-C3-V33",
    kernelBinding: "matching version tokens stay FRESH",
    path: "positive",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-token-ok" }),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      expect(result.value?.record.freshnessStatus).toBe("FRESH");
    }
  },
  {
    id: "CSOC-C3-V34",
    kernelBinding: "TTL alone != FRESH",
    path: "fail-closed",
    run: () => {
      expect(ttlAloneIsFresh(false)).toBe(false);
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-ttl", ttlExpired: true }),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      expect(result.value?.record.freshnessStatus).toBe("EXPIRED");
      expect(result.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C3-V34",
    kernelBinding: "uncorrupted evidence without TTL expiry can be FRESH",
    path: "positive",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-nottl" }),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      expect(result.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V35",
    kernelBinding: "technical freshness != authority",
    path: "fail-closed",
    run: () => {
      const fresh = freshnessRecord({ freshnessStatus: "FRESH" });
      expect(freshnessGrantsAuthority(fresh)).toBe(false);
    }
  },
  {
    id: "CSOC-C3-V35",
    kernelBinding: "FRESH still requires separate authority evaluation",
    path: "positive",
    run: () => {
      const fresh = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-auth" }),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      const authority = evaluateAuthority({ decision: "NONE" });
      expect(fresh.status).toBe("PASS");
      expect(authority.status).toBe("NOT_AUTHORIZED");
    }
  },
  {
    id: "CSOC-C3-V36",
    kernelBinding: "earlier freshness records remain unchanged",
    path: "fail-closed",
    run: () => {
      const first = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord(),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      const original = first.value!.record;
      const second = verifyGateFreshness({
        state: first.value!.state!,
        verification: freshnessRecord({ freshnessStatus: "EXPIRED" }),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      expect(second.status).toBe("HOLD");
      expect(first.value!.state.records[0]).toEqual(original);
    }
  },
  {
    id: "CSOC-C3-V36",
    kernelBinding: "later verification is a new record",
    path: "positive",
    run: () => {
      const first = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord(),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      const second = verifyGateFreshness({
        state: first.value!.state!,
        verification: freshnessRecord({ observationId: "fresh-2" }),
        requiredEvidence,
        observedEvidence: requiredEvidence
      });
      expect(second.status).toBe("PASS");
      expect(second.value!.state.records).toHaveLength(2);
    }
  },
  {
    id: "CSOC-C3-V37",
    kernelBinding: "ambiguous required evidence → HOLD",
    path: "fail-closed",
    run: () => {
      const result = verifyGateFreshness({
        state: emptyKernelState(),
        verification: freshnessRecord({ observationId: "fresh-empty" }),
        requiredEvidence: [],
        observedEvidence: []
      });
      expect(result.status).toBe("HOLD");
      expect(result.classification).toBe("AMBIGUOUS_REQUIRED_EVIDENCE");
    }
  },
  {
    id: "CSOC-C3-V37",
    kernelBinding: "explicit required evidence can be compared",
    path: "positive",
    run: () => {
      expect(
        verifyGateFreshness({
          state: emptyKernelState(),
          verification: freshnessRecord({ observationId: "fresh-explicit" }),
          requiredEvidence,
          observedEvidence: requiredEvidence
        }).status
      ).toBe("PASS");
    }
  },
  {
    id: "CSOC-C3-V38",
    kernelBinding: "stale freshness blocks mutation eligibility",
    path: "fail-closed",
    run: () => {
      const result = evaluateMutationEligibility({
        observation: gateBound(),
        freshness: freshnessRecord({ freshnessStatus: "EXPIRED" }),
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(result.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C3-V38",
    kernelBinding: "FRESH + authority GO can be eligible",
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
    id: "CSOC-C4-V39",
    kernelBinding: "successful claim",
    path: "positive",
    run: () => {
      const result = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord()
      });
      expect(result.status).toBe("PASS");
      expect(result.value?.record?.claimState).toBe("CLAIMED");
    }
  },
  {
    id: "CSOC-C4-V39",
    kernelBinding: "successful claims per observation <= 1",
    path: "fail-closed",
    run: () => {
      const first = attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() });
      const second = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({ observationId: "claim-2", attemptGeneration: "gen-2" })
      });
      expect(second.status).toBe("HOLD");
      expect(second.classification).toBe("CLAIM_REJECTED");
      expect(second.value).toEqual({ mutationPerformed: false, mutationAttempts: 0 });
    }
  },
  {
    id: "CSOC-C4-V40",
    kernelBinding: "CLAIM_REJECTED is WAIT/HOLD not NOT_AUTHORIZED",
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
    id: "CSOC-C4-V40",
    kernelBinding: "no competing winner allows claim",
    path: "positive",
    run: () => {
      expect(attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C4-V41",
    kernelBinding: "missing attemptGeneration is not generated",
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
    id: "CSOC-C4-V41",
    kernelBinding: "explicit attemptGeneration accepted",
    path: "positive",
    run: () => {
      expect(parseGateUseClaim(claimRecord()).value?.attemptGeneration).toBe("gen-1");
    }
  },
  {
    id: "CSOC-C4-V42",
    kernelBinding: "active logicalMutationId+attemptGeneration <= 1",
    path: "fail-closed",
    run: () => {
      const first = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord({ claimState: "AVAILABLE" })
      });
      const second = attemptGateUseClaim({
        state: first.value!.state!,
        claim: claimRecord({ observationId: "claim-dup" })
      });
      expect(second.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C4-V42",
    kernelBinding: "new attemptGeneration can be considered only after safety",
    path: "positive",
    run: () => {
      const allowed = canStartExecutableAttempt({
        lastTerminal: terminalRecord({
          claimState: "TERMINAL_NO_MUTATION",
          mutationPerformed: false,
          mutationAttempts: 0
        })
      });
      expect(allowed.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C4-V43",
    kernelBinding: "NEW_OBSERVATION_REQUIRED != immediate retry",
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
    kernelBinding: "reconciliation-proved-safe permits a new attempt",
    path: "positive",
    run: () => {
      expect(canStartExecutableAttempt({ reconciliationProvesSafe: true }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C5-V44",
    kernelBinding: "ambiguous terminal → TERMINAL_OUTCOME_UNKNOWN and HOLD",
    path: "fail-closed",
    run: () => {
      const result = recordTerminalOutcome({
        state: emptyKernelState(),
        outcome: terminalRecord(),
        ambiguous: true
      });
      expect(result.status).toBe("HOLD");
      expect(result.value?.record.claimState).toBe("TERMINAL_OUTCOME_UNKNOWN");
    }
  },
  {
    id: "CSOC-C5-V44",
    kernelBinding: "explicit terminal outcome recorded",
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
    id: "CSOC-C5-V45",
    kernelBinding: "terminal state never returns to AVAILABLE",
    path: "fail-closed",
    run: () => {
      const terminal = recordTerminalOutcome({
        state: emptyKernelState(),
        outcome: terminalRecord({ claimState: "TERMINAL_CONSUMED_SUCCESS" })
      });
      const again = attemptGateUseClaim({
        state: terminal.value!.state,
        claim: claimRecord({ observationId: "claim-after-terminal", attemptGeneration: "gen-9" })
      });
      expect(again.status).toBe("HOLD");
    }
  },
  {
    id: "CSOC-C5-V45",
    kernelBinding: "non-terminal observation can still be claimed",
    path: "positive",
    run: () => {
      expect(attemptGateUseClaim({ state: emptyKernelState(), claim: claimRecord() }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C5-V46",
    kernelBinding: "Claim denial != Authority denial",
    path: "fail-closed",
    run: () => {
      const claim = attemptGateUseClaim({
        state: emptyKernelState(),
        claim: claimRecord(),
        winningAttemptPhase: "IN_FLIGHT"
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
    kernelBinding: "authority GO is independent of claim state",
    path: "positive",
    run: () => {
      expect(evaluateAuthority({ decision: "GO", authorityDecisionRef: "auth-1" }).status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C5-V47",
    kernelBinding: "mutationAttempts must not be inferred as 0",
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
    kernelBinding: "explicit mutationAttempts recorded",
    path: "positive",
    run: () => {
      expect(parseTerminalOutcome(terminalRecord({ mutationAttempts: 1 })).value?.mutationAttempts).toBe(1);
    }
  }
];

describe("CSOC-C2 through CSOC-C5 runtime/domain behavioral tests", () => {
  it.each(bindings)("$id $kernelBinding [$path]", (binding) => {
    binding.run();
  });

  it("covers every parent ID from CSOC-C2-V25 through CSOC-C5-V47", () => {
    const ids = new Set(bindings.map((binding) => binding.id));
    const expected = [
      "CSOC-C2-V25",
      "CSOC-C2-V26",
      "CSOC-C2-V27",
      "CSOC-C2-V28",
      "CSOC-C2-V29",
      "CSOC-C2-V30",
      "CSOC-C2-V31",
      "CSOC-C3-V32",
      "CSOC-C3-V33",
      "CSOC-C3-V34",
      "CSOC-C3-V35",
      "CSOC-C3-V36",
      "CSOC-C3-V37",
      "CSOC-C3-V38",
      "CSOC-C4-V39",
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
      expect(bindings.some((binding) => binding.id === id && binding.path === "positive")).toBe(true);
      expect(bindings.some((binding) => binding.id === id && binding.path === "fail-closed")).toBe(true);
    }
  });
});
