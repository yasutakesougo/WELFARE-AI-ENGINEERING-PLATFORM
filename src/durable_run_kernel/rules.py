from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional, Sequence

from .models import (
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


def _present(value: Optional[str]) -> bool:
    return value is not None and value != ""


def evaluate_authority(binding: AuthorityBinding, observed: AuthorityObservation) -> AuthorityFreshness:
    if binding.revoked:
        return AuthorityFreshness.REVOKED if _present(binding.revocation_source_ref) else AuthorityFreshness.UNKNOWN
    if binding.superseded:
        return AuthorityFreshness.STALE if _present(binding.supersession_ref) else AuthorityFreshness.UNKNOWN

    if not (_present(binding.target_repository_identity) or _present(binding.target_system_identity)):
        return AuthorityFreshness.UNKNOWN
    if not _present(binding.target_resource_identity):
        return AuthorityFreshness.UNKNOWN
    if not (_present(binding.tool_identity) or _present(binding.tool_class)):
        return AuthorityFreshness.UNKNOWN

    if binding.decision_expires_at is not None:
        if observed.now >= binding.decision_expires_at:
            return AuthorityFreshness.STALE
    elif _present(binding.freshness_policy):
        if observed.freshness_policy_current is None:
            return AuthorityFreshness.UNKNOWN
        if not observed.freshness_policy_current:
            return AuthorityFreshness.STALE
    else:
        return AuthorityFreshness.UNKNOWN

    expected = (
        binding.authority_subject_identity,
        binding.worker_identity,
        binding.run_id,
        binding.target_repository_identity,
        binding.target_system_identity,
        binding.target_resource_identity,
        binding.action_identity,
        binding.operation_class,
        binding.tool_identity,
        binding.tool_class,
        binding.gate_identity,
        binding.scope_identity,
        binding.definition_identity,
        binding.capability_snapshot_id,
        binding.authority_generation,
    )
    actual = (
        observed.authority_subject_identity,
        observed.worker_identity,
        observed.run_id,
        observed.target_repository_identity,
        observed.target_system_identity,
        observed.target_resource_identity,
        observed.action_identity,
        observed.operation_class,
        observed.tool_identity,
        observed.tool_class,
        observed.gate_identity,
        observed.scope_identity,
        observed.definition_identity,
        observed.capability_snapshot_id,
        observed.authority_generation,
    )
    required_actual = (
        observed.authority_subject_identity,
        observed.worker_identity,
        observed.run_id,
        observed.target_resource_identity,
        observed.action_identity,
        observed.operation_class,
        observed.gate_identity,
        observed.scope_identity,
        observed.definition_identity,
        observed.capability_snapshot_id,
    )
    if any(value in (None, "") for value in required_actual):
        return AuthorityFreshness.UNKNOWN
    if not (_present(observed.target_repository_identity) or _present(observed.target_system_identity)):
        return AuthorityFreshness.UNKNOWN
    if not (_present(observed.tool_identity) or _present(observed.tool_class)):
        return AuthorityFreshness.UNKNOWN
    if expected != actual:
        return AuthorityFreshness.STALE
    return AuthorityFreshness.CURRENT


def authority_decision(freshness: AuthorityFreshness) -> Decision:
    if freshness is AuthorityFreshness.CURRENT:
        return Decision.ALLOW_CONTINUE
    if freshness is AuthorityFreshness.REVOKED:
        return Decision.DENY_POLICY
    return Decision.HOLD_REQUIRED


def capability_decision(bound: CapabilitySnapshot, observed: CapabilitySnapshot) -> Decision:
    materially_bound = (
        "runtime_identity",
        "runtime_version",
        "available_tools",
        "sandbox_isolation_mode",
        "network_capability_class",
        "filesystem_capability_class",
        "credential_capability_class",
        "mutation_capability_class",
        "adapter_version",
        "model_provider_identity",
        "mcp_configuration_identity",
    )
    if any(getattr(bound, field) != getattr(observed, field) for field in materially_bound):
        return Decision.REAUTHORIZE_REQUIRED
    if bound.snapshot_id == observed.snapshot_id and bound.snapshot_digest == observed.snapshot_digest:
        return Decision.ALLOW_CONTINUE
    return Decision.HOLD_REQUIRED


def _reconciliation_matches(effect: EffectIdentity, reconciliation: ReconciliationObservation) -> bool:
    return (
        reconciliation.logical_mutation_id == effect.logical_mutation_id
        and reconciliation.target_identity == effect.target_identity
        and reconciliation.attempt_generation == effect.attempt_generation
        and reconciliation.effect_observation_source == effect.effect_observation_source
        and bool(reconciliation.reconciliation_evidence_refs)
        and set(reconciliation.reconciliation_evidence_refs).issubset(set(effect.reconciliation_evidence_refs))
    )


def effect_decision(
    effect: EffectIdentity,
    state: EffectState,
    *,
    reconciliation: Optional[ReconciliationObservation] = None,
) -> Decision:
    if state is EffectState.EFFECT_APPLIED:
        return Decision.DUPLICATE_MUTATION_PROHIBITED
    if state is EffectState.EFFECT_NOT_APPLIED:
        return Decision.REAUTHORIZE_REQUIRED
    if state is EffectState.EFFECT_CONFLICT:
        return Decision.HOLD_REQUIRED
    if state is EffectState.EFFECT_UNKNOWN:
        if reconciliation is None or not _reconciliation_matches(effect, reconciliation):
            return Decision.RECONCILIATION_REQUIRED
        if reconciliation.reconciled_state is EffectState.EFFECT_APPLIED:
            return Decision.DUPLICATE_MUTATION_PROHIBITED
        if reconciliation.reconciled_state is EffectState.EFFECT_NOT_APPLIED:
            return Decision.REAUTHORIZE_REQUIRED
        return Decision.HOLD_REQUIRED
    return Decision.ALLOW_CONTINUE


def lease_write_decision(
    lease: Lease,
    *,
    now: datetime,
    presented_owner_id: str,
    presented_fence_token: int,
    current_fence_token: int,
) -> Decision:
    if now >= lease.lease_expires_at:
        return Decision.STALE_LEASE_REJECTED
    if presented_owner_id != lease.lease_owner_id:
        return Decision.STALE_LEASE_REJECTED
    if presented_fence_token != lease.fence_token:
        return Decision.STALE_LEASE_REJECTED
    if presented_fence_token < current_fence_token:
        return Decision.STALE_LEASE_REJECTED
    return Decision.ALLOW_CONTINUE


def _subset(child: Iterable[str], parent: Iterable[str]) -> bool:
    return set(child).issubset(set(parent))


def child_authority_decision(parent: AuthorityEnvelope, child: AuthorityEnvelope) -> Decision:
    dimensions = (
        (child.repository_scope, parent.repository_scope),
        (child.target_scope, parent.target_scope),
        (child.action_scope, parent.action_scope),
        (child.tool_scope, parent.tool_scope),
        (child.network_scope, parent.network_scope),
        (child.credential_scope, parent.credential_scope),
        (child.write_scope, parent.write_scope),
        (child.capability_scope, parent.capability_scope),
    )
    if (
        child.budget_ceiling is None
        or parent.budget_ceiling is None
        or child.valid_until is None
        or parent.valid_until is None
        or any(child_set is None or parent_set is None for child_set, parent_set in dimensions)
    ):
        return Decision.HOLD_REQUIRED
    if child.budget_ceiling > parent.budget_ceiling or child.valid_until > parent.valid_until:
        return Decision.REAUTHORIZE_REQUIRED
    if all(_subset(child_set, parent_set) for child_set, parent_set in dimensions):
        return Decision.ALLOW_CONTINUE
    return Decision.REAUTHORIZE_REQUIRED


def replay_decision(
    replay_class: ReplayClass,
    *,
    snapshot_current: bool = True,
    prior_effect_applied: bool = False,
) -> Decision:
    if replay_class is ReplayClass.REPLAYABLE_IMMUTABLE:
        return Decision.ALLOW_CONTINUE
    if replay_class is ReplayClass.REPLAYABLE_SNAPSHOT:
        return Decision.ALLOW_CONTINUE if snapshot_current else Decision.REVALIDATION_REQUIRED
    if replay_class is ReplayClass.REVALIDATE_BEFORE_USE:
        return Decision.REVALIDATION_REQUIRED
    if prior_effect_applied:
        return Decision.DUPLICATE_MUTATION_PROHIBITED
    return Decision.RECONCILIATION_REQUIRED


def definition_decision(active: DefinitionIdentity, observed: DefinitionIdentity) -> Decision:
    if active.identity == observed.identity and active.digest == observed.digest:
        return Decision.ALLOW_CONTINUE
    return Decision.DEFINITION_MISMATCH


def persistence_decision(classification: PersistabilityClass) -> Decision:
    if classification is PersistabilityClass.PROHIBITED_RAW_DATA:
        return Decision.PERSISTENCE_REJECTED
    return Decision.ALLOW_CONTINUE


def ledger_history_decision(records: Sequence[LedgerRecord]) -> Decision:
    seen_ids = set()
    previous_sequence = None
    for record in records:
        if not record.record_id or record.record_id in seen_ids:
            return Decision.HOLD_REQUIRED
        if previous_sequence is not None and record.sequence <= previous_sequence:
            return Decision.HOLD_REQUIRED
        for linked_id in (
            record.corrects_record_id,
            record.supersedes_record_id,
            record.reconciles_record_id,
        ):
            if linked_id is not None and linked_id not in seen_ids:
                return Decision.HOLD_REQUIRED
        seen_ids.add(record.record_id)
        previous_sequence = record.sequence
    return Decision.ALLOW_CONTINUE
