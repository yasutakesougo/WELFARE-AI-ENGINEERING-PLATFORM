from __future__ import annotations

import json
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from security_boundary.evaluator import (
    aggregate_security,
    audit_chain_state,
    authentication_constraint,
    authority_binding_state,
    batch_state,
    budget_state,
    canonical_network_classification,
    combine_provenance,
    credential_binding_state,
    delegation_state,
    dependency_constraint,
    derive_primary_class,
    evaluate_effective,
    network_binding_state,
    regrant_state,
    resume_state,
    transform_provenance,
    validity_state,
    verified_claim_state,
)
from security_boundary.models import (
    AuthenticationState,
    AuthorityBinding,
    AuthorityState,
    BatchSnapshot,
    BindingState,
    BudgetSnapshot,
    BudgetState,
    ContainmentState,
    CredentialBinding,
    CredentialOperation,
    DelegationSnapshot,
    DependencyAssessment,
    DependencyFinding,
    Eligibility,
    EvaluationContext,
    ExecutionPolicyDecision,
    ExecutionRegrantDecision,
    GenerationBinding,
    NetworkBinding,
    OperationSensitivity,
    ProvenanceClass,
    ResumeSnapshot,
    SecurityConstraint,
    SyntheticAuditEvent,
    ValidityWindow,
    VerifiedClaimSnapshot,
)

T0 = datetime(2026, 8, 29, 0, 0, tzinfo=timezone.utc)
CTX = EvaluationContext(T0, "snapshot-1")


def _effective(
    *,
    containment: ContainmentState = ContainmentState.NORMAL,
    authority: AuthorityState = AuthorityState.CURRENT,
    bindings: tuple[BindingState, ...] = (BindingState.MATCH,),
    budget: BudgetState = BudgetState.AVAILABLE,
):
    return evaluate_effective(
        execution_policy=ExecutionPolicyDecision.ALLOW,
        security_constraint=SecurityConstraint.PASS,
        containment_state=containment,
        authority_state=authority,
        binding_states=bindings,
        budget=budget,
    )


def _resume(
    state: ContainmentState = ContainmentState.STOP_ENFORCED,
    event: str = "stop-a",
    current_event: str = "stop-a",
    generation: int = 4,
    current_generation: int = 4,
    run: str = "run-1",
    current_run: str = "run-1",
):
    return ResumeSnapshot(
        containment_state=state,
        containment_event_ref=event,
        current_containment_event_ref=current_event,
        containment_generation=generation,
        current_containment_generation=current_generation,
        root_execution_grant_id="grant-1",
        current_root_execution_grant_id="grant-1",
        run_identity=run,
        current_run_identity=current_run,
        authority_generation=GenerationBinding(3, 3),
        resume_scope=frozenset({"run:run-1"}),
        current_resume_scope=frozenset({"run:run-1"}),
        validity=ValidityWindow(valid_until=T0 + timedelta(hours=1)),
    )


def _regrant(
    target_scope: frozenset[str] = frozenset({"repo:A"}),
    operation_scope: frozenset[str] = frozenset({"READ"}),
):
    return ExecutionRegrantDecision(
        previous_root_execution_grant_id="grant-old",
        previous_authority_decision_ref="auth-old",
        regrant_decision_ref="regrant-1",
        regrant_reason="budget exhausted",
        prior_budget_limit=10,
        prior_budget_consumption=10,
        requested_additional_budget=5,
        approved_additional_budget=5,
        approving_authority="human-1",
        decision_time=T0,
        validity_window=ValidityWindow(valid_until=T0 + timedelta(hours=1)),
        target_scope=target_scope,
        operation_scope=operation_scope,
        new_root_execution_grant_id="grant-new",
    )


