import { CLAIM_EVENT_TYPE, CLAIM_HISTORY_RESULT, immutableRecord, sameJsonIdentity } from './contracts.js';

const TERMINAL_EVENTS = new Set([
  CLAIM_EVENT_TYPE.CLAIM_CONSUMED,
  CLAIM_EVENT_TYPE.CLAIM_ABORTED,
  CLAIM_EVENT_TYPE.CLAIM_RELEASED,
]);

function evidenceReferencesValid(value) {
  return Array.isArray(value) && value.length > 0
    && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}

export function validateClaimHistory(events, expectedClaim) {
  if (!expectedClaim?.claimId || !expectedClaim?.gateObservationId) {
    return immutableRecord({ result: CLAIM_HISTORY_RESULT.UNRESOLVED, derivedState: 'NO_CLAIM', observationSpent: false, findings: ['EXPECTED_CLAIM_IDENTITY_UNRESOLVED'] });
  }
  if (!Array.isArray(events) || events.length === 0) {
    return immutableRecord({ result: CLAIM_HISTORY_RESULT.UNRESOLVED, derivedState: 'NO_CLAIM', observationSpent: false, findings: ['CLAIM_HISTORY_EMPTY'] });
  }

  const findings = [];
  const eventIds = new Set();
  let acquired = false;
  let terminal = null;
  let priorTime = -Infinity;

  for (const event of events) {
    if (!event || typeof event !== 'object') { findings.push('CLAIM_EVENT_INVALID'); continue; }
    for (const field of ['claimEventId', 'claimId', 'gateObservationId', 'eventType', 'occurredAt', 'actorIdentity']) {
      if (typeof event[field] !== 'string' || event[field].length === 0) findings.push(`CLAIM_EVENT_FIELD_MISSING:${field}`);
    }
    if (!evidenceReferencesValid(event.evidenceReferences)) findings.push('CLAIM_EVENT_EVIDENCE_MISSING');
    if (event.claimId !== expectedClaim.claimId) findings.push('CLAIM_EVENT_CLAIM_ID_MISMATCH');
    if (event.gateObservationId !== expectedClaim.gateObservationId) findings.push('CLAIM_EVENT_GATE_OBSERVATION_ID_MISMATCH');
    if (eventIds.has(event.claimEventId)) findings.push('CLAIM_EVENT_ID_DUPLICATE');
    eventIds.add(event.claimEventId);

    const eventTime = new Date(event.occurredAt).getTime();
    if (Number.isNaN(eventTime)) findings.push('CLAIM_EVENT_OCCURRED_AT_INVALID');
    else {
      if (eventTime < priorTime) findings.push('CLAIM_EVENT_ORDER_INVALID');
      priorTime = eventTime;
    }

    if (event.eventType === CLAIM_EVENT_TYPE.CLAIM_RECOVERY_RECORDED) continue;
    if (event.eventType === CLAIM_EVENT_TYPE.CLAIM_ACQUIRED) {
      if (acquired || terminal) findings.push('CLAIM_REACTIVATION_OR_DUPLICATE_ACQUIRE');
      acquired = true;
      continue;
    }
    if (TERMINAL_EVENTS.has(event.eventType)) {
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
    derivedState: invalid ? 'INVALID' : terminal ? terminal.replace('CLAIM_', '') : acquired ? 'ACTIVE' : 'NO_CLAIM',
    observationSpent: acquired,
    findings,
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
