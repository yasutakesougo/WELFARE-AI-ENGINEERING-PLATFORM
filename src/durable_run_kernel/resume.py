from __future__ import annotations

from typing import Optional

from .checkpoint import CheckpointLineage, CheckpointRecord, ResumeDecision, ResumeEvidence
from .models import AuthorityFreshness, Decision, EffectState, ReconciliationObservation, ReplayClass
from .rules import capability_decision, effect_decision


def _complete_identity(checkpoint: CheckpointRecord) -> bool:
    required = (
        checkpoint.checkpoint_id,
        checkpoint.run_id,
        checkpoint.node_definition_id,
        checkpoint.logical_iteration_id,
        checkpoint.attempt_id,
        checkpoint.result_reference,
        checkpoint.result_digest,
        checkpoint.source_identity,
        checkpoint.source_version,
        checkpoint.definition_identity.identity,
        checkpoint.definition_identity.digest,
        checkpoint.authority_snapshot_id,
        checkpoint.capability_snapshot_id,
    )
    return checkpoint.sequence > 0 and all(value not in (None, "") for value in required)


def _map_effect_decision(decision: Decision) -> ResumeDecision:
    mapping = {
        Decision.DUPLICATE_MUTATION_PROHIBITED: ResumeDecision.DUPLICATE_MUTATION_PROHIBITED,
        Decision.REAUTHORIZE_REQUIRED: ResumeDecision.REAUTHORIZE_REQUIRED,
        Decision.RECONCILIATION_REQUIRED: ResumeDecision.RECONCILIATION_REQUIRED,
        Decision.HOLD_REQUIRED: ResumeDecision.HOLD_REQUIRED,
        Decision.ALLOW_CONTINUE: ResumeDecision.HOLD_REQUIRED,
    }
    return mapping.get(decision, ResumeDecision.HOLD_REQUIRED)


def _effect_resume_decision(
    checkpoint: CheckpointRecord,
    reconciliation: Optional[ReconciliationObservation],
) -> Optional[ResumeDecision]:
    if checkpoint.replay_class is not ReplayClass.NON_REPLAYABLE_EFFECT:
        return None
    if checkpoint.effect_identity is None or checkpoint.effect_state is None:
        return ResumeDecision.HOLD_REQUIRED
    if checkpoint.effect_state is EffectState.EFFECT_IN_FLIGHT:
        return ResumeDecision.HOLD_REQUIRED
    decision = effect_decision(
        checkpoint.effect_identity,
        checkpoint.effect_state,
        reconciliation=reconciliation,
    )
    mapped = _map_effect_decision(decision)
    if mapped in (
        ResumeDecision.DUPLICATE_MUTATION_PROHIBITED,
        ResumeDecision.RECONCILIATION_REQUIRED,
        ResumeDecision.HOLD_REQUIRED,
    ):
        return mapped
    return None


def evaluate_checkpoint_resume(
    checkpoint: CheckpointRecord,
    evidence: ResumeEvidence,
    *,
    reconciliation: Optional[ReconciliationObservation] = None,
) -> ResumeDecision:
    if not _complete_identity(checkpoint):
        return ResumeDecision.HOLD_REQUIRED

    active = evidence.active_definition_identity
    bound = checkpoint.definition_identity
    if active.identity != bound.identity or active.digest != bound.digest:
        return ResumeDecision.DEFINITION_MISMATCH

    if checkpoint.result_reference != evidence.expected_result_reference:
        return ResumeDecision.HOLD_REQUIRED
    if checkpoint.result_digest != evidence.expected_result_digest:
        return ResumeDecision.HOLD_REQUIRED

    effect_safety = _effect_resume_decision(checkpoint, reconciliation)
    if effect_safety is not None:
        return effect_safety

    if not evidence.current_authority_snapshot_id:
        return ResumeDecision.REAUTHORIZE_REQUIRED
    if evidence.current_authority_freshness is not AuthorityFreshness.CURRENT:
        return ResumeDecision.REAUTHORIZE_REQUIRED

    if checkpoint.capability_snapshot_id != evidence.bound_capability_snapshot.snapshot_id:
        return ResumeDecision.HOLD_REQUIRED

    capability = capability_decision(
        evidence.bound_capability_snapshot,
        evidence.observed_capability_snapshot,
    )
    if capability is Decision.REAUTHORIZE_REQUIRED:
        return ResumeDecision.REAUTHORIZE_REQUIRED
    if capability is not Decision.ALLOW_CONTINUE:
        return ResumeDecision.HOLD_REQUIRED

    if checkpoint.replay_class is ReplayClass.REPLAYABLE_IMMUTABLE:
        return ResumeDecision.ALLOW_REUSE

    if checkpoint.replay_class is ReplayClass.REPLAYABLE_SNAPSHOT:
        if evidence.snapshot_freshness_current is True:
            return ResumeDecision.ALLOW_REUSE
        return ResumeDecision.REVALIDATION_REQUIRED

    if checkpoint.replay_class is ReplayClass.REVALIDATE_BEFORE_USE:
        return ResumeDecision.REVALIDATION_REQUIRED

    if checkpoint.replay_class is ReplayClass.NON_REPLAYABLE_EFFECT:
        return ResumeDecision.REAUTHORIZE_REQUIRED

    return ResumeDecision.HOLD_REQUIRED


def checkpoint_lineage_decision(lineage: CheckpointLineage) -> ResumeDecision:
    records = lineage.records
    if not records:
        return ResumeDecision.HOLD_REQUIRED

    seen_checkpoint_ids = set()
    seen_attempt_ids = set()
    run_id = records[0].run_id
    previous = None

    for record in records:
        if not _complete_identity(record):
            return ResumeDecision.HOLD_REQUIRED
        if record.run_id != run_id:
            return ResumeDecision.HOLD_REQUIRED
        if record.checkpoint_id in seen_checkpoint_ids:
            return ResumeDecision.HOLD_REQUIRED
        if record.attempt_id in seen_attempt_ids:
            return ResumeDecision.HOLD_REQUIRED

        if previous is None:
            if record.parent_checkpoint_id is not None:
                return ResumeDecision.HOLD_REQUIRED
        else:
            if record.sequence <= previous.sequence:
                return ResumeDecision.HOLD_REQUIRED
            if record.parent_checkpoint_id != previous.checkpoint_id:
                return ResumeDecision.HOLD_REQUIRED

        seen_checkpoint_ids.add(record.checkpoint_id)
        seen_attempt_ids.add(record.attempt_id)
        previous = record

    return ResumeDecision.ALLOW_REUSE
