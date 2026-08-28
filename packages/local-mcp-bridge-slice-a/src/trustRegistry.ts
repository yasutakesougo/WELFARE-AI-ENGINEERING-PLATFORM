import type {
  AuthorityResult,
  ContainmentEvidence,
  DataZone,
  DataZoneDecision,
  TargetScope,
  TrustedConfigurationValidationRecord,
  VerifiedDecision,
} from './contracts';

const now = '2026-08-28T00:00:00+09:00';
const rootIdentity = 'root:A';
const targetIdentity = 'fixture:file:readme';
const repositoryIdentity = 'fixture:repo:normal';
const validConfigDigestA = `sha256:${'a'.repeat(64)}`;
const validConfigDigestB = `sha256:${'b'.repeat(64)}`;
const validConfigDigestC = `sha256:${'c'.repeat(64)}`;
const validConfigDigestD = `sha256:${'d'.repeat(64)}`;
const validConfigDigestE = `sha256:${'e'.repeat(64)}`;

export type TrustedDecisionClass = 'SCOPE' | 'AUTHORITY';

export interface TrustedDecisionRecord {
  decisionClass: TrustedDecisionClass;
  decision: VerifiedDecision;
}

export interface TrustedDataZoneAuthorityRecord {
  decisionRef: string;
  dataZone: DataZone;
  dataZoneSource: 'LOCKED_POLICY' | 'TRUSTED_CONFIGURATION' | 'EXPLICIT_AUTHORITY_DECISION';
  targetScope: TargetScope;
  scopeIdentity: string;
  authorityClass: 'AUTHORITATIVE';
  evidenceRef: string;
}

const trustedDecisionRecords: readonly TrustedDecisionRecord[] = [
  {
    decisionClass: 'SCOPE',
    decision: {
      result: 'ALLOW',
      producerIdentity: 'fixture:trusted-scope-policy-engine',
      decisionRef: 'synthetic:scope:read',
      targetIdentity,
      evaluatedAt: now,
      evidenceRef: 'synthetic:scope:read:evidence',
      verificationState: 'VERIFIED',
    },
  },
  {
    decisionClass: 'AUTHORITY',
    decision: {
      result: 'ALLOW',
      producerIdentity: 'fixture:trusted-authority-engine',
      decisionRef: 'synthetic:authority:read',
      targetIdentity,
      evaluatedAt: now,
      evidenceRef: 'synthetic:authority:read:evidence',
      verificationState: 'VERIFIED',
    },
  },
  {
    decisionClass: 'SCOPE',
    decision: {
      result: 'ALLOW',
      producerIdentity: 'fixture:trusted-scope-policy-engine',
      decisionRef: 'synthetic:scope:other-target',
      targetIdentity: 'fixture:file:other',
      evaluatedAt: now,
      evidenceRef: 'synthetic:scope:other-target:evidence',
      verificationState: 'VERIFIED',
    },
  },
];

const trustedContainmentRecords: readonly ContainmentEvidence[] = [
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: rootIdentity,
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: rootIdentity,
    targetIdentity,
    containmentResult: 'PASS',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:pass',
    verificationState: 'VERIFIED',
  },
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: rootIdentity,
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: 'root:B',
    targetIdentity,
    containmentResult: 'FAIL',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:root-replaced',
    verificationState: 'VERIFIED',
  },
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: rootIdentity,
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: rootIdentity,
    targetIdentity,
    containmentResult: 'FAIL',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:symlink-escape',
    verificationState: 'VERIFIED',
  },
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: rootIdentity,
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: rootIdentity,
    targetIdentity,
    containmentResult: 'UNVERIFIABLE',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:junction-unverifiable',
    verificationState: 'VERIFIED',
  },
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: rootIdentity,
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: rootIdentity,
    targetIdentity,
    containmentResult: 'FAIL',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:path-traversal',
    verificationState: 'VERIFIED',
  },
];

const trustedDataZoneAuthorityRecords: readonly TrustedDataZoneAuthorityRecord[] = [
  {
    decisionRef: 'synthetic:authority:development',
    dataZone: 'DEVELOPMENT',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    authorityClass: 'AUTHORITATIVE',
    evidenceRef: 'synthetic:data-zone-authority:development',
  },
  {
    decisionRef: 'synthetic:authority:production',
    dataZone: 'PRODUCTION',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    authorityClass: 'AUTHORITATIVE',
    evidenceRef: 'synthetic:data-zone-authority:production',
  },
  {
    decisionRef: 'synthetic:authority:restricted',
    dataZone: 'RESTRICTED',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    authorityClass: 'AUTHORITATIVE',
    evidenceRef: 'synthetic:data-zone-authority:restricted',
  },
  {
    decisionRef: 'authority:external:B',
    dataZone: 'DEVELOPMENT',
    dataZoneSource: 'TRUSTED_CONFIGURATION',
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    authorityClass: 'AUTHORITATIVE',
    evidenceRef: 'synthetic:data-zone-authority:external-b',
  },
];

