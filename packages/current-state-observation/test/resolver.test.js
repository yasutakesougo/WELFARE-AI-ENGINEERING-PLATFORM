import test from 'node:test';
import assert from 'node:assert/strict';

import { shadowEvaluate } from '../src/shadow-evaluator.js';
import {
  evaluateActionEligibility,
  resolveAuthority,
  resolveMaterialEvidence,
  validateAuthorityDecisionGraph,
  validateClaimBinding,
  validateClaimHistory,
} from '../src/resolver.js';
import { baseRevision, makeHappyScenario } from '../fixtures/synthetic-fixtures.js';

test('material evidence is COMPLETE only for supported complete states', () => {
  const result = resolveMaterialEvidence([
    { fieldName: 'checks', status: 'PRESENT', value: [], evidenceRef: 'ev-1' },
    { fieldName: 'protection', status: 'AUTHORITATIVELY_ABSENT', evidenceRef: 'ev-2', sourceClass: 'REMOTE_AUTHORITATIVE' },
    { fieldName: 'ruleset', status: 'NOT_APPLICABLE', policyRef: 'policy-1' },
  ]);
  assert.equal(result.result, 'COMPLETE');
  assert.equal(result.gate, 'PASS');
});

test('UNAVAILABLE material fails closed', () => {
  const result = resolveMaterialEvidence([{ fieldName: 'checks', status: 'UNAVAILABLE' }]);
  assert.equal(result.result, 'PARTIAL');
  assert.equal(result.gate, 'HOLD');
});

test('UNKNOWN material fails closed', () => {
  const result = resolveMaterialEvidence([{ fieldName: 'checks', status: 'UNKNOWN' }]);
  assert.equal(result.gate, 'HOLD');
});

test('claim acquire then consume is valid and spends observation', () => {
  const result = validateClaimHistory([
    { eventType: 'CLAIM_ACQUIRED' },
    { eventType: 'CLAIM_CONSUMED' },
  ]);
  assert.equal(result.result, 'PASS');
  assert.equal(result.derivedState, 'CONSUMED');
  assert.equal(result.observationSpent, true);
});

test('claim release remains terminal and observation stays spent', () => {
  const result = validateClaimHistory([
    { eventType: 'CLAIM_ACQUIRED' },
    { eventType: 'CLAIM_RELEASED' },
  ]);
  assert.equal(result.result, 'PASS');
  assert.equal(result.derivedState, 'RELEASED');
  assert.equal(result.observationSpent, true);
});

test('claim reactivation is invalid', () => {
  const result = validateClaimHistory([
    { eventType: 'CLAIM_ACQUIRED' },
    { eventType: 'CLAIM_CONSUMED' },
    { eventType: 'CLAIM_ACQUIRED' },
  ]);
  assert.equal(result.result, 'INVALID');
});

test('authority graph self-reference is invalid', () => {
  const result = validateAuthorityDecisionGraph([
    { decisionId: 'D1', supersedesDecisionId: 'D1', authorityDomain: 'MERGE' },
  ]);
  assert.equal(result.result, 'INVALID');
});

test('authority graph missing reference is unresolved', () => {
  const result = validateAuthorityDecisionGraph([
    { decisionId: 'D1', supersedesDecisionId: 'D404', authorityDomain: 'MERGE' },
  ]);
  assert.equal(result.result, 'UNRESOLVED');
});

test('authority resolver returns GO for one valid applicable decision', () => {
  const scenario = makeHappyScenario();
  const result = resolveAuthority(scenario.authorityContext);
  assert.equal(result.result, 'GO');
});

test('overlapping incompatible active decisions fail closed as conflict', () => {
  const scenario = makeHappyScenario();
  scenario.authorityContext.decisions.push({
    decisionId: 'D-HOLD-2',
    authorityDomain: 'MERGE',
    actorAuthorized: true,
    repositoryIdentity: scenario.authorityContext.repositoryIdentity,
    targetIdentity: '*',
    targetRevisionIdentity: baseRevision,
    action: 'MERGE',
    decision: 'HOLD',
    effectiveAt: '2026-08-28T20:00:00+09:00',
  });
  const result = resolveAuthority(scenario.authorityContext);
  assert.equal(result.result, 'AUTHORITY_CONFLICT');
});

test('exact claim binding passes for matching observation and claim', () => {
  const scenario = makeHappyScenario();
  assert.equal(validateClaimBinding(scenario.observation, scenario.claim).result, 'PASS');
});

test('claim binding mismatch prevents eligibility', () => {
  const scenario = makeHappyScenario();
  scenario.claim = { ...scenario.claim, actionType: 'READY' };
  const result = evaluateActionEligibility({
    observation: scenario.observation,
    claim: scenario.claim,
    claimEvents: scenario.claimEvents,
    preActionTechnicalResult: 'PASS',
    preActionAuthorityResolution: { result: 'GO' },
  });
  assert.equal(result.result, 'NO_MUTATION');
});

test('pre-action authority change prevents eligibility', () => {
  const scenario = makeHappyScenario();
  const result = evaluateActionEligibility({
    observation: scenario.observation,
    claim: scenario.claim,
    claimEvents: scenario.claimEvents,
    preActionTechnicalResult: 'PASS',
    preActionAuthorityResolution: { result: 'DENY' },
  });
  assert.equal(result.result, 'NO_MUTATION');
});

test('happy path is eligible but resolver itself never authorizes mutation execution', () => {
  const scenario = makeHappyScenario();
  const result = shadowEvaluate(scenario);
  assert.equal(result.recommendation, 'ELIGIBLE');
  assert.equal(result.mode, 'SHADOW_READ_ONLY');
  assert.equal(result.mutationAttempted, false);
  assert.equal(result.eligibility.mutationAuthorizedByThisResolver, false);
});

test('shadow evaluation with unavailable material stays NO_MUTATION', () => {
  const scenario = makeHappyScenario({
    evaluationId: 'SYNTH-MATERIAL-HOLD-001',
    materialComponents: [{ fieldName: 'checks', status: 'UNAVAILABLE' }],
  });
  const result = shadowEvaluate(scenario);
  assert.equal(result.recommendation, 'NO_MUTATION');
  assert.equal(result.mutationAttempted, false);
});
