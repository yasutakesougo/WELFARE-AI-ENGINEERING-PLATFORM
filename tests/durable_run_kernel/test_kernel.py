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
    EffectIdentity,
    EffectState,
    Lease,
    LedgerRecord,
    PersistabilityClass,
    ReconciliationObservation,
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
    ledger_history_decision,
    persistence_decision,
    replay_decision,
)

T0 = datetime(2026, 8, 29, 4, 0, tzinfo=timezone.utc)


def binding(**changes):
    values = dict(
        binding_id="b1",
        authority_decision_id="a1",
        authority_subject_identity="human-1",
        worker_identity="worker-1",
        run_id="run-1",
        target_repository_identity="repo@sha1",
        target_system_identity=None,
        target_resource_identity="src/durable_run_kernel/**",
        action_identity="validate",
        operation_class="PURE_DOMAIN",
        tool_identity="python",
        tool_class=None,
        gate_identity="impl-start-1",
        scope_identity="DARK-IMPL-SLICE-A",
        definition_identity="WAEP-DURABLE-AGENT-RUN-KERNEL-V1",
        capability_snapshot_id="cap-1",
        decision_issued_at=T0,
        decision_expires_at=T0 + timedelta(hours=1),
        freshness_policy=None,
        authority_generation=1,
    )
    values.update(changes)
    return AuthorityBinding(**values)


def observation(**changes):
    values = dict(
        now=T0 + timedelta(minutes=1),
        authority_subject_identity="human-1",
        worker_identity="worker-1",
        run_id="run-1",
        target_repository_identity="repo@sha1",
        target_system_identity=None,
        target_resource_identity="src/durable_run_kernel/**",
        action_identity="validate",
        operation_class="PURE_DOMAIN",
        tool_identity="python",
        tool_class=None,
        gate_identity="impl-start-1",
        scope_identity="DARK-IMPL-SLICE-A",
        definition_identity="WAEP-DURABLE-AGENT-RUN-KERNEL-V1",
        capability_snapshot_id="cap-1",
        authority_generation=1,
    )
    values.update(changes)
    return AuthorityObservation(**values)


def effect(**changes):
    values = dict(
        logical_mutation_id="m1",
        action_identity="write",
        target_identity="target-1",
        attempt_generation=1,
        attempt_id="attempt-1",
        idempotency_key="idem-1",
        concurrency_token=None,
        target_identity_before="before-1",
        expected_target_identity_after="after-1",
        effect_observation_source="source-1",
        reconciliation_evidence_refs=("evidence-1",),
    )
    values.update(changes)
    return EffectIdentity(**values)


def envelope(**changes):
    values = dict(
        repository_scope=frozenset({"r"}),
        target_scope=frozenset({"t"}),
        action_scope=frozenset({"read"}),
        tool_scope=frozenset({"python"}),
        network_scope=frozenset(),
        credential_scope=frozenset(),
        write_scope=frozenset(),
        budget_ceiling=10,
        valid_until=T0 + timedelta(hours=1),
        capability_scope=frozenset({"pure"}),
    )
    values.update(changes)
    return AuthorityEnvelope(**values)


