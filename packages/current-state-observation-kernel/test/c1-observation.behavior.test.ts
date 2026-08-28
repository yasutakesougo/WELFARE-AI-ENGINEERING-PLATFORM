import { describe, expect, it } from "vitest";
import {
  appendRecord,
  attemptGateUseClaim,
  emptyKernelState,
  evaluateAuthority,
  evaluateMutationEligibility,
  originalRecordPreserved,
  parsePullRequestObservation,
  parseRepositoryObservation,
  preferStableRepositoryIdentity,
  rejectObservationIdReuse
} from "../src/index.js";
import { claimRecord, freshnessRecord, gateBound, pullRequestObservation, repositoryObservation, REPO } from "./helpers.js";

interface Scenario {
  id: string;
  title: string;
  path: "positive" | "fail-closed";
  run: () => void;
}

const scenarios: Scenario[] = [
  {
    id: "CSOC-C1-V17",
    title: "Composite Observation Head Movement",
    path: "fail-closed",
    run: () => {
      const result = parsePullRequestObservation(
        pullRequestObservation({
          identityBefore: { headSha: "A" },
          identityAfter: { headSha: "B" }
        })
      );
      expect(result.status).toBe("HOLD");
      expect(result.classification).toBe("IDENTITY_MOVED");
      expect(result.value?.observationResult).toBe("INVALIDATED");
      expect(result.value?.consistencyResult).toBe("INVALIDATED");
    }
  },
  {
    id: "CSOC-C1-V17",
    title: "Composite Observation Head Movement",
    path: "positive",
    run: () => {
      const result = parsePullRequestObservation(pullRequestObservation());
      expect(result.status).toBe("PASS");
      expect(result.value?.consistencyResult).toBe("PASS");
    }
  },
  {
    id: "CSOC-C1-V18",
    title: "Authority GO but Technical State Invalid",
    path: "fail-closed",
    run: () => {
      const result = evaluateMutationEligibility({
        observation: gateBound({
          observationResult: "INVALIDATED",
          consistencyResult: "INVALIDATED",
          validForAction: false,
          failureClass: "IDENTITY_MOVED",
          unavailableFields: ["headSha"],
          errorEvidenceReferences: ["ev-gate"],
          retryability: "NEW_OBSERVATION_REQUIRED"
        }),
        freshness: freshnessRecord(),
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(result.status).toBe("HOLD");
      expect(result.value?.eligible).toBe(false);
    }
  },
  {
    id: "CSOC-C1-V18",
    title: "Authority GO but Technical State Invalid",
    path: "positive",
    run: () => {
      const result = evaluateMutationEligibility({
        observation: gateBound(),
        freshness: freshnessRecord(),
        authority: { decision: "GO", authorityDecisionRef: "auth-1" }
      });
      expect(result.status).toBe("PASS");
      expect(result.value?.eligible).toBe(true);
    }
  },
  {
    id: "CSOC-C1-V19",
    title: "Technical PASS but No Authority",
    path: "fail-closed",
    run: () => {
      const result = evaluateAuthority({ decision: "NONE" });
      expect(result.status).toBe("NOT_AUTHORIZED");
      expect(result.classification).toBe("AUTHORITY_FAILURE");
    }
  },
  {
    id: "CSOC-C1-V19",
    title: "Technical PASS but No Authority",
    path: "positive",
    run: () => {
      const technical = parsePullRequestObservation(pullRequestObservation({ mergeable: true }));
      const authority = evaluateAuthority({ decision: "GO", authorityDecisionRef: "auth-1" });
      expect(technical.status).toBe("PASS");
      expect(authority.status).toBe("PASS");
    }
  },
  {
    id: "CSOC-C1-V20",
    title: "Local Git Stale",
    path: "fail-closed",
    run: () => {
      const local = parseRepositoryObservation(
        repositoryObservation({
          sourceClass: "LOCAL_OBSERVATION",
          observationSource: "LOCAL_GIT",
          observedDefaultBranchSha: "A"
        })
      );
      expect(local.status).toBe("HOLD");
      expect(local.classification).toBe("LOCAL_OBSERVATION_NOT_REMOTE_AUTHORITY");
    }
  },
  {
    id: "CSOC-C1-V20",
    title: "Local Git Stale",
    path: "positive",
    run: () => {
      const remote = parseRepositoryObservation(
        repositoryObservation({
          sourceClass: "REMOTE_AUTHORITATIVE",
          observedDefaultBranchSha: "B"
        })
      );
      expect(remote.status).toBe("PASS");
      expect(remote.value?.observedDefaultBranchSha).toBe("B");
    }
  },
  {
    id: "CSOC-C1-V21",
    title: "Partial Observation",
    path: "fail-closed",
    run: () => {
      const result = parsePullRequestObservation(
        pullRequestObservation({
          ciWorkflowEvidence: [{ conclusion: "SUCCESS" }],
          reviewThreads: undefined
        })
      );
      expect(result.status).toBe("HOLD");
      expect(result.value?.observationResult).toBe("PARTIAL");
      expect(result.value?.unavailableFields).toContain("reviewThreads");
      expect(result.value?.failureClass).toBe("UNAVAILABLE_FIELD");
    }
  },
  {
    id: "CSOC-C1-V21",
    title: "Partial Observation",
    path: "positive",
    run: () => {
      const result = parsePullRequestObservation(pullRequestObservation());
      expect(result.status).toBe("PASS");
      expect(result.value?.observationResult).toBe("COMPLETE");
    }
  },
  {
    id: "CSOC-C1-V22",
    title: "Ready Race",
    path: "fail-closed",
    run: () => {
      const result = parsePullRequestObservation(
        pullRequestObservation({
          identityBefore: { headSha: "A" },
          identityAfter: { headSha: "B" }
        })
      );
      expect(result.status).toBe("HOLD");
      expect(result.retryability).toBe("NEW_OBSERVATION_REQUIRED");
    }
  },
  {
    id: "CSOC-C1-V22",
    title: "Ready Race",
    path: "positive",
    run: () => {
      const result = parsePullRequestObservation(pullRequestObservation());
      expect(result.status).toBe("PASS");
      expect(result.value?.identityBefore.headSha).toBe(result.value?.identityAfter.headSha);
    }
  },
  {
    id: "CSOC-C1-V23",
    title: "Append-Only Observation",
    path: "fail-closed",
    run: () => {
      const first = repositoryObservation({ observationId: "O1", observedDefaultBranchSha: "A" });
      const state = appendRecord(emptyKernelState(), first);
      const reuse = rejectObservationIdReuse(state, "O1");
      const preserved = originalRecordPreserved(state, "O1");
      expect(reuse.status).toBe("HOLD");
      expect(preserved.status).toBe("PASS");
      expect(preserved.value).toEqual(first);
    }
  },
  {
    id: "CSOC-C1-V23",
    title: "Append-Only Observation",
    path: "positive",
    run: () => {
      const o1 = repositoryObservation({ observationId: "O1", observedDefaultBranchSha: "A" });
      const o2 = repositoryObservation({
        observationId: "O2",
        observedDefaultBranchSha: "B",
        supersedesObservationId: "O1"
      });
      let state = appendRecord(emptyKernelState(), o1);
      expect(rejectObservationIdReuse(state, "O2").status).toBe("PASS");
      state = appendRecord(state, o2);
      expect(originalRecordPreserved(state, "O1").value?.observationId).toBe("O1");
      expect(state.records).toHaveLength(2);
    }
  },
  {
    id: "CSOC-C1-V24",
    title: "Repository Rename",
    path: "positive",
    run: () => {
      const renamed = { ...REPO, owner: "new-owner", repository: "new-name" };
      const result = preferStableRepositoryIdentity(REPO, renamed);
      expect(result.status).toBe("PASS");
      expect(result.value?.sameRepository).toBe(true);
      expect(result.value?.comparedBy).toBe("repositoryId");
    }
  },
  {
    id: "CSOC-C1-V24",
    title: "Repository Rename",
    path: "fail-closed",
    run: () => {
      const different = { ...REPO, repositoryId: "repo-2" };
      const result = preferStableRepositoryIdentity(REPO, different);
      expect(result.status).toBe("PASS");
      expect(result.value?.sameRepository).toBe(false);
    }
  }
];

describe("CSOC-C1 runtime/domain behavioral tests", () => {
  it.each(scenarios)("$id $title [$path]", (scenario) => {
    scenario.run();
  });

  it("does not classify competing-claim rejection as NOT_AUTHORIZED", () => {
    const claimed = attemptGateUseClaim({
      state: emptyKernelState(),
      claim: claimRecord({ observationId: "claim-win", claimState: "AVAILABLE" })
    });
    expect(claimed.status).toBe("PASS");
    const rejected = attemptGateUseClaim({
      state: claimed.value!.state!,
      claim: claimRecord({
        observationId: "claim-lose",
        attemptGeneration: "gen-2"
      })
    });
    expect(rejected.status).toBe("HOLD");
    expect(rejected.classification).toBe("CLAIM_REJECTED");
    expect(rejected.status).not.toBe("NOT_AUTHORIZED");
  });
});
