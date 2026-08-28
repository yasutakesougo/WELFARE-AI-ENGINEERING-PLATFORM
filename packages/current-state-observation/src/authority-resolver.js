import { AUTHORITY_RESULT, immutableRecord, sameJsonIdentity, validateAuthorityPolicyRevisionIdentity } from './contracts.js';
import { validateAuthorityDecisionGraph } from './authority-graph.js';

function timeState(decision, at) {
  const t = new Date(at).getTime();
  if (Number.isNaN(t)) return 'UNRESOLVED_TIME';
  if (decision.effectiveAt && new Date(decision.effectiveAt).getTime() > t) return 'FUTURE';
  if (decision.expiresAt && new Date(decision.expiresAt).getTime() <= t) return 'EXPIRED';
  return 'ACTIVE';
}

function policyResolvable(decision, context) {
  return Array.isArray(context.resolvablePolicyRevisions)
    && context.resolvablePolicyRevisions.some((identity) => sameJsonIdentity(identity, decision.authorityPolicyRevisionIdentity));
}

function applicabilityReason(decision, context) {
  if (decision.actorAuthorized !== true || !decision.actorAuthorityBasis) return 'ACTOR_AUTHORITY_UNRESOLVED';
  if (!policyResolvable(decision, context)) return 'POLICY_REVISION_UNRESOLVED';
  if (decision.repositoryIdentity !== context.repositoryIdentity) return 'REPOSITORY_MISMATCH';
  if (decision.authorityDomain !== context.authorityPolicyIdentity.authorityDomain) return 'AUTHORITY_DOMAIN_MISMATCH';
  if (decision.action !== context.action) return 'ACTION_MISMATCH';
  if (!sameJsonIdentity(decision.scope, context.scope)) return 'SCOPE_MISMATCH';
  if (decision.targetIdentity !== '*' && decision.targetIdentity !== context.targetIdentity) return 'TARGET_MISMATCH';
  if (decision.targetRevisionIdentity === '*') {
    return decision.revisionIndependent === true && context.policyRevision.revisionIndependentAllowed === true
      ? null
      : 'REVISION_INDEPENDENCE_NOT_ALLOWED';
  }
  return sameJsonIdentity(decision.targetRevisionIdentity, context.targetRevisionIdentity) ? null : 'REVISION_MISMATCH';
}

function decisionApplicable(decision, context) {
  return applicabilityReason(decision, context) === null;
}

function lifecycleEdgeEffective(sourceDecision, context) {
  return decisionApplicable(sourceDecision, context) && timeState(sourceDecision, context.resolvedAt) === 'ACTIVE';
}

function contextFindings(context) {
  const findings = [];
  for (const field of ['authorityResolutionId', 'resolvedAt', 'repositoryIdentity', 'targetIdentity', 'action', 'decisionGraphValidationId', 'scopeResolutionRuleRef']) {
    if (typeof context?.[field] !== 'string' || context[field].length === 0) findings.push(`AUTHORITY_CONTEXT_${field.toUpperCase()}_MISSING`);
  }
  if (context?.resolvedAt && Number.isNaN(new Date(context.resolvedAt).getTime())) findings.push('AUTHORITY_RESOLVED_AT_INVALID');
  if (validateAuthorityPolicyRevisionIdentity(context?.policyRevisionIdentity).result !== 'PASS') findings.push('CURRENT_POLICY_REVISION_INVALID');
  if (context?.currentPolicyCompatibility !== 'PASS') findings.push('CURRENT_POLICY_COMPATIBILITY_NOT_PASS');
  if (typeof context?.currentPolicyCompatibilityEvidenceRef !== 'string' || context.currentPolicyCompatibilityEvidenceRef.length === 0) findings.push('CURRENT_POLICY_COMPATIBILITY_EVIDENCE_MISSING');
  if (!context?.authorityPolicyIdentity?.policyId
    || !context?.authorityPolicyIdentity?.policyName
    || context?.authorityPolicyIdentity?.authorityDomain !== context?.action
    || context.authorityPolicyIdentity.policyId !== context?.policyRevisionIdentity?.policyId) findings.push('AUTHORITY_POLICY_IDENTITY_INVALID');
  if (!context?.scope || typeof context.scope !== 'object') findings.push('AUTHORITY_SCOPE_UNRESOLVED');
  if (!context?.policyRevision
    || !sameJsonIdentity(context.policyRevision.identity, context.policyRevisionIdentity)
    || typeof context.policyRevision.evidenceRef !== 'string' || context.policyRevision.evidenceRef.length === 0
    || typeof context.policyRevision.revisionIndependentAllowed !== 'boolean'
    || !Array.isArray(context.policyRevision.precedenceDecisionIds)
    || context.policyRevision.scopeResolutionRuleRef !== context.scopeResolutionRuleRef) findings.push('CURRENT_POLICY_RULES_NOT_BOUND_TO_REVISION');
  if (!Array.isArray(context?.evidenceReferences) || context.evidenceReferences.length === 0) findings.push('AUTHORITY_RESOLUTION_EVIDENCE_MISSING');
  return findings;
}

