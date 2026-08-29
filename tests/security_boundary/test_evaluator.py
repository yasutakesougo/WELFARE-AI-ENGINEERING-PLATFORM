from __future__ import annotations
import json,sys,unittest
from datetime import datetime,timedelta,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'src'))
from security_boundary.evaluator import *
from security_boundary.models import *
T0=datetime(2026,8,29,0,0,tzinfo=timezone.utc);CTX=EvaluationContext(T0,'snapshot-1')
class SecurityBoundaryTests(unittest.TestCase):
 def test_precedence(self):self.assertEqual(aggregate_security([SecurityConstraint.ASK_HUMAN,SecurityConstraint.BLOCK,SecurityConstraint.PASS]),SecurityConstraint.BLOCK)
 def test_budget(self):self.assertEqual(budget_state(BudgetSnapshot(100,99,2)),BudgetState.WOULD_EXCEED)
 def test_expiry(self):self.assertEqual(validity_state(ValidityWindow(valid_until=T0-timedelta(seconds=1)),CTX),AuthorityState.EXPIRED)
 def test_auth(self):self.assertEqual(authentication_constraint(AuthenticationState.ANONYMOUS,OperationSensitivity.CODE_EXECUTION),SecurityConstraint.BLOCK)
 def test_delegation(self):
  s=DelegationSnapshot(frozenset({'repo:A:read'}),frozenset({'repo:A:write'}),AuthorityState.CURRENT,GenerationBinding(1,1),ValidityWindow(valid_until=T0+timedelta(hours=1)),'g1','g1')
  self.assertEqual(delegation_state(s,CTX),BindingState.OUT_OF_SCOPE)
 def test_batch_generation(self):
  s=BatchSnapshot('b1',10,4,T0-timedelta(seconds=10),60,GenerationBinding(8,9),GenerationBinding(3,3),GenerationBinding(2,2),frozenset({'repo:A'}),frozenset({'repo:A'}))
  self.assertEqual(batch_state(s,CTX),BindingState.GENERATION_MISMATCH)
 def test_resume_stale(self):
  s=ResumeSnapshot(ContainmentState.STOP_ENFORCED,'a','b',4,5,'g1','g1','r1','r1',GenerationBinding(3,3),frozenset({'r1'}),frozenset({'r1'}),ValidityWindow(valid_until=T0+timedelta(hours=1)))
  self.assertEqual(resume_state(s,CTX),BindingState.STALE)
 def test_failed_containment(self):
  s=ResumeSnapshot(ContainmentState.STOP_ENFORCEMENT_FAILED,'a','a',4,4,'g1','g1','r1','r1',GenerationBinding(3,3),frozenset({'r1'}),frozenset({'r1'}),ValidityWindow(valid_until=T0+timedelta(hours=1)))
  self.assertNotEqual(resume_state(s,CTX),BindingState.MATCH)
 def test_provenance(self):
  self.assertEqual(transform_provenance(ProvenanceClass.UNTRUSTED_SOURCE),ProvenanceClass.UNTRUSTED_DERIVED)
  self.assertEqual(combine_provenance([ProvenanceClass.AUTHORITATIVE_SOURCE,ProvenanceClass.UNTRUSTED_SOURCE]),ProvenanceClass.MIXED_SOURCE)
 def test_verified_claim(self):
  s=VerifiedClaimSnapshot('c1',('s1',),'abc',None,'PASS',T0,ValidityWindow(valid_until=T0+timedelta(hours=1)))
  self.assertEqual(verified_claim_state(s,CTX),BindingState.REQUIRED_MISSING)
 def test_network_classification(self):
  c=canonical_network_classification({'SHAREPOINT','M365','PUBLIC_INTERNET'});self.assertEqual(c,frozenset({'SHAREPOINT','M365','PUBLIC_INTERNET'}));self.assertEqual(derive_primary_class(c),'SHAREPOINT')
 def test_network_binding(self):
  s=NetworkBinding('b',frozenset({'a'}),GenerationBinding(1,1));self.assertEqual(network_binding_state(s),BindingState.OUT_OF_SCOPE)
 def test_credential_drift(self):
  s=CredentialBinding(CredentialOperation.USE,frozenset({CredentialOperation.USE}),GenerationBinding(4,5));self.assertEqual(credential_binding_state(s),BindingState.GENERATION_MISMATCH)
 def test_dependency(self):self.assertEqual(dependency_constraint(DependencyFinding.KNOWN_VULNERABILITY,None),SecurityConstraint.UNKNOWN)
 def test_effective(self):
  kw=dict(execution_policy=ExecutionPolicyDecision.ALLOW,security_constraint=SecurityConstraint.PASS,containment_state=ContainmentState.NORMAL,authority_state=AuthorityState.CURRENT,binding_states=(BindingState.MATCH,))
  self.assertEqual(evaluate_effective(**kw,budget=BudgetState.AVAILABLE).eligibility,Eligibility.ELIGIBLE)
  self.assertEqual(evaluate_effective(**kw,budget=BudgetState.WOULD_EXCEED).eligibility,Eligibility.BLOCKED)
 def test_fixture_catalog(self):
  d=json.loads((ROOT/'fixtures/security_boundary/synthetic_cases.json').read_text());self.assertEqual([x['id'] for x in d],[f'S{i}' for i in range(1,42)])
 def test_determinism(self):
  kw=dict(execution_policy=ExecutionPolicyDecision.ALLOW,security_constraint=SecurityConstraint.PASS,containment_state=ContainmentState.NORMAL,authority_state=AuthorityState.CURRENT,binding_states=(BindingState.MATCH,),budget=BudgetState.AVAILABLE)
  self.assertEqual(evaluate_effective(**kw),evaluate_effective(**kw))
if __name__=='__main__':unittest.main()
