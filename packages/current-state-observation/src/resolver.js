import {
  ACTION_ELIGIBILITY,
  AUTHORITY_RESULT,
  CLAIM_EVENT_TYPE,
  CLAIM_HISTORY_RESULT,
  MATERIAL_EVIDENCE_STATUS,
  TECHNICAL_RESULT,
  immutableRecord,
  requireNonEmptyString,
  sameJsonIdentity,
} from './contracts.js';

const COMPLETE_STATUSES = new Set([
  MATERIAL_EVIDENCE_STATUS.PRESENT,
  MATERIAL_EVIDENCE_STATUS.AUTHORITATIVELY_ABSENT,
  MATERIAL_EVIDENCE_STATUS.NOT_APPLICABLE,
]);

const TERMINAL_CLAIM_EVENTS = new Set([
  CLAIM_EVENT_TYPE.CLAIM_CONSUMED,
  CLAIM_EVENT_TYPE.CLAIM_ABORTED,
  CLAIM_EVENT_TYPE.CLAIM_RELEASED,
]);

function materialComponentIsSupported(component) {
  switch (component.status) {
    case MATERIAL_EVIDENCE_STATUS.PRESENT:
      return Object.hasOwn(component, 'value') && Boolean(component.evidenceRef);
    case MATERIAL_EVIDENCE_STATUS.AUTHORITATIVELY_ABSENT:
      return Boolean(component.evidenceRef) && component.sourceClass === 'REMOTE_AUTHORITATIVE';
    case MATERIAL_EVIDENCE_STATUS.NOT_APPLICABLE:
      return Boolean(component.policyRef);
    case MATERIAL_EVIDENCE_STATUS.UNAVAILABLE:
    case MATERIAL_EVIDENCE_STATUS.UNKNOWN:
      return true;
    default:
      return false;
  }
}

export function resolveMaterialEvidence(components) {
  if (!Array.isArray(components) || components.length === 0) {
    return immutableRecord({ result: 'PARTIAL', gate: 'HOLD', findings: ['MATERIAL_EVIDENCE_EMPTY'] });
  }

  const findings = [];
  let complete = true;

  for (const component of components) {
    if (!materialComponentIsSupported(component)) {
      complete = false;
      findings.push(`MATERIAL_COMPONENT_INVALID:${component?.fieldName ?? 'UNKNOWN'}`);
      continue;
    }
    if (!COMPLETE_STATUSES.has(component.status)) {
      complete = false;
      findings.push(`MATERIAL_COMPONENT_${component.status}:${component.fieldName}`);
    }
  }

  return immutableRecord({
    result: complete ? 'COMPLETE' : 'PARTIAL',
    gate: complete ? 'PASS' : 'HOLD',
    findings,
  });
}

export function validateClaimHistory(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return immutableRecord({
      result: CLAIM_HISTORY_RESULT.UNRESOLVED,
      derivedState: 'NO_CLAIM',
      observationSpent: false,
      findings: ['CLAIM_HISTORY_EMPTY'],
    });
  }

  const findings = [];
  let acquired = false;
  let terminal = null;

  for (const event of events) {
    if (!event || typeof event !== 'object') {
      findings.push('CLAIM_EVENT_INVALID');
      continue;
    }

    if (event.eventType === CLAIM_EVENT_TYPE.CLAIM_RECOVERY_RECORDED) {
      continue;
    }

    if (event.eventType === CLAIM_EVENT_TYPE.CLAIM_ACQUIRED) {
      if (acquired || terminal) findings.push('CLAIM_REACTIVATION_OR_DUPLICATE_ACQUIRE');
      acquired = true;
      continue;
    }

    if (TERMINAL_CLAIM_EVENTS.has(event.eventType)) {
      if (!acquired) findings.push('CLAIM_TERMINAL_BEFORE_ACQUIRE');
      if (terminal) findings.push('CLAIM_MULTIPLE_TERMINAL_EVENTS');
      terminal = event.eventType;
      continue;
    }

    findings.push(`CLAIM_EVENT_UNKNOWN:${event.eventType ?? 'MISSING'}`);
  }

  const invalid = findings.length > 0;
  return immutableRecord({
    result: invalid ? CLAIM_HISTORY_RESULT.INVALID : CLAIM_HISTORY_RESULT.PASS,
    derivedState: invalid
      ? 'INVALID'
      : terminal
        ? terminal.replace('CLAIM_', '')
        : acquired
          ? 'ACTIVE'
          : 'NO_CLAIM',
    observationSpent: acquired,
    findings,
  });
}

