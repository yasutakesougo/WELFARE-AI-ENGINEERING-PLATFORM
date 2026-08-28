import { AUTHORITY_RESULT, immutableRecord, sameJsonIdentity, validateAuthorityPolicyRevisionIdentity } from './contracts.js';
import { decisionEdges, validateAuthorityDecisionGraph } from './authority-graph.js';

function timeActive(decision, now) {
  const t = new Date(now).getTime();
  if (Number.isNaN(t)) return false;
  if (decision.effectiveAt && new Date(decision.effectiveAt).getTime() > t) return false;
  if (decision.expiresAt && new Date(decision.expiresAt).getTime() <= t) return false;
  return true;
}

function policyResolvable(decision, context) {
  return Array.isArray(context.resolvablePolicyRevisions)
    && context.resolvablePolicyRevisions.some((identity) => sameJsonIdentity(identity, decision.authorityPolicyRevisionIdentity));
}

function decisionApplicable(decision, context) {
  if (decision.actorAuthorized !== true || !decision.actorAuthorityBasis) return false;
  if (!policyResolvable(decision, context)) return false;
  if (decision.repositoryIdentity !== context.repositoryIdentity) return false;
  if (decision.action !== context.action) return false;
  if (decision.targetIdentity !== '*' && decision.targetIdentity !== context.targetIdentity) return false;
  if (decision.targetRevisionIdentity === '*') {
    return decision.revisionIndependent === true && context.policyRevision?.revisionIndependentAllowed === true;
  }
  return sameJsonIdentity(decision.targetRevisionIdentity, context.targetRevisionIdentity);
}

function lifecycleEdgeEffective(sourceDecision, context) {
  return decisionApplicable(sourceDecision, context) && timeActive(sourceDecision, context.resolvedAt);
}

function contextFindings(context) {
  const findings = [];
  for (const field of ['authorityResolutionId', 'resolvedAt', 'repositoryIdentity', 'targetIdentity', 'action', 'decisionGraphValidationId', 'scopeResolutionRuleRef']) {
    if (typeof context?.[field] !== 'string' || context[field].length === 0) findings.push(`AUTHORITY_CONTEXT_${field.toUpperCase()}_MISSING`);
  }
  if (context?.resolvedAt && Number.isNaN(new Date(context.resolvedAt).getTime())) findings.push('AUTHORITY_RESOLVED_AT_INVALID');
  if (validateAuthorityPolicyRevisionIdentity(context?.policyRevisionIdentity).result !== 'PASS') findings.push('CURRENT_POLICY_REVISION_INVALID');
  if (context?.currentPolicyCompatibility !== 'PASS') findings.push('CURRENT_POLICY_COMPATIBILITY_NOT_PASS');
  if (!context?.authorityPolicyIdentity?.policyId
    || !context?.authorityPolicyIdentity?.policyName
    || context?.authorityPolicyIdentity?.authorityDomain !== context?.action
    || context.authorityPolicyIdentity.policyId !== context?.policyRevisionIdentity?.policyId) findings.push('AUTHORITY_POLICY_IDENTITY_INVALID');
  if (!Array.isArray(context?.evidenceReferences) || context.evidenceReferences.length === 0) findings.push('AUTHORITY_RESOLUTION_EVIDENCE_MISSING');
  return findings;
}

function resolutionRecord(context, graph, applicableDecisionIds, result, reason, findings = [], precedenceDecisionId) {
  return immutableRecord({
    authorityResolutionId: context?.authorityResolutionId ?? 'UNRESOLVED',
    resolvedAt: context?.resolvedAt ?? null,
    repositoryIdentity: context?.repositoryIdentity ?? null,
    targetIdentity: context?.targetIdentity ?? null,
    targetRevisionIdentity: context?.targetRevisionIdentity ?? null,
    action: context?.action ?? null,
    authorityPolicyIdentity: context?.authorityPolicyIdentity ?? null,
    authorityPolicyRevisionIdentity: context?.policyRevisionIdentity ?? null,
    decisionGraphValidationRef: graph?.validationId ?? context?.decisionGraphValidationId ?? null,
    applicableDecisionIds,
    scopeResolutionRuleRef: context?.scopeResolutionRuleRef ?? null,
    conditionsEvaluationRefs: context?.conditionsEvaluationRefs ?? [],
    result,
    reason,
    precedenceDecisionId,
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

  const suppressedIds = new Set();
  for (const decision of context.decisions) {
    if (!lifecycleEdgeEffective(decision, context)) continue;
    if (decision.supersedesDecisionId) suppressedIds.add(decision.supersedesDecisionId);
    if (decision.revokesDecisionId) suppressedIds.add(decision.revokesDecisionId);
  }

  const applicable = context.decisions.filter((decision) =>
    decisionApplicable(decision, context) && timeActive(decision, context.resolvedAt) && !suppressedIds.has(decision.decisionId));

  if (applicable.length === 0) {
    return resolutionRecord(context, graph, [], AUTHORITY_RESULT.UNRESOLVED, 'NO_APPLICABLE_ACTIVE_DECISION');
  }

  const outcomes = new Set(applicable.map((decision) => decision.decision));
  if (outcomes.size > 1) {
    const precedenceIds = context.policyRevision.precedenceDecisionIds;
    const preferredId = Array.isArray(precedenceIds)
      ? precedenceIds.find((id) => applicable.some((decision) => decision.decisionId === id))
      : undefined;
    if (preferredId) {
      const preferred = applicable.find((decision) => decision.decisionId === preferredId);
      return resolutionRecord(context, graph, applicable.map((decision) => decision.decisionId), preferred.decision, 'EXPLICIT_POLICY_PRECEDENCE', [], preferredId);
    }
    return resolutionRecord(context, graph, applicable.map((decision) => decision.decisionId), AUTHORITY_RESULT.AUTHORITY_CONFLICT, 'INCOMPATIBLE_APPLICABLE_ACTIVE_DECISIONS');
  }

  return resolutionRecord(context, graph, applicable.map((decision) => decision.decisionId), applicable[0].decision, 'APPLICABLE_ACTIVE_DECISIONS_AGREE');
}
