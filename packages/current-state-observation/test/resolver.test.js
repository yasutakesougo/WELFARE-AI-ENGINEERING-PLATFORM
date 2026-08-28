import test from 'node:test';
import assert from 'node:assert/strict';
import { shadowEvaluate } from '../src/shadow-evaluator.js';
import {
  buildPreActionAuthorityValidation, evaluateActionEligibility, resolveAuthority, resolveMaterialEvidence,
  validateAuthorityDecisionGraph, validateClaimBinding, validateClaimHistory,
} from '../src/resolver.js';
import { baseRevision, makeDecision, makeHappyScenario, policyRevisionIdentity } from '../fixtures/synthetic-fixtures.js';

test('material evidence COMPLETE requires authoritative provenance', () => {
  const result = resolveMaterialEvidence(makeHappyScenario().materialComponents);
  assert.equal(result.result, 'COMPLETE');
  assert.equal(result.gate, 'PASS');
});

test('PRESENT with missing authoritative provenance fails closed', () => {
  const result = resolveMaterialEvidence([{ fieldName: 'checks', status: 'PRESENT', value: [], evidenceRef: 'ev' }]);
  assert.equal(result.result, 'PARTIAL');
  assert.equal(result.gate, 'HOLD');
});

test('PRESENT with LOCAL_OBSERVATION provenance fails closed', () => {
  const result = resolveMaterialEvidence([{ fieldName: 'checks', status: 'PRESENT', value: [], evidenceRef: 'ev', sourceClass: 'LOCAL_OBSERVATION', sourceSystem: 'git', sourceResource: 'local', retrievedAt: '2026-08-28T20:00:00+09:00' }]);
  assert.equal(result.gate, 'HOLD');
});

test('UNAVAILABLE and UNKNOWN material fail closed', () => {
  assert.equal(resolveMaterialEvidence([{ fieldName: 'checks', status: 'UNAVAILABLE' }]).gate, 'HOLD');
  assert.equal(resolveMaterialEvidence([{ fieldName: 'checks', status: 'UNKNOWN' }]).gate, 'HOLD');
});

test('claim acquired with exact binding is ACTIVE and spent', () => {
  const scenario = makeHappyScenario();
  const result = validateClaimHistory(scenario.claimEvents, scenario.claim);
  assert.equal(result.result, 'PASS');
  assert.equal(result.derivedState, 'ACTIVE');
  assert.equal(result.observationSpent, true);
});

test('mixed claimId events are invalid', () => {
  const scenario = makeHappyScenario();
  const mixed = [{ ...scenario.claimEvents[0], claimId: 'C-OTHER' }];
  assert.equal(validateClaimHistory(mixed, scenario.claim).result, 'INVALID');
});

test('mixed gateObservationId events are invalid', () => {
  const scenario = makeHappyScenario();
  const mixed = [{ ...scenario.claimEvents[0], gateObservationId: 'G-OTHER' }];
  assert.equal(validateClaimHistory(mixed, scenario.claim).result, 'INVALID');
});

test('claim event missing provenance is invalid', () => {
  const scenario = makeHappyScenario();
  const broken = [{ ...scenario.claimEvents[0], evidenceReferences: [] }];
  assert.equal(validateClaimHistory(broken, scenario.claim).result, 'INVALID');
});

test('claim terminal states never become eligible again', () => {
  const scenario = makeHappyScenario();
  scenario.claimEvents = [...scenario.claimEvents, {
    claimEventId: 'CE-2', claimId: 'C-1', gateObservationId: 'G-1', eventType: 'CLAIM_RELEASED',
    occurredAt: '2026-08-28T20:30:04+09:00', actorIdentity: 'worker-a', evidenceReferences: ['claim-ev-2'],
  }];
  assert.equal(shadowEvaluate(scenario).recommendation, 'NO_MUTATION');
});

test('missing actor authority evidence makes graph non-PASS', () => {
  const decision = makeDecision({ decisionId: 'D1', outcome: 'GO' });
  delete decision.actorAuthorized;
  const result = validateAuthorityDecisionGraph([decision]);
  assert.notEqual(result.result, 'PASS');
});

test('missing actor authority basis makes graph invalid', () => {
  const decision = makeDecision({ decisionId: 'D1', outcome: 'GO' });
  delete decision.actorAuthorityBasis;
  assert.equal(validateAuthorityDecisionGraph([decision]).result, 'INVALID');
});

test('duplicate decisionId is invalid', () => {
  const d1 = makeDecision({ decisionId: 'D1', outcome: 'GO' });
  const d2 = makeDecision({ decisionId: 'D1', outcome: 'GO' });
  assert.equal(validateAuthorityDecisionGraph([d1, d2]).result, 'INVALID');
});

