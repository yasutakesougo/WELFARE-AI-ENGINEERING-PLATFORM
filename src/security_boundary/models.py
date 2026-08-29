from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import FrozenSet, Optional, Tuple


class ExecutionPolicyDecision(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    HOLD = "HOLD"
    ASK_HUMAN = "ASK_HUMAN"
    UNKNOWN = "UNKNOWN"


class SecurityConstraint(str, Enum):
    PASS = "PASS"
    BLOCK = "BLOCK"
    HOLD = "HOLD"
    ASK_HUMAN = "ASK_HUMAN"
    UNKNOWN = "UNKNOWN"


class ContainmentState(str, Enum):
    NORMAL = "NORMAL"
    STOP_REQUESTED = "STOP_REQUESTED"
    STOP_ENFORCED = "STOP_ENFORCED"
    STOP_ENFORCEMENT_FAILED = "STOP_ENFORCEMENT_FAILED"


class AuthorityState(str, Enum):
    CURRENT = "CURRENT"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
    SUPERSEDED = "SUPERSEDED"
    STALE = "STALE"
    GENERATION_MISMATCH = "GENERATION_MISMATCH"
    SUBJECT_MISMATCH = "SUBJECT_MISMATCH"
    TARGET_MISMATCH = "TARGET_MISMATCH"
    OPERATION_MISMATCH = "OPERATION_MISMATCH"
    UNKNOWN = "UNKNOWN"


class BindingState(str, Enum):
    MATCH = "MATCH"
    REQUIRED_MISSING = "REQUIRED_MISSING"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNKNOWN = "UNKNOWN"
    MISMATCH = "MISMATCH"
    STALE = "STALE"
    GENERATION_MISMATCH = "GENERATION_MISMATCH"
    SNAPSHOT_MISMATCH = "SNAPSHOT_MISMATCH"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"


class BudgetState(str, Enum):
    AVAILABLE = "AVAILABLE"
    EXHAUSTED = "EXHAUSTED"
    WOULD_EXCEED = "WOULD_EXCEED"
    UNKNOWN = "UNKNOWN"


class AuthenticationState(str, Enum):
    ANONYMOUS = "ANONYMOUS"
    AUTHENTICATED = "AUTHENTICATED"
    UNKNOWN = "UNKNOWN"


class OperationSensitivity(str, Enum):
    PUBLIC_READ = "PUBLIC_READ"
    AUTHENTICATED_READ = "AUTHENTICATED_READ"
    DATA_MUTATION = "DATA_MUTATION"
    ADMINISTRATION = "ADMINISTRATION"
    CODE_EXECUTION = "CODE_EXECUTION"
    CREDENTIAL_OPERATION = "CREDENTIAL_OPERATION"
    AUTHORITY_MUTATION = "AUTHORITY_MUTATION"


class Eligibility(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    BLOCKED = "BLOCKED"
    HELD = "HELD"
    HUMAN_REQUIRED = "HUMAN_REQUIRED"
    UNKNOWN = "UNKNOWN"


class ProvenanceClass(str, Enum):
    AUTHORITATIVE_SOURCE = "AUTHORITATIVE_SOURCE"
    VERIFIED_SOURCE = "VERIFIED_SOURCE"
    UNTRUSTED_SOURCE = "UNTRUSTED_SOURCE"
    UNTRUSTED_DERIVED = "UNTRUSTED_DERIVED"
    MIXED_SOURCE = "MIXED_SOURCE"
    UNKNOWN_SOURCE = "UNKNOWN_SOURCE"


class CredentialOperation(str, Enum):
    DISCOVER = "DISCOVER"
    OBSERVE = "OBSERVE"
    READ = "READ"
    USE = "USE"
    FORWARD = "FORWARD"
    PERSIST = "PERSIST"
    ROTATE = "ROTATE"
    REVOKE = "REVOKE"


class DependencyFinding(str, Enum):
    KNOWN_VULNERABILITY = "KNOWN_VULNERABILITY"
    EOL = "EOL"
    VERSION_DRIFT = "VERSION_DRIFT"
    UNVERIFIED_SOURCE = "UNVERIFIED_SOURCE"
    UNKNOWN_VERSION = "UNKNOWN_VERSION"
    NO_KNOWN_FINDING = "NO_KNOWN_FINDING"


@dataclass(frozen=True)
class EvaluationContext:
    evaluation_timestamp: datetime
    input_snapshot_identity: str


@dataclass(frozen=True)
class ValidityWindow:
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None


@dataclass(frozen=True)
class GenerationBinding:
    granted_generation: Optional[int]
    current_generation: Optional[int]


@dataclass(frozen=True)
class BudgetSnapshot:
    limit: Optional[int]
    consumed: Optional[int]
    requested_consumption: Optional[int]
    root_execution_grant_id: str = ""


@dataclass(frozen=True)
class AuthorityBinding:
    root_execution_grant_id: str
    task_identity: str
    run_identity: str
    subject_identity: str
    target_repository: Optional[str]
    target_system: Optional[str]
    target_resource_set: FrozenSet[str]
    allowed_operation_set: FrozenSet[str]
    allowed_tool_set: FrozenSet[str]
    credential_ref: Optional[str]
    allowed_network_destination_set: FrozenSet[str]
    write_target_set: FrozenSet[str]
    authority_decision_ref: str
    authority_generation: GenerationBinding
    validity_window: ValidityWindow
    agent_identity: Optional[str] = None
    worker_identity: Optional[str] = None
    target_ref: Optional[str] = None
    target_commit: Optional[str] = None


@dataclass(frozen=True)
class AuthorityRequest:
    target_repository: Optional[str] = None
    target_system: Optional[str] = None
    target_resource: Optional[str] = None
    operation: Optional[str] = None
    tool: Optional[str] = None
    credential_ref: Optional[str] = None
    network_destination: Optional[str] = None
    write_target: Optional[str] = None


@dataclass(frozen=True)
class MutableScopeGenerations:
    resource_set: GenerationBinding
    operation_set: GenerationBinding
    tool_set: GenerationBinding
    destination_set: GenerationBinding
    write_target_set: GenerationBinding


@dataclass(frozen=True)
class ExecutionRegrantDecision:
    previous_root_execution_grant_id: str
    previous_authority_decision_ref: str
    regrant_decision_ref: str
    regrant_reason: str
    prior_budget_limit: int
    prior_budget_consumption: int
    requested_additional_budget: int
    approved_additional_budget: int
    approving_authority: str
    decision_time: datetime
    validity_window: ValidityWindow
    target_scope: FrozenSet[str]
    operation_scope: FrozenSet[str]
    new_root_execution_grant_id: str
    previous_regrant_decision_ref: Optional[str] = None
    regrant_sequence: int = 1
    cumulative_budget_granted: Optional[int] = None
    cumulative_budget_consumed: Optional[int] = None


@dataclass(frozen=True)
class NetworkBinding:
    requested_destination: str
    allowed_destinations: FrozenSet[str]
    destination_generation: GenerationBinding


@dataclass(frozen=True)
class CredentialBinding:
    operation: CredentialOperation
    allowed_operations: FrozenSet[CredentialOperation]
    credential_generation: GenerationBinding


@dataclass(frozen=True)
class DelegationSnapshot:
    parent_scope: FrozenSet[str]
    delegated_scope: FrozenSet[str]
    parent_authority_state: AuthorityState
    parent_generation: GenerationBinding
    delegation_validity: ValidityWindow
    root_execution_grant_id: str
    delegated_root_execution_grant_id: str


@dataclass(frozen=True)
class BatchSnapshot:
    batch_identity: str
    maximum_operations: int
    operations_consumed: int
    batch_start_timestamp: datetime
    maximum_duration_seconds: int
    authority_generation: GenerationBinding
    credential_generation: GenerationBinding
    selector_generation: GenerationBinding
    target_scope: FrozenSet[str]
    current_target_scope: FrozenSet[str]


@dataclass(frozen=True)
class ResumeSnapshot:
    containment_state: ContainmentState
    containment_event_ref: str
    current_containment_event_ref: str
    containment_generation: int
    current_containment_generation: int
    root_execution_grant_id: str
    current_root_execution_grant_id: str
    run_identity: str
    current_run_identity: str
    authority_generation: GenerationBinding
    resume_scope: FrozenSet[str]
    current_resume_scope: FrozenSet[str]
    validity: ValidityWindow


@dataclass(frozen=True)
class VerifiedClaimSnapshot:
    claim_identity: str
    source_content_refs: Tuple[str, ...]
    claim_digest: str
    verification_evidence_ref: Optional[str]
    verification_result: str
    verified_at: datetime
    verification_validity: ValidityWindow


@dataclass(frozen=True)
class DependencyAssessment:
    finding: DependencyFinding
    assessment_identity: str
    assessed_constraint: SecurityConstraint
    evidence_ref: str


@dataclass(frozen=True)
class SyntheticAuditEvent:
    event_identity: str
    event_sequence: int
    recorded_at: datetime
    root_execution_grant_id: str
    run_identity: str
    task_identity: str
    target_identity: str
    operation_class: str
    authority_decision_ref: str
    authority_generation: int
    security_constraint_result: SecurityConstraint
    containment_state: ContainmentState
    runtime_outcome: str
    causal_parent_ref: Optional[str] = None
    agent_identity: Optional[str] = None
    worker_identity: Optional[str] = None
    parent_execution_ref: Optional[str] = None
    tool_identity: Optional[str] = None
    network_destination_ref: Optional[str] = None
    network_destination_class: Optional[str] = None
    credential_ref: Optional[str] = None
    credential_class: Optional[str] = None
    budget_before: Optional[int] = None
    budget_consumed: Optional[int] = None
    budget_after: Optional[int] = None


@dataclass(frozen=True)
class EvaluationResult:
    eligibility: Eligibility
    reasons: Tuple[str, ...]
