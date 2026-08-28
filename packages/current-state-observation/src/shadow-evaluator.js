import { immutableRecord } from './contracts.js';
import { evaluateActionEligibility, resolveAuthority, resolveMaterialEvidence } from './resolver.js';

export function shadowEvaluate(scenario) {
  const material = resolveMaterialEvidence(scenario.materialComponents);
  const authority = resolveAuthority(scenario.authorityContext);
  const eligibility = evaluateActionEligibility({
    observation: scenario.observation,
    claim: scenario.claim,
    claimEvents: scenario.claimEvents,
    preActionTechnicalResult: material.gate === 'PASS' ? scenario.preActionTechnicalResult : 'HOLD',
    preActionAuthorityResolution: authority,
  });

  return immutableRecord({
    evaluationId: scenario.evaluationId,
    mode: 'SHADOW_READ_ONLY',
    mutationAttempted: false,
    material,
    authority,
    eligibility,
    recommendation: eligibility.result,
  });
}
