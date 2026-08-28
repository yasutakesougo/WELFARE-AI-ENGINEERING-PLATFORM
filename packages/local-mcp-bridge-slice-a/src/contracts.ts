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
export type FieldAvailability = 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_ASSESSED' | 'REDACTED';
export type SourceClass = 'LOCAL_OBSERVATION' | 'REMOTE_AUTHORITATIVE' | 'REMOTE_DERIVED' | 'COMPOSITE_VERIFIED';
export type PreAccessEligibility = 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN';
export type DataZone = 'SYNTHETIC' | 'DEVELOPMENT' | 'RESTRICTED' | 'PRODUCTION' | 'CREDENTIAL' | 'UNKNOWN';
export type ObservationAccessClass = 'ALLOW_OBSERVE' | 'HOLD_OBSERVE' | 'DENY_OBSERVE';
export type ContainmentResult = 'PASS' | 'FAIL' | 'UNVERIFIABLE';
export type RuntimeState = 'DISABLED' | 'OBSERVE_ONLY' | 'EXECUTION_CAPABLE';

export interface SearchBounds {
  maxFiles: number;
  maxBytes: number;
  maxFileSize: number;
  maxDepth: number;
  maxResults: number;
  timeoutMs: number;
  maxOutputBytes: number;
}

export interface ApprovedRootBinding {
  configuredPath: string;
  resolvedPath: string;
  resolvedIdentity: string;
  resolvedAt: string;
  authorityRef: string;
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
  targetIdentity: string;
  decisionEvidence: readonly string[];
  observationAccessClass: ObservationAccessClass;
  accessPolicyRef: string | null;
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

export interface ShadowRequest {
  requestId: string;
  capability: string;
  targetIdentity: string;
  targetPath?: string;
  runtimeState: RuntimeState;
  definitionAllowsCapability: boolean;
  scopeResult: AuthorityResult;
  authorityResult: AuthorityResult;
  dependencyResult: AuthorityResult;
  dataZoneDecision?: DataZoneDecision;
  preAccessEligibility?: PreAccessEligibility;
  rootBinding?: ApprovedRootBinding;
  observedRootIdentity?: string;
  targetContainmentResult?: ContainmentResult;
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
  observationResult: ObservationResult;
  effectiveResult: AuthorityResult;
  wouldExecute: boolean;
  executionPerformed: false;
  blockReason: string | null;
  evidence: readonly string[];
}
