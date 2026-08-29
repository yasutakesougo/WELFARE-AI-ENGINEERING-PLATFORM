from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from durable_run_kernel.checkpoint import ResumeDecision
from durable_run_kernel.models import AuthorityFreshness, EffectState, RunState
from durable_run_kernel.transition import (
    ChildPropagation,
    TransitionDecision,
    TransitionEvidence,
    parent_propagation_decision,
    recovery_decision,
    retry_decision,
    transition_decision,
)


def evidence(**changes):
    values = dict(
        current_authority_freshness=AuthorityFreshness.CURRENT,
        definition_matches=True,
        capability_compatible=True,
        lease_current=True,
        fence_current=True,
        effect_state=None,
        resume_decision=None,
    )
    values.update(changes)
    return TransitionEvidence(**values)


class DurableRunKernelSliceCTests(unittest.TestCase):
    def test_dk_c_r1_normal_transition(self): self.assertEqual(transition_decision(RunState.AUTHORIZED, RunState.RUNNING, evidence()), TransitionDecision.ALLOW_TRANSITION)
    def test_dk_c_r2_terminal_state_cannot_reopen(self): self.assertEqual(transition_decision(RunState.SUCCEEDED, RunState.RUNNING, evidence()), TransitionDecision.TERMINAL_STATE_PROTECTED)
    def test_dk_c_r3_stale_authority_blocks_transition(self): self.assertEqual(transition_decision(RunState.SUSPENDED, RunState.AUTHORIZED, evidence(current_authority_freshness=AuthorityFreshness.STALE)), TransitionDecision.REAUTHORIZE_REQUIRED)
    def test_dk_c_r4_definition_drift_blocks_transition(self): self.assertEqual(transition_decision(RunState.SUSPENDED, RunState.AUTHORIZED, evidence(definition_matches=False)), TransitionDecision.DEFINITION_MISMATCH)
    def test_dk_c_r5_capability_drift_requires_reauthorization(self): self.assertEqual(transition_decision(RunState.SUSPENDED, RunState.AUTHORIZED, evidence(capability_compatible=False)), TransitionDecision.REAUTHORIZE_REQUIRED)
    def test_dk_c_r6_stale_lease_rejected(self): self.assertEqual(transition_decision(RunState.RUNNING, RunState.SUSPENDED, evidence(lease_current=False)), TransitionDecision.STALE_LEASE_REJECTED)
    def test_dk_c_r7_stale_fence_rejected(self): self.assertEqual(transition_decision(RunState.RUNNING, RunState.SUSPENDED, evidence(fence_current=False)), TransitionDecision.STALE_LEASE_REJECTED)
    def test_dk_c_r8_retryable_does_not_bypass_authority(self): self.assertEqual(retry_decision(RunState.FAILED, evidence(current_authority_freshness=AuthorityFreshness.UNKNOWN), technically_retryable=True), TransitionDecision.REAUTHORIZE_REQUIRED)
    def test_dk_c_r9_effect_unknown_requires_reconciliation(self): self.assertEqual(retry_decision(RunState.FAILED, evidence(effect_state=EffectState.EFFECT_UNKNOWN), technically_retryable=True), TransitionDecision.RECONCILIATION_REQUIRED)
    def test_dk_c_r10_effect_not_applied_retry_eligible(self): self.assertEqual(retry_decision(RunState.FAILED, evidence(effect_state=EffectState.EFFECT_NOT_APPLIED), technically_retryable=True), TransitionDecision.RETRY_ELIGIBLE)
    def test_dk_c_r11_resume_eligible_is_not_resume_authority(self): self.assertEqual(recovery_decision(RunState.SUSPENDED, evidence(resume_decision=ResumeDecision.REAUTHORIZE_REQUIRED)), TransitionDecision.REAUTHORIZE_REQUIRED)
    def test_dk_c_r12_unknown_effect_resume_requires_reconciliation(self): self.assertEqual(recovery_decision(RunState.UNKNOWN, evidence(resume_decision=ResumeDecision.RECONCILIATION_REQUIRED)), TransitionDecision.RECONCILIATION_REQUIRED)
    def test_dk_c_r13_recovery_candidate_when_safe(self): self.assertEqual(recovery_decision(RunState.SUSPENDED, evidence(resume_decision=ResumeDecision.ALLOW_REUSE)), TransitionDecision.RECOVERY_ELIGIBLE)
    def test_dk_c_r14_child_failure_does_not_auto_fail_parent(self): self.assertEqual(parent_propagation_decision(ChildPropagation(RunState.FAILED, RunState.RUNNING, False)), TransitionDecision.HOLD_REQUIRED)
    def test_dk_c_r15_explicit_parent_failure_rule_allows_propagation(self): self.assertEqual(parent_propagation_decision(ChildPropagation(RunState.FAILED, RunState.RUNNING, True)), TransitionDecision.ALLOW_TRANSITION)
    def test_dk_c_r16_policy_denied_terminal_is_protected(self): self.assertEqual(retry_decision(RunState.DENIED, evidence(), technically_retryable=True), TransitionDecision.TERMINAL_STATE_PROTECTED)
    def test_dk_c_r17_applied_effect_preserves_duplicate_prohibition(self): self.assertEqual(retry_decision(RunState.FAILED, evidence(effect_state=EffectState.EFFECT_APPLIED), technically_retryable=True), TransitionDecision.DUPLICATE_MUTATION_PROHIBITED)
    def test_dk_c_r18_missing_resume_evidence_holds(self): self.assertEqual(recovery_decision(RunState.SUSPENDED, evidence(resume_decision=None)), TransitionDecision.HOLD_REQUIRED)
    def test_dk_c_r19_resume_duplicate_prohibition_preserved(self): self.assertEqual(recovery_decision(RunState.SUSPENDED, evidence(resume_decision=ResumeDecision.DUPLICATE_MUTATION_PROHIBITED)), TransitionDecision.DUPLICATE_MUTATION_PROHIBITED)


if __name__ == "__main__": unittest.main()
