from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import FrozenSet, Optional, Tuple


class AuthorityFreshness(str, Enum):
    CURRENT = "CURRENT"
    STALE = "STALE"
    REVOKED = "REVOKED"
    UNKNOWN = "UNKNOWN"


class Decision(str, Enum):
    ALLOW_CONTINUE = "ALLOW_CONTINUE"
    HOLD_REQUIRED = "HOLD_REQUIRED"
    DENY_POLICY = "DENY_POLICY"
    REAUTHORIZE_REQUIRED = "REAUTHORIZE_REQUIRED"
    RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED"
    REVALIDATION_REQUIRED = "REVALIDATION_REQUIRED"
    DUPLICATE_MUTATION_PROHIBITED = "DUPLICATE_MUTATION_PROHIBITED"
    STALE_LEASE_REJECTED = "STALE_LEASE_REJECTED"
    DEFINITION_MISMATCH = "DEFINITION_MISMATCH"
    PERSISTENCE_REJECTED = "PERSISTENCE_REJECTED"


class EffectState(str, Enum):
    EFFECT_NOT_STARTED = "EFFECT_NOT_STARTED"
    EFFECT_IN_FLIGHT = "EFFECT_IN_FLIGHT"
    EFFECT_APPLIED = "EFFECT_APPLIED"
    EFFECT_NOT_APPLIED = "EFFECT_NOT_APPLIED"
    EFFECT_CONFLICT = "EFFECT_CONFLICT"
    EFFECT_UNKNOWN = "EFFECT_UNKNOWN"


class ReplayClass(str, Enum):
    REPLAYABLE_IMMUTABLE = "REPLAYABLE_IMMUTABLE"
    REPLAYABLE_SNAPSHOT = "REPLAYABLE_SNAPSHOT"
    REVALIDATE_BEFORE_USE = "REVALIDATE_BEFORE_USE"
    NON_REPLAYABLE_EFFECT = "NON_REPLAYABLE_EFFECT"


class PersistabilityClass(str, Enum):
    PROHIBITED_RAW_DATA = "PROHIBITED_RAW_DATA"
    REDACTED_DERIVED_EVIDENCE = "REDACTED_DERIVED_EVIDENCE"
    REFERENCE_ONLY = "REFERENCE_ONLY"
    SAFE_STRUCTURED_METADATA = "SAFE_STRUCTURED_METADATA"


class RunState(str, Enum):
    PENDING = "PENDING"
    AUTHORIZED = "AUTHORIZED"
    RUNNING = "RUNNING"
    WAITING_HUMAN = "WAITING_HUMAN"
    WAITING_CALLBACK = "WAITING_CALLBACK"
    SUSPENDED = "SUSPENDED"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    DENIED = "DENIED"
    CANCELLED = "CANCELLED"
    UNKNOWN = "UNKNOWN"


@dataclass(frozen=True)
class AuthorityBinding:
    binding_id: str
    authority_decision_id: str
    authority_subject_identity: str
    worker_identity: str
    run_id: str
    target_identity: str
    action_identity: str
    operation_class: str
    tool_identity: str
    gate_identity: str
    scope_identity: str
    definition_identity: str
    capability_snapshot_id: str
    decision_issued_at: datetime
    decision_expires_at: Optional[datetime]
    authority_generation: int
    revoked: bool = False
    superseded: bool = False


@dataclass(frozen=True)
class AuthorityObservation:
    now: datetime
    authority_subject_identity: str
    worker_identity: str
    run_id: str
    target_identity: str
    action_identity: str
    operation_class: str
    tool_identity: str
    gate_identity: str
    scope_identity: str
    definition_identity: str
    capability_snapshot_id: str
    authority_generation: int


@dataclass(frozen=True)
class CapabilitySnapshot:
    snapshot_id: str
    runtime_identity: str
    runtime_version: str
    available_tools: FrozenSet[str]
    sandbox_isolation_mode: str
    network_capability_class: str
    filesystem_capability_class: str
    credential_capability_class: str
    mutation_capability_class: str
    adapter_version: str
    captured_at: datetime
    snapshot_digest: str


@dataclass(frozen=True)
class EffectIdentity:
    logical_mutation_id: str
    action_identity: str
    target_identity: str
    attempt_generation: int
    attempt_id: str
    idempotency_key: Optional[str]
    concurrency_token: Optional[str]
    target_identity_before: str
    expected_target_identity_after: str
    effect_observation_source: str
    reconciliation_evidence_refs: Tuple[str, ...] = ()


@dataclass(frozen=True)
class Lease:
    lease_id: str
    lease_owner_id: str
    lease_acquisition_id: str
    lease_acquired_at: datetime
    lease_expires_at: datetime
    lease_renewed_at: Optional[datetime]
    fence_token: int


@dataclass(frozen=True)
class AuthorityEnvelope:
    repository_scope: FrozenSet[str]
    target_scope: FrozenSet[str]
    action_scope: FrozenSet[str]
    tool_scope: FrozenSet[str]
    network_scope: FrozenSet[str]
    credential_scope: FrozenSet[str]
    write_scope: FrozenSet[str]
    budget_ceiling: int
    valid_until: datetime
    capability_scope: FrozenSet[str]


@dataclass(frozen=True)
class DefinitionIdentity:
    identity: str
    digest: str


@dataclass(frozen=True)
class LedgerRecord:
    record_id: str
    sequence: int
    kind: str
    payload_digest: str
    corrects_record_id: Optional[str] = None
    supersedes_record_id: Optional[str] = None
    reconciles_record_id: Optional[str] = None
