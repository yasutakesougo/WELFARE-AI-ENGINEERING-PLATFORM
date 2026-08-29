from __future__ import annotations

from datetime import datetime
from typing import Iterable

from .models import (
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


def evaluate_authority(binding: AuthorityBinding, observed: AuthorityObservation) -> AuthorityFreshness:
    if binding.revoked:
        return AuthorityFreshness.REVOKED
    if binding.superseded:
        return AuthorityFreshness.STALE
    if binding.decision_expires_at is not None and observed.now > binding.decision_expires_at:
        return AuthorityFreshness.STALE

    expected = (
        binding.authority_subject_identity,
        binding.worker_identity,
        binding.run_id,
        binding.target_identity,
        binding.action_identity,
        binding.operation_class,
        binding.tool_identity,
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
        observed.target_identity,
        observed.action_identity,
        observed.operation_class,
        observed.tool_identity,
        observed.gate_identity,
        observed.scope_identity,
        observed.definition_identity,
        observed.capability_snapshot_id,
        observed.authority_generation,
    )
    if any(value in (None, "") for value in actual[:-1]):
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
    if bound.snapshot_id == observed.snapshot_id and bound.snapshot_digest == observed.snapshot_digest:
        return Decision.ALLOW_CONTINUE
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
    )
    if any(getattr(bound, field) != getattr(observed, field) for field in materially_bound):
        return Decision.REAUTHORIZE_REQUIRED
    return Decision.HOLD_REQUIRED


def effect_decision(state: EffectState, *, reconciliation_proves_applied: bool = False) -> Decision:
    if state is EffectState.EFFECT_UNKNOWN:
        return Decision.RECONCILIATION_REQUIRED
    if state is EffectState.EFFECT_APPLIED or reconciliation_proves_applied:
        return Decision.DUPLICATE_MUTATION_PROHIBITED
    if state is EffectState.EFFECT_NOT_APPLIED:
        return Decision.REAUTHORIZE_REQUIRED
    if state is EffectState.EFFECT_CONFLICT:
        return Decision.HOLD_REQUIRED
    return Decision.ALLOW_CONTINUE


def lease_write_decision(lease: Lease, *, now: datetime, presented_owner_id: str, presented_fence_token: int, current_fence_token: int) -> Decision:
    if now > lease.lease_expires_at:
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
    if child.budget_ceiling > parent.budget_ceiling or child.valid_until > parent.valid_until:
        return Decision.REAUTHORIZE_REQUIRED
    subset_pairs = (
        (child.repository_scope, parent.repository_scope),
        (child.target_scope, parent.target_scope),
        (child.action_scope, parent.action_scope),
        (child.tool_scope, parent.tool_scope),
        (child.network_scope, parent.network_scope),
        (child.credential_scope, parent.credential_scope),
        (child.write_scope, parent.write_scope),
        (child.capability_scope, parent.capability_scope),
    )
    if all(_subset(child_set, parent_set) for child_set, parent_set in subset_pairs):
        return Decision.ALLOW_CONTINUE
    return Decision.REAUTHORIZE_REQUIRED


def replay_decision(replay_class: ReplayClass, *, snapshot_current: bool = True, prior_effect_applied: bool = False) -> Decision:
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
