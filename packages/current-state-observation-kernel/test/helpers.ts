import type {
  GateBoundObservationV1,
  GateFreshnessVerificationV1,
  GateUseClaimV1,
  PullRequestObservationV1,
  RepositoryIdentity,
  RepositoryObservationV1,
  RetrievalProvenance,
  TerminalOutcomeV1
} from "../src/types.js";
import { CONTRACT } from "../src/types.js";

export const T0 = "2026-08-28T01:00:00Z";
export const T1 = "2026-08-28T01:00:05Z";

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
    gateCriticalEvidence: [
      { key: "headSha", value: "head-a", versionToken: "v1" },
      { key: "baseSha", value: "base-a", versionToken: "v1" }
    ],
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
    freshnessStatus: "FRESH",
    gateCriticalEvidence: [
      { key: "headSha", value: "head-a", versionToken: "v1" },
      { key: "baseSha", value: "base-a", versionToken: "v1" }
    ],
    evidenceReferences: ["ev-fresh"],
    retrievalProvenance: PROVENANCE,
    ...overrides
  };
}

export function claimRecord(overrides: Partial<GateUseClaimV1> = {}): GateUseClaimV1 {
  return {
    contractType: CONTRACT.GateUseClaim,
    observationId: "claim-1",
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
    sourceObservationId: "obs-gate-1",
    logicalMutationId: "mut-1",
    attemptGeneration: "gen-1",
    claimState: "TERMINAL_CONSUMED_SUCCESS",
    mutationPerformed: true,
    mutationAttempts: 1,
    ...overrides
  };
}
