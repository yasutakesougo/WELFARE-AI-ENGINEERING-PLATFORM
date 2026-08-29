from __future__ import annotations

from datetime import timedelta
from typing import FrozenSet, Iterable, Sequence

from .models import (
    AuthenticationState,
    AuthorityBinding,
    AuthorityRequest,
    AuthorityState,
    BatchSnapshot,
    BindingState,
    BudgetSnapshot,
    BudgetState,
    ContainmentState,
    CredentialBinding,
    DelegationSnapshot,
    DependencyAssessment,
    DependencyFinding,
    Eligibility,
    EvaluationContext,
    EvaluationResult,
    ExecutionPolicyDecision,
    ExecutionRegrantDecision,
    MutableScopeGenerations,
    NetworkBinding,
    OperationSensitivity,
    ProvenanceClass,
    ResumeSnapshot,
    SecurityConstraint,
    SyntheticAuditEvent,
    ValidityWindow,
    VerifiedClaimSnapshot,
)


_SECURITY_PRECEDENCE = {
    SecurityConstraint.PASS: 0,
    SecurityConstraint.ASK_HUMAN: 1,
    SecurityConstraint.HOLD: 2,
    SecurityConstraint.UNKNOWN: 3,
    SecurityConstraint.BLOCK: 4,
}


def aggregate_security(results: Iterable[SecurityConstraint]) -> SecurityConstraint:
    values = tuple(results)
    if not values:
        return SecurityConstraint.UNKNOWN
    return max(values, key=lambda value: _SECURITY_PRECEDENCE[value])


def validity_state(window: ValidityWindow, context: EvaluationContext) -> AuthorityState:
    now = context.evaluation_timestamp
    if window.valid_from is not None and now < window.valid_from:
        return AuthorityState.UNKNOWN
    if window.valid_until is not None and now > window.valid_until:
        return AuthorityState.EXPIRED
    return AuthorityState.CURRENT


def budget_state(snapshot: BudgetSnapshot) -> BudgetState:
    if snapshot.limit is None or snapshot.consumed is None or snapshot.requested_consumption is None:
        return BudgetState.UNKNOWN
    if min(snapshot.limit, snapshot.consumed, snapshot.requested_consumption) < 0:
        return BudgetState.UNKNOWN
    if snapshot.consumed >= snapshot.limit:
        return BudgetState.EXHAUSTED
    if snapshot.consumed + snapshot.requested_consumption > snapshot.limit:
        return BudgetState.WOULD_EXCEED
    return BudgetState.AVAILABLE


def generation_state(granted: int | None, current: int | None) -> BindingState:
    if granted is None or current is None:
        return BindingState.UNKNOWN
    if granted != current:
        return BindingState.GENERATION_MISMATCH
    return BindingState.MATCH


def authority_binding_state(
    binding: AuthorityBinding,
    context: EvaluationContext,
    *,
    current_authority_generation: int | None,
) -> BindingState:
    required = (
        binding.root_execution_grant_id,
        binding.task_identity,
        binding.run_identity,
        binding.subject_identity,
        binding.authority_decision_ref,
    )
    if any(not value for value in required):
        return BindingState.REQUIRED_MISSING
    generation = generation_state(
        binding.authority_generation.granted_generation,
        current_authority_generation,
    )
    if generation is not BindingState.MATCH:
        return generation
    if validity_state(binding.validity_window, context) is not AuthorityState.CURRENT:
        return BindingState.STALE
    return BindingState.MATCH


def authority_request_state(
    binding: AuthorityBinding,
    request: AuthorityRequest,
    context: EvaluationContext,
    *,
    current_authority_generation: int | None,
) -> BindingState:
    currentness = authority_binding_state(
        binding,
        context,
        current_authority_generation=current_authority_generation,
    )
    if currentness is not BindingState.MATCH:
        return currentness
    exact_pairs = (
        (request.target_repository, binding.target_repository),
        (request.target_system, binding.target_system),
        (request.credential_ref, binding.credential_ref),
    )
    for requested, granted in exact_pairs:
        if requested is not None and requested != granted:
            return BindingState.MISMATCH
    scoped_pairs = (
        (request.target_resource, binding.target_resource_set),
        (request.operation, binding.allowed_operation_set),
        (request.tool, binding.allowed_tool_set),
        (request.network_destination, binding.allowed_network_destination_set),
        (request.write_target, binding.write_target_set),
    )
    for requested, allowed in scoped_pairs:
        if requested is not None and requested not in allowed:
            return BindingState.OUT_OF_SCOPE
    return BindingState.MATCH


