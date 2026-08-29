from __future__ import annotations

import json
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from security_boundary.evaluator import *  # noqa: F403,E402
from security_boundary.models import *  # noqa: F403,E402

T0 = datetime(2026, 8, 29, 0, 0, tzinfo=timezone.utc)
CTX = EvaluationContext(T0, "snapshot-1")


def _effective(*, containment=ContainmentState.NORMAL, authority=AuthorityState.CURRENT,
               bindings=(BindingState.MATCH,), budget=BudgetState.AVAILABLE):
    return evaluate_effective(
        execution_policy=ExecutionPolicyDecision.ALLOW,
        security_constraint=SecurityConstraint.PASS,
        containment_state=containment,
        authority_state=authority,
        binding_states=bindings,
        budget=budget,
    )


def _resume(state=ContainmentState.STOP_ENFORCED, event="a", current_event="a",
            generation=4, current_generation=4, run="r1", current_run="r1"):
    return ResumeSnapshot(
        state, event, current_event, generation, current_generation,
        "g1", "g1", run, current_run, GenerationBinding(3, 3),
        frozenset({"run:r1"}), frozenset({"run:r1"}),
        ValidityWindow(valid_until=T0 + timedelta(hours=1)),
    )


def check_case(name: str) -> bool:
    if name == "budget_exhausted":
        return budget_state(BudgetSnapshot(10, 10, 1)) is BudgetState.EXHAUSTED
    if name == "budget_would_exceed":
        return budget_state(BudgetSnapshot(100, 99, 2)) is BudgetState.WOULD_EXCEED
    if name == "anonymous_privileged":
        return authentication_constraint(AuthenticationState.ANONYMOUS, OperationSensitivity.CODE_EXECUTION) is SecurityConstraint.BLOCK
    if name == "unknown_authentication":
        return authentication_constraint(AuthenticationState.UNKNOWN, OperationSensitivity.AUTHENTICATED_READ) is SecurityConstraint.UNKNOWN
    if name == "credential_use_out_of_scope":
        s = CredentialBinding(CredentialOperation.USE, frozenset({CredentialOperation.OBSERVE}), GenerationBinding(1, 1))
        return credential_binding_state(s) is BindingState.OUT_OF_SCOPE
    if name == "credential_generation_mismatch":
        s = CredentialBinding(CredentialOperation.USE, frozenset({CredentialOperation.USE}), GenerationBinding(4, 5))
        return credential_binding_state(s) is BindingState.GENERATION_MISMATCH
    if name == "binding_out_of_scope":
        return _effective(bindings=(BindingState.OUT_OF_SCOPE,)).eligibility is Eligibility.BLOCKED
    if name == "delegation_root_mismatch":
        s = DelegationSnapshot(frozenset({"repo:A:read"}), frozenset({"repo:A:read"}), AuthorityState.CURRENT, GenerationBinding(1, 1), ValidityWindow(valid_until=T0 + timedelta(hours=1)), "g1", "g2")
        return delegation_state(s, CTX) is BindingState.MISMATCH
    if name == "delegation_scope_expansion":
        s = DelegationSnapshot(frozenset({"repo:A:read"}), frozenset({"repo:A:write"}), AuthorityState.CURRENT, GenerationBinding(1, 1), ValidityWindow(valid_until=T0 + timedelta(hours=1)), "g1", "g1")
        return delegation_state(s, CTX) is BindingState.OUT_OF_SCOPE
    if name == "untrusted_transform":
        return transform_provenance(ProvenanceClass.UNTRUSTED_SOURCE) is ProvenanceClass.UNTRUSTED_DERIVED
    if name == "shared_state_not_authority":
        return transform_provenance(ProvenanceClass.UNTRUSTED_DERIVED) is not ProvenanceClass.AUTHORITATIVE_SOURCE
    if name == "mixed_provenance":
        return combine_provenance([ProvenanceClass.AUTHORITATIVE_SOURCE, ProvenanceClass.UNTRUSTED_SOURCE]) is ProvenanceClass.MIXED_SOURCE
    if name == "unknown_provenance":
        return combine_provenance([ProvenanceClass.UNKNOWN_SOURCE]) is ProvenanceClass.UNKNOWN_SOURCE
    if name == "network_out_of_scope":
        s = NetworkBinding("host-b", frozenset({"host-a"}), GenerationBinding(1, 1))
        return network_binding_state(s) is BindingState.OUT_OF_SCOPE
    if name == "network_generation_mismatch":
        s = NetworkBinding("host-a", frozenset({"host-a"}), GenerationBinding(1, 2))
        return network_binding_state(s) is BindingState.GENERATION_MISMATCH
    if name == "network_classification_set":
        c = canonical_network_classification({"SHAREPOINT", "M365", "PUBLIC_INTERNET"})
        return c == frozenset({"SHAREPOINT", "M365", "PUBLIC_INTERNET"}) and derive_primary_class(c) == "SHAREPOINT"
    if name == "containment_stop":
        return _effective(containment=ContainmentState.STOP_ENFORCED).eligibility is Eligibility.BLOCKED
    if name == "authority_revoked":
        return _effective(authority=AuthorityState.REVOKED).eligibility is Eligibility.BLOCKED
    if name == "resume_wrong_run":
        return resume_state(_resume(run="r1", current_run="r2"), CTX) is BindingState.MISMATCH
    if name == "stale_resume":
        return resume_state(_resume(event="a", current_event="b", generation=4, current_generation=5), CTX) is BindingState.STALE
    if name == "failed_containment":
        return resume_state(_resume(state=ContainmentState.STOP_ENFORCEMENT_FAILED), CTX) is not BindingState.MATCH
    if name == "correct_resume":
        return resume_state(_resume(), CTX) is BindingState.MATCH
    if name == "batch_generation_mismatch":
        s = BatchSnapshot("b1", 10, 4, T0 - timedelta(seconds=10), 60, GenerationBinding(8, 9), GenerationBinding(3, 3), GenerationBinding(2, 2), frozenset({"repo:A"}), frozenset({"repo:A"}))
        return batch_state(s, CTX) is BindingState.GENERATION_MISMATCH
    if name == "batch_limit":
        s = BatchSnapshot("b1", 10, 10, T0 - timedelta(seconds=10), 60, GenerationBinding(8, 8), GenerationBinding(3, 3), GenerationBinding(2, 2), frozenset({"repo:A"}), frozenset({"repo:A"}))
        return batch_state(s, CTX) is BindingState.OUT_OF_SCOPE
    if name == "verified_claim_ok":
        s = VerifiedClaimSnapshot("c1", ("source",), "digest", "evidence", "PASS", T0, ValidityWindow(valid_until=T0 + timedelta(hours=1)))
        return verified_claim_state(s, CTX) is BindingState.MATCH
    if name == "verified_claim_missing_evidence":
        s = VerifiedClaimSnapshot("c1", ("source",), "digest", None, "PASS", T0, ValidityWindow(valid_until=T0 + timedelta(hours=1)))
        return verified_claim_state(s, CTX) is BindingState.REQUIRED_MISSING
    if name == "expired":
        return validity_state(ValidityWindow(valid_until=T0 - timedelta(seconds=1)), CTX) is AuthorityState.EXPIRED
    if name == "security_precedence":
        return aggregate_security([SecurityConstraint.ASK_HUMAN, SecurityConstraint.BLOCK, SecurityConstraint.PASS]) is SecurityConstraint.BLOCK
    if name == "dependency_requires_assessment":
        return dependency_constraint(DependencyFinding.KNOWN_VULNERABILITY, None) is SecurityConstraint.UNKNOWN
    raise AssertionError(f"unknown fixture check: {name}")


class SecurityBoundaryTests(unittest.TestCase):
    def test_s1_to_s41_fixture_runner(self):
        data = json.loads((ROOT / "fixtures/security_boundary/synthetic_cases.json").read_text())
        self.assertEqual([x["id"] for x in data], [f"S{i}" for i in range(1, 42)])
        for case in data:
            with self.subTest(case=case["id"], check=case["check"]):
                self.assertEqual(case["expected"], "PASS")
                self.assertTrue(check_case(case["check"]))

    def test_effective_eligibility_requires_all_axes(self):
        self.assertEqual(_effective().eligibility, Eligibility.ELIGIBLE)
        self.assertEqual(_effective(budget=BudgetState.WOULD_EXCEED).eligibility, Eligibility.BLOCKED)
        self.assertEqual(_effective(authority=AuthorityState.UNKNOWN).eligibility, Eligibility.BLOCKED)
        self.assertEqual(_effective(containment=ContainmentState.STOP_REQUESTED).eligibility, Eligibility.BLOCKED)

    def test_determinism(self):
        self.assertEqual(_effective(), _effective())


if __name__ == "__main__":
    unittest.main()
