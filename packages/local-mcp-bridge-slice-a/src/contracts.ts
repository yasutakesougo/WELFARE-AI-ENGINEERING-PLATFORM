export type Capability =
  | 'repository.observe'
  | 'filesystem.read'
  | 'filesystem.list'
  | 'filesystem.search'
  | 'process.observe_limited'
  | 'test_result.read_sanitized'
  | 'log.read_sanitized'
  | 'evidence.emit';

export type ObservationResult = 'COMPLETE' | 'PARTIAL' | 'FAILED' | 'INVALIDATED';
export type AuthorityResult = 'ALLOW' | 'DENY' | 'HOLD';
export type VerificationState = 'VERIFIED' | 'UNVERIFIED' | 'INVALIDATED';
export type FieldAvailability = 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_ASSESSED' | 'REDACTED';
export type SourceClass = 'LOCAL_OBSERVATION' | 'REMOTE_AUTHORITATIVE' | 'REMOTE_DERIVED' | 'COMPOSITE_VERIFIED';
export type PreAccessEligibility = 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN';
export type DataZone = 'SYNTHETIC' | 'DEVELOPMENT' | 'RESTRICTED' | 'PRODUCTION' | 'CREDENTIAL' | 'UNKNOWN';
export type ObservationAccessClass = 'ALLOW_OBSERVE' | 'HOLD_OBSERVE' | 'DENY_OBSERVE';
export type ContainmentResult = 'PASS' | 'FAIL' | 'UNVERIFIABLE';
export type RuntimeState = 'DISABLED' | 'OBSERVE_ONLY' | 'EXECUTION_CAPABLE';
export type TargetScope = 'EXACT_TARGET' | 'APPROVED_ROOT' | 'REPOSITORY';

export interface SearchBounds {
  maxFiles: number;
  maxBytes: number;
  maxFileSize: number;
  maxDepth: number;
  maxResults: number;
  timeoutMs: number;
  maxOutputBytes: number;
}

export interface RepositoryIdentity {
  repositoryId: string;
  host: string;
  owner: string;
  repository: string;
}

export interface ApprovedRootBinding {
  configuredPath: string;
  resolvedPath: string;
  resolvedIdentity: string;
  resolvedAt: string;
  authorityRef: string;
}

export interface VerifiedDecision {
  result: AuthorityResult;
  producerIdentity: string;
  decisionRef: string;
  targetIdentity: string;
  evaluatedAt: string;
  evidenceRef: string;
  verificationState: VerificationState;
}

export interface ContainmentEvidence {
  rootBinding: ApprovedRootBinding;
  observedRootIdentity: string;
  targetIdentity: string;
  containmentResult: ContainmentResult;
  verifiedAt: string;
  evidenceRef: string;
  verificationState: VerificationState;
}

export interface TrustedConfigurationValidationRecord {
  configurationIdentity: string;
  configurationExactRef: string;
  integrityResult: 'PASS' | 'FAIL' | 'UNVERIFIABLE';
  configurationAuthorityRef: string | null;
  configurationAuthorityState: 'VALID' | 'INVALID' | 'UNRESOLVED' | 'EXPIRED';
  targetScopeMatch: boolean;
  authorityCycleDetected: boolean;
  validatedAt: string;
}

export interface DataZoneDecision {
  dataZone: DataZone;
  dataZoneSource:
    | 'LOCKED_POLICY'
    | 'TRUSTED_CONFIGURATION'
    | 'EXPLICIT_AUTHORITY_DECISION'
    | 'UNTRUSTED_METADATA'
    | 'UNKNOWN';
  dataZoneAuthority: 'AUTHORITATIVE' | 'CONSTRAINT_ONLY' | 'NONE';
  dataZoneDecisionRef: string | null;
  classifiedAt: string;
  targetScope: TargetScope;
  scopeIdentity: string;
  targetIdentity: string;
  decisionEvidence: readonly string[];
  observationAccessClass: ObservationAccessClass;
  accessPolicyRef: string | null;
  trustedConfigurationValidation?: TrustedConfigurationValidationRecord;
}

export interface DependencyEntry {
  dependencyId: string;
  revision: string;
  exactRef: string;
  definitionState: string;
  relationship: 'NORMATIVE' | 'COMPATIBILITY_REQUIRED' | 'INFORMATIVE_REFERENCE' | 'FUTURE_DEPENDENCY';
  authorityRole: 'NORMATIVE_AUTHORITY' | 'CONSTRAINT_ONLY' | 'INFORMATIVE_ONLY' | 'NONE';
  verifiedAt: string;
  verificationEvidence: string;
}

