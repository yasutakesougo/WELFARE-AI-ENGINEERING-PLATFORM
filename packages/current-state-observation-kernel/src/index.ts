export { CONTRACT, CLAIM_STATES, FRESHNESS_STATUSES, TERMINAL_STATES, REQUIRED_MUTATION_VERIFICATION_PURPOSE, VERIFICATION_PURPOSE } from "./types.js";
export type {
  AuthorityResult,
  BranchRelationObservationV1,
  ClaimResult,
  ContractType,
  EvidenceComparison,
  FailureEvidence,
  GateBoundObservationV1,
  GateCriticalEvidenceItem,
  GateFreshnessVerificationV1,
  GateUseClaimV1,
  KernelState,
  KernelStatus,
  MutationEligibility,
  MutationPerformed,
  PullRequestObservationV1,
  RepositoryObservationV1,
  TerminalOutcomeV1,
  VersionedRecord
} from "./types.js";
export type { StructuredResult } from "./result.js";
export { fail, isImmediateRetryAuthorized, ok } from "./result.js";
export {
  parseBranchRelationObservation,
  parseGateBoundObservation,
  parseGateFreshnessVerification,
  parseGateUseClaim,
  parsePullRequestObservation,
  parseRepositoryObservation,
  parseTerminalOutcome,
  finalizeObservation
} from "./records.js";
export {
  originalRecordPreserved,
  preferStableRepositoryIdentity,
  rejectObservationIdReuse,
  requireExplicitSuccession,
  requireTraceability
} from "./identity.js";
export { freshnessGrantsAuthority, ttlAloneIsFresh, verifyGateFreshness, resolveLatestApplicableFreshness } from "./freshness.js";
export {
  attemptGateUseClaim,
  canStartExecutableAttempt,
  newObservationRequiredMeansImmediateRetry,
  recordTerminalOutcome
} from "./claim.js";
export { evaluateAuthority, evaluateMutationEligibility } from "./eligibility.js";
export { derivedConsumed, observationHasTerminalState } from "./derived-state.js";
export { appendRecord, acceptRecord, emptyKernelState, findByObservationId, recordsOfType, VERSIONED_CONTRACTS } from "./state.js";
