from __future__ import annotations

from datetime import timedelta
from typing import FrozenSet, Iterable, Sequence

from .models import *

_PRECEDENCE={SecurityConstraint.PASS:0,SecurityConstraint.ASK_HUMAN:1,SecurityConstraint.HOLD:2,SecurityConstraint.UNKNOWN:3,SecurityConstraint.BLOCK:4}

def aggregate_security(results: Iterable[SecurityConstraint])->SecurityConstraint:
    values=tuple(results)
    return max(values,key=lambda x:_PRECEDENCE[x]) if values else SecurityConstraint.UNKNOWN

def validity_state(window: ValidityWindow, context: EvaluationContext)->AuthorityState:
    now=context.evaluation_timestamp
    if window.valid_from is not None and now<window.valid_from:return AuthorityState.UNKNOWN
    if window.valid_until is not None and now>window.valid_until:return AuthorityState.EXPIRED
    return AuthorityState.CURRENT

def budget_state(s: BudgetSnapshot)->BudgetState:
    if s.limit is None or s.consumed is None or s.requested_consumption is None:return BudgetState.UNKNOWN
    if min(s.limit,s.consumed,s.requested_consumption)<0:return BudgetState.UNKNOWN
    if s.consumed>=s.limit:return BudgetState.EXHAUSTED
    if s.consumed+s.requested_consumption>s.limit:return BudgetState.WOULD_EXCEED
    return BudgetState.AVAILABLE

def generation_state(granted:int|None,current:int|None)->BindingState:
    if granted is None or current is None:return BindingState.UNKNOWN
    return BindingState.MATCH if granted==current else BindingState.GENERATION_MISMATCH

def authentication_constraint(auth:AuthenticationState,op:OperationSensitivity)->SecurityConstraint:
    if auth is AuthenticationState.UNKNOWN:return SecurityConstraint.UNKNOWN
    if auth is AuthenticationState.AUTHENTICATED:return SecurityConstraint.PASS
    return SecurityConstraint.PASS if op is OperationSensitivity.PUBLIC_READ else SecurityConstraint.BLOCK

def network_binding_state(b:NetworkBinding)->BindingState:
    g=generation_state(b.destination_generation.granted_generation,b.destination_generation.current_generation)
    if g is not BindingState.MATCH:return g
    return BindingState.MATCH if b.requested_destination in b.allowed_destinations else BindingState.OUT_OF_SCOPE

def credential_binding_state(b:CredentialBinding)->BindingState:
    g=generation_state(b.credential_generation.granted_generation,b.credential_generation.current_generation)
    if g is not BindingState.MATCH:return g
    return BindingState.MATCH if b.operation in b.allowed_operations else BindingState.OUT_OF_SCOPE

def delegation_state(s:DelegationSnapshot,c:EvaluationContext)->BindingState:
    if s.parent_authority_state is not AuthorityState.CURRENT:return BindingState.STALE
    g=generation_state(s.parent_generation.granted_generation,s.parent_generation.current_generation)
    if g is not BindingState.MATCH:return g
    if validity_state(s.delegation_validity,c) is not AuthorityState.CURRENT:return BindingState.STALE
    if s.root_execution_grant_id!=s.delegated_root_execution_grant_id:return BindingState.MISMATCH
    return BindingState.MATCH if s.delegated_scope.issubset(s.parent_scope) else BindingState.OUT_OF_SCOPE

def batch_state(s:BatchSnapshot,c:EvaluationContext)->BindingState:
    if s.operations_consumed>=s.maximum_operations:return BindingState.OUT_OF_SCOPE
    if c.evaluation_timestamp-s.batch_start_timestamp>timedelta(seconds=s.maximum_duration_seconds):return BindingState.STALE
    for b in (s.authority_generation,s.credential_generation,s.selector_generation):
        g=generation_state(b.granted_generation,b.current_generation)
        if g is not BindingState.MATCH:return g
    return BindingState.MATCH if s.target_scope==s.current_target_scope else BindingState.MISMATCH