def check_case(name: str) -> bool:
    if name == "budget_exhausted":
        return budget_state(BudgetSnapshot(10, 10, 1, "grant-1")) is BudgetState.EXHAUSTED
    if name == "budget_would_exceed":
        return budget_state(BudgetSnapshot(100, 99, 2, "grant-1")) is BudgetState.WOULD_EXCEED
    if name == "anonymous_privileged":
        return authentication_constraint(AuthenticationState.ANONYMOUS, OperationSensitivity.CODE_EXECUTION) is SecurityConstraint.BLOCK
    if name == "unknown_authentication":
        return authentication_constraint(AuthenticationState.UNKNOWN, OperationSensitivity.AUTHENTICATED_READ) is SecurityConstraint.UNKNOWN
    if name == "credential_use_out_of_scope":
        snapshot = CredentialBinding(CredentialOperation.USE, frozenset({CredentialOperation.OBSERVE}), GenerationBinding(1, 1))
        return credential_binding_state(snapshot) is BindingState.OUT_OF_SCOPE
    if name == "credential_generation_mismatch":
        snapshot = CredentialBinding(CredentialOperation.USE, frozenset({CredentialOperation.USE}), GenerationBinding(4, 5))
        return credential_binding_state(snapshot) is BindingState.GENERATION_MISMATCH
    if name == "binding_out_of_scope":
        return _effective(bindings=(BindingState.OUT_OF_SCOPE,)).eligibility is Eligibility.BLOCKED
    if name == "delegation_root_mismatch":
        snapshot = DelegationSnapshot(frozenset({"repo:A:read"}), frozenset({"repo:A:read"}), AuthorityState.CURRENT, GenerationBinding(1, 1), ValidityWindow(valid_until=T0 + timedelta(hours=1)), "grant-1", "grant-2")
        return delegation_state(snapshot, CTX) is BindingState.MISMATCH
    if name == "delegation_scope_expansion":
        snapshot = DelegationSnapshot(frozenset({"repo:A:read"}), frozenset({"repo:A:write"}), AuthorityState.CURRENT, GenerationBinding(1, 1), ValidityWindow(valid_until=T0 + timedelta(hours=1)), "grant-1", "grant-1")
        return delegation_state(snapshot, CTX) is BindingState.OUT_OF_SCOPE
    if name == "untrusted_transform":
        return transform_provenance(ProvenanceClass.UNTRUSTED_SOURCE) is ProvenanceClass.UNTRUSTED_DERIVED
    if name == "shared_state_not_authority":
        return transform_provenance(ProvenanceClass.UNTRUSTED_DERIVED) is not ProvenanceClass.AUTHORITATIVE_SOURCE
    if name == "mixed_provenance":
        return combine_provenance([ProvenanceClass.AUTHORITATIVE_SOURCE, ProvenanceClass.UNTRUSTED_SOURCE]) is ProvenanceClass.MIXED_SOURCE
    if name == "unknown_provenance":
        return combine_provenance([ProvenanceClass.UNKNOWN_SOURCE]) is ProvenanceClass.UNKNOWN_SOURCE
    if name == "network_out_of_scope":
        snapshot = NetworkBinding("host-b", frozenset({"host-a"}), GenerationBinding(1, 1))
        return network_binding_state(snapshot) is BindingState.OUT_OF_SCOPE
    if name == "network_generation_mismatch":
        snapshot = NetworkBinding("host-a", frozenset({"host-a"}), GenerationBinding(1, 2))
        return network_binding_state(snapshot) is BindingState.GENERATION_MISMATCH
    if name == "network_classification_set":
        classification_set = canonical_network_classification({"SHAREPOINT", "M365", "PUBLIC_INTERNET"})
        return classification_set == frozenset({"SHAREPOINT", "M365", "PUBLIC_INTERNET"}) and derive_primary_class(classification_set) == "SHAREPOINT"
    if name == "containment_stop":
        return _effective(containment=ContainmentState.STOP_ENFORCED).eligibility is Eligibility.BLOCKED
    if name == "authority_revoked":
        return _effective(authority=AuthorityState.REVOKED).eligibility is Eligibility.BLOCKED
    if name == "resume_wrong_run":
        return resume_state(_resume(run="run-1", current_run="run-2"), CTX) is BindingState.MISMATCH
    if name == "stale_resume":
        return resume_state(_resume(event="stop-a", current_event="stop-b", generation=4, current_generation=5), CTX) is BindingState.STALE
    if name == "failed_containment":
        return resume_state(_resume(state=ContainmentState.STOP_ENFORCEMENT_FAILED), CTX) is not BindingState.MATCH
    if name == "correct_resume":
        return resume_state(_resume(), CTX) is BindingState.MATCH
    if name == "batch_generation_mismatch":
        snapshot = BatchSnapshot("batch-1", 10, 4, T0 - timedelta(seconds=10), 60, GenerationBinding(8, 9), GenerationBinding(3, 3), GenerationBinding(2, 2), frozenset({"repo:A"}), frozenset({"repo:A"}))
        return batch_state(snapshot, CTX) is BindingState.GENERATION_MISMATCH
    if name == "batch_limit":
        snapshot = BatchSnapshot("batch-1", 10, 10, T0 - timedelta(seconds=10), 60, GenerationBinding(8, 8), GenerationBinding(3, 3), GenerationBinding(2, 2), frozenset({"repo:A"}), frozenset({"repo:A"}))
        return batch_state(snapshot, CTX) is BindingState.OUT_OF_SCOPE
    if name == "verified_claim_ok":
        snapshot = VerifiedClaimSnapshot("claim-1", ("source-1",), "digest", "evidence-1", "PASS", T0, ValidityWindow(valid_until=T0 + timedelta(hours=1)))
        return verified_claim_state(snapshot, CTX) is BindingState.MATCH
    if name == "verified_claim_missing_evidence":
        snapshot = VerifiedClaimSnapshot("claim-1", ("source-1",), "digest", None, "PASS", T0, ValidityWindow(valid_until=T0 + timedelta(hours=1)))
        return verified_claim_state(snapshot, CTX) is BindingState.REQUIRED_MISSING
    if name == "expired":
        return validity_state(ValidityWindow(valid_until=T0 - timedelta(seconds=1)), CTX) is AuthorityState.EXPIRED
    if name == "security_precedence":
        return aggregate_security([SecurityConstraint.ASK_HUMAN, SecurityConstraint.BLOCK, SecurityConstraint.PASS]) is SecurityConstraint.BLOCK
    if name == "dependency_requires_assessment":
        return dependency_constraint(DependencyFinding.KNOWN_VULNERABILITY, None) is SecurityConstraint.UNKNOWN
    if name == "explicit_regrant_required":
        return regrant_state(None, CTX, expected_previous_root_execution_grant_id="grant-old", expected_previous_authority_decision_ref="auth-old", previous_target_scope=frozenset({"repo:A"}), previous_operation_scope=frozenset({"READ"})) is BindingState.REQUIRED_MISSING
    if name == "regrant_scope_no_widening":
        return regrant_state(_regrant(target_scope=frozenset({"repo:A", "repo:B"})), CTX, expected_previous_root_execution_grant_id="grant-old", expected_previous_authority_decision_ref="auth-old", previous_target_scope=frozenset({"repo:A"}), previous_operation_scope=frozenset({"READ"})) is BindingState.OUT_OF_SCOPE
    raise AssertionError(f"unknown fixture check: {name}")


