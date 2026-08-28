import type { DataZoneDecision, ShadowRequest } from './contracts';

const now = '2026-08-28T00:00:00+09:00';

export const syntheticDevelopmentZone: DataZoneDecision = {
  dataZone: 'DEVELOPMENT',
  dataZoneSource: 'EXPLICIT_AUTHORITY_DECISION',
  dataZoneAuthority: 'AUTHORITATIVE',
  dataZoneDecisionRef: 'synthetic:authority:development',
  classifiedAt: now,
  targetIdentity: 'fixture:repo:normal',
  decisionEvidence: ['synthetic-only'],
  observationAccessClass: 'ALLOW_OBSERVE',
  accessPolicyRef: 'synthetic:policy:observe-v1',
};

export const syntheticProductionZone: DataZoneDecision = {
  ...syntheticDevelopmentZone,
  dataZone: 'PRODUCTION',
  targetIdentity: 'fixture:repo:production-like',
  observationAccessClass: 'DENY_OBSERVE',
  dataZoneDecisionRef: 'synthetic:authority:production',
};

export const maliciousProductionAllowClaim: DataZoneDecision = {
  ...syntheticProductionZone,
  targetIdentity: 'fixture:repo:malicious-production-allow',
  observationAccessClass: 'ALLOW_OBSERVE',
};

export const untrustedDevelopmentClaim: DataZoneDecision = {
  ...syntheticDevelopmentZone,
  targetIdentity: 'fixture:repo:untrusted-development',
  dataZoneSource: 'UNTRUSTED_METADATA',
  dataZoneAuthority: 'CONSTRAINT_ONLY',
  dataZoneDecisionRef: null,
};

export const selfAuthorizingTrustedConfig: DataZoneDecision = {
  ...syntheticDevelopmentZone,
  targetIdentity: 'fixture:repo:self-authorizing-config',
  dataZoneSource: 'TRUSTED_CONFIGURATION',
  trustedConfigurationValidation: {
    configurationIdentity: 'config:A',
    configurationExactRef: 'sha256:config-a',
    integrityResult: 'PASS',
    configurationAuthorityRef: 'config:A',
    configurationAuthorityState: 'VALID',
    targetScopeMatch: true,
    authorityCycleDetected: true,
    validatedAt: now,
  },
};

export const validTrustedConfigDevelopment: DataZoneDecision = {
  ...syntheticDevelopmentZone,
  targetIdentity: 'fixture:repo:valid-trusted-config',
  dataZoneSource: 'TRUSTED_CONFIGURATION',
  trustedConfigurationValidation: {
    configurationIdentity: 'config:B',
    configurationExactRef: 'sha256:config-b',
    integrityResult: 'PASS',
    configurationAuthorityRef: 'authority:external:B',
    configurationAuthorityState: 'VALID',
    targetScopeMatch: true,
    authorityCycleDetected: false,
    validatedAt: now,
  },
};

export const baseFilesystemReadRequest: ShadowRequest = {
  requestId: 'fixture-request-001',
  capability: 'filesystem.read',
  targetIdentity: 'fixture:file:readme',
  targetPath: '/fixture/repo/README.md',
  runtimeState: 'OBSERVE_ONLY',
  definitionAllowsCapability: true,
  scopeResult: 'ALLOW',
  authorityResult: 'ALLOW',
  dependencyResult: 'ALLOW',
  preAccessEligibility: 'ELIGIBLE',
  dataZoneDecisions: [syntheticDevelopmentZone],
  rootBinding: {
    configuredPath: '/fixture/repo',
    resolvedPath: '/fixture/repo',
    resolvedIdentity: 'root:A',
    resolvedAt: now,
    authorityRef: 'synthetic:root-authority',
  },
  observedRootIdentity: 'root:A',
  targetContainmentResult: 'PASS',
};

export const sliceAFixtures: readonly { name: string; request: ShadowRequest; expected: 'ALLOW' | 'DENY' | 'HOLD' }[] = [
  {
    name: 'normal development read',
    request: baseFilesystemReadRequest,
    expected: 'ALLOW',
  },
  {
    name: 'root identity replacement',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-002', observedRootIdentity: 'root:B' },
    expected: 'DENY',
  },
  {
    name: 'production zone read',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-003', dataZoneDecisions: [syntheticProductionZone] },
    expected: 'DENY',
  },
  {
    name: 'production cannot self-declare allow',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-004', dataZoneDecisions: [maliciousProductionAllowClaim] },
    expected: 'DENY',
  },
  {
    name: 'untrusted development claim cannot authorize read',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-005', dataZoneDecisions: [untrustedDevelopmentClaim] },
    expected: 'HOLD',
  },
  {
    name: 'trusted config cannot self-authorize',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-006', dataZoneDecisions: [selfAuthorizingTrustedConfig] },
    expected: 'HOLD',
  },
  {
    name: 'externally authorized trusted config can allow development read',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-007', dataZoneDecisions: [validTrustedConfigDevelopment] },
    expected: 'ALLOW',
  },
  {
    name: 'unknown pre-access classification',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-008', preAccessEligibility: 'UNKNOWN' },
    expected: 'HOLD',
  },
  {
    name: 'unknown capability',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-009', capability: 'filesystem.magic' },
    expected: 'DENY',
  },
  {
    name: 'evidence persistence request',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-010', capability: 'evidence.persist' },
    expected: 'DENY',
  },
  {
    name: 'internal subprocess request',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-011', capability: 'process.spawn' },
    expected: 'DENY',
  },
  {
    name: 'invalid search bounds',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-012',
      capability: 'filesystem.search',
      searchBounds: {
        maxFiles: 0,
        maxBytes: 10,
        maxFileSize: 10,
        maxDepth: 1,
        maxResults: 1,
        timeoutMs: 1,
        maxOutputBytes: 10,
      },
    },
    expected: 'DENY',
  },
];
