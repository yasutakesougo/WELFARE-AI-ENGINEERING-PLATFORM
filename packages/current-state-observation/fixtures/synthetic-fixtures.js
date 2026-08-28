export const baseRevision = Object.freeze({ headSha: 'head-a', baseSha: 'base-a' });
export const policyRevisionIdentity = Object.freeze({
  policyId: 'WAEP-AUTH-POLICY',
  policyVersion: '1',
  policyRevisionId: 'POLICY-A',
  effectiveAt: '2026-08-28T00:00:00+09:00',
  sourceCommitSha: 'policy-commit-a',
  contentHash: 'sha256:policy-a',
});

function authoritativeMaterial(fieldName, value, evidenceRef) {
  return {
    fieldName,
    status: 'PRESENT',
    value,
    evidenceRef,
    sourceClass: 'REMOTE_AUTHORITATIVE',
    sourceSystem: 'SYNTHETIC_REMOTE_API',
    sourceResource: `synthetic://${fieldName}`,
    retrievedAt: '2026-08-28T20:29:00+09:00',
  };
}

function decision(repositoryIdentity, targetIdentity, action, decisionId = 'D-GO-1', outcome = 'GO') {
  return {
    decisionId,
    authorityDomain: action,
    actorAuthorized: true,
    actorIdentity: 'human-authority-1',
    actorAuthorityBasis: {
      authorityDomain: action,
      policyRevisionIdentity,
      evidenceRef: 'synthetic-actor-authority-evidence',
    },
    authorityPolicyRevisionIdentity: policyRevisionIdentity,
    repositoryIdentity,
    targetIdentity,
    targetRevisionIdentity: baseRevision,
    action,
    scope: { targetType: 'PULL_REQUEST', environment: 'SYNTHETIC' },
    decision: outcome,
    effectiveAt: '2026-08-28T20:00:00+09:00',
  };
}

function authorityContext({ resolutionId, resolvedAt, repositoryIdentity, targetIdentity, action, decisions }) {
  return {
    authorityResolutionId: resolutionId,
    resolvedAt,
    authorityPolicyIdentity: { policyId: 'WAEP-AUTH-POLICY', policyName: 'Synthetic Authority Policy', authorityDomain: action },
    policyRevisionIdentity,
    policyRevision: {
      identity: policyRevisionIdentity,
      revisionIndependentAllowed: false,
      precedenceDecisionIds: [],
      scopeResolutionRuleRef: 'SCOPE-FAIL-CLOSED-V1',
      evidenceRef: 'synthetic-policy-rules-evidence',
    },
    currentPolicyCompatibility: 'PASS',
    currentPolicyCompatibilityEvidenceRef: 'synthetic-current-policy-compatibility-evidence',
    resolvablePolicyRevisions: [policyRevisionIdentity],
    repositoryIdentity,
    targetIdentity,
    targetRevisionIdentity: baseRevision,
    action,
    scope: { targetType: 'PULL_REQUEST', environment: 'SYNTHETIC' },
    now: resolvedAt,
    decisions,
    decisionGraphValidationId: `${resolutionId}-GRAPH`,
    scopeResolutionRuleRef: 'SCOPE-FAIL-CLOSED-V1',
    conditionsEvaluationRefs: [],
    evidenceReferences: [`${resolutionId}-EVIDENCE`],
  };
}

export function makeHappyScenario(overrides = {}) {
  const repositoryIdentity = 'repo-123';
  const targetIdentity = 'PR-20';
  const action = 'MERGE';
  const initialAuthorityResolutionId = 'AR-initial-1';
  const decisions = [decision(repositoryIdentity, targetIdentity, action)];

  const scenario = {
    evaluationId: 'SYNTH-HAPPY-001',
    materialComponents: [
      authoritativeMaterial('requiredChecks', ['ci'], 'ev-checks'),
      {
        fieldName: 'branchProtection', status: 'AUTHORITATIVELY_ABSENT', evidenceRef: 'ev-protection',
        sourceClass: 'REMOTE_AUTHORITATIVE', sourceSystem: 'SYNTHETIC_REMOTE_API',
        sourceResource: 'synthetic://branchProtection', retrievedAt: '2026-08-28T20:29:00+09:00',
      },
      { fieldName: 'ruleset', status: 'NOT_APPLICABLE', policyRef: 'policy-ruleset-na' },
    ],
    initialAuthorityContext: authorityContext({
      resolutionId: initialAuthorityResolutionId,
      resolvedAt: '2026-08-28T20:30:00+09:00', repositoryIdentity, targetIdentity, action, decisions,
    }),
    preActionAuthorityContext: authorityContext({
      resolutionId: 'AR-preaction-1',
      resolvedAt: '2026-08-28T20:30:05+09:00', repositoryIdentity, targetIdentity, action, decisions,
    }),
    observation: {
      gateObservationId: 'G-1', repositoryIdentity, targetIdentity,
      targetRevisionIdentity: baseRevision, validForAction: action,
      authorityResolutionId: initialAuthorityResolutionId,
    },
    claim: {
      claimId: 'C-1', gateObservationId: 'G-1', repositoryIdentity, targetIdentity,
      targetRevisionIdentity: baseRevision, actionType: action,
      authorityResolutionId: initialAuthorityResolutionId, executionAttemptId: 'EX-1',
    },
    claimEvents: [{
      claimEventId: 'CE-1', claimId: 'C-1', gateObservationId: 'G-1', eventType: 'CLAIM_ACQUIRED',
      occurredAt: '2026-08-28T20:30:03+09:00', actorIdentity: 'worker-a', evidenceReferences: ['claim-ev-1'],
    }],
    preActionTechnicalResult: 'PASS',
    preActionAuthorityValidationId: 'PAV-1',
    preActionAuthorityValidatedAt: '2026-08-28T20:30:06+09:00',
  };
  return { ...scenario, ...overrides };
}

export function makeDecision({ repositoryIdentity = 'repo-123', targetIdentity = 'PR-20', action = 'MERGE', decisionId, outcome }) {
  return decision(repositoryIdentity, targetIdentity, action, decisionId, outcome);
}
