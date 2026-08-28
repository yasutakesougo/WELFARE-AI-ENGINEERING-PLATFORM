export const CONTRACT = {
  RepositoryObservation: "RepositoryObservation@v1",
  PullRequestObservation: "PullRequestObservation@v1",
  BranchRelationObservation: "BranchRelationObservation@v1",
  GateBoundObservation: "GateBoundObservation@v1",
  GateFreshnessVerification: "GateFreshnessVerification@v1",
  GateUseClaim: "GateUseClaim@v1",
  TerminalOutcome: "TerminalOutcome@v1"
} as const;

export type ContractType = (typeof CONTRACT)[keyof typeof CONTRACT];

export type KernelStatus =
  | "PASS"
  | "HOLD"
  | "NOT_AUTHORIZED"
  | "INVALIDATED"
  | "UNVERIFIABLE"
  | "PARTIAL"
  | "FAILED";

export type Retryability =
  | "NONE"
  | "WAIT"
  | "NEW_OBSERVATION_REQUIRED"
  | "NOT_RETRYABLE";

export type SourceClass =
  | "REMOTE_AUTHORITATIVE"
  | "REMOTE_DERIVED"
  | "LOCAL_OBSERVATION"
  | "COMPOSITE_VERIFIED";

export type ObservationResult = "COMPLETE" | "PARTIAL" | "FAILED" | "INVALIDATED";

export type ConsistencyResult = "PASS" | "INVALIDATED" | "UNVERIFIABLE";

export type FreshnessStatus = "FRESH" | "EXPIRED" | "INVALIDATED" | "UNVERIFIABLE";

export type ClaimState =
  | "AVAILABLE"
  | "CLAIMED"
  | "TERMINAL_CONSUMED_SUCCESS"
  | "TERMINAL_INVALIDATED"
  | "TERMINAL_NOT_AUTHORIZED"
  | "TERMINAL_NO_MUTATION"
  | "TERMINAL_OUTCOME_UNKNOWN";

export type WinningAttemptPhase =
  | "CLAIMED"
  | "ACTIVE"
  | "IN_FLIGHT"
  | "NON_TERMINAL"
  | "TERMINAL_OUTCOME_UNKNOWN";

export const FRESHNESS_STATUSES: readonly FreshnessStatus[] = [
  "FRESH",
  "EXPIRED",
  "INVALIDATED",
  "UNVERIFIABLE"
];

export const CLAIM_STATES: readonly ClaimState[] = [
  "AVAILABLE",
  "CLAIMED",
  "TERMINAL_CONSUMED_SUCCESS",
  "TERMINAL_INVALIDATED",
  "TERMINAL_NOT_AUTHORIZED",
  "TERMINAL_NO_MUTATION",
  "TERMINAL_OUTCOME_UNKNOWN"
];

export const TERMINAL_STATES: readonly ClaimState[] = [
  "TERMINAL_CONSUMED_SUCCESS",
  "TERMINAL_INVALIDATED",
  "TERMINAL_NOT_AUTHORIZED",
  "TERMINAL_NO_MUTATION",
  "TERMINAL_OUTCOME_UNKNOWN"
];

export interface RepositoryIdentity {
  repositoryId: string;
  host: string;
  owner: string;
  repository: string;
}

export interface RetrievalProvenance {
  sourceSystem: string;
  sourceMethod: string;
  sourceResource: string;
  retrievedAt: string;
}

export interface GateCriticalEvidenceItem {
  key: string;
  value: string;
  versionToken?: string;
}

export interface ObservationIdentityBoundary {
  defaultBranchSha?: string;
  baseSha?: string;
  headSha?: string;
}

export interface BaseObservationFields {
  contractType: ContractType;
  observationId: string;
  observationStartedAt: string;
  observationCompletedAt: string;
  observationSource: string;
  sourceClass: SourceClass;
  observationResult: ObservationResult;
  identityBefore: ObservationIdentityBoundary;
  identityAfter: ObservationIdentityBoundary;
  consistencyResult: ConsistencyResult;
  evidenceReferences: string[];
  retrievalProvenance: RetrievalProvenance;
  repositoryIdentity: RepositoryIdentity;
  supersedesObservationId?: string;
  correctsObservationId?: string;
}

export interface RepositoryObservationV1 extends BaseObservationFields {
  contractType: typeof CONTRACT.RepositoryObservation;
  observedDefaultBranchSha?: string;
}

export interface PullRequestObservationV1 extends BaseObservationFields {
  contractType: typeof CONTRACT.PullRequestObservation;
  pullRequestId: string;
  state: string;
  draft: boolean;
  merged: boolean;
  observedBaseSha?: string;
  observedHeadSha?: string;
  mergeable?: boolean;
}

export interface BranchRelationObservationV1 extends BaseObservationFields {
  contractType: typeof CONTRACT.BranchRelationObservation;
  mergeBaseSha?: string;
  relation?: string;
  aheadBy?: number;
  behindBy?: number;
}

export interface GateBoundObservationV1 extends BaseObservationFields {
  contractType: typeof CONTRACT.GateBoundObservation;
  gateType: string;
  targetIdentity: string;
  observedBaseSha: string;
  observedHeadSha: string;
  authorityDecisionRef: string;
  validForAction: boolean;
  gateCriticalEvidence: GateCriticalEvidenceItem[];
  logicalMutationId: string;
}

export interface GateFreshnessVerificationV1 {
  contractType: typeof CONTRACT.GateFreshnessVerification;
  observationId: string;
  observationStartedAt: string;
  observationCompletedAt: string;
  sourceObservationId: string;
  freshnessStatus: FreshnessStatus;
  gateCriticalEvidence: GateCriticalEvidenceItem[];
  evidenceReferences: string[];
  retrievalProvenance: RetrievalProvenance;
  ttlExpired?: boolean;
}

export interface GateUseClaimV1 {
  contractType: typeof CONTRACT.GateUseClaim;
  observationId: string;
  sourceObservationId: string;
  logicalMutationId: string;
  attemptGeneration: string;
  claimState: ClaimState;
  winningAttemptPhase?: WinningAttemptPhase;
}

export interface TerminalOutcomeV1 {
  contractType: typeof CONTRACT.TerminalOutcome;
  observationId: string;
  sourceObservationId: string;
  logicalMutationId: string;
  attemptGeneration: string;
  claimState: ClaimState;
  mutationPerformed: boolean;
  mutationAttempts: number;
}

export type VersionedRecord =
  | RepositoryObservationV1
  | PullRequestObservationV1
  | BranchRelationObservationV1
  | GateBoundObservationV1
  | GateFreshnessVerificationV1
  | GateUseClaimV1
  | TerminalOutcomeV1;

export interface AuthorityResult {
  decision: "GO" | "HOLD" | "UNKNOWN" | "NONE";
  authorityDecisionRef?: string;
}

export interface MutationEligibility {
  eligible: boolean;
  reason: KernelStatus;
}

export interface KernelState {
  readonly records: readonly VersionedRecord[];
}
