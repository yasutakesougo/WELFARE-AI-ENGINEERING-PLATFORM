from __future__ import annotations

import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from durable_run_kernel.models import (
    AuthorityBinding,
    AuthorityEnvelope,
    AuthorityFreshness,
    AuthorityObservation,
    CapabilitySnapshot,
    Decision,
    DefinitionIdentity,
    EffectState,
    Lease,
    PersistabilityClass,
    ReplayClass,
)
from durable_run_kernel.rules import (
    authority_decision,
    capability_decision,
    child_authority_decision,
    definition_decision,
    effect_decision,
    evaluate_authority,
    lease_write_decision,
    persistence_decision,
    replay_decision,
)

T0 = datetime(2026, 8, 29, 4, 0, tzinfo=timezone.utc)


def binding(**changes):
    values = dict(
        binding_id="b1", authority_decision_id="a1", authority_subject_identity="human-1",
        worker_identity="worker-1", run_id="run-1", target_identity="repo@sha1",
        action_identity="validate", operation_class="PURE_DOMAIN", tool_identity="python",
        gate_identity="impl-start-1", scope_identity="DARK-IMPL-SLICE-A",
        definition_identity="WAEP-DURABLE-AGENT-RUN-KERNEL-V1", capability_snapshot_id="cap-1",
        decision_issued_at=T0, decision_expires_at=T0 + timedelta(hours=1), authority_generation=1,
    )
    values.update(changes)
    return AuthorityBinding(**values)


def observation(**changes):
    values = dict(
        now=T0 + timedelta(minutes=1), authority_subject_identity="human-1", worker_identity="worker-1",
        run_id="run-1", target_identity="repo@sha1", action_identity="validate",
        operation_class="PURE_DOMAIN", tool_identity="python", gate_identity="impl-start-1",
        scope_identity="DARK-IMPL-SLICE-A", definition_identity="WAEP-DURABLE-AGENT-RUN-KERNEL-V1",
        capability_snapshot_id="cap-1", authority_generation=1,
    )
    values.update(changes)
    return AuthorityObservation(**values)


class DurableRunKernelTests(unittest.TestCase):
    def test_dk_r1_stale_authority_on_retry_holds(self):
        state = evaluate_authority(binding(), observation(now=T0 + timedelta(hours=2)))
        self.assertEqual(state, AuthorityFreshness.STALE)
        self.assertEqual(authority_decision(state), Decision.HOLD_REQUIRED)

    def test_dk_r2_revoked_authority_is_policy_denial(self):
        state = evaluate_authority(binding(revoked=True), observation())
        self.assertEqual(authority_decision(state), Decision.DENY_POLICY)

    def test_dk_r3_target_change_invalidates_prior_authority(self):
        self.assertEqual(evaluate_authority(binding(), observation(target_identity="repo@sha2")), AuthorityFreshness.STALE)

    def test_dk_r4_effect_unknown_never_auto_retries(self):
        self.assertEqual(effect_decision(EffectState.EFFECT_UNKNOWN), Decision.RECONCILIATION_REQUIRED)

    def test_dk_r5_already_applied_blocks_duplicate(self):
        self.assertEqual(effect_decision(EffectState.EFFECT_APPLIED), Decision.DUPLICATE_MUTATION_PROHIBITED)

    def test_dk_r6_stale_lease_owner_checkpoint_rejected(self):
        lease = Lease("l1", "owner-new", "acq", T0, T0 + timedelta(hours=1), None, 2)
        self.assertEqual(lease_write_decision(lease, now=T0, presented_owner_id="owner-old", presented_fence_token=1, current_fence_token=2), Decision.STALE_LEASE_REJECTED)

    def test_dk_r7_child_cannot_broaden_scope(self):
        parent = AuthorityEnvelope(frozenset({"r"}), frozenset({"t"}), frozenset({"read"}), frozenset({"python"}), frozenset(), frozenset(), frozenset(), 10, T0 + timedelta(hours=1), frozenset({"pure"}))
        child = AuthorityEnvelope(frozenset({"r"}), frozenset({"t"}), frozenset({"read", "write"}), frozenset({"python"}), frozenset(), frozenset(), frozenset({"write"}), 10, T0 + timedelta(hours=1), frozenset({"pure"}))
        self.assertEqual(child_authority_decision(parent, child), Decision.REAUTHORIZE_REQUIRED)

    def test_dk_r8_material_capability_drift_reauthorizes(self):
        a = CapabilitySnapshot("cap-1", "python", "3.12", frozenset({"stdlib"}), "isolated", "none", "slice", "none", "none", "v1", T0, "d1")
        b = CapabilitySnapshot("cap-2", "python", "3.12", frozenset({"stdlib", "network"}), "isolated", "enabled", "slice", "none", "none", "v1", T0, "d2")
        self.assertEqual(capability_decision(a, b), Decision.REAUTHORIZE_REQUIRED)

    def test_dk_r9_prohibited_raw_data_is_rejected(self):
        self.assertEqual(persistence_decision(PersistabilityClass.PROHIBITED_RAW_DATA), Decision.PERSISTENCE_REJECTED)

    def test_dk_r10_definition_digest_mismatch_holds(self):
        self.assertEqual(definition_decision(DefinitionIdentity("d", "sha1"), DefinitionIdentity("d", "sha2")), Decision.DEFINITION_MISMATCH)

    def test_dk_r11_immutable_replay_reuses_without_reexecution_signal(self):
        self.assertEqual(replay_decision(ReplayClass.REPLAYABLE_IMMUTABLE), Decision.ALLOW_CONTINUE)

    def test_dk_r12_stale_snapshot_requires_revalidation(self):
        self.assertEqual(replay_decision(ReplayClass.REPLAYABLE_SNAPSHOT, snapshot_current=False), Decision.REVALIDATION_REQUIRED)

    def test_dk_r13_deny_is_not_runtime_retry(self):
        self.assertEqual(authority_decision(AuthorityFreshness.REVOKED), Decision.DENY_POLICY)

    def test_dk_r14_history_model_can_retain_failed_and_success_records(self):
        from durable_run_kernel.models import LedgerRecord
        records = (
            LedgerRecord("1", 1, "ATTEMPT_FAILED", "f"),
            LedgerRecord("2", 2, "ATTEMPT_SUCCEEDED", "s", supersedes_record_id=None),
        )
        self.assertEqual([r.kind for r in records], ["ATTEMPT_FAILED", "ATTEMPT_SUCCEEDED"])

    def test_unknown_binding_fails_closed(self):
        state = evaluate_authority(binding(), observation(tool_identity=""))
        self.assertEqual(state, AuthorityFreshness.UNKNOWN)
        self.assertEqual(authority_decision(state), Decision.HOLD_REQUIRED)


if __name__ == "__main__":
    unittest.main()