def mutable_scope_state(snapshot: MutableScopeGenerations) -> BindingState:
    for binding in (
        snapshot.resource_set,
        snapshot.operation_set,
        snapshot.tool_set,
        snapshot.destination_set,
        snapshot.write_target_set,
    ):
        state = generation_state(
            binding.granted_generation,
            binding.current_generation,
        )
        if state is not BindingState.MATCH:
            return state
    return BindingState.MATCH


def regrant_state(
    decision: ExecutionRegrantDecision | None,
    context: EvaluationContext,
    *,
    expected_previous_root_execution_grant_id: str,
    expected_previous_authority_decision_ref: str,
    previous_target_scope: FrozenSet[str],
    previous_operation_scope: FrozenSet[str],
) -> BindingState:
    if decision is None:
        return BindingState.REQUIRED_MISSING
    if decision.previous_root_execution_grant_id != expected_previous_root_execution_grant_id:
        return BindingState.MISMATCH
    if decision.previous_authority_decision_ref != expected_previous_authority_decision_ref:
        return BindingState.MISMATCH
    if not decision.regrant_decision_ref or not decision.approving_authority:
        return BindingState.REQUIRED_MISSING
    if decision.regrant_sequence < 1:
        return BindingState.MISMATCH
    if decision.approved_additional_budget <= 0:
        return BindingState.MISMATCH
    if decision.approved_additional_budget > decision.requested_additional_budget:
        return BindingState.MISMATCH
    if decision.prior_budget_consumption < decision.prior_budget_limit:
        return BindingState.MISMATCH
    if not decision.target_scope.issubset(previous_target_scope):
        return BindingState.OUT_OF_SCOPE
    if not decision.operation_scope.issubset(previous_operation_scope):
        return BindingState.OUT_OF_SCOPE
    if not decision.new_root_execution_grant_id:
        return BindingState.REQUIRED_MISSING
    if validity_state(decision.validity_window, context) is not AuthorityState.CURRENT:
        return BindingState.STALE
    return BindingState.MATCH


def authentication_constraint(
    authentication: AuthenticationState,
    operation: OperationSensitivity,
) -> SecurityConstraint:
    if authentication is AuthenticationState.UNKNOWN:
        return SecurityConstraint.UNKNOWN
    if authentication is AuthenticationState.AUTHENTICATED:
        return SecurityConstraint.PASS
    if operation is OperationSensitivity.PUBLIC_READ:
        return SecurityConstraint.PASS
    return SecurityConstraint.BLOCK


def network_binding_state(binding: NetworkBinding) -> BindingState:
    generation = generation_state(
        binding.destination_generation.granted_generation,
        binding.destination_generation.current_generation,
    )
    if generation is not BindingState.MATCH:
        return generation
    if binding.requested_destination not in binding.allowed_destinations:
        return BindingState.OUT_OF_SCOPE
    return BindingState.MATCH


def credential_binding_state(binding: CredentialBinding) -> BindingState:
    generation = generation_state(
        binding.credential_generation.granted_generation,
        binding.credential_generation.current_generation,
    )
    if generation is not BindingState.MATCH:
        return generation
    if binding.operation not in binding.allowed_operations:
        return BindingState.OUT_OF_SCOPE
    return BindingState.MATCH


