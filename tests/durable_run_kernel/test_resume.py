from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from durable_run_kernel.checkpoint import CheckpointLineage, CheckpointRecord, ResumeDecision, ResumeEvidence
from durable_run_kernel.models import (
    CapabilitySnapshot,
    DefinitionIdentity,
    EffectIdentity,
    EffectState,
    ReplayClass,
)
from durable_run_kernel.resume import checkpoint_lineage_decision, evaluate_checkpoint_resume

T0 = datetime(2026, 8, 29, 8, 0, tzinfo=timezone.utc)


def capability(**changes):
    values = dict(
        snapshot_id="cap-1",
        runtime_identity="python",
        runtime_version="3.12",
        available_tools=frozenset({"stdlib"}),
        sandbox_isolation_mode="isolated",
        network_capability_class="none",
        filesystem_capability_class="slice",
        credential_capability_class="none",
        mutation_capability_class="none",
        adapter_version="v1",
        captured_at=T0,
        snapshot_digest="cap-digest",
        model_provider_identity=None,
        mcp_configuration_identity=None,
    )
    values.update(changes)
    return CapabilitySnapshot(**values)


def effect():
    return EffectIdentity(
        logical_mutation_id="m1",
        action_identity="write",
        target_identity="target-1",
        attempt_generation=1,
        attempt_id="effect-attempt-1",
        idempotency_key="idem-1",
        concurrency_token=None,
        target_identity_before="before",
        expected_target_identity_after="after",
        effect_observation_source="source-1",
        reconciliation_evidence_refs=("ev-1",),
    )


def checkpoint(**changes):
    values = dict(
        checkpoint_id="cp-1",
        run_id="run-1",
        node_definition_id="node-1",
        logical_iteration_id="iter-1",
        attempt_id="attempt-1",
        result_reference="result://1",
        result_digest="sha256:abc",
        replay_class=ReplayClass.REPLAYABLE_IMMUTABLE,
        captured_at=T0,
        source_identity="source-1",
        source_version="v1",
        freshness_policy=None,
        definition_identity=DefinitionIdentity("def-1", "digest-1"),
        authority_snapshot_id="auth-1",
        capability_snapshot_id="cap-1",
        effect_identity=None,
        effect_state=None,
        parent_checkpoint_id=None,
        sequence=1,
    )
    values.update(changes)
    return CheckpointRecord(**values)


def evidence(**changes):
    values = dict(
        expected_result_reference="result://1",
        expected_result_digest="sha256:abc",
        active_definition_identity=DefinitionIdentity("def-1", "digest-1"),
        current_authority_evidence_present=True,
        bound_capability_snapshot=capability(),
        observed_capability_snapshot=capability(),
        snapshot_freshness_current=None,
    )
    values.update(changes)
    return ResumeEvidence(**values)


class DurableRunKernelSliceBTests(unittest.TestCase):
    def test_dk_b_r1_immutable_exact_identity_reuse(self):
        self.assertEqual(evaluate_checkpoint_resume(checkpoint(), evidence()), ResumeDecision.ALLOW_REUSE)

    def test_dk_b_r2_immutable_digest_mismatch(self):
        self.assertEqual(
            evaluate_checkpoint_resume(checkpoint(), evidence(expected_result_digest="sha256:other")),
            ResumeDecision.HOLD_REQUIRED,
        )

    def test_dk_b_r3_snapshot_current(self):
        cp = checkpoint(replay_class=ReplayClass.REPLAYABLE_SNAPSHOT)
        self.assertEqual(
            evaluate_checkpoint_resume(cp, evidence(snapshot_freshness_current=True)),
            ResumeDecision.ALLOW_REUSE,
        )

    def test_dk_b_r4_snapshot_stale(self):
        cp = checkpoint(replay_class=ReplayClass.REPLAYABLE_SNAPSHOT)
        self.assertEqual(
            evaluate_checkpoint_resume(cp, evidence(snapshot_freshness_current=False)),
            ResumeDecision.REVALIDATION_REQUIRED,
        )

    def test_dk_b_r5_snapshot_freshness_unknown(self):
        cp = checkpoint(replay_class=ReplayClass.REPLAYABLE_SNAPSHOT)
        self.assertEqual(
            evaluate_checkpoint_resume(cp, evidence(snapshot_freshness_current=None)),
            ResumeDecision.REVALIDATION_REQUIRED,
        )

    def test_dk_b_r6_revalidate_before_use(self):
        cp = checkpoint(replay_class=ReplayClass.REVALIDATE_BEFORE_USE)
        self.assertEqual(evaluate_checkpoint_resume(cp, evidence()), ResumeDecision.REVALIDATION_REQUIRED)

    def test_dk_b_r7_non_replayable_applied_effect(self):
        cp = checkpoint(
            replay_class=ReplayClass.NON_REPLAYABLE_EFFECT,
            effect_identity=effect(),
            effect_state=EffectState.EFFECT_APPLIED,
        )
        self.assertEqual(
            evaluate_checkpoint_resume(cp, evidence()),
            ResumeDecision.DUPLICATE_MUTATION_PROHIBITED,
        )

    def test_dk_b_r8_non_replayable_unknown_effect(self):
        cp = checkpoint(
            replay_class=ReplayClass.NON_REPLAYABLE_EFFECT,
            effect_identity=effect(),
            effect_state=EffectState.EFFECT_UNKNOWN,
        )
        self.assertEqual(
            evaluate_checkpoint_resume(cp, evidence()),
            ResumeDecision.RECONCILIATION_REQUIRED,
        )

    def test_dk_b_r9_definition_digest_mismatch(self):
        self.assertEqual(
            evaluate_checkpoint_resume(
                checkpoint(),
                evidence(active_definition_identity=DefinitionIdentity("def-1", "digest-2")),
            ),
            ResumeDecision.DEFINITION_MISMATCH,
        )

    def test_dk_b_r10_prior_authority_reference_without_current_evidence(self):
        self.assertEqual(
            evaluate_checkpoint_resume(checkpoint(), evidence(current_authority_evidence_present=False)),
            ResumeDecision.REAUTHORIZE_REQUIRED,
        )

    def test_dk_b_r11_capability_drift_on_resume(self):
        observed = capability(snapshot_id="cap-2", snapshot_digest="cap-2", model_provider_identity="provider-b")
        bound = capability(model_provider_identity="provider-a")
        self.assertEqual(
            evaluate_checkpoint_resume(
                checkpoint(),
                evidence(bound_capability_snapshot=bound, observed_capability_snapshot=observed),
            ),
            ResumeDecision.REAUTHORIZE_REQUIRED,
        )

    def test_dk_b_r12_ambiguous_invalid_checkpoint_lineage(self):
        first = checkpoint()
        second = checkpoint(
            checkpoint_id="cp-2",
            attempt_id="attempt-2",
            sequence=2,
            parent_checkpoint_id="not-cp-1",
        )
        self.assertEqual(
            checkpoint_lineage_decision(CheckpointLineage((first, second))),
            ResumeDecision.HOLD_REQUIRED,
        )

    def test_valid_checkpoint_lineage(self):
        first = checkpoint()
        second = checkpoint(
            checkpoint_id="cp-2",
            attempt_id="attempt-2",
            sequence=2,
            parent_checkpoint_id="cp-1",
        )
        self.assertEqual(
            checkpoint_lineage_decision(CheckpointLineage((first, second))),
            ResumeDecision.ALLOW_REUSE,
        )


if __name__ == "__main__":
    unittest.main()
