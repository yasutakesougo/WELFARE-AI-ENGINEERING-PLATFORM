"""Deterministic validators for WAEP field knowledge capture Slice A."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable, Mapping, Sequence

from .models import (
    Applicability,
    ApprovedKnowledgeVersion,
    AuthorityDecision,
    KnowledgeCandidate,
    KnowledgeDecision,
    KnowledgeStatus,
    RetrievalEligibility,
    SensitivityState,
    SupersessionState,
    VerificationState,
)


_ALLOWED_TRANSITIONS = {
    KnowledgeStatus.FIELD_CANDIDATE: {
        KnowledgeStatus.FIELD_UNDER_REVIEW,
        KnowledgeStatus.FIELD_HOLD,
    },
    KnowledgeStatus.FIELD_UNDER_REVIEW: {
        KnowledgeStatus.LOCAL_APPROVED,
        KnowledgeStatus.LOCAL_REJECTED,
        KnowledgeStatus.FIELD_HOLD,
    },
    KnowledgeStatus.LOCAL_APPROVED: {
        KnowledgeStatus.LOCAL_SUPERSEDED,
        KnowledgeStatus.WAEP_CLASSIFICATION,
    },
    KnowledgeStatus.WAEP_CLASSIFICATION: {
        KnowledgeStatus.WAEP_UNDER_REVIEW,
        KnowledgeStatus.WAEP_HOLD,
    },
    KnowledgeStatus.WAEP_UNDER_REVIEW: {
        KnowledgeStatus.WAEP_ADOPTED,
        KnowledgeStatus.WAEP_REJECTED,
        KnowledgeStatus.WAEP_HOLD,
    },
    KnowledgeStatus.WAEP_ADOPTED: {KnowledgeStatus.WAEP_SUPERSEDED},
}


class ValidationError(ValueError):
    """Raised when a locked invariant is violated."""


def _require_non_empty(value: str, name: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{name} must be non-empty")


def validate_candidate(candidate: KnowledgeCandidate) -> None:
    for name in (
        "candidate_id",
        "candidate_type",
        "scope",
        "statement",
        "trigger",
        "expected_action",
    ):
        _require_non_empty(getattr(candidate, name), name)
    if not candidate.evidence_refs:
        raise ValidationError("candidate must reference at least one evidence item")
    if candidate.status is not KnowledgeStatus.FIELD_CANDIDATE:
        raise ValidationError("new candidate must start as FIELD_CANDIDATE")


def validate_decision(decision: KnowledgeDecision) -> None:
    for name in (
        "decision_id",
        "candidate_id",
        "decision",
        "reason",
        "reviewer_ref",
        "reviewer_role",
        "authority_ref",
        "decision_basis",
    ):
        _require_non_empty(getattr(decision, name), name)
    if not decision.source_evidence_refs:
        raise ValidationError("decision must reference evidence")
    if decision.authority_decision is not AuthorityDecision.ALLOW:
        raise ValidationError("approval transition requires authorityDecision=ALLOW")


def validate_sensitive_persistence(
    *,
    sensitivity_state: SensitivityState,
    generalized: bool,
    redacted: bool,
) -> None:
    if sensitivity_state is SensitivityState.SENSITIVE:
        raise ValidationError("sensitive data persistence is denied")
    if sensitivity_state is SensitivityState.UNKNOWN:
        raise ValidationError("unknown sensitivity must hold")
    if not generalized:
        raise ValidationError("generalization incomplete")
    if not redacted:
        raise ValidationError("redaction incomplete")


def validate_transition(
    from_state: KnowledgeStatus,
    to_state: KnowledgeStatus,
    *,
    authority_decision: AuthorityDecision,
    guards: Mapping[str, bool],
) -> None:
    allowed = _ALLOWED_TRANSITIONS.get(from_state, set())
    if to_state not in allowed:
        raise ValidationError(f"transition {from_state.value}->{to_state.value} is not allowed")
    if authority_decision is not AuthorityDecision.ALLOW:
        raise ValidationError("transition authority must be ALLOW")
    failed_guards = sorted(name for name, passed in guards.items() if not passed)
    if failed_guards:
        raise ValidationError("failed guards: " + ", ".join(failed_guards))


def validate_retrieval_eligibility(
    knowledge: ApprovedKnowledgeVersion,
    *,
    requested_version: int,
    requested_scope: str,
    now: datetime,
) -> RetrievalEligibility:
    reasons = []
    if knowledge.local_status is not KnowledgeStatus.LOCAL_APPROVED:
        reasons.append("LOCAL_STATUS_NOT_APPROVED")
    if knowledge.version != requested_version:
        reasons.append("VERSION_NOT_ACTIVE_REQUEST")
    if knowledge.supersession_state is not SupersessionState.ACTIVE:
        reasons.append("SUPERSEDED")
    if knowledge.verification_state is not VerificationState.PASS:
        reasons.append("VERIFICATION_NOT_PASS")
    if knowledge.applicability in {
        Applicability.UNKNOWN,
        Applicability.NOT_APPLICABLE,
        Applicability.SUPERSEDED,
    }:
        reasons.append("APPLICABILITY_NOT_ELIGIBLE")
    if now < knowledge.valid_from:
        reasons.append("NOT_YET_VALID")
    if knowledge.valid_until is not None and now >= knowledge.valid_until:
        reasons.append("EXPIRED")
    if requested_scope != knowledge.scope:
        reasons.append("SCOPE_MISMATCH")
    if knowledge.sensitivity_state is not SensitivityState.PASS:
        reasons.append("SENSITIVITY_NOT_PASS")
    return RetrievalEligibility(eligible=not reasons, reasons=tuple(reasons))
