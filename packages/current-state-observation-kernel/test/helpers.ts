import type {
  GateBoundObservationV1,
  GateCriticalEvidenceItem,
  GateFreshnessVerificationV1,
  GateUseClaimV1,
  PullRequestObservationV1,
  RepositoryIdentity,
  RepositoryObservationV1,
  RetrievalProvenance,
  TerminalOutcomeV1
} from "../src/types.js";
import { CONTRACT, REQUIRED_MUTATION_VERIFICATION_PURPOSE } from "../src/types.js";
import { emptyKernelState, verifyGateFreshness } from "../src/index.js";

export const T0 = "2026-08-28T01:00:00Z";
export const T1 = "2026-08-28T01:00:05Z";
export const T2 = "2026-08-28T01:00:10Z";

export const REPO: RepositoryIdentity = {
  repositoryId: "repo-1",
  host: "github.com",
  owner: "yasutakesougo",
  repository: "WELFARE-AI-ENGINEERING-PLATFORM"
};

export const PROVENANCE: RetrievalProvenance = {
  sourceSystem: "github",
  sourceMethod: "GITHUB_API",
  sourceResource: "/repos/example",
  retrievedAt: T1
};

export function evidenceItem(
  overrides: Partial<GateCriticalEvidenceItem> & Pick<GateCriticalEvidenceItem, "key" | "observedValue">
): GateCriticalEvidenceItem {
  return {
    evidenceType: "IDENTITY",
    sourceResource: "/repos/example/pulls/42",
    retrievedAt: T1,
    ...overrides
  };
}

export const HEAD_EVIDENCE = evidenceItem({
  key: "headSha",
  evidenceType: "IDENTITY",
  sourceResource: "/repos/example/pulls/42",
  observedValue: "head-a",
  observedIdentity: "head-a",
  versionToken: "v1"
});

export const BASE_EVIDENCE = evidenceItem({
  key: "baseSha",
  evidenceType: "IDENTITY",
  sourceResource: "/repos/example/pulls/42",
  observedValue: "base-a",
  observedIdentity: "base-a",
  versionToken: "v1"
});

export const CI_EVIDENCE = evidenceItem({
  key: "ciConclusion",
  evidenceType: "CI_WORKFLOW",
  sourceResource: "/repos/example/actions/runs/1",
  observedValue: "SUCCESS",
  versionToken: "ci-v1"
});

export const REVIEW_EVIDENCE = evidenceItem({
  key: "reviewState",
  evidenceType: "REVIEW",
  sourceResource: "/repos/example/pulls/42/reviews/1",
  observedValue: "APPROVED",
  versionToken: "rev-v1"
});

export const POLICY_EVIDENCE = evidenceItem({
  key: "branchPolicy",
  evidenceType: "BRANCH_POLICY",
  sourceResource: "/repos/example/branches/main/protection",
  observedValue: "required-reviews=1",
  versionToken: "pol-v1"
});

export const COMPLETE_EVIDENCE = [HEAD_EVIDENCE, BASE_EVIDENCE, CI_EVIDENCE, REVIEW_EVIDENCE, POLICY_EVIDENCE];

export function repositoryObservation(
  overrides: Partial<RepositoryObservationV1> = {}
): RepositoryObservationV1 {
  return {
    contractType: CONTRACT.RepositoryObservation,
    observationId: "obs-repo-1",
    observationStartedAt: T0,
    observationCompletedAt: T1,
    observationSource: "GITHUB_API",
    sourceClass: "REMOTE_AUTHORITATIVE",
    observationResult: "COMPLETE",
    identityBefore: { defaultBranchSha: "aaa111" },
    identityAfter: { defaultBranchSha: "aaa111" },
    consistencyResult: "PASS",
    evidenceReferences: ["ev-1"],
    retrievalProvenance: PROVENANCE,
    repositoryIdentity: REPO,
    observedDefaultBranchSha: "aaa111",
    ...overrides
  };
}

export function pullRequestObservation(
  overrides: Partial<PullRequestObservationV1> = {}
): PullRequestObservationV1 {
  return {
    contractType: CONTRACT.PullRequestObservation,
    observationId: "obs-pr-1",
    observationStartedAt: T0,
    observationCompletedAt: T1,
    observationSource: "GITHUB_API",
    sourceClass: "REMOTE_AUTHORITATIVE",
    observationResult: "COMPLETE",
    identityBefore: { baseSha: "base-a", headSha: "head-a" },
    identityAfter: { baseSha: "base-a", headSha: "head-a" },
    consistencyResult: "PASS",
    evidenceReferences: ["ev-pr"],
    retrievalProvenance: PROVENANCE,
    repositoryIdentity: REPO,
    pullRequestId: "42",
    state: "OPEN",
    draft: false,
    merged: false,
    observedBaseSha: "base-a",
    observedHeadSha: "head-a",
    mergeable: true,
    reviews: [],
    reviewThreads: [],
    ciWorkflowEvidence: [],
    branchPolicyEvidence: [],
    ...overrides
  };
}

