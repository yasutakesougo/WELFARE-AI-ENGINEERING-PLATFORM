import { immutableRecord } from './contracts.js';
import { buildPreActionAuthorityValidation, evaluateActionEligibility, resolveAuthority, resolveMaterialEvidence } from './resolver.js';

export function shadowEvaluate(scenario) {
  const material = resolveMaterialEvidence(scenario.materialComponents);
  const initialAuthorityResolution = resolveAuthority(scenario.initialAuthorityContext);
  const preActionAuthorityResolution = resolveAuthority(scenario.preActionAuthorityContext);
  const preActionAuthorityValidation = buildPreActionAuthorityValidation({
    validationId: scenario.preActionAuthorityValidationId,
    validatedAt: scenario.preActionAuthorityValidatedAt,
    observation: scenario.observation,
    claim: scenario.claim,
    initialAuthorityResolution,
    preActionAuthorityResolution,
  });
  const eligibility = evaluateActionEligibility({
    observation: scenario.observation,
    claim: scenario.claim,
    claimEvents: scenario.claimEvents,
    preActionTechnicalResult: material.gate === 'PASS' ? scenario.preActionTechnicalResult : 'HOLD',
    initialAuthorityResolution,
    preActionAuthorityValidation,
  });

  return immutableRecord({
    evaluationId: scenario.evaluationId,
    mode: 'SHADOW_READ_ONLY',
    mutationAttempted: false,
    material,
    initialAuthorityResolution,
    preActionAuthorityResolution,
    preActionAuthorityValidation,
    eligibility,
    recommendation: eligibility.result,
  });
}