class DurableRunKernelTests(unittest.TestCase):
    def test_dk_r1_stale_authority_on_retry_holds(self):
        state = evaluate_authority(binding(), observation(now=T0 + timedelta(hours=2)))
        self.assertEqual(state, AuthorityFreshness.STALE)
        self.assertEqual(authority_decision(state), Decision.HOLD_REQUIRED)

    def test_dk_r2_revoked_authority_is_policy_denial_with_evidence(self):
        state = evaluate_authority(binding(revoked=True, revocation_source_ref="rev-1"), observation())
        self.assertEqual(state, AuthorityFreshness.REVOKED)
        self.assertEqual(authority_decision(state), Decision.DENY_POLICY)

    def test_revoked_without_evidence_fails_unknown(self):
        self.assertEqual(evaluate_authority(binding(revoked=True), observation()), AuthorityFreshness.UNKNOWN)

    def test_dk_r3_target_change_invalidates_prior_authority(self):
        self.assertEqual(
            evaluate_authority(binding(), observation(target_repository_identity="repo@sha2")),
            AuthorityFreshness.STALE,
        )

    def test_target_resource_change_invalidates_prior_authority(self):
        self.assertEqual(
            evaluate_authority(binding(), observation(target_resource_identity="tests/**")),
            AuthorityFreshness.STALE,
        )

    def test_freshness_policy_unobserved_fails_unknown(self):
        state = evaluate_authority(
            binding(decision_expires_at=None, freshness_policy="CURRENT_GATE"),
            observation(freshness_policy_current=None),
        )
        self.assertEqual(state, AuthorityFreshness.UNKNOWN)

    def test_dk_r4_effect_unknown_never_auto_retries(self):
        self.assertEqual(
            effect_decision(effect(), EffectState.EFFECT_UNKNOWN),
            Decision.RECONCILIATION_REQUIRED,
        )

    def test_dk_r5_evidence_backed_reconciliation_proves_applied(self):
        reconciled = ReconciliationObservation(
            "m1", "target-1", 1, "source-1", ("evidence-1",), EffectState.EFFECT_APPLIED
        )
        self.assertEqual(
            effect_decision(effect(), EffectState.EFFECT_UNKNOWN, reconciliation=reconciled),
            Decision.DUPLICATE_MUTATION_PROHIBITED,
        )

    def test_mismatched_reconciliation_cannot_prove_applied(self):
        mismatched = ReconciliationObservation(
            "m-other", "target-1", 1, "source-1", ("evidence-1",), EffectState.EFFECT_APPLIED
        )
        self.assertEqual(
            effect_decision(effect(), EffectState.EFFECT_UNKNOWN, reconciliation=mismatched),
            Decision.RECONCILIATION_REQUIRED,
        )

    def test_missing_reconciliation_evidence_cannot_prove_applied(self):
        missing = ReconciliationObservation(
            "m1", "target-1", 1, "source-1", (), EffectState.EFFECT_APPLIED
        )
        self.assertEqual(
            effect_decision(effect(), EffectState.EFFECT_UNKNOWN, reconciliation=missing),
            Decision.RECONCILIATION_REQUIRED,
        )

    def test_dk_r6_stale_lease_owner_checkpoint_rejected(self):
        lease = Lease("l1", "owner-new", "acq", T0, T0 + timedelta(hours=1), None, 2)
        self.assertEqual(
            lease_write_decision(
                lease,
                now=T0,
                presented_owner_id="owner-old",
                presented_fence_token=1,
                current_fence_token=2,
            ),
            Decision.STALE_LEASE_REJECTED,
        )

    def test_lease_exact_expiry_is_rejected(self):
        lease = Lease("l1", "owner", "acq", T0, T0 + timedelta(hours=1), None, 2)
        self.assertEqual(
            lease_write_decision(
                lease,
                now=lease.lease_expires_at,
                presented_owner_id="owner",
                presented_fence_token=2,
                current_fence_token=2,
            ),
            Decision.STALE_LEASE_REJECTED,
        )

    def test_dk_r7_child_cannot_broaden_scope(self):
        child = envelope(action_scope=frozenset({"read", "write"}), write_scope=frozenset({"write"}))
        self.assertEqual(child_authority_decision(envelope(), child), Decision.REAUTHORIZE_REQUIRED)

    def test_child_unknown_scope_proof_holds(self):
        child = envelope(tool_scope=None)
        self.assertEqual(child_authority_decision(envelope(), child), Decision.HOLD_REQUIRED)

    def test_dk_r8_material_capability_drift_reauthorizes(self):
        a = CapabilitySnapshot(
            "cap-1", "python", "3.12", frozenset({"stdlib"}), "isolated", "none", "slice",
            "none", "none", "v1", T0, "d1", model_provider_identity="model-a"
        )
        b = CapabilitySnapshot(
            "cap-2", "python", "3.12", frozenset({"stdlib"}), "isolated", "none", "slice",
            "none", "none", "v1", T0, "d2", model_provider_identity="model-b"
        )
        self.assertEqual(capability_decision(a, b), Decision.REAUTHORIZE_REQUIRED)

    def test_mcp_configuration_drift_reauthorizes(self):
        a = CapabilitySnapshot(
            "cap-1", "python", "3.12", frozenset({"stdlib"}), "isolated", "none", "slice",
            "none", "none", "v1", T0, "d1", mcp_configuration_identity="mcp-a"
        )
        b = CapabilitySnapshot(
            "cap-2", "python", "3.12", frozenset({"stdlib"}), "isolated", "none", "slice",
            "none", "none", "v1", T0, "d2", mcp_configuration_identity="mcp-b"
        )
        self.assertEqual(capability_decision(a, b), Decision.REAUTHORIZE_REQUIRED)

    def test_same_snapshot_identity_cannot_hide_material_drift(self):
        a = CapabilitySnapshot(
            "cap-1", "python", "3.12", frozenset({"stdlib"}), "isolated", "none", "slice",
            "none", "none", "v1", T0, "same", model_provider_identity="model-a"
        )
        b = CapabilitySnapshot(
            "cap-1", "python", "3.12", frozenset({"stdlib"}), "isolated", "none", "slice",
            "none", "none", "v1", T0, "same", model_provider_identity="model-b"
        )
        self.assertEqual(capability_decision(a, b), Decision.REAUTHORIZE_REQUIRED)

    def test_dk_r9_prohibited_raw_data_is_rejected(self):
        self.assertEqual(
            persistence_decision(PersistabilityClass.PROHIBITED_RAW_DATA),
            Decision.PERSISTENCE_REJECTED,
        )

    def test_dk_r10_definition_digest_mismatch_holds(self):
        self.assertEqual(
            definition_decision(DefinitionIdentity("d", "sha1"), DefinitionIdentity("d", "sha2")),
            Decision.DEFINITION_MISMATCH,
        )

    def test_dk_r11_immutable_replay_reuses_without_reexecution_signal(self):
        self.assertEqual(
            replay_decision(ReplayClass.REPLAYABLE_IMMUTABLE),
            Decision.ALLOW_CONTINUE,
        )

    def test_dk_r12_stale_snapshot_requires_revalidation(self):
        self.assertEqual(
            replay_decision(ReplayClass.REPLAYABLE_SNAPSHOT, snapshot_current=False),
            Decision.REVALIDATION_REQUIRED,
        )

    def test_dk_r13_deny_is_not_runtime_retry(self):
        self.assertEqual(authority_decision(AuthorityFreshness.REVOKED), Decision.DENY_POLICY)

    def test_dk_r14_append_only_history_preserves_prior_failure(self):
        records = (
            LedgerRecord("1", 1, "ATTEMPT_FAILED", "f"),
            LedgerRecord("2", 2, "ATTEMPT_SUCCEEDED", "s", supersedes_record_id="1"),
        )
        self.assertEqual(ledger_history_decision(records), Decision.ALLOW_CONTINUE)
        self.assertEqual([r.kind for r in records], ["ATTEMPT_FAILED", "ATTEMPT_SUCCEEDED"])

    def test_ledger_non_monotonic_sequence_holds(self):
        records = (
            LedgerRecord("1", 2, "FAILED", "f"),
            LedgerRecord("2", 2, "SUCCEEDED", "s"),
        )
        self.assertEqual(ledger_history_decision(records), Decision.HOLD_REQUIRED)

    def test_ledger_forward_correction_link_holds(self):
        records = (
            LedgerRecord("1", 1, "CORRECTION", "c", corrects_record_id="future"),
            LedgerRecord("future", 2, "FAILED", "f"),
        )
        self.assertEqual(ledger_history_decision(records), Decision.HOLD_REQUIRED)

    def test_unknown_binding_fails_closed(self):
        state = evaluate_authority(binding(), observation(tool_identity="", tool_class=None))
        self.assertEqual(state, AuthorityFreshness.UNKNOWN)
        self.assertEqual(authority_decision(state), Decision.HOLD_REQUIRED)


if __name__ == "__main__":
    unittest.main()