def delegation_state(snapshot: DelegationSnapshot, context: EvaluationContext) -> BindingState:
    if snapshot.parent_authority_state is not AuthorityState.CURRENT:
        return BindingState.STALE
    generation = generation_state(
        snapshot.parent_generation.granted_generation,
        snapshot.parent_generation.current_generation,
    )
    if generation is not BindingState.MATCH:
        return generation
    if validity_state(snapshot.delegation_validity, context) is not AuthorityState.CURRENT:
        return BindingState.STALE
    if snapshot.root_execution_grant_id != snapshot.delegated_root_execution_grant_id:
        return BindingState.MISMATCH
    if not snapshot.delegated_scope.issubset(snapshot.parent_scope):
        return BindingState.OUT_OF_SCOPE
    return BindingState.MATCH


def batch_state(snapshot: BatchSnapshot, context: EvaluationContext) -> BindingState:
    if snapshot.maximum_operations <= 0 or snapshot.maximum_duration_seconds <= 0:
        return BindingState.UNKNOWN
    if snapshot.operations_consumed >= snapshot.maximum_operations:
        return BindingState.OUT_OF_SCOPE
    elapsed = context.evaluation_timestamp - snapshot.batch_start_timestamp
    if elapsed > timedelta(seconds=snapshot.maximum_duration_seconds):
        return BindingState.STALE
    for binding in (
        snapshot.authority_generation,
        snapshot.credential_generation,
        snapshot.selector_generation,
    ):
        state = generation_state(binding.granted_generation, binding.current_generation)
        if state is not BindingState.MATCH:
            return state
    if snapshot.target_scope != snapshot.current_target_scope:
        return BindingState.MISMATCH
    return BindingState.MATCH


def resume_state(snapshot: ResumeSnapshot, context: EvaluationContext) -> BindingState:
    if snapshot.containment_state is not ContainmentState.STOP_ENFORCED:
        return BindingState.MISMATCH
    if snapshot.containment_event_ref != snapshot.current_containment_event_ref:
        return BindingState.STALE
    if snapshot.containment_generation != snapshot.current_containment_generation:
        return BindingState.STALE
    if snapshot.root_execution_grant_id != snapshot.current_root_execution_grant_id:
        return BindingState.MISMATCH
    if snapshot.run_identity != snapshot.current_run_identity:
        return BindingState.MISMATCH
    generation = generation_state(
        snapshot.authority_generation.granted_generation,
        snapshot.authority_generation.current_generation,
    )
    if generation is not BindingState.MATCH:
        return generation
    if snapshot.resume_scope != snapshot.current_resume_scope:
        return BindingState.MISMATCH
    if validity_state(snapshot.validity, context) is not AuthorityState.CURRENT:
        return BindingState.STALE
    return BindingState.MATCH


def transform_provenance(source: ProvenanceClass) -> ProvenanceClass:
    if source in (ProvenanceClass.UNTRUSTED_SOURCE, ProvenanceClass.UNTRUSTED_DERIVED):
        return ProvenanceClass.UNTRUSTED_DERIVED
    return source


def combine_provenance(values: Sequence[ProvenanceClass]) -> ProvenanceClass:
    unique = set(values)
    if not unique:
        return ProvenanceClass.UNKNOWN_SOURCE
    if len(unique) == 1:
        return next(iter(unique))
    if ProvenanceClass.UNKNOWN_SOURCE in unique:
        return ProvenanceClass.UNKNOWN_SOURCE
    return ProvenanceClass.MIXED_SOURCE


def verified_claim_state(snapshot: VerifiedClaimSnapshot, context: EvaluationContext) -> BindingState:
    if snapshot.verification_result != "PASS":
        return BindingState.MISMATCH
    if not snapshot.verification_evidence_ref or not snapshot.source_content_refs:
        return BindingState.REQUIRED_MISSING
    if validity_state(snapshot.verification_validity, context) is not AuthorityState.CURRENT:
        return BindingState.STALE
    return BindingState.MATCH


def dependency_constraint(
    finding: DependencyFinding,
    assessment: DependencyAssessment | SecurityConstraint | None,
) -> SecurityConstraint:
    if assessment is None:
        return SecurityConstraint.UNKNOWN
    if isinstance(assessment, SecurityConstraint):
        return assessment
    if assessment.finding is not finding:
        return SecurityConstraint.UNKNOWN
    if not assessment.assessment_identity or not assessment.evidence_ref:
        return SecurityConstraint.UNKNOWN
    return assessment.assessed_constraint


