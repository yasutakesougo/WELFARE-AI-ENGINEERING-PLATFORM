import type {
  DataZoneDecision,
  DependencyEntry,
  EvidenceEmit,
  ProcessObservationLimited,
  RepositoryObservation,
  SanitizedLogResult,
  SearchObservationSummary,
  ShadowRequest,
  VerifiedDecision,
} from './contracts';

const now = '2026-08-28T00:00:00+09:00';
const repositoryIdentity = 'fixture:repo:normal';
const targetIdentity = 'fixture:file:readme';
const rootIdentity = 'root:A';

function verifiedDecision(ref: string, target = targetIdentity): VerifiedDecision {
  return {
    result: 'ALLOW',
    producerIdentity: 'fixture:verified-policy-engine',
    decisionRef: ref,
    targetIdentity: target,
    evaluatedAt: now,
    evidenceRef: `${ref}:evidence`,
    verificationState: 'VERIFIED',
  };
}

export const currentStateDependency: DependencyEntry = {
  dependencyId: 'WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1',
  revision: 'Definition Correction-1',
  exactRef: '5c55d9383a34915c45619429d7e24488ade75337',
  definitionState: 'CORRECTED / NOT LOCKED',
  relationship: 'COMPATIBILITY_REQUIRED',
  authorityRole: 'CONSTRAINT_ONLY',
  verifiedAt: now,
  verificationEvidence: 'fixture:immutable-commit:5c55d9383a34915c45619429d7e24488ade75337',
};

export const syntheticDevelopmentZone: DataZoneDecision = {
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
};

export const syntheticProductionZone: DataZoneDecision = {
  ...syntheticDevelopmentZone,
  dataZone: 'PRODUCTION',
  observationAccessClass: 'DENY_OBSERVE',
  dataZoneDecisionRef: 'synthetic:authority:production',
};

export const maliciousProductionAllowClaim: DataZoneDecision = {
  ...syntheticProductionZone,
  observationAccessClass: 'ALLOW_OBSERVE',
};

export const untrustedDevelopmentClaim: DataZoneDecision = {
  ...syntheticDevelopmentZone,
  dataZoneSource: 'UNTRUSTED_METADATA',
  dataZoneAuthority: 'CONSTRAINT_ONLY',
  dataZoneDecisionRef: null,
};

export const untrustedProductionConstraint: DataZoneDecision = {
  ...syntheticProductionZone,
  dataZoneSource: 'UNTRUSTED_METADATA',
  dataZoneAuthority: 'CONSTRAINT_ONLY',
  dataZoneDecisionRef: null,
};

