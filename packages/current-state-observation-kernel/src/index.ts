export { CONTRACT, CLAIM_STATES, FRESHNESS_STATUSES, TERMINAL_STATES } from "./types.js";
export type {
  AuthorityResult,
  BranchRelationObservationV1,
  ContractType,
  GateBoundObservationV1,
  GateFreshnessVerificationV1,
  GateUseClaimV1,
  KernelState,
  KernelStatus,
  MutationEligibility,
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
export { freshnessGrantsAuthority, ttlAloneIsFresh, verifyGateFreshness } from "./freshness.js";
export {
  attemptGateUseClaim,
  canStartExecutableAttempt,
  newObservationRequiredMeansImmediateRetry,
  recordTerminalOutcome
} from "./claim.js";
export { evaluateAuthority, evaluateMutationEligibility } from "./eligibility.js";
export { appendRecord, emptyKernelState, findByObservationId, recordsOfType, VERSIONED_CONTRACTS } from "./state.js";