function decisionEdges(decision) {
  return [decision.supersedesDecisionId, decision.revokesDecisionId].filter(Boolean);
}

export function validateAuthorityDecisionGraph(decisions) {
  if (!Array.isArray(decisions)) {
    return immutableRecord({ result: 'UNRESOLVED', findings: ['DECISION_SET_UNAVAILABLE'] });
  }

  const byId = new Map();
  const findings = [];

  for (const decision of decisions) {
    if (!decision?.decisionId) {
      findings.push('DECISION_ID_MISSING');
      continue;
    }
    byId.set(decision.decisionId, decision);
  }

  for (const decision of decisions) {
    if (!decision?.decisionId) continue;
    if (decision.actorAuthorized === false) findings.push(`DECISION_ACTOR_UNAUTHORIZED:${decision.decisionId}`);

    for (const referencedId of decisionEdges(decision)) {
      if (referencedId === decision.decisionId) findings.push(`DECISION_SELF_REFERENCE:${decision.decisionId}`);
      const referenced = byId.get(referencedId);
      if (!referenced) {
        findings.push(`DECISION_REFERENCE_MISSING:${decision.decisionId}->${referencedId}`);
        continue;
      }
      if (decision.authorityDomain && referenced.authorityDomain && decision.authorityDomain !== referenced.authorityDomain) {
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
    if (hasCycle(id)) {
      findings.push('DECISION_GRAPH_CYCLE');
      break;
    }
  }

  if (findings.some((finding) => finding.includes('REFERENCE_MISSING'))) {
    return immutableRecord({ result: 'UNRESOLVED', findings });
  }
  return immutableRecord({ result: findings.length ? 'INVALID' : 'PASS', findings });
}

function isDecisionApplicable(decision, context) {
  if (decision.repositoryIdentity !== context.repositoryIdentity) return false;
  if (decision.action !== context.action) return false;
  if (decision.targetIdentity !== '*' && decision.targetIdentity !== context.targetIdentity) return false;
  if (decision.targetRevisionIdentity === '*') {
    return decision.revisionIndependent === true && context.policyRevision?.revisionIndependentAllowed === true;
  }
  return sameJsonIdentity(decision.targetRevisionIdentity, context.targetRevisionIdentity);
}

function isDecisionActive(decision, now, supersededOrRevokedIds) {
  const t = new Date(now).getTime();
  if (Number.isNaN(t)) return false;
  if (decision.effectiveAt && new Date(decision.effectiveAt).getTime() > t) return false;
  if (decision.expiresAt && new Date(decision.expiresAt).getTime() <= t) return false;
  if (supersededOrRevokedIds.has(decision.decisionId)) return false;
  return true;
}

export function resolveAuthority(context) {
  if (!context?.policyRevision?.policyRevisionId) {
    return immutableRecord({
      result: AUTHORITY_RESULT.UNRESOLVED,
      reason: 'AUTHORITY_POLICY_UNRESOLVED',
      applicableDecisionIds: [],
    });
  }

  const graph = validateAuthorityDecisionGraph(context.decisions);
  if (graph.result !== 'PASS') {
    return immutableRecord({
      result: AUTHORITY_RESULT.UNRESOLVED,
      reason: `AUTHORITY_DECISION_GRAPH_${graph.result}`,
      graph,
      applicableDecisionIds: [],
    });
  }

  const supersededOrRevokedIds = new Set();
  for (const decision of context.decisions) {
    if (decision.supersedesDecisionId) supersededOrRevokedIds.add(decision.supersedesDecisionId);
    if (decision.revokesDecisionId) supersededOrRevokedIds.add(decision.revokesDecisionId);
  }

  const applicable = context.decisions.filter(
    (decision) => isDecisionApplicable(decision, context) && isDecisionActive(decision, context.now, supersededOrRevokedIds),
  );

  if (applicable.length === 0) {
    return immutableRecord({
      result: AUTHORITY_RESULT.UNRESOLVED,
      reason: 'NO_APPLICABLE_ACTIVE_DECISION',
      applicableDecisionIds: [],
      graph,
    });
  }

  const outcomes = new Set(applicable.map((decision) => decision.decision));
  if (outcomes.size > 1) {
    const precedenceIds = context.policyRevision.precedenceDecisionIds;
    if (Array.isArray(precedenceIds)) {
      for (const id of precedenceIds) {
        const preferred = applicable.find((decision) => decision.decisionId === id);
        if (preferred) {
          return immutableRecord({
            result: preferred.decision,
            reason: 'EXPLICIT_POLICY_PRECEDENCE',
            applicableDecisionIds: applicable.map((decision) => decision.decisionId),
            precedenceDecisionId: preferred.decisionId,
            graph,
          });
        }
      }
    }
    return immutableRecord({
      result: AUTHORITY_RESULT.AUTHORITY_CONFLICT,
      reason: 'INCOMPATIBLE_APPLICABLE_ACTIVE_DECISIONS',
      applicableDecisionIds: applicable.map((decision) => decision.decisionId),
      graph,
    });
  }

  return immutableRecord({
    result: applicable[0].decision,
    reason: 'APPLICABLE_ACTIVE_DECISIONS_AGREE',
    applicableDecisionIds: applicable.map((decision) => decision.decisionId),
    graph,
  });
}

export function validateClaimBinding(observation, claim) {
  const findings = [];
  if (!observation || !claim) return immutableRecord({ result: 'INVALID', findings: ['CLAIM_OR_OBSERVATION_MISSING'] });

  const comparisons = [
    ['gateObservationId', observation.gateObservationId, claim.gateObservationId],
    ['repositoryIdentity', observation.repositoryIdentity, claim.repositoryIdentity],
    ['targetIdentity', observation.targetIdentity, claim.targetIdentity],
    ['targetRevisionIdentity', observation.targetRevisionIdentity, claim.targetRevisionIdentity],
    ['actionType', observation.validForAction, claim.actionType],
    ['authorityResolutionId', observation.authorityResolutionId, claim.authorityResolutionId],
  ];

  for (const [field, expected, actual] of comparisons) {
    const matches = typeof expected === 'object' || typeof actual === 'object'
      ? sameJsonIdentity(expected, actual)
      : expected === actual;
    if (!matches) findings.push(`CLAIM_BINDING_MISMATCH:${field}`);
  }

  return immutableRecord({ result: findings.length ? 'INVALID' : 'PASS', findings });
}

export function evaluateActionEligibility({
  observation,
  claim,
  claimEvents,
  preActionTechnicalResult,
  preActionAuthorityResolution,
}) {
  requireNonEmptyString(observation?.gateObservationId, 'observation.gateObservationId');

  const binding = validateClaimBinding(observation, claim);
  const claimHistory = validateClaimHistory(claimEvents);

  const findings = [...binding.findings, ...claimHistory.findings];
  if (preActionTechnicalResult !== TECHNICAL_RESULT.PASS) findings.push('PREACTION_TECHNICAL_NOT_PASS');
  if (preActionAuthorityResolution?.result !== AUTHORITY_RESULT.GO) findings.push('PREACTION_AUTHORITY_NOT_GO');
  if (claimHistory.result !== CLAIM_HISTORY_RESULT.PASS) findings.push('CLAIM_HISTORY_NOT_PASS');
  if (binding.result !== 'PASS') findings.push('CLAIM_BINDING_NOT_PASS');
  if (!claimHistory.observationSpent) findings.push('EXCLUSIVE_CLAIM_NOT_ACQUIRED');

  return immutableRecord({
    result: findings.length === 0 ? ACTION_ELIGIBILITY.ELIGIBLE : ACTION_ELIGIBILITY.NO_MUTATION,
    mutationAuthorizedByThisResolver: false,
    binding,
    claimHistory,
    preActionTechnicalResult,
    preActionAuthorityResult: preActionAuthorityResolution?.result ?? AUTHORITY_RESULT.UNRESOLVED,
    findings,
  });
}
