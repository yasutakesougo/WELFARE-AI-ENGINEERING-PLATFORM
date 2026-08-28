import type {
  AuthorityResult,
  DataZone,
  DataZoneDecision,
  DependencyEntry,
  ObservationAccessClass,
} from './contracts';
import {
  isImmutableConfigurationExactRef,
  resolveDataZoneAuthority,
  resolveDataZoneDecision,
  resolveTrustedConfiguration,
  resolveTrustedContainment,
  resolveTrustedDecision,
  type TrustedDecisionClass,
} from './trustRegistry';

const accessRank: Record<ObservationAccessClass, number> = {
  ALLOW_OBSERVE: 0,
  HOLD_OBSERVE: 1,
  DENY_OBSERVE: 2,
};

const CURRENT_STATE_DEPENDENCY = {
  dependencyId: 'WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1',
  revision: 'Definition Correction-1',
  exactRef: '5c55d9383a34915c45619429d7e24488ade75337',
  definitionState: 'CORRECTED / NOT LOCKED',
  relationship: 'COMPATIBILITY_REQUIRED',
  authorityRole: 'CONSTRAINT_ONLY',
} as const;

export interface DataAccessContext {
  targetIdentity: string;
  repositoryIdentity: string;
  approvedRootIdentity?: string;
}

export function deriveZoneAccessClass(zone: DataZone): ObservationAccessClass {
  switch (zone) {
    case 'SYNTHETIC':
    case 'DEVELOPMENT':
      return 'ALLOW_OBSERVE';
    case 'UNKNOWN':
      return 'HOLD_OBSERVE';
    case 'RESTRICTED':
    case 'PRODUCTION':
    case 'CREDENTIAL':
      return 'DENY_OBSERVE';
  }
}

function stricterAccessClass(a: ObservationAccessClass, b: ObservationAccessClass): ObservationAccessClass {
  return accessRank[a] >= accessRank[b] ? a : b;
}

export function validateTrustedConfigurationRef(registryRef: string | undefined): boolean {
  const validation = resolveTrustedConfiguration(registryRef);
  if (!validation) return false;
  if (!validation.configurationIdentity.trim()) return false;
  if (!isImmutableConfigurationExactRef(validation.configurationExactRef)) return false;
  if (validation.integrityResult !== 'PASS') return false;
  if (validation.configurationAuthorityState !== 'VALID') return false;
  if (!validation.configurationAuthorityRef?.trim()) return false;
  if (validation.configurationAuthorityRef === validation.configurationIdentity) return false;
  if (!resolveDataZoneAuthority(validation.configurationAuthorityRef)) return false;
  if (!validation.targetScopeMatch) return false;
  if (validation.authorityCycleDetected) return false;
  if (!validation.validatedAt.trim()) return false;
  return true;
}

function authorityRecordMatchesDecision(decision: DataZoneDecision): boolean {
  const authorityRecord = resolveDataZoneAuthority(decision.dataZoneDecisionRef);
  if (!authorityRecord) return false;
  return authorityRecord.dataZone === decision.dataZone &&
    authorityRecord.dataZoneSource === decision.dataZoneSource &&
    authorityRecord.targetScope === decision.targetScope &&
    authorityRecord.scopeIdentity === decision.scopeIdentity &&
    authorityRecord.authorityClass === decision.dataZoneAuthority;
}

function validateDecisionAuthority(decision: DataZoneDecision): 'AUTHORITATIVE' | 'CONSTRAINT_ONLY' | 'INVALID' {
  switch (decision.dataZoneSource) {
    case 'LOCKED_POLICY':
    case 'EXPLICIT_AUTHORITY_DECISION':
      return decision.dataZoneAuthority === 'AUTHORITATIVE' && authorityRecordMatchesDecision(decision)
        ? 'AUTHORITATIVE'
        : 'INVALID';
    case 'TRUSTED_CONFIGURATION':
      return decision.dataZoneAuthority === 'AUTHORITATIVE' &&
        authorityRecordMatchesDecision(decision) &&
        validateTrustedConfigurationRef(decision.trustedConfigurationRef)
        ? 'AUTHORITATIVE'
        : 'INVALID';
    case 'UNTRUSTED_METADATA':
      return decision.dataZoneAuthority === 'CONSTRAINT_ONLY' ? 'CONSTRAINT_ONLY' : 'INVALID';
    case 'UNKNOWN':
      return decision.dataZoneAuthority === 'NONE' ? 'CONSTRAINT_ONLY' : 'INVALID';
  }
}

function decisionTargetsRequest(decision: DataZoneDecision, context: DataAccessContext): boolean {
  switch (decision.targetScope) {
    case 'EXACT_TARGET':
      return decision.targetIdentity === context.targetIdentity && decision.scopeIdentity === context.targetIdentity;
    case 'APPROVED_ROOT':
      return !!context.approvedRootIdentity && decision.scopeIdentity === context.approvedRootIdentity;
    case 'REPOSITORY':
      return decision.scopeIdentity === context.repositoryIdentity;
  }
}

