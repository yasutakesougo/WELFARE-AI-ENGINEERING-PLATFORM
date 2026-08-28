import { MATERIAL_EVIDENCE_STATUS, immutableRecord } from './contracts.js';

const COMPLETE_STATUSES = new Set([
  MATERIAL_EVIDENCE_STATUS.PRESENT,
  MATERIAL_EVIDENCE_STATUS.AUTHORITATIVELY_ABSENT,
  MATERIAL_EVIDENCE_STATUS.NOT_APPLICABLE,
]);
const AUTHORITATIVE_SOURCE = 'REMOTE_AUTHORITATIVE';

function hasAuthoritativeProvenance(component) {
  return component?.sourceClass === AUTHORITATIVE_SOURCE
    && typeof component.sourceSystem === 'string' && component.sourceSystem.length > 0
    && typeof component.sourceResource === 'string' && component.sourceResource.length > 0
    && typeof component.retrievedAt === 'string' && !Number.isNaN(new Date(component.retrievedAt).getTime())
    && typeof component.evidenceRef === 'string' && component.evidenceRef.length > 0;
}

function componentSupported(component) {
  switch (component?.status) {
    case MATERIAL_EVIDENCE_STATUS.PRESENT:
      return Object.hasOwn(component, 'value') && hasAuthoritativeProvenance(component);
    case MATERIAL_EVIDENCE_STATUS.AUTHORITATIVELY_ABSENT:
      return hasAuthoritativeProvenance(component);
    case MATERIAL_EVIDENCE_STATUS.NOT_APPLICABLE:
      return typeof component.policyRef === 'string' && component.policyRef.length > 0;
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
    if (!componentSupported(component)) {
      complete = false;
      findings.push(`MATERIAL_COMPONENT_INVALID:${component?.fieldName ?? 'UNKNOWN'}`);
      continue;
    }
    if (!COMPLETE_STATUSES.has(component.status)) {
      complete = false;
      findings.push(`MATERIAL_COMPONENT_${component.status}:${component.fieldName}`);
    }
  }
  return immutableRecord({ result: complete ? 'COMPLETE' : 'PARTIAL', gate: complete ? 'PASS' : 'HOLD', findings });
}
