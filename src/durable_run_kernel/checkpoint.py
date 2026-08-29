from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional, Tuple

from .models import CapabilitySnapshot, DefinitionIdentity, EffectIdentity, EffectState, ReplayClass


class ResumeDecision(str, Enum):
    ALLOW_REUSE = "ALLOW_REUSE"
    REVALIDATION_REQUIRED = "REVALIDATION_REQUIRED"
    REAUTHORIZE_REQUIRED = "REAUTHORIZE_REQUIRED"
    RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED"
    DEFINITION_MISMATCH = "DEFINITION_MISMATCH"
    HOLD_REQUIRED = "HOLD_REQUIRED"
    DUPLICATE_MUTATION_PROHIBITED = "DUPLICATE_MUTATION_PROHIBITED"


@dataclass(frozen=True)
class CheckpointRecord:
    checkpoint_id: str
    run_id: str
    node_definition_id: str
    logical_iteration_id: str
    attempt_id: str
    result_reference: str
    result_digest: str
    replay_class: ReplayClass
    captured_at: datetime
    source_identity: str
    source_version: str
    freshness_policy: Optional[str]
    definition_identity: DefinitionIdentity
    authority_snapshot_id: str
    capability_snapshot_id: str
    effect_identity: Optional[EffectIdentity] = None
    effect_state: Optional[EffectState] = None
    parent_checkpoint_id: Optional[str] = None
    sequence: int = 1


@dataclass(frozen=True)
class ResumeEvidence:
    expected_result_reference: str
    expected_result_digest: str
    active_definition_identity: DefinitionIdentity
    current_authority_evidence_present: bool
    bound_capability_snapshot: CapabilitySnapshot
    observed_capability_snapshot: CapabilitySnapshot
    snapshot_freshness_current: Optional[bool] = None


@dataclass(frozen=True)
class CheckpointLineage:
    records: Tuple[CheckpointRecord, ...]