def canonical_network_classification(classes: Iterable[str]) -> FrozenSet[str]:
    return frozenset(classes)


def derive_primary_class(classification_set: FrozenSet[str]) -> str | None:
    # Display-only derived view. Authorization MUST NOT consume this value.
    display_order = (
        "SHAREPOINT",
        "ENTRA",
        "M365",
        "METADATA_SERVICE",
        "CLOUD_CONTROL_PLANE",
        "SOURCE_CONTROL",
        "PACKAGE_REGISTRY",
        "LOCALHOST",
        "INTERNAL_NETWORK",
        "PUBLIC_INTERNET",
        "OTHER_SERVICE",
    )
    for item in display_order:
        if item in classification_set:
            return item
    return None


def audit_chain_state(events: Sequence[SyntheticAuditEvent]) -> BindingState:
    if not events:
        return BindingState.UNKNOWN
    seen: set[str] = set()
    previous_sequence: int | None = None
    for event in sorted(events, key=lambda value: value.event_sequence):
        if not event.event_identity or event.event_identity in seen:
            return BindingState.MISMATCH
        if previous_sequence is not None and event.event_sequence <= previous_sequence:
            return BindingState.MISMATCH
        if event.causal_parent_ref is not None and event.causal_parent_ref not in seen:
            return BindingState.MISMATCH
        if not event.root_execution_grant_id or not event.authority_decision_ref:
            return BindingState.REQUIRED_MISSING
        seen.add(event.event_identity)
        previous_sequence = event.event_sequence
    return BindingState.MATCH


def evaluate_effective(
    *,
    execution_policy: ExecutionPolicyDecision,
    security_constraint: SecurityConstraint,
    containment_state: ContainmentState,
    authority_state: AuthorityState,
    binding_states: Sequence[BindingState],
    budget: BudgetState,
) -> EvaluationResult:
    if containment_state is not ContainmentState.NORMAL:
        return EvaluationResult(Eligibility.BLOCKED, (containment_state.value,))

    policy_results = {
        ExecutionPolicyDecision.DENY: Eligibility.BLOCKED,
        ExecutionPolicyDecision.HOLD: Eligibility.HELD,
        ExecutionPolicyDecision.ASK_HUMAN: Eligibility.HUMAN_REQUIRED,
        ExecutionPolicyDecision.UNKNOWN: Eligibility.UNKNOWN,
    }
    if execution_policy is not ExecutionPolicyDecision.ALLOW:
        return EvaluationResult(
            policy_results[execution_policy],
            ("EXECUTION_POLICY_" + execution_policy.value,),
        )

    security_results = {
        SecurityConstraint.BLOCK: Eligibility.BLOCKED,
        SecurityConstraint.HOLD: Eligibility.HELD,
        SecurityConstraint.ASK_HUMAN: Eligibility.HUMAN_REQUIRED,
        SecurityConstraint.UNKNOWN: Eligibility.UNKNOWN,
    }
    if security_constraint is not SecurityConstraint.PASS:
        return EvaluationResult(
            security_results[security_constraint],
            ("SECURITY_" + security_constraint.value,),
        )

    if authority_state is not AuthorityState.CURRENT:
        return EvaluationResult(
            Eligibility.BLOCKED,
            ("AUTHORITY_" + authority_state.value,),
        )

    invalid_bindings = tuple(
        state
        for state in binding_states
        if state not in (BindingState.MATCH, BindingState.NOT_APPLICABLE)
    )
    if invalid_bindings:
        return EvaluationResult(
            Eligibility.BLOCKED,
            tuple("BINDING_" + state.value for state in invalid_bindings),
        )

    if budget is not BudgetState.AVAILABLE:
        return EvaluationResult(
            Eligibility.BLOCKED,
            ("BUDGET_" + budget.value,),
        )

    return EvaluationResult(
        Eligibility.ELIGIBLE,
        ("SNAPSHOT_CONDITIONS_SATISFIED",),
    )