export const selfAuthorizingTrustedConfig: DataZoneDecision = {
  ...syntheticDevelopmentZone,
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

export const trustedConfigIntegrityFailure: DataZoneDecision = {
  ...validTrustedConfigDevelopment,
  trustedConfigurationValidation: {
    ...validTrustedConfigDevelopment.trustedConfigurationValidation!,
    integrityResult: 'FAIL',
  },
};

export const trustedConfigExpired: DataZoneDecision = {
  ...validTrustedConfigDevelopment,
  trustedConfigurationValidation: {
    ...validTrustedConfigDevelopment.trustedConfigurationValidation!,
    configurationAuthorityState: 'EXPIRED',
  },
};

export const targetMismatchDevelopmentZone: DataZoneDecision = {
  ...syntheticDevelopmentZone,
  scopeIdentity: 'root:OTHER',
  targetIdentity: 'root:OTHER',
};

export const restrictedSyntheticMarker: DataZoneDecision = {
  ...syntheticDevelopmentZone,
  dataZone: 'RESTRICTED',
  observationAccessClass: 'DENY_OBSERVE',
  dataZoneDecisionRef: 'synthetic:authority:restricted',
};

export const baseFilesystemReadRequest: ShadowRequest = {
  requestId: 'fixture-request-001',
  capability: 'filesystem.read',
  targetIdentity,
  repositoryIdentity,
  approvedRootIdentity: rootIdentity,
  targetPath: '/fixture/repo/README.md',
  runtimeState: 'OBSERVE_ONLY',
  scopeDecision: verifiedDecision('synthetic:scope:read'),
  authorityDecision: verifiedDecision('synthetic:authority:read'),
  dependencyEntries: [currentStateDependency],
  preAccessEligibility: 'ELIGIBLE',
  dataZoneDecisions: [syntheticDevelopmentZone],
  containmentEvidence: {
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
};

const validSearchBounds = {
  maxFiles: 10,
  maxBytes: 10000,
  maxFileSize: 1000,
  maxDepth: 3,
  maxResults: 10,
  timeoutMs: 1000,
  maxOutputBytes: 2000,
} as const;

export const sliceAFixtures: readonly { name: string; request: ShadowRequest; expected: 'ALLOW' | 'DENY' | 'HOLD' }[] = [
  { name: 'normal development read', request: baseFilesystemReadRequest, expected: 'ALLOW' },
  {
    name: 'root identity replacement',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-002',
      containmentEvidence: { ...baseFilesystemReadRequest.containmentEvidence!, observedRootIdentity: 'root:B' },
    },
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
    name: 'untrusted metadata may only tighten access',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-006',
      dataZoneDecisions: [syntheticDevelopmentZone, untrustedProductionConstraint],
    },
    expected: 'DENY',
  },
  {
    name: 'trusted config cannot self-authorize',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-007', dataZoneDecisions: [selfAuthorizingTrustedConfig] },
    expected: 'HOLD',
  },
  {
    name: 'externally authorized trusted config can allow development read',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-008', dataZoneDecisions: [validTrustedConfigDevelopment] },
    expected: 'ALLOW',
  },
  {
    name: 'trusted config integrity failure',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-009', dataZoneDecisions: [trustedConfigIntegrityFailure] },
    expected: 'HOLD',
  },
  {
    name: 'trusted config expiry',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-010', dataZoneDecisions: [trustedConfigExpired] },
    expected: 'HOLD',
  },
  {
    name: 'unknown pre-access classification',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-011', preAccessEligibility: 'UNKNOWN' },
    expected: 'HOLD',
  },
  {
    name: 'ineligible pre-access classification',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-012', preAccessEligibility: 'INELIGIBLE' },
    expected: 'DENY',
  },
  {
    name: 'unknown capability',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-013', capability: 'filesystem.magic' },
    expected: 'DENY',
  },
  {
    name: 'evidence persistence request',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-014', capability: 'evidence.persist' },
    expected: 'DENY',
  },
  {
    name: 'internal subprocess request',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-015', capability: 'process.spawn' },
    expected: 'DENY',
  },
  {
    name: 'invalid zero search bound',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-016', capability: 'filesystem.search', searchBounds: { ...validSearchBounds, maxFiles: 0 } },
    expected: 'DENY',
  },
  {
    name: 'invalid fractional search bound',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-017', capability: 'filesystem.search', searchBounds: { ...validSearchBounds, maxFiles: 1.5 } },
    expected: 'DENY',
  },
  {
    name: 'missing search bounds',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-018', capability: 'filesystem.search', searchBounds: undefined },
    expected: 'DENY',
  },
  {
    name: 'valid bounded search candidate',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-019', capability: 'filesystem.search', searchBounds: validSearchBounds },
    expected: 'ALLOW',
  },
  {
    name: 'scope decision target mismatch',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-020', scopeDecision: verifiedDecision('synthetic:scope:wrong', 'fixture:file:other') },
    expected: 'HOLD',
  },
  {
    name: 'authority decision unverified',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-021',
      authorityDecision: { ...baseFilesystemReadRequest.authorityDecision, verificationState: 'UNVERIFIED' },
    },
    expected: 'HOLD',
  },
  {
    name: 'dependency exact-ref mismatch',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-022',
      dependencyEntries: [{ ...currentStateDependency, exactRef: 'deadbeef' }],
    },
    expected: 'HOLD',
  },
  {
    name: 'required dependency missing',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-023', dependencyEntries: [] },
    expected: 'HOLD',
  },
  {
    name: 'data-zone target scope mismatch',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-024', dataZoneDecisions: [targetMismatchDevelopmentZone] },
    expected: 'HOLD',
  },
  {
    name: 'symlink escape containment fail',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-025',
      containmentEvidence: { ...baseFilesystemReadRequest.containmentEvidence!, containmentResult: 'FAIL', evidenceRef: 'synthetic:symlink-escape' },
    },
    expected: 'DENY',
  },
  {
    name: 'junction containment unverifiable',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-026',
      containmentEvidence: { ...baseFilesystemReadRequest.containmentEvidence!, containmentResult: 'UNVERIFIABLE', evidenceRef: 'synthetic:junction-unverifiable' },
    },
    expected: 'DENY',
  },
  {
    name: 'path traversal containment fail',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-027',
      targetPath: '/fixture/repo/../outside/secret.txt',
      containmentEvidence: { ...baseFilesystemReadRequest.containmentEvidence!, containmentResult: 'FAIL', evidenceRef: 'synthetic:path-traversal' },
    },
    expected: 'DENY',
  },
  {
    name: 'secret-like filename preclassified restricted',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-028', targetPath: '/fixture/repo/.env', dataZoneDecisions: [restrictedSyntheticMarker] },
    expected: 'DENY',
  },
  {
    name: 'secret-like content marker preclassified restricted',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-029', dataZoneDecisions: [restrictedSyntheticMarker] },
    expected: 'DENY',
  },
  {
    name: 'personal-data-like marker preclassified restricted',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-030', dataZoneDecisions: [restrictedSyntheticMarker] },
    expected: 'DENY',
  },
  {
    name: 'runtime disabled',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-031', runtimeState: 'DISABLED' },
    expected: 'DENY',
  },
  {
    name: 'execution-capable runtime unreachable in slice A',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-032', runtimeState: 'EXECUTION_CAPABLE' },
    expected: 'DENY',
  },
];