export function evaluateDataAccessDecisionRefs(
  decisionRefs: readonly string[] | undefined,
  context: DataAccessContext,
): AuthorityResult {
  if (!decisionRefs?.length) return 'HOLD';

  let authoritativeCount = 0;
  let effectiveClass: ObservationAccessClass = 'ALLOW_OBSERVE';

  for (const registryRef of decisionRefs) {
    const decision = resolveDataZoneDecision(registryRef);
    if (!decision) return 'HOLD';
    if (decision.registryRef !== registryRef) return 'HOLD';
    if (!decisionTargetsRequest(decision, context)) return 'HOLD';
    if (!decision.classifiedAt.trim()) return 'HOLD';
    if (!decision.decisionEvidence.length) return 'HOLD';

    const authorityClass = validateDecisionAuthority(decision);
    if (authorityClass === 'INVALID') return 'HOLD';

    const derived = deriveZoneAccessClass(decision.dataZone);
    const declaredCannotWiden = stricterAccessClass(derived, decision.observationAccessClass);
    effectiveClass = stricterAccessClass(effectiveClass, declaredCannotWiden);

    if (authorityClass === 'AUTHORITATIVE') authoritativeCount += 1;
  }

  if (effectiveClass === 'DENY_OBSERVE') return 'DENY';
  if (authoritativeCount === 0) return 'HOLD';
  if (effectiveClass === 'HOLD_OBSERVE') return 'HOLD';
  return 'ALLOW';
}

export function evaluateTrustedDecisionRef(
  decisionClass: TrustedDecisionClass,
  decisionRef: string | undefined,
  targetIdentity: string,
): AuthorityResult {
  const decision = resolveTrustedDecision(decisionClass, decisionRef);
  if (!decision) return 'HOLD';
  if (decision.verificationState !== 'VERIFIED') return 'HOLD';
  if (decision.targetIdentity !== targetIdentity) return 'HOLD';
  if (!decision.producerIdentity.trim()) return 'HOLD';
  if (!decision.decisionRef.trim()) return 'HOLD';
  if (!decision.evaluatedAt.trim()) return 'HOLD';
  if (!decision.evidenceRef.trim()) return 'HOLD';
  return decision.result;
}

export function validateDependencyEntry(entry: DependencyEntry): AuthorityResult {
  if (!entry.dependencyId.trim()) return 'HOLD';
  if (!entry.revision.trim()) return 'HOLD';
  if (!entry.exactRef.trim()) return 'HOLD';
  if (!entry.definitionState.trim()) return 'HOLD';
  if (!entry.verifiedAt.trim()) return 'HOLD';
  if (!entry.verificationEvidence.trim()) return 'HOLD';

  if (entry.relationship === 'COMPATIBILITY_REQUIRED' && entry.authorityRole === 'NORMATIVE_AUTHORITY') {
    return 'DENY';
  }

  if (entry.dependencyId === CURRENT_STATE_DEPENDENCY.dependencyId) {
    if (
      entry.revision !== CURRENT_STATE_DEPENDENCY.revision ||
      entry.exactRef !== CURRENT_STATE_DEPENDENCY.exactRef ||
      entry.definitionState !== CURRENT_STATE_DEPENDENCY.definitionState ||
      entry.relationship !== CURRENT_STATE_DEPENDENCY.relationship ||
      entry.authorityRole !== CURRENT_STATE_DEPENDENCY.authorityRole
    ) {
      return 'HOLD';
    }
  }

  return 'ALLOW';
}

export function evaluateDependencyEntries(entries: readonly DependencyEntry[] | undefined): AuthorityResult {
  if (!entries?.length) return 'HOLD';
  const required = entries.find((entry) => entry.dependencyId === CURRENT_STATE_DEPENDENCY.dependencyId);
  if (!required) return 'HOLD';

  let sawHold = false;
  for (const entry of entries) {
    const result = validateDependencyEntry(entry);
    if (result === 'DENY') return 'DENY';
    if (result === 'HOLD') sawHold = true;
  }
  return sawHold ? 'HOLD' : 'ALLOW';
}

export function evaluateTrustedContainmentRef(
  evidenceRef: string | undefined,
  targetIdentity: string,
): AuthorityResult {
  const evidence = resolveTrustedContainment(evidenceRef);
  if (!evidence) return 'DENY';
  if (evidence.verificationState !== 'VERIFIED') return 'DENY';
  if (evidence.targetIdentity !== targetIdentity) return 'DENY';
  if (!evidence.verifiedAt.trim() || !evidence.evidenceRef.trim()) return 'DENY';
  if (!evidence.rootBinding.resolvedIdentity.trim()) return 'DENY';
  if (evidence.rootBinding.resolvedIdentity !== evidence.observedRootIdentity) return 'DENY';
  if (evidence.containmentResult !== 'PASS') return 'DENY';
  return 'ALLOW';
}
