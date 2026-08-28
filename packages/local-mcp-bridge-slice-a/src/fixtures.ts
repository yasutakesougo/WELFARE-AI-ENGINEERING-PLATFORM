import type {
  DependencyEntry,
  EvidenceEmit,
  ProcessObservationLimited,
  RepositoryObservation,
  SanitizedLogResult,
  SearchObservationSummary,
  ShadowRequest,
} from './contracts';

const now = '2026-08-28T00:00:00+09:00';
const repositoryIdentity = 'fixture:repo:normal';
const targetIdentity = 'fixture:file:readme';
const rootIdentity = 'root:A';

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

export const baseFilesystemReadRequest: ShadowRequest = {
  requestId: 'fixture-request-001',
  capability: 'filesystem.read',
  targetIdentity,
  repositoryIdentity,
  approvedRootIdentity: rootIdentity,
  targetPath: '/fixture/repo/README.md',
  runtimeState: 'OBSERVE_ONLY',
  scopeDecisionRef: 'synthetic:scope:read',
  authorityDecisionRef: 'synthetic:authority:read',
  dependencyEntries: [currentStateDependency],
  preAccessEligibility: 'ELIGIBLE',
  dataZoneDecisionRefs: ['synthetic:zone:development'],
  containmentEvidenceRef: 'synthetic:containment:pass',
};

export const validSearchBounds = {
  maxFiles: 10,
  maxBytes: 10_000,
  maxFileSize: 1_000,
  maxDepth: 3,
  maxResults: 10,
  timeoutMs: 1_000,
  maxOutputBytes: 2_000,
} as const;