function resolutionRecord(context, graph, applicableDecisionIds, result, reason, findings = [], extras = {}) {
  return immutableRecord({
    authorityResolutionId: context?.authorityResolutionId ?? 'UNRESOLVED',
    resolvedAt: context?.resolvedAt ?? null,
    repositoryIdentity: context?.repositoryIdentity ?? null,
    targetIdentity: context?.targetIdentity ?? null,
    targetRevisionIdentity: context?.targetRevisionIdentity ?? null,
    action: context?.action ?? null,
    scope: context?.scope ?? null,
    authorityPolicyIdentity: context?.authorityPolicyIdentity ?? null,
    authorityPolicyRevisionIdentity: context?.policyRevisionIdentity ?? null,
    decisionGraphValidationRef: graph?.validationId ?? context?.decisionGraphValidationId ?? null,
    evaluatedDecisionIds: Array.isArray(context?.decisions) ? context.decisions.map((decision) => decision?.decisionId ?? 'MISSING') : [],
    applicableDecisionIds,
    excludedDecisions: extras.excludedDecisions ?? [],
    suppressedDecisions: extras.suppressedDecisions ?? [],
    scopeResolutionRuleRef: context?.scopeResolutionRuleRef ?? null,
    conditionsEvaluationRefs: context?.conditionsEvaluationRefs ?? [],
    result,
    reason,
    precedenceDecisionId: extras.precedenceDecisionId,
    findings,
    evidenceReferences: context?.evidenceReferences ?? [],
  });
}

export function resolveAuthority(context) {
  const invalidContext = contextFindings(context);
  if (invalidContext.length) {
    return resolutionRecord(context, null, [], AUTHORITY_RESULT.UNRESOLVED, invalidContext[0], invalidContext);
  }

  const graph = validateAuthorityDecisionGraph(context.decisions, context.decisionGraphValidationId);
  if (graph.result !== 'PASS') {
    return resolutionRecord(context, graph, [], AUTHORITY_RESULT.UNRESOLVED, `AUTHORITY_DECISION_GRAPH_${graph.result}`, graph.findings);
  }

  const suppressedMap = new Map();
  for (const decision of context.decisions) {
    if (!lifecycleEdgeEffective(decision, context)) continue;
    if (decision.supersedesDecisionId) suppressedMap.set(decision.supersedesDecisionId, { decisionId: decision.supersedesDecisionId, reason: 'SUPERSEDED', sourceDecisionId: decision.decisionId });
    if (decision.revokesDecisionId) suppressedMap.set(decision.revokesDecisionId, { decisionId: decision.revokesDecisionId, reason: 'REVOKED', sourceDecisionId: decision.decisionId });
  }

  const applicable = [];
  const excludedDecisions = [];
  for (const decision of context.decisions) {
    const applicability = applicabilityReason(decision, context);
    const temporal = timeState(decision, context.resolvedAt);
    const suppressed = suppressedMap.get(decision.decisionId);
    if (applicability !== null) excludedDecisions.push({ decisionId: decision.decisionId, reason: applicability });
    else if (temporal !== 'ACTIVE') excludedDecisions.push({ decisionId: decision.decisionId, reason: temporal });
    else if (suppressed) excludedDecisions.push({ decisionId: decision.decisionId, reason: suppressed.reason, sourceDecisionId: suppressed.sourceDecisionId });
    else applicable.push(decision);
  }
  const extras = { excludedDecisions, suppressedDecisions: [...suppressedMap.values()] };

  if (applicable.length === 0) {
    return resolutionRecord(context, graph, [], AUTHORITY_RESULT.UNRESOLVED, 'NO_APPLICABLE_ACTIVE_DECISION', [], extras);
  }

  const outcomes = new Set(applicable.map((decision) => decision.decision));
  if (outcomes.size > 1) {
    const preferredId = context.policyRevision.precedenceDecisionIds.find((id) => applicable.some((decision) => decision.decisionId === id));
    if (preferredId) {
      const preferred = applicable.find((decision) => decision.decisionId === preferredId);
      return resolutionRecord(context, graph, applicable.map((decision) => decision.decisionId), preferred.decision, 'EXPLICIT_POLICY_PRECEDENCE', [], { ...extras, precedenceDecisionId: preferredId });
    }
    return resolutionRecord(context, graph, applicable.map((decision) => decision.decisionId), AUTHORITY_RESULT.AUTHORITY_CONFLICT, 'INCOMPATIBLE_APPLICABLE_ACTIVE_DECISIONS', [], extras);
  }

  return resolutionRecord(context, graph, applicable.map((decision) => decision.decisionId), applicable[0].decision, 'APPLICABLE_ACTIVE_DECISIONS_AGREE', [], extras);
}
