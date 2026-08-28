import { ACTION_ELIGIBILITY, AUTHORITY_RESULT, CLAIM_HISTORY_RESULT, TECHNICAL_RESULT, immutableRecord, requireNonEmptyString, sameJsonIdentity } from './contracts.js';
import { validateClaimBinding, validateClaimHistory } from './claim-resolver.js';

function resolutionMatchesObservation(resolution, observation) {
  return resolution?.repositoryIdentity === observation?.repositoryIdentity
    && resolution?.targetIdentity === observation?.targetIdentity
    && sameJsonIdentity(resolution?.targetRevisionIdentity, observation?.targetRevisionIdentity)
    && resolution?.action === observation?.validForAction;
}

export function buildPreActionAuthorityValidation({
  validationId, validatedAt, observation, claim, initialAuthorityResolution, preActionAuthorityResolution,
}) {
  const findings = [];
  if (typeof validationId !== 'string' || validationId.length === 0) findings.push('PREACTION_VALIDATION_ID_MISSING');
  if (typeof validatedAt !== 'string' || Number.isNaN(new Date(validatedAt).getTime())) findings.push('PREACTION_VALIDATED_AT_INVALID');
  const binding = validateClaimBinding(observation, claim);
  if (binding.result !== 'PASS') findings.push('CLAIM_BINDING_NOT_PASS');
  if (initialAuthorityResolution?.authorityResolutionId !== observation?.authorityResolutionId
    || initialAuthorityResolution?.authorityResolutionId !== claim?.authorityResolutionId) findings.push('INITIAL_AUTHORITY_RESOLUTION_BINDING_MISMATCH');
  if (!resolutionMatchesObservation(initialAuthorityResolution, observation)) findings.push('INITIAL_AUTHORITY_TARGET_BINDING_MISMATCH');
  if (!resolutionMatchesObservation(preActionAuthorityResolution, observation)) findings.push('PREACTION_AUTHORITY_TARGET_BINDING_MISMATCH');
  if (initialAuthorityResolution?.result !== AUTHORITY_RESULT.GO) findings.push('INITIAL_AUTHORITY_NOT_GO');
  if (preActionAuthorityResolution?.result !== AUTHORITY_RESULT.GO) findings.push('PREACTION_AUTHORITY_NOT_GO');

  const result = findings.length === 0 ? AUTHORITY_RESULT.GO
    : preActionAuthorityResolution?.result && preActionAuthorityResolution.result !== AUTHORITY_RESULT.GO
      ? preActionAuthorityResolution.result
      : AUTHORITY_RESULT.UNRESOLVED;

  return immutableRecord({
    validationId,
    validatedAt,
    repositoryIdentity: observation?.repositoryIdentity,
    targetIdentity: observation?.targetIdentity,
    targetRevisionIdentity: observation?.targetRevisionIdentity,
    action: observation?.validForAction,
    gateObservationId: observation?.gateObservationId,
    claimId: claim?.claimId,
    initialAuthorityResolutionId: initialAuthorityResolution?.authorityResolutionId ?? null,
    preActionAuthorityResolutionId: preActionAuthorityResolution?.authorityResolutionId ?? null,
    currentAuthorityPolicyRevisionIdentity: preActionAuthorityResolution?.authorityPolicyRevisionIdentity ?? null,
    decisionGraphValidationRef: preActionAuthorityResolution?.decisionGraphValidationRef ?? null,
    applicableDecisionIds: preActionAuthorityResolution?.applicableDecisionIds ?? [],
    result,
    findings,
    evidenceReferences: preActionAuthorityResolution?.evidenceReferences ?? [],
  });
}

export function evaluateActionEligibility({
  observation, claim, claimEvents, preActionTechnicalResult, initialAuthorityResolution, preActionAuthorityValidation,
}) {
  requireNonEmptyString(observation?.gateObservationId, 'observation.gateObservationId');
  const binding = validateClaimBinding(observation, claim);
  const claimHistory = validateClaimHistory(claimEvents, claim);
  const findings = [...binding.findings, ...claimHistory.findings];
  if (preActionTechnicalResult !== TECHNICAL_RESULT.PASS) findings.push('PREACTION_TECHNICAL_NOT_PASS');
  if (initialAuthorityResolution?.result !== AUTHORITY_RESULT.GO) findings.push('INITIAL_AUTHORITY_NOT_GO');
  if (preActionAuthorityValidation?.result !== AUTHORITY_RESULT.GO) findings.push('PREACTION_AUTHORITY_NOT_GO');
  if (claimHistory.result !== CLAIM_HISTORY_RESULT.PASS) findings.push('CLAIM_HISTORY_NOT_PASS');
  if (claimHistory.derivedState !== 'ACTIVE') findings.push('EXCLUSIVE_CLAIM_NOT_ACTIVE');
  if (binding.result !== 'PASS') findings.push('CLAIM_BINDING_NOT_PASS');
  if (!claimHistory.observationSpent) findings.push('EXCLUSIVE_CLAIM_NOT_ACQUIRED');

  return immutableRecord({
    result: findings.length === 0 ? ACTION_ELIGIBILITY.ELIGIBLE : ACTION_ELIGIBILITY.NO_MUTATION,
    mutationAuthorizedByThisResolver: false,
    binding,
    claimHistory,
    initialAuthorityResolutionId: initialAuthorityResolution?.authorityResolutionId ?? null,
    preActionAuthorityResolutionId: preActionAuthorityValidation?.preActionAuthorityResolutionId ?? null,
    preActionTechnicalResult,
    preActionAuthorityResult: preActionAuthorityValidation?.result ?? AUTHORITY_RESULT.UNRESOLVED,
    findings,
  });
}
