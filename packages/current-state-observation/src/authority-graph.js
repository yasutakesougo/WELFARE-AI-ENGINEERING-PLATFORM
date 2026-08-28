import { immutableRecord, sameJsonIdentity, validateAuthorityPolicyRevisionIdentity } from './contracts.js';

export function decisionEdges(decision) {
  return [decision.supersedesDecisionId, decision.revokesDecisionId].filter(Boolean);
}

function targetsOverlap(left, right) {
  return left === '*' || right === '*' || left === right;
}

export function validateAuthorityDecisionGraph(decisions, validationId = 'GRAPH-VALIDATION-UNSPECIFIED') {
  if (!Array.isArray(decisions)) return immutableRecord({ result: 'UNRESOLVED', validationId, findings: ['DECISION_SET_UNAVAILABLE'] });
  const byId = new Map();
  const findings = [];

  for (const decision of decisions) {
    if (!decision?.decisionId) { findings.push('DECISION_ID_MISSING'); continue; }
    if (byId.has(decision.decisionId)) findings.push(`DECISION_ID_DUPLICATE:${decision.decisionId}`);
    byId.set(decision.decisionId, decision);
  }

  for (const decision of decisions) {
    if (!decision?.decisionId) continue;
    if (decision.actorAuthorized !== true) findings.push(`DECISION_ACTOR_AUTHORITY_UNRESOLVED:${decision.decisionId}`);
    if (typeof decision.actorIdentity !== 'string' || decision.actorIdentity.length === 0) findings.push(`DECISION_ACTOR_IDENTITY_MISSING:${decision.decisionId}`);
    const basis = decision.actorAuthorityBasis;
    if (!basis || typeof basis !== 'object'
      || typeof basis.evidenceRef !== 'string' || basis.evidenceRef.length === 0
      || basis.authorityDomain !== decision.authorityDomain
      || !sameJsonIdentity(basis.policyRevisionIdentity, decision.authorityPolicyRevisionIdentity)) {
      findings.push(`DECISION_ACTOR_AUTHORITY_BASIS_INVALID:${decision.decisionId}`);
    }
    if (validateAuthorityPolicyRevisionIdentity(decision.authorityPolicyRevisionIdentity).result !== 'PASS') {
      findings.push(`DECISION_POLICY_REVISION_INVALID:${decision.decisionId}`);
    }
    if (!['GO', 'HOLD', 'DENY'].includes(decision.decision)) findings.push(`DECISION_OUTCOME_INVALID:${decision.decisionId}`);
    if (decision.effectiveAt && Number.isNaN(new Date(decision.effectiveAt).getTime())) findings.push(`DECISION_EFFECTIVE_AT_INVALID:${decision.decisionId}`);
    if (decision.expiresAt && Number.isNaN(new Date(decision.expiresAt).getTime())) findings.push(`DECISION_EXPIRES_AT_INVALID:${decision.decisionId}`);
    if (decisionEdges(decision).length > 0
      && (decision.lifecycleAuthority !== true
        || typeof decision.lifecycleAuthorityEvidenceRef !== 'string'
        || decision.lifecycleAuthorityEvidenceRef.length === 0)) {
      findings.push(`DECISION_LIFECYCLE_AUTHORITY_INVALID:${decision.decisionId}`);
    }

    for (const referencedId of decisionEdges(decision)) {
      if (referencedId === decision.decisionId) findings.push(`DECISION_SELF_REFERENCE:${decision.decisionId}`);
      const referenced = byId.get(referencedId);
      if (!referenced) { findings.push(`DECISION_REFERENCE_MISSING:${decision.decisionId}->${referencedId}`); continue; }
      if (decision.authorityDomain !== referenced.authorityDomain
        || decision.repositoryIdentity !== referenced.repositoryIdentity
        || decision.action !== referenced.action
        || !targetsOverlap(decision.targetIdentity, referenced.targetIdentity)) {
        findings.push(`DECISION_CROSS_DOMAIN_EDGE:${decision.decisionId}->${referencedId}`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const hasCycle = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const decision = byId.get(id);
    for (const next of decision ? decisionEdges(decision) : []) {
      if (byId.has(next) && hasCycle(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  for (const id of byId.keys()) {
    if (hasCycle(id)) { findings.push('DECISION_GRAPH_CYCLE'); break; }
  }

  const unresolved = findings.some((finding) => finding.includes('REFERENCE_MISSING') || finding.includes('AUTHORITY_UNRESOLVED'));
  return immutableRecord({ validationId, result: unresolved ? 'UNRESOLVED' : findings.length ? 'INVALID' : 'PASS', findings });
}