const trustedConfigurationRecords: Readonly<Record<string, TrustedConfigurationValidationRecord>> = {
  'synthetic:config:self-authorizing': {
    configurationIdentity: 'config:A',
    configurationExactRef: validConfigDigestA,
    integrityResult: 'PASS',
    configurationAuthorityRef: 'config:A',
    configurationAuthorityState: 'VALID',
    targetScopeMatch: true,
    authorityCycleDetected: true,
    validatedAt: now,
  },
  'synthetic:config:valid': {
    configurationIdentity: 'config:B',
    configurationExactRef: validConfigDigestB,
    integrityResult: 'PASS',
    configurationAuthorityRef: 'authority:external:B',
    configurationAuthorityState: 'VALID',
    targetScopeMatch: true,
    authorityCycleDetected: false,
    validatedAt: now,
  },
  'synthetic:config:integrity-fail': {
    configurationIdentity: 'config:C',
    configurationExactRef: validConfigDigestC,
    integrityResult: 'FAIL',
    configurationAuthorityRef: 'authority:external:B',
    configurationAuthorityState: 'VALID',
    targetScopeMatch: true,
    authorityCycleDetected: false,
    validatedAt: now,
  },
  'synthetic:config:expired': {
    configurationIdentity: 'config:D',
    configurationExactRef: validConfigDigestD,
    integrityResult: 'PASS',
    configurationAuthorityRef: 'authority:external:B',
    configurationAuthorityState: 'EXPIRED',
    targetScopeMatch: true,
    authorityCycleDetected: false,
    validatedAt: now,
  },
  'synthetic:config:mutable-ref': {
    configurationIdentity: 'config:E',
    configurationExactRef: 'main',
    integrityResult: 'PASS',
    configurationAuthorityRef: 'authority:external:B',
    configurationAuthorityState: 'VALID',
    targetScopeMatch: true,
    authorityCycleDetected: false,
    validatedAt: now,
  },
  'synthetic:config:unknown-authority': {
    configurationIdentity: 'config:F',
    configurationExactRef: validConfigDigestE,
    integrityResult: 'PASS',
    configurationAuthorityRef: 'authority:external:UNREGISTERED',
    configurationAuthorityState: 'VALID',
    targetScopeMatch: true,
    authorityCycleDetected: false,
    validatedAt: now,
  },
};

