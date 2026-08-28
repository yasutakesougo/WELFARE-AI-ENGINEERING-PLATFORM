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
  dataZoneDecision: syntheticDevelopmentZone,
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
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-003', dataZoneDecision: syntheticProductionZone },
    expected: 'DENY',
  },
  {
    name: 'unknown pre-access classification',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-004', preAccessEligibility: 'UNKNOWN' },
    expected: 'HOLD',
  },
  {
    name: 'unknown capability',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-005', capability: 'filesystem.magic' },
    expected: 'DENY',
  },
  {
    name: 'evidence persistence request',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-006', capability: 'evidence.persist' },
    expected: 'DENY',
  },
  {
    name: 'internal subprocess request',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-007', capability: 'process.spawn' },
    expected: 'DENY',
  },
  {
    name: 'invalid search bounds',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-008',
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
