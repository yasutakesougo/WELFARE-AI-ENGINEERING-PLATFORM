export const MATERIAL_EVIDENCE_STATUS = Object.freeze({
  PRESENT: 'PRESENT',
  AUTHORITATIVELY_ABSENT: 'AUTHORITATIVELY_ABSENT',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
});

export const AUTHORITY_RESULT = Object.freeze({
  GO: 'GO',
  HOLD: 'HOLD',
  DENY: 'DENY',
  AUTHORITY_CONFLICT: 'AUTHORITY_CONFLICT',
  UNRESOLVED: 'UNRESOLVED',
});

export const CLAIM_EVENT_TYPE = Object.freeze({
  CLAIM_ACQUIRED: 'CLAIM_ACQUIRED',
  CLAIM_CONSUMED: 'CLAIM_CONSUMED',
  CLAIM_ABORTED: 'CLAIM_ABORTED',
  CLAIM_RELEASED: 'CLAIM_RELEASED',
  CLAIM_RECOVERY_RECORDED: 'CLAIM_RECOVERY_RECORDED',
});

export const CLAIM_HISTORY_RESULT = Object.freeze({
  PASS: 'PASS',
  INVALID: 'INVALID',
  UNRESOLVED: 'UNRESOLVED',
});

export const TECHNICAL_RESULT = Object.freeze({
  PASS: 'PASS',
  HOLD: 'HOLD',
  FAIL: 'FAIL',
});

export const ACTION_ELIGIBILITY = Object.freeze({
  ELIGIBLE: 'ELIGIBLE',
  NO_MUTATION: 'NO_MUTATION',
});

export function immutableRecord(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      immutableRecord(nested);
    }
  }
  return value;
}

export function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
  return value;
}

export function sameJsonIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
