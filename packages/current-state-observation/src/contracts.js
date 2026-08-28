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
  PASS: 'PASS', HOLD: 'HOLD', FAIL: 'FAIL',
});

export const ACTION_ELIGIBILITY = Object.freeze({
  ELIGIBLE: 'ELIGIBLE', NO_MUTATION: 'NO_MUTATION',
});

export function immutableRecord(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) immutableRecord(nested);
  }
  return value;
}

export function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
  return value;
}

function canonicalize(value) {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') throw new TypeError('identity contains unsupported value');
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('identity contains non-finite number');
  if (typeof value === 'string') return value.normalize('NFC');
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const entries = Object.keys(value).map((key) => [key.normalize('NFC'), value[key]]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const out = {};
    for (const [key, nested] of entries) {
      if (Object.hasOwn(out, key)) throw new TypeError('identity contains duplicate normalized key');
      out[key] = canonicalize(nested);
    }
    return out;
  }
  return value;
}

export function canonicalIdentityString(value) {
  return JSON.stringify(canonicalize(value));
}

export function sameJsonIdentity(left, right) {
  try { return canonicalIdentityString(left) === canonicalIdentityString(right); }
  catch { return false; }
}

export function validateAuthorityPolicyRevisionIdentity(identity) {
  const findings = [];
  for (const field of ['policyId', 'policyVersion', 'policyRevisionId', 'effectiveAt']) {
    if (typeof identity?.[field] !== 'string' || identity[field].length === 0) findings.push(`POLICY_REVISION_${field.toUpperCase()}_MISSING`);
  }
  if (identity?.effectiveAt && Number.isNaN(new Date(identity.effectiveAt).getTime())) findings.push('POLICY_REVISION_EFFECTIVE_AT_INVALID');
  return immutableRecord({ result: findings.length ? 'INVALID' : 'PASS', findings });
}