const baseRepositoryObservation: RepositoryObservation = {
  observationId: 'repo-observation-clean',
  repositoryIdentity: {
    repositoryId: 'fixture-repository-id',
    host: 'fixture.invalid',
    owner: 'fixture',
    repository: 'repo',
  },
  exactHeadSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  branch: 'main',
  detachedHead: false,
  workingState: { workingTree: 'CLEAN', index: 'CLEAN', untrackedCount: 0, conflictCount: 0 },
  branchRelation: {
    upstreamRef: 'origin/main',
    trackingRefObservedSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    mergeBaseSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    aheadBy: 0,
    behindBy: 0,
    relationAvailability: 'AVAILABLE',
    sourceClass: 'LOCAL_OBSERVATION',
    remoteCurrentStateResolved: false,
  },
  sourceClass: 'LOCAL_OBSERVATION',
  observationStartedAt: now,
  observationCompletedAt: now,
  identityBefore: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  identityAfter: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  consistencyResult: 'PASS',
  observationResult: 'COMPLETE',
  evidenceReferences: ['synthetic:repo-observation'],
};

export const repositoryObservationFixtures: readonly RepositoryObservation[] = [
  baseRepositoryObservation,
  { ...baseRepositoryObservation, observationId: 'repo-observation-dirty', workingState: { ...baseRepositoryObservation.workingState, workingTree: 'DIRTY' } },
  { ...baseRepositoryObservation, observationId: 'repo-observation-detached', branch: null, detachedHead: true },
  { ...baseRepositoryObservation, observationId: 'repo-observation-untracked', workingState: { ...baseRepositoryObservation.workingState, untrackedCount: 3 } },
  { ...baseRepositoryObservation, observationId: 'repo-observation-conflict', workingState: { workingTree: 'DIRTY', index: 'DIRTY', untrackedCount: 0, conflictCount: 2 } },
  {
    ...baseRepositoryObservation,
    observationId: 'repo-observation-stale-tracking',
    branchRelation: { ...baseRepositoryObservation.branchRelation, trackingRefObservedSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', behindBy: 1, remoteCurrentStateResolved: false },
  },
  {
    ...baseRepositoryObservation,
    observationId: 'repo-observation-identity-movement',
    identityAfter: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    consistencyResult: 'FAIL',
    observationResult: 'INVALIDATED',
  },
];

export const limitedProcessFixture: ProcessObservationLimited = {
  observationId: 'process-limited-001',
  pid: 123,
  parentPid: 1,
  executableName: 'node',
  state: 'running',
  startTime: now,
  resourceSummary: { cpuPercent: 0, memoryBytes: 1024 },
  observationResult: 'COMPLETE',
  sanitized: true,
};

export const maliciousInstructionLogFixture: SanitizedLogResult = {
  observationId: 'log-sanitized-001',
  sourceIdentity: 'fixture:log:malicious-instruction',
  status: 'SANITIZED',
  boundedSummary: 'Untrusted instruction-like content detected and treated as data.',
  sanitizedDiagnostics: ['instruction-like content redacted'],
  excerpt: '[REDACTED_UNTRUSTED_INSTRUCTION]',
  excerptBytes: 32,
  outputTruncated: false,
  redacted: true,
  containsUntrustedInstruction: true,
  authorityInstructionApplied: false,
  observationResult: 'COMPLETE',
};

export const boundedSearchExhaustionFixture: SearchObservationSummary = {
  observationId: 'search-partial-001',
  bounds: validSearchBounds,
  filesVisited: validSearchBounds.maxFiles,
  bytesRead: 9000,
  resultsProduced: 8,
  outputBytesProduced: 1500,
  depthReached: 3,
  elapsedMs: 500,
  exhaustedBy: 'maxFiles',
  outputTruncated: true,
  observationResult: 'PARTIAL',
};

export const evidenceEmitFixture: EvidenceEmit = {
  evidenceId: 'evidence-emit-001',
  observationId: null,
  requestId: 'fixture-request-evidence',
  actorId: 'fixture:actor',
  bridgeId: 'fixture:bridge',
  capability: 'evidence.emit',
  targetIdentity: 'fixture:target',
  sourceClass: null,
  observationStartedAt: null,
  observationCompletedAt: null,
  policyDecision: 'ALLOW',
  evidenceReferences: ['synthetic-only'],
  persistencePerformed: false,
};