test('future revocation cannot suppress current DENY', () => {
  const scenario = makeHappyScenario();
  const deny = makeDecision({ decisionId: 'D-DENY', outcome: 'DENY' });
  const futureRevoke = makeDecision({ decisionId: 'D-FUTURE', outcome: 'GO' });
  futureRevoke.effectiveAt = '2026-08-29T20:00:00+09:00';
  futureRevoke.revokesDecisionId = 'D-DENY';
  futureRevoke.lifecycleAuthority = true;
  futureRevoke.lifecycleAuthorityEvidenceRef = 'lifecycle-ev';
  scenario.initialAuthorityContext.decisions = [deny, futureRevoke];
  const result = resolveAuthority(scenario.initialAuthorityContext);
  assert.equal(result.result, 'DENY');
});

test('target-inapplicable revocation cannot suppress current DENY', () => {
  const scenario = makeHappyScenario();
  const deny = makeDecision({ decisionId: 'D-DENY', outcome: 'DENY' });
  const revoke = makeDecision({ decisionId: 'D-OTHER', outcome: 'GO', targetIdentity: 'PR-999' });
  revoke.revokesDecisionId = 'D-DENY';
  revoke.lifecycleAuthority = true;
  revoke.lifecycleAuthorityEvidenceRef = 'lifecycle-ev';
  scenario.initialAuthorityContext.decisions = [deny, revoke];
  const result = resolveAuthority(scenario.initialAuthorityContext);
  assert.notEqual(result.result, 'GO');
});

test('unresolvable historical Authority Policy revision fails closed', () => {
  const scenario = makeHappyScenario();
  scenario.initialAuthorityContext.resolvablePolicyRevisions = [];
  const result = resolveAuthority(scenario.initialAuthorityContext);
  assert.equal(result.result, 'UNRESOLVED');
});

test('current policy compatibility failure fails closed', () => {
  const scenario = makeHappyScenario();
  scenario.initialAuthorityContext.currentPolicyCompatibility = 'HOLD';
  assert.equal(resolveAuthority(scenario.initialAuthorityContext).result, 'UNRESOLVED');
});

test('authority resolution materializes exact immutable evidence fields', () => {
  const scenario = makeHappyScenario();
  const result = resolveAuthority(scenario.initialAuthorityContext);
  assert.equal(result.authorityResolutionId, 'AR-initial-1');
  assert.deepEqual(result.authorityPolicyRevisionIdentity, policyRevisionIdentity);
  assert.deepEqual(result.applicableDecisionIds, ['D-GO-1']);
  assert.equal(result.result, 'GO');
  assert.equal(Object.isFrozen(result), true);
});

test('Gate authorityResolutionId not backed by evaluated evidence fails pre-action validation', () => {
  const scenario = makeHappyScenario();
  const initial = resolveAuthority({ ...scenario.initialAuthorityContext, authorityResolutionId: 'AR-DIFFERENT' });
  const pre = resolveAuthority(scenario.preActionAuthorityContext);
  const validation = buildPreActionAuthorityValidation({
    validationId: 'PAV-X', validatedAt: scenario.preActionAuthorityValidatedAt,
    observation: scenario.observation, claim: scenario.claim,
    initialAuthorityResolution: initial, preActionAuthorityResolution: pre,
  });
  assert.equal(validation.result, 'UNRESOLVED');
});

test('pre-action Authority change prevents eligibility', () => {
  const scenario = makeHappyScenario();
  scenario.preActionAuthorityContext.decisions = [makeDecision({ decisionId: 'D-DENY', outcome: 'DENY' })];
  assert.equal(shadowEvaluate(scenario).recommendation, 'NO_MUTATION');
});

test('same revision identity with reordered object keys compares as same', () => {
  const scenario = makeHappyScenario();
  scenario.claim = { ...scenario.claim, targetRevisionIdentity: { baseSha: 'base-a', headSha: 'head-a' } };
  assert.equal(validateClaimBinding(scenario.observation, scenario.claim).result, 'PASS');
});

test('wrong action claim binding prevents eligibility', () => {
  const scenario = makeHappyScenario();
  scenario.claim = { ...scenario.claim, actionType: 'READY' };
  assert.equal(shadowEvaluate(scenario).recommendation, 'NO_MUTATION');
});

test('happy path is ELIGIBLE only as shadow recommendation', () => {
  const result = shadowEvaluate(makeHappyScenario());
  assert.equal(result.recommendation, 'ELIGIBLE');
  assert.equal(result.mode, 'SHADOW_READ_ONLY');
  assert.equal(result.mutationAttempted, false);
  assert.equal(result.eligibility.mutationAuthorizedByThisResolver, false);
  assert.equal(result.preActionAuthorityValidation.result, 'GO');
  assert.equal(result.eligibility.initialAuthorityResolutionId, 'AR-initial-1');
  assert.equal(result.eligibility.preActionAuthorityResolutionId, 'AR-preaction-1');
});

test('unavailable material stays NO_MUTATION', () => {
  const scenario = makeHappyScenario({ materialComponents: [{ fieldName: 'checks', status: 'UNAVAILABLE' }] });
  const result = shadowEvaluate(scenario);
  assert.equal(result.recommendation, 'NO_MUTATION');
  assert.equal(result.mutationAttempted, false);
});
