"""Pure data contracts for WAEP field knowledge capture Slice A."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional, Tuple


class AuthorityDecision(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    UNKNOWN = "UNKNOWN"
    STALE = "STALE"


class Applicability(str, Enum):
    UNKNOWN = "UNKNOWN"
    SOURCE_ONLY = "SOURCE_ONLY"
    CANDIDATE = "CANDIDATE"
    ADOPTED_EQUIVALENT = "ADOPTED_EQUIVALENT"
    ADOPTED_EXACT = "ADOPTED_EXACT"
    SUPERSEDED = "SUPERSEDED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class SensitivityState(str, Enum):
    PASS = "PASS"
    SENSITIVE = "SENSITIVE"
    UNKNOWN = "UNKNOWN"


class VerificationState(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    UNKNOWN = "UNKNOWN"
    STALE = "STALE"


class SupersessionState(str, Enum):
    ACTIVE = "ACTIVE"
    SUPERSEDED = "SUPERSEDED"


class KnowledgeStatus(str, Enum):
    FIELD_CANDIDATE = "FIELD_CANDIDATE"
    FIELD_UNDER_REVIEW = "FIELD_UNDER_REVIEW"
    FIELD_HOLD = "FIELD_HOLD"
    LOCAL_APPROVED = "LOCAL_APPROVED"
    LOCAL_REJECTED = "LOCAL_REJECTED"
    LOCAL_SUPERSEDED = "LOCAL_SUPERSEDED"
    WAEP_CLASSIFICATION = "WAEP_CLASSIFICATION"
    WAEP_UNDER_REVIEW = "WAEP_UNDER_REVIEW"
    WAEP_HOLD = "WAEP_HOLD"
    WAEP_ADOPTED = "WAEP_ADOPTED"
    WAEP_REJECTED = "WAEP_REJECTED"
    WAEP_SUPERSEDED = "WAEP_SUPERSEDED"


@dataclass(frozen=True)
class KnowledgeEvidenceReference:
    evidence_id: str
    source_ref: str
    source_digest: Optional[str]
    sensitivity_state: SensitivityState


@dataclass(frozen=True)
class KnowledgeCandidate:
    candidate_id: str
    candidate_type: str
    scope: str
    statement: str
    trigger: str
    expected_action: str
    evidence_refs: Tuple[str, ...]
    status: KnowledgeStatus = KnowledgeStatus.FIELD_CANDIDATE


@dataclass(frozen=True)
class KnowledgeDecision:
    decision_id: str
    candidate_id: str
    decision: str
    reason: str
    reviewer_ref: str
    reviewer_role: str
    authority_ref: str
    authority_decision: AuthorityDecision
    decision_basis: str
    source_evidence_refs: Tuple[str, ...]
    decided_at: datetime


@dataclass(frozen=True)
class KnowledgeClassification:
    knowledge_domain: str
    scope_class: str
    applicability: Applicability


@dataclass(frozen=True)
class ApprovedKnowledgeVersion:
    knowledge_id: str
    version: int
    candidate_id: str
    scope: str
    statement: str
    valid_from: datetime
    valid_until: Optional[datetime]
    local_status: KnowledgeStatus
    verification_state: VerificationState
    applicability: Applicability
    supersession_state: SupersessionState
    sensitivity_state: SensitivityState


@dataclass(frozen=True)
class RetrievalEligibility:
    eligible: bool
    reasons: Tuple[str, ...]