def resume_state(s:ResumeSnapshot,c:EvaluationContext)->BindingState:
    if s.containment_state is not ContainmentState.STOP_ENFORCED:return BindingState.MISMATCH
    if s.containment_event_ref!=s.current_containment_event_ref or s.containment_generation!=s.current_containment_generation:return BindingState.STALE
    if s.root_execution_grant_id!=s.current_root_execution_grant_id or s.run_identity!=s.current_run_identity:return BindingState.MISMATCH
    g=generation_state(s.authority_generation.granted_generation,s.authority_generation.current_generation)
    if g is not BindingState.MATCH:return g
    if s.resume_scope!=s.current_resume_scope:return BindingState.MISMATCH
    return BindingState.MATCH if validity_state(s.validity,c) is AuthorityState.CURRENT else BindingState.STALE

def transform_provenance(p:ProvenanceClass)->ProvenanceClass:
    if p in (ProvenanceClass.UNTRUSTED_SOURCE,ProvenanceClass.UNTRUSTED_DERIVED):return ProvenanceClass.UNTRUSTED_DERIVED
    return p

def combine_provenance(values:Sequence[ProvenanceClass])->ProvenanceClass:
    u=set(values)
    if not u:return ProvenanceClass.UNKNOWN_SOURCE
    if len(u)==1:return next(iter(u))
    if ProvenanceClass.UNKNOWN_SOURCE in u:return ProvenanceClass.UNKNOWN_SOURCE
    return ProvenanceClass.MIXED_SOURCE

def verified_claim_state(s:VerifiedClaimSnapshot,c:EvaluationContext)->BindingState:
    if s.verification_result!='PASS':return BindingState.MISMATCH
    if not s.verification_evidence_ref or not s.source_content_refs:return BindingState.REQUIRED_MISSING
    return BindingState.MATCH if validity_state(s.verification_validity,c) is AuthorityState.CURRENT else BindingState.STALE

def dependency_constraint(finding:DependencyFinding, assessed:SecurityConstraint|None)->SecurityConstraint:
    return assessed if assessed is not None else SecurityConstraint.UNKNOWN

def canonical_network_classification(classes:Iterable[str])->FrozenSet[str]:
    return frozenset(classes)

def derive_primary_class(classes:FrozenSet[str])->str|None:
    # Display-only; authorization never consumes this value.
    for x in ('SHAREPOINT','ENTRA','M365','METADATA_SERVICE','CLOUD_CONTROL_PLANE','SOURCE_CONTROL','PACKAGE_REGISTRY','LOCALHOST','INTERNAL_NETWORK','PUBLIC_INTERNET','OTHER_SERVICE'):
        if x in classes:return x
    return None

def evaluate_effective(*,execution_policy:ExecutionPolicyDecision,security_constraint:SecurityConstraint,containment_state:ContainmentState,authority_state:AuthorityState,binding_states:Sequence[BindingState],budget:BudgetState)->EvaluationResult:
    if containment_state is not ContainmentState.NORMAL:return EvaluationResult(Eligibility.BLOCKED,(containment_state.value,))
    policy_map={ExecutionPolicyDecision.DENY:Eligibility.BLOCKED,ExecutionPolicyDecision.HOLD:Eligibility.HELD,ExecutionPolicyDecision.ASK_HUMAN:Eligibility.HUMAN_REQUIRED,ExecutionPolicyDecision.UNKNOWN:Eligibility.UNKNOWN}
    if execution_policy is not ExecutionPolicyDecision.ALLOW:return EvaluationResult(policy_map[execution_policy],('EXECUTION_POLICY_'+execution_policy.value,))
    sec_map={SecurityConstraint.BLOCK:Eligibility.BLOCKED,SecurityConstraint.HOLD:Eligibility.HELD,SecurityConstraint.ASK_HUMAN:Eligibility.HUMAN_REQUIRED,SecurityConstraint.UNKNOWN:Eligibility.UNKNOWN}
    if security_constraint is not SecurityConstraint.PASS:return EvaluationResult(sec_map[security_constraint],('SECURITY_'+security_constraint.value,))
    if authority_state is not AuthorityState.CURRENT:return EvaluationResult(Eligibility.BLOCKED,('AUTHORITY_'+authority_state.value,))
    bad=tuple(x for x in binding_states if x not in (BindingState.MATCH,BindingState.NOT_APPLICABLE))
    if bad:return EvaluationResult(Eligibility.BLOCKED,tuple('BINDING_'+x.value for x in bad))
    if budget is not BudgetState.AVAILABLE:return EvaluationResult(Eligibility.BLOCKED,('BUDGET_'+budget.value,))
    return EvaluationResult(Eligibility.ELIGIBLE,('SNAPSHOT_CONDITIONS_SATISFIED',))