export const sliceAFixtures: readonly { name: string; request: ShadowRequest; expected: 'ALLOW' | 'DENY' | 'HOLD' }[] = [
  { name: 'normal development read', request: baseFilesystemReadRequest, expected: 'ALLOW' },
  {
    name: 'root identity replacement',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-002', containmentEvidenceRef: 'synthetic:containment:root-replaced' },
    expected: 'DENY',
  },
  {
    name: 'production zone read',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-003', dataZoneDecisionRefs: ['synthetic:zone:production'] },
    expected: 'DENY',
  },
  {
    name: 'production cannot self-declare allow',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-004', dataZoneDecisionRefs: ['synthetic:zone:malicious-production-allow'] },
    expected: 'DENY',
  },
  {
    name: 'untrusted development claim cannot authorize read',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-005', dataZoneDecisionRefs: ['synthetic:zone:untrusted-development'] },
    expected: 'HOLD',
  },
  {
    name: 'untrusted metadata may only tighten access',
    request: {
      ...baseFilesystemReadRequest,
      requestId: 'fixture-request-006',
      dataZoneDecisionRefs: ['synthetic:zone:development', 'synthetic:zone:untrusted-production'],
    },
    expected: 'DENY',
  },
  {
    name: 'trusted config cannot self-authorize',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-007', dataZoneDecisionRefs: ['synthetic:zone:trusted-self-authorize'] },
    expected: 'HOLD',
  },
  {
    name: 'externally authorized trusted config can allow development read',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-008', dataZoneDecisionRefs: ['synthetic:zone:trusted-valid'] },
    expected: 'ALLOW',
  },
  {
    name: 'trusted config integrity failure',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-009', dataZoneDecisionRefs: ['synthetic:zone:trusted-integrity-fail'] },
    expected: 'HOLD',
  },
  {
    name: 'trusted config expiry',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-010', dataZoneDecisionRefs: ['synthetic:zone:trusted-expired'] },
    expected: 'HOLD',
  },
  {
    name: 'trusted config mutable exact ref rejected',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-011', dataZoneDecisionRefs: ['synthetic:zone:trusted-mutable-ref'] },
    expected: 'HOLD',
  },
  {
    name: 'trusted config unknown authority root rejected',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-012', dataZoneDecisionRefs: ['synthetic:zone:trusted-unknown-authority'] },
    expected: 'HOLD',
  },
  {
    name: 'data-zone authority semantic mismatch rejected',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-013', dataZoneDecisionRefs: ['synthetic:zone:authority-semantic-mismatch'] },
    expected: 'HOLD',
  },
  {
    name: 'unregistered data-zone decision ref rejected',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-014', dataZoneDecisionRefs: ['forged:zone:development'] },
    expected: 'HOLD',
  },
  {
    name: 'unknown pre-access classification',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-015', preAccessEligibility: 'UNKNOWN' },
    expected: 'HOLD',
  },
  {
    name: 'ineligible pre-access classification',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-016', preAccessEligibility: 'INELIGIBLE' },
    expected: 'DENY',
  },
  {
    name: 'unknown capability',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-017', capability: 'filesystem.magic' },
    expected: 'DENY',
  },
  {
    name: 'evidence persistence request',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-018', capability: 'evidence.persist' },
    expected: 'DENY',
  },
  {
    name: 'internal subprocess request',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-019', capability: 'process.spawn' },
    expected: 'DENY',
  },
  {
    name: 'invalid zero search bound',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-020', capability: 'filesystem.search', searchBounds: { ...validSearchBounds, maxFiles: 0 } },
    expected: 'DENY',
  },
  {
    name: 'invalid fractional search bound',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-021', capability: 'filesystem.search', searchBounds: { ...validSearchBounds, maxFiles: 1.5 } },
    expected: 'DENY',
  },
  {
    name: 'missing search bounds',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-022', capability: 'filesystem.search', searchBounds: undefined },
    expected: 'DENY',
  },
  {
    name: 'search bound exceeds policy ceiling',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-023', capability: 'filesystem.search', searchBounds: { ...validSearchBounds, maxFiles: 1001 } },
    expected: 'DENY',
  },
  {
    name: 'valid bounded search candidate',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-024', capability: 'filesystem.search', searchBounds: validSearchBounds },
    expected: 'ALLOW',
  },
  {
    name: 'scope decision target mismatch',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-025', scopeDecisionRef: 'synthetic:scope:other-target' },
    expected: 'HOLD',
  },
  {
    name: 'forged verified authority ref rejected',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-026', authorityDecisionRef: 'forged:authority:read' },
    expected: 'HOLD',
  },
  {
    name: 'dependency exact-ref mismatch',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-027', dependencyEntries: [{ ...currentStateDependency, exactRef: 'deadbeef' }] },
    expected: 'HOLD',
  },
  {
    name: 'required dependency missing',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-028', dependencyEntries: [] },
    expected: 'HOLD',
  },
  {
    name: 'data-zone target scope mismatch',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-029', dataZoneDecisionRefs: ['synthetic:zone:target-mismatch'] },
    expected: 'HOLD',
  },
  {
    name: 'symlink escape containment fail',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-030', containmentEvidenceRef: 'synthetic:containment:symlink-escape' },
    expected: 'DENY',
  },
  {
    name: 'junction containment unverifiable',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-031', containmentEvidenceRef: 'synthetic:containment:junction-unverifiable' },
    expected: 'DENY',
  },
  {
    name: 'path traversal containment fail',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-032', targetPath: '/fixture/repo/../outside/secret.txt', containmentEvidenceRef: 'synthetic:containment:path-traversal' },
    expected: 'DENY',
  },
  {
    name: 'unregistered containment pass rejected',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-033', containmentEvidenceRef: 'forged:containment:pass' },
    expected: 'DENY',
  },
  {
    name: 'secret-like filename preclassified restricted',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-034', targetPath: '/fixture/repo/.env', dataZoneDecisionRefs: ['synthetic:zone:restricted'] },
    expected: 'DENY',
  },
  {
    name: 'secret-like content marker preclassified restricted',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-035', dataZoneDecisionRefs: ['synthetic:zone:restricted'] },
    expected: 'DENY',
  },
  {
    name: 'personal-data-like marker preclassified restricted',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-036', dataZoneDecisionRefs: ['synthetic:zone:restricted'] },
    expected: 'DENY',
  },
  {
    name: 'runtime disabled',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-037', runtimeState: 'DISABLED' },
    expected: 'DENY',
  },
  {
    name: 'execution-capable runtime unreachable in slice A',
    request: { ...baseFilesystemReadRequest, requestId: 'fixture-request-038', runtimeState: 'EXECUTION_CAPABLE' },
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
  resourceSummary: { cpuPercent: 0, residentMemoryBytes: 1024, threadCount: 1, handleCount: 4 },
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