const dataZoneDecisionRecords: readonly DataZoneDecision[] = [
  {
    registryRef: 'synthetic:zone:development',
    dataZone: 'DEVELOPMENT',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    dataZoneAuthority: 'AUTHORITATIVE',
    dataZoneDecisionRef: 'synthetic:authority:development',
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    targetIdentity: rootIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'ALLOW_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
  {
    registryRef: 'synthetic:zone:production',
    dataZone: 'PRODUCTION',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    dataZoneAuthority: 'AUTHORITATIVE',
    dataZoneDecisionRef: 'synthetic:authority:production',
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    targetIdentity: rootIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'DENY_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
  {
    registryRef: 'synthetic:zone:malicious-production-allow',
    dataZone: 'PRODUCTION',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    dataZoneAuthority: 'AUTHORITATIVE',
    dataZoneDecisionRef: 'synthetic:authority:production',
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    targetIdentity: rootIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'ALLOW_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
  {
    registryRef: 'synthetic:zone:untrusted-development',
    dataZone: 'DEVELOPMENT',
    dataZoneSource: 'UNTRUSTED_METADATA',
    dataZoneAuthority: 'CONSTRAINT_ONLY',
    dataZoneDecisionRef: null,
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    targetIdentity: rootIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'ALLOW_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
  {
    registryRef: 'synthetic:zone:untrusted-production',
    dataZone: 'PRODUCTION',
    dataZoneSource: 'UNTRUSTED_METADATA',
    dataZoneAuthority: 'CONSTRAINT_ONLY',
    dataZoneDecisionRef: null,
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    targetIdentity: rootIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'DENY_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
  ...[
    ['synthetic:zone:trusted-self-authorize', 'synthetic:config:self-authorizing'],
    ['synthetic:zone:trusted-valid', 'synthetic:config:valid'],
    ['synthetic:zone:trusted-integrity-fail', 'synthetic:config:integrity-fail'],
    ['synthetic:zone:trusted-expired', 'synthetic:config:expired'],
    ['synthetic:zone:trusted-mutable-ref', 'synthetic:config:mutable-ref'],
    ['synthetic:zone:trusted-unknown-authority', 'synthetic:config:unknown-authority'],
  ].map(([registryRef, trustedConfigurationRef]) => ({
    registryRef,
    dataZone: 'DEVELOPMENT' as const,
    dataZoneSource: 'TRUSTED_CONFIGURATION' as const,
    dataZoneAuthority: 'AUTHORITATIVE' as const,
    dataZoneDecisionRef: 'authority:external:B',
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT' as const,
    scopeIdentity: rootIdentity,
    targetIdentity: rootIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'ALLOW_OBSERVE' as const,
    accessPolicyRef: 'synthetic:policy:observe-v1',
    trustedConfigurationRef,
  })),
  {
    registryRef: 'synthetic:zone:target-mismatch',
    dataZone: 'DEVELOPMENT',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    dataZoneAuthority: 'AUTHORITATIVE',
    dataZoneDecisionRef: 'synthetic:authority:development',
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: 'root:OTHER',
    targetIdentity: 'root:OTHER',
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'ALLOW_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
  {
    registryRef: 'synthetic:zone:restricted',
    dataZone: 'RESTRICTED',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    dataZoneAuthority: 'AUTHORITATIVE',
    dataZoneDecisionRef: 'synthetic:authority:restricted',
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    targetIdentity: rootIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'DENY_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
  {
    registryRef: 'synthetic:zone:authority-semantic-mismatch',
    dataZone: 'DEVELOPMENT',
    dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
    dataZoneAuthority: 'AUTHORITATIVE',
    dataZoneDecisionRef: 'synthetic:authority:production',
    classifiedAt: now,
    targetScope: 'APPROVED_ROOT',
    scopeIdentity: rootIdentity,
    targetIdentity: rootIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'ALLOW_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
  {
    registryRef: 'synthetic:zone:repository-development',
    dataZone: 'DEVELOPMENT',
    dataZoneSource: 'LOCKED_POLICY',
    dataZoneAuthority: 'AUTHORITATIVE',
    dataZoneDecisionRef: 'synthetic:authority:development',
    classifiedAt: now,
    targetScope: 'REPOSITORY',
    scopeIdentity: repositoryIdentity,
    targetIdentity: repositoryIdentity,
    decisionEvidence: ['synthetic-only'],
    observationAccessClass: 'ALLOW_OBSERVE',
    accessPolicyRef: 'synthetic:policy:observe-v1',
  },
];

function cloneDecision(decision: VerifiedDecision): VerifiedDecision {
  return { ...decision };
}

function cloneContainment(evidence: ContainmentEvidence): ContainmentEvidence {
  return { ...evidence, rootBinding: { ...evidence.rootBinding } };
}

function cloneDataZoneDecision(decision: DataZoneDecision): DataZoneDecision {
  return { ...decision, decisionEvidence: [...decision.decisionEvidence] };
}

export function resolveTrustedDecision(
  decisionClass: TrustedDecisionClass,
  decisionRef: string | undefined,
): VerifiedDecision | undefined {
  if (!decisionRef) return undefined;
  const record = trustedDecisionRecords.find(
    (candidate) => candidate.decisionClass === decisionClass && candidate.decision.decisionRef === decisionRef,
  );
  return record ? cloneDecision(record.decision) : undefined;
}

export function resolveTrustedContainment(evidenceRef: string | undefined): ContainmentEvidence | undefined {
  if (!evidenceRef) return undefined;
  const record = trustedContainmentRecords.find((candidate) => candidate.evidenceRef === evidenceRef);
  return record ? cloneContainment(record) : undefined;
}

export function resolveDataZoneDecision(registryRef: string): DataZoneDecision | undefined {
  const record = dataZoneDecisionRecords.find((candidate) => candidate.registryRef === registryRef);
  return record ? cloneDataZoneDecision(record) : undefined;
}

export function resolveTrustedConfiguration(
  registryRef: string | undefined,
): TrustedConfigurationValidationRecord | undefined {
  if (!registryRef) return undefined;
  const record = trustedConfigurationRecords[registryRef];
  return record ? { ...record } : undefined;
}

export function resolveDataZoneAuthority(
  decisionRef: string | null | undefined,
): TrustedDataZoneAuthorityRecord | undefined {
  if (!decisionRef) return undefined;
  return trustedDataZoneAuthorityRecords.find((record) => record.decisionRef === decisionRef);
}

export function isImmutableConfigurationExactRef(value: string): boolean {
  return /^(?:sha256:[0-9a-f]{64}|commit:[0-9a-f]{40})$/i.test(value.trim());
}

export function trustAnchorHealth(): AuthorityResult {
  return trustedDecisionRecords.length > 0 &&
    trustedContainmentRecords.length > 0 &&
    trustedDataZoneAuthorityRecords.length > 0 &&
    dataZoneDecisionRecords.length > 0 &&
    Object.keys(trustedConfigurationRecords).length > 0
    ? 'ALLOW'
    : 'HOLD';
}