export interface RepositoryWorkingState {
  workingTree: 'CLEAN' | 'DIRTY';
  index: 'CLEAN' | 'DIRTY';
  untrackedCount: number;
  conflictCount: number;
}

export interface BranchRelationObservation {
  upstreamRef: string | null;
  trackingRefObservedSha: string | null;
  mergeBaseSha: string | null;
  aheadBy: number | null;
  behindBy: number | null;
  relationAvailability: FieldAvailability;
  sourceClass: SourceClass;
  remoteCurrentStateResolved: false;
}

export interface RepositoryObservation {
  observationId: string;
  repositoryIdentity: RepositoryIdentity;
  exactHeadSha: string;
  branch: string | null;
  detachedHead: boolean;
  workingState: RepositoryWorkingState;
  branchRelation: BranchRelationObservation;
  sourceClass: SourceClass;
  observationStartedAt: string;
  observationCompletedAt: string;
  identityBefore: string;
  identityAfter: string;
  consistencyResult: 'PASS' | 'FAIL';
  observationResult: ObservationResult;
  evidenceReferences: readonly string[];
}

export interface ProcessObservationLimited {
  observationId: string;
  pid: number;
  parentPid: number | null;
  executableName: string;
  state: string;
  startTime: string | null;
  resourceSummary: Readonly<Record<string, number | string | null>>;
  observationResult: ObservationResult;
  sanitized: true;
}

export interface SanitizedLogResult {
  observationId: string;
  sourceIdentity: string;
  status: string;
  boundedSummary: string;
  sanitizedDiagnostics: readonly string[];
  excerpt: string | null;
  excerptBytes: number;
  outputTruncated: boolean;
  redacted: boolean;
  containsUntrustedInstruction: boolean;
  authorityInstructionApplied: false;
  observationResult: ObservationResult;
}

export interface SanitizedTestResult {
  observationId: string;
  sourceIdentity: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  boundedSummary: string;
  sanitizedDiagnostics: readonly string[];
  outputTruncated: boolean;
  redacted: boolean;
  observationResult: ObservationResult;
}

export interface EvidenceEmit {
  evidenceId: string;
  observationId: string | null;
  requestId: string;
  actorId: string;
  bridgeId: string;
  capability: string;
  targetIdentity: string;
  sourceClass: SourceClass | null;
  observationStartedAt: string | null;
  observationCompletedAt: string | null;
  policyDecision: AuthorityResult;
  evidenceReferences: readonly string[];
  persistencePerformed: false;
}

export interface SearchObservationSummary {
  observationId: string;
  bounds: SearchBounds;
  filesVisited: number;
  bytesRead: number;
  resultsProduced: number;
  outputBytesProduced: number;
  depthReached: number;
  elapsedMs: number;
  exhaustedBy: keyof SearchBounds | null;
  outputTruncated: boolean;
  observationResult: ObservationResult;
}

export interface ShadowRequest {
  requestId: string;
  capability: string;
  targetIdentity: string;
  repositoryIdentity: string;
  approvedRootIdentity?: string;
  targetPath?: string;
  runtimeState: RuntimeState;
  scopeDecision: VerifiedDecision;
  authorityDecision: VerifiedDecision;
  dependencyEntries: readonly DependencyEntry[];
  dataZoneDecisions?: readonly DataZoneDecision[];
  preAccessEligibility?: PreAccessEligibility;
  containmentEvidence?: ContainmentEvidence;
  searchBounds?: SearchBounds;
}

export interface ShadowResult {
  requestId: string;
  capability: string;
  targetIdentity: string;
  definitionCapabilityResult: AuthorityResult;
  scopeResult: AuthorityResult;
  authorityResult: AuthorityResult;
  dataAccessResult: AuthorityResult;
  dependencyResult: AuthorityResult;
  runtimeStateResult: AuthorityResult;
  containmentResult: AuthorityResult;
  boundsResult: AuthorityResult;
  shadowEvaluationResult: AuthorityResult;
  effectiveResult: AuthorityResult;
  observationPerformed: false;
  observationResult: null;
  wouldExecute: boolean;
  executionPerformed: false;
  blockReason: string | null;
  evidence: readonly string[];
}
