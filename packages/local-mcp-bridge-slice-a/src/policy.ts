import type {
  AuthorityResult,
  DataZone,
  DataZoneDecision,
  DependencyEntry,
  ObservationAccessClass,
  TrustedConfigurationValidationRecord,
} from './contracts';

const accessRank: Record<ObservationAccessClass, number> = {
  ALLOW_OBSERVE: 0,
  HOLD_OBSERVE: 1,
  DENY_OBSERVE: 2,
};

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

export function validateTrustedConfiguration(
  validation: TrustedConfigurationValidationRecord | undefined,
): boolean {
  if (!validation) return false;
  if (!validation.configurationIdentity.trim()) return false;
  if (!validation.configurationExactRef.trim()) return false;
  if (validation.integrityResult !== 'PASS') return false;
  if (validation.configurationAuthorityState !== 'VALID') return false;
  if (!validation.configurationAuthorityRef?.trim()) return false;
  if (validation.configurationAuthorityRef === validation.configurationIdentity) return false;
  if (!validation.targetScopeMatch) return false;
  if (validation.authorityCycleDetected) return false;
  return true;
}

function validateDecisionAuthority(decision: DataZoneDecision): 'AUTHORITATIVE' | 'CONSTRAINT_ONLY' | 'INVALID' {
  switch (decision.dataZoneSource) {
    case 'LOCKED_POLICY':
    case 'EXPLICIT_AUTHORITY_DECISION':
      return decision.dataZoneAuthority === 'AUTHORITATIVE' && !!decision.dataZoneDecisionRef
        ? 'AUTHORITATIVE'
        : 'INVALID';
    case 'TRUSTED_CONFIGURATION':
      return decision.dataZoneAuthority === 'AUTHORITATIVE' &&
        !!decision.dataZoneDecisionRef &&
        validateTrustedConfiguration(decision.trustedConfigurationValidation)
        ? 'AUTHORITATIVE'
        : 'INVALID';
    case 'UNTRUSTED_METADATA':
      return decision.dataZoneAuthority === 'CONSTRAINT_ONLY' ? 'CONSTRAINT_ONLY' : 'INVALID';
    case 'UNKNOWN':
      return decision.dataZoneAuthority === 'NONE' ? 'CONSTRAINT_ONLY' : 'INVALID';
  }
}

export function evaluateDataAccessDecisions(decisions: readonly DataZoneDecision[] | undefined): AuthorityResult {
  if (!decisions?.length) return 'HOLD';

  let authoritativeCount = 0;
  let effectiveClass: ObservationAccessClass = 'ALLOW_OBSERVE';

  for (const decision of decisions) {
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

  return 'ALLOW';
}
