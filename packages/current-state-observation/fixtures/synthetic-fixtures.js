export const baseRevision = Object.freeze({ headSha: 'head-a', baseSha: 'base-a' });

export function makeHappyScenario(overrides = {}) {
  const repositoryIdentity = 'repo-123';
  const targetIdentity = 'PR-20';
  const action = 'MERGE';
  const authorityResolutionId = 'AR-initial-1';

  return {
    evaluationId: 'SYNTH-HAPPY-001',
    materialComponents: [
      { fieldName: 'requiredChecks', status: 'PRESENT', value: ['ci'], evidenceRef: 'ev-checks' },
      { fieldName: 'branchProtection', status: 'AUTHORITATIVELY_ABSENT', evidenceRef: 'ev-protection', sourceClass: 'REMOTE_AUTHORITATIVE' },
      { fieldName: 'ruleset', status: 'NOT_APPLICABLE', policyRef: 'policy-ruleset-na' },
    ],
    authorityContext: {
      policyRevision: { policyRevisionId: 'POLICY-A', revisionIndependentAllowed: false },
      repositoryIdentity,
      targetIdentity,
      targetRevisionIdentity: baseRevision,
      action,
      now: '2026-08-28T20:30:00+09:00',
      decisions: [
        {
          decisionId: 'D-GO-1',
          authorityDomain: 'MERGE',
          actorAuthorized: true,
          repositoryIdentity,
          targetIdentity,
          targetRevisionIdentity: baseRevision,
          action,
          decision: 'GO',
          effectiveAt: '2026-08-28T20:00:00+09:00',
        },
      ],
    },
    observation: {
      gateObservationId: 'G-1',
      repositoryIdentity,
      targetIdentity,
      targetRevisionIdentity: baseRevision,
      validForAction: action,
      authorityResolutionId,
    },
    claim: {
      claimId: 'C-1',
      gateObservationId: 'G-1',
      repositoryIdentity,
      targetIdentity,
      targetRevisionIdentity: baseRevision,
      actionType: action,
      authorityResolutionId,
      executionAttemptId: 'EX-1',
    },
    claimEvents: [
      { claimEventId: 'CE-1', claimId: 'C-1', gateObservationId: 'G-1', eventType: 'CLAIM_ACQUIRED' },
    ],
    preActionTechnicalResult: 'PASS',
    ...overrides,
  };
}
