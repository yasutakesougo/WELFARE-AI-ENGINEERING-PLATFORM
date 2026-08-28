import type {
  AuthorityResult,
  DataZoneDecision,
  SearchBounds,
  ShadowRequest,
  ShadowResult,
} from './contracts';

const ALLOWED_CAPABILITIES = new Set([
  'repository.observe',
  'filesystem.read',
  'filesystem.list',
  'filesystem.search',
  'process.observe_limited',
  'test_result.read_sanitized',
  'log.read_sanitized',
  'evidence.emit',
]);

const MUTATION_CAPABILITIES = new Set([
  'evidence.persist',
  'filesystem.write',
  'filesystem.patch',
  'filesystem.delete',
  'filesystem.move',
  'process.spawn',
  'shell.spawn',
  'command.execute',
  'git.commit',
  'git.push',
  'desktop.control',
]);

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function validateSearchBounds(bounds: SearchBounds | undefined): AuthorityResult {
  if (!bounds) return 'DENY';
  return [
    bounds.maxFiles,
    bounds.maxBytes,
    bounds.maxFileSize,
    bounds.maxDepth,
    bounds.maxResults,
    bounds.timeoutMs,
    bounds.maxOutputBytes,
  ].every(isPositiveFinite)
    ? 'ALLOW'
    : 'DENY';
}

export function evaluateDataAccess(decision: DataZoneDecision | undefined): AuthorityResult {
  if (!decision) return 'HOLD';
  switch (decision.observationAccessClass) {
    case 'ALLOW_OBSERVE':
      return 'ALLOW';
    case 'HOLD_OBSERVE':
      return 'HOLD';
    case 'DENY_OBSERVE':
      return 'DENY';
  }
}

function combine(results: readonly AuthorityResult[]): AuthorityResult {
  if (results.includes('DENY')) return 'DENY';
  if (results.includes('HOLD')) return 'HOLD';
  return 'ALLOW';
}

export function evaluateShadow(request: ShadowRequest): ShadowResult {
  const definitionCapabilityResult: AuthorityResult =
    request.definitionAllowsCapability && ALLOWED_CAPABILITIES.has(request.capability)
      ? 'ALLOW'
      : 'DENY';

  const mutationDenied = MUTATION_CAPABILITIES.has(request.capability);
  const runtimeStateResult: AuthorityResult =
    request.runtimeState === 'OBSERVE_ONLY' && !mutationDenied ? 'ALLOW' : 'DENY';

  let dataAccessResult: AuthorityResult = 'ALLOW';
  if (request.capability.startsWith('filesystem.') || request.capability.includes('read')) {
    if (request.preAccessEligibility === 'INELIGIBLE') dataAccessResult = 'DENY';
    else if (request.preAccessEligibility === 'UNKNOWN' || request.preAccessEligibility === undefined)
      dataAccessResult = 'HOLD';
    else dataAccessResult = evaluateDataAccess(request.dataZoneDecision);
  }

  let containmentResult: AuthorityResult = 'ALLOW';
  if (request.capability.startsWith('filesystem.')) {
    if (!request.rootBinding || !request.observedRootIdentity) containmentResult = 'DENY';
    else if (request.rootBinding.resolvedIdentity !== request.observedRootIdentity) containmentResult = 'DENY';
    else if (request.targetContainmentResult !== 'PASS') containmentResult = 'DENY';
  }

  let boundsResult: AuthorityResult = 'ALLOW';
  if (request.capability === 'filesystem.search') {
    boundsResult = validateSearchBounds(request.searchBounds);
  }

  const effectiveResult = combine([
    definitionCapabilityResult,
    request.scopeResult,
    request.authorityResult,
    request.dependencyResult,
    dataAccessResult,
    runtimeStateResult,
    containmentResult,
    boundsResult,
  ]);

  const blockReason =
    effectiveResult === 'ALLOW'
      ? null
      : mutationDenied
        ? 'MUTATION_CAPABILITY_DENIED'
        : definitionCapabilityResult === 'DENY'
          ? 'CAPABILITY_NOT_DEFINED'
          : containmentResult === 'DENY'
            ? 'CONTAINMENT_NOT_PROVEN'
            : boundsResult === 'DENY'
              ? 'INVALID_SEARCH_BOUNDS'
              : dataAccessResult === 'DENY'
                ? 'DATA_ACCESS_DENIED'
                : dataAccessResult === 'HOLD'
                  ? 'DATA_ACCESS_HOLD'
                  : 'POLICY_OR_AUTHORITY_BLOCK';

  return {
    requestId: request.requestId,
    capability: request.capability,
    targetIdentity: request.targetIdentity,
    definitionCapabilityResult,
    scopeResult: request.scopeResult,
    authorityResult: request.authorityResult,
    dataAccessResult,
    dependencyResult: request.dependencyResult,
    runtimeStateResult,
    observationResult: effectiveResult === 'ALLOW' ? 'COMPLETE' : effectiveResult === 'HOLD' ? 'PARTIAL' : 'FAILED',
    effectiveResult,
    wouldExecute: effectiveResult === 'ALLOW',
    executionPerformed: false,
    blockReason,
    evidence: [
      `capability:${request.capability}`,
      `runtime:${request.runtimeState}`,
      `effective:${effectiveResult}`,
    ],
  };
}