class SecurityBoundaryTests(unittest.TestCase):
    def test_s1_to_s41_fixture_runner(self):
        data = json.loads((ROOT / "fixtures/security_boundary/synthetic_cases.json").read_text())
        self.assertEqual([case["id"] for case in data], [f"S{i}" for i in range(1, 42)])
        for case in data:
            with self.subTest(case=case["id"], check=case["check"]):
                self.assertEqual(case["expected"], "PASS")
                self.assertTrue(check_case(case["check"]))

    def test_authority_binding_requires_current_generation(self):
        binding = AuthorityBinding(
            root_execution_grant_id="grant-1",
            task_identity="task-1",
            run_identity="run-1",
            subject_identity="worker-1",
            target_repository="repo:A",
            target_system=None,
            target_resource_set=frozenset({"repo:A"}),
            allowed_operation_set=frozenset({"READ"}),
            allowed_tool_set=frozenset({"repo-read"}),
            credential_ref=None,
            allowed_network_destination_set=frozenset(),
            write_target_set=frozenset(),
            authority_decision_ref="auth-1",
            authority_generation=GenerationBinding(3, 3),
            validity_window=ValidityWindow(valid_until=T0 + timedelta(hours=1)),
        )
        self.assertEqual(authority_binding_state(binding, CTX, current_authority_generation=3), BindingState.MATCH)
        self.assertEqual(authority_binding_state(binding, CTX, current_authority_generation=4), BindingState.GENERATION_MISMATCH)

    def test_explicit_regrant_contract(self):
        self.assertEqual(regrant_state(_regrant(), CTX, expected_previous_root_execution_grant_id="grant-old", expected_previous_authority_decision_ref="auth-old", previous_target_scope=frozenset({"repo:A"}), previous_operation_scope=frozenset({"READ"})), BindingState.MATCH)
        self.assertEqual(regrant_state(None, CTX, expected_previous_root_execution_grant_id="grant-old", expected_previous_authority_decision_ref="auth-old", previous_target_scope=frozenset({"repo:A"}), previous_operation_scope=frozenset({"READ"})), BindingState.REQUIRED_MISSING)

    def test_dependency_assessment_contract(self):
        assessment = DependencyAssessment(DependencyFinding.KNOWN_VULNERABILITY, "assessment-1", SecurityConstraint.HOLD, "evidence-1")
        self.assertEqual(dependency_constraint(DependencyFinding.KNOWN_VULNERABILITY, assessment), SecurityConstraint.HOLD)

    def test_synthetic_audit_chain(self):
        first = SyntheticAuditEvent("event-1", 1, T0, "grant-1", "run-1", "task-1", "repo:A", "READ", "auth-1", 1, SecurityConstraint.PASS, ContainmentState.NORMAL, "NOT_EXECUTED")
        second = SyntheticAuditEvent("event-2", 2, T0, "grant-1", "run-1", "task-1", "repo:A", "READ", "auth-1", 1, SecurityConstraint.PASS, ContainmentState.NORMAL, "NOT_EXECUTED", causal_parent_ref="event-1")
        self.assertEqual(audit_chain_state([first, second]), BindingState.MATCH)

    def test_effective_eligibility_requires_all_axes(self):
        self.assertEqual(_effective().eligibility, Eligibility.ELIGIBLE)
        self.assertEqual(_effective(budget=BudgetState.WOULD_EXCEED).eligibility, Eligibility.BLOCKED)
        self.assertEqual(_effective(authority=AuthorityState.UNKNOWN).eligibility, Eligibility.BLOCKED)
        self.assertEqual(_effective(containment=ContainmentState.STOP_REQUESTED).eligibility, Eligibility.BLOCKED)

    def test_determinism(self):
        self.assertEqual(_effective(), _effective())


if __name__ == "__main__":
    unittest.main()
