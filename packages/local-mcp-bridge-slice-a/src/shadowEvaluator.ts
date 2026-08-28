import type { AuthorityResult, SearchBounds, ShadowRequest, ShadowResult } from './contracts';
import { isDefinitionCapability } from './definitionRegistry';
import {
  evaluateContainmentEvidence,
  evaluateDataAccessDecisions,
  evaluateDependencyEntries,
  evaluateVerifiedDecision,
} from './policy';

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

function isPositiveFiniteInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0;
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
  ].every(isPositiveFiniteInteger)
    ? 'ALLOW'
    : 'DENY';
}

function combine(results: readonly AuthorityResult[]): AuthorityResult {
  if (results.includes('DENY')) return 'DENY';
  if (results.includes('HOLD')) return 'HOLD';
  return 'ALLOW';
}

function needsDataAccessEvaluation(capability: string): boolean {
  return capability.startsWith('filesystem.') || capability === 'test_result.read_sanitized' || capability === 'log.read_sanitized';
}

export function evaluateShadow(request: ShadowRequest): ShadowResult {
  const capabilityDefined = isDefinitionCapability(request.capability);
  const definitionCapabilityResult: AuthorityResult = capabilityDefined ? 'ALLOW' : 'DENY';
  const mutationDenied = MUTATION_CAPABILITIES.has(request.capability);

  const scopeResult = evaluateVerifiedDecision(request.scopeDecision, request.targetIdentity);
  const authorityResult = evaluateVerifiedDecision(request.authorityDecision, request.targetIdentity);
  const dependencyResult = evaluateDependencyEntries(request.dependencyEntries);

  const runtimeStateResult: AuthorityResult =
    request.runtimeState === 'OBSERVE_ONLY' && capabilityDefined && !mutationDenied ? 'ALLOW' : 'DENY';

  let dataAccessResult: AuthorityResult = 'ALLOW';
  if (needsDataAccessEvaluation(request.capability)) {
    if (request.preAccessEligibility === 'INELIGIBLE') dataAccessResult = 'DENY';
    else if (request.preAccessEligibility === 'UNKNOWN' || request.preAccessEligibility === undefined) {
      dataAccessResult = 'HOLD';
    } else {
      dataAccessResult = evaluateDataAccessDecisions(request.dataZoneDecisions, {
        targetIdentity: request.targetIdentity,
        repositoryIdentity: request.repositoryIdentity,
        approvedRootIdentity: request.approvedRootIdentity,
      });
    }
  }

  let containmentResult: AuthorityResult = 'ALLOW';
  if (request.capability.startsWith('filesystem.')) {
    containmentResult = evaluateContainmentEvidence(request.containmentEvidence, request.targetIdentity);
  }

  let boundsResult: AuthorityResult = 'ALLOW';
  if (request.capability === 'filesystem.search') {
    boundsResult = validateSearchBounds(request.searchBounds);
  }

  const effectiveResult = combine([
    definitionCapabilityResult,
    scopeResult,
    authorityResult,
    dependencyResult,
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
          : scopeResult !== 'ALLOW'
            ? 'SCOPE_DECISION_NOT_VERIFIED_ALLOW'
            : authorityResult !== 'ALLOW'
              ? 'AUTHORITY_DECISION_NOT_VERIFIED_ALLOW'
              : dependencyResult !== 'ALLOW'
                ? 'DEPENDENCY_NOT_VERIFIED_ALLOW'
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
    scopeResult,
    authorityResult,
    dataAccessResult,
    dependencyResult,
    runtimeStateResult,
    containmentResult,
    boundsResult,
    shadowEvaluationResult: effectiveResult,
    effectiveResult,
    observationPerformed: false,
    observationResult: null,
    wouldExecute: effectiveResult === 'ALLOW',
    executionPerformed: false,
    blockReason,
    evidence: [
      `capability:${request.capability}`,
      `scope:${scopeResult}`,
      `authority:${authorityResult}`,
      `dependency:${dependencyResult}`,
      `runtime:${request.runtimeState}`,
      `effective:${effectiveResult}`,
      'observation-performed:false',
      'execution-performed:false',
    ],
  };
}