export function gateBound(
  overrides: Partial<GateBoundObservationV1> = {}
): GateBoundObservationV1 {
  return {
    contractType: CONTRACT.GateBoundObservation,
    observationId: "obs-gate-1",
    observationStartedAt: T0,
    observationCompletedAt: T1,
    observationSource: "VERIFIED_COMPOSITE",
    sourceClass: "COMPOSITE_VERIFIED",
    observationResult: "COMPLETE",
    identityBefore: { baseSha: "base-a", headSha: "head-a" },
    identityAfter: { baseSha: "base-a", headSha: "head-a" },
    consistencyResult: "PASS",
    evidenceReferences: ["ev-gate"],
    retrievalProvenance: PROVENANCE,
    repositoryIdentity: REPO,
    gateType: "MERGE",
    targetIdentity: "pr-42",
    observedBaseSha: "base-a",
    observedHeadSha: "head-a",
    authorityDecisionRef: "auth-1",
    validForAction: true,
    logicalMutationId: "mut-1",
    attemptGeneration: "gen-1",
    gateCriticalEvidence: COMPLETE_EVIDENCE,
    ...overrides
  };
}

export function freshnessRecord(
  overrides: Partial<GateFreshnessVerificationV1> = {}
): GateFreshnessVerificationV1 {
  return {
    contractType: CONTRACT.GateFreshnessVerification,
    observationId: "fresh-1",
    observationStartedAt: T0,
    observationCompletedAt: T1,
    sourceObservationId: "obs-gate-1",
    gateBoundObservationId: "obs-gate-1",
    logicalMutationId: "mut-1",
    attemptGeneration: "gen-1",
    verificationPurpose: REQUIRED_MUTATION_VERIFICATION_PURPOSE,
    freshnessVerifiedAt: T1,
    freshnessStatus: "FRESH",
    gateCriticalEvidence: COMPLETE_EVIDENCE,
    gateCriticalEvidenceReferences: COMPLETE_EVIDENCE.map(
      (item) => `${item.evidenceType}|${item.sourceResource}|${item.key}`
    ),
    sourceNativeBindings: COMPLETE_EVIDENCE,
    evidenceComparison: {
      requiredEvidence: COMPLETE_EVIDENCE,
      observedEvidence: COMPLETE_EVIDENCE,
      missingRequiredMembers: []
    },
    evidenceReferences: ["ev-fresh"],
    retrievalProvenance: PROVENANCE,
    ...overrides
  };
}

export function claimRecord(overrides: Partial<GateUseClaimV1> = {}): GateUseClaimV1 {
  return {
    contractType: CONTRACT.GateUseClaim,
    observationId: "claim-1",
    claimId: "claim-event-1",
    claimantId: "kernel-claimant",
    claimedAt: T1,
    claimResult: "CLAIMED",
    sourceObservationId: "obs-gate-1",
    logicalMutationId: "mut-1",
    attemptGeneration: "gen-1",
    claimState: "AVAILABLE",
    ...overrides
  };
}

export function terminalRecord(overrides: Partial<TerminalOutcomeV1> = {}): TerminalOutcomeV1 {
  return {
    contractType: CONTRACT.TerminalOutcome,
    observationId: "term-1",
    claimId: "claim-event-1",
    sourceObservationId: "obs-gate-1",
    logicalMutationId: "mut-1",
    attemptGeneration: "gen-1",
    claimState: "TERMINAL_CONSUMED_SUCCESS",
    mutationPerformed: true,
    mutationAttempts: 1,
    ...overrides
  };
}

export function seedFreshState(input: {
  observation?: GateBoundObservationV1;
  observedEvidence?: readonly GateCriticalEvidenceItem[];
  verification?: Partial<GateFreshnessVerificationV1>;
} = {}) {
  const observation = input.observation ?? gateBound();
  const verified = verifyGateFreshness({
    state: emptyKernelState(),
    verification: freshnessRecord({
      observationId: input.verification?.observationId ?? "fresh-live",
      sourceObservationId: observation.observationId,
      gateBoundObservationId: observation.observationId,
      logicalMutationId: observation.logicalMutationId,
      attemptGeneration: observation.attemptGeneration,
      ...input.verification
    }),
    sourceObservation: observation,
    observedEvidence: input.observedEvidence ?? observation.gateCriticalEvidence
  });
  return {
    observation,
    freshness: verified.value?.record,
    state: verified.value?.state ?? emptyKernelState(),
    verificationResult: verified
  };
}
