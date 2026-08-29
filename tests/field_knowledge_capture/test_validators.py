from datetime import datetime, timedelta, timezone

import pytest

from src.field_knowledge_capture.models import (
    Applicability,
    ApprovedKnowledgeVersion,
    AuthorityDecision,
    KnowledgeCandidate,
    KnowledgeDecision,
    KnowledgeStatus,
    SensitivityState,
    SupersessionState,
    VerificationState,
)
from src.field_knowledge_capture.validators import (
    ValidationError,
    validate_candidate,
    validate_decision,
    validate_retrieval_eligibility,
    validate_sensitive_persistence,
    validate_transition,
)


def _approved(**overrides):
    now = datetime(2026, 8, 29, tzinfo=timezone.utc)
    values = dict(
        knowledge_id="KNOW-FIELD-001",
        version=1,
        candidate_id="FIELD-CAND-001",
        scope="SupportRecord",
        statement="Use observable behavior wording.",
        valid_from=now - timedelta(days=1),
        valid_until=None,
        local_status=KnowledgeStatus.LOCAL_APPROVED,
        verification_state=VerificationState.PASS,
        applicability=Applicability.SOURCE_ONLY,
        supersession_state=SupersessionState.ACTIVE,
        sensitivity_state=SensitivityState.PASS,
    )
    values.update(overrides)
    return ApprovedKnowledgeVersion(**values)


def test_candidate_requires_evidence():
    candidate = KnowledgeCandidate(
        candidate_id="FIELD-CAND-001",
        candidate_type="WORKFLOW",
        scope="SupportRecord",
        statement="Use observable wording.",
        trigger="record drafting",
        expected_action="suggest observable wording",
        evidence_refs=(),
    )
    with pytest.raises(ValidationError):
        validate_candidate(candidate)


def test_decision_requires_explicit_allow():
    decision = KnowledgeDecision(
        decision_id="DEC-001",
        candidate_id="FIELD-CAND-001",
        decision="APPROVE",
        reason="validated",
        reviewer_ref="role:reviewer",
        reviewer_role="FIELD_KNOWLEDGE_REVIEWER",
        authority_ref="AUTH-001",
        authority_decision=AuthorityDecision.UNKNOWN,
        decision_basis="synthetic review",
        source_evidence_refs=("EVID-001",),
        decided_at=datetime(2026, 8, 29, tzinfo=timezone.utc),
    )
    with pytest.raises(ValidationError):
        validate_decision(decision)


def test_sensitive_data_is_denied():
    with pytest.raises(ValidationError):
        validate_sensitive_persistence(
            sensitivity_state=SensitivityState.SENSITIVE,
            generalized=True,
            redacted=True,
        )


def test_unknown_sensitivity_holds():
    with pytest.raises(ValidationError):
        validate_sensitive_persistence(
            sensitivity_state=SensitivityState.UNKNOWN,
            generalized=True,
            redacted=True,
        )


def test_valid_transition_requires_allow_and_guards():
    validate_transition(
        KnowledgeStatus.FIELD_CANDIDATE,
        KnowledgeStatus.FIELD_UNDER_REVIEW,
        authority_decision=AuthorityDecision.ALLOW,
        guards={"candidate_identity_fixed": True, "evidence_refs_valid": True},
    )


def test_superseded_does_not_reactivate_directly():
    with pytest.raises(ValidationError):
        validate_transition(
            KnowledgeStatus.LOCAL_SUPERSEDED,
            KnowledgeStatus.LOCAL_APPROVED,
            authority_decision=AuthorityDecision.ALLOW,
            guards={"candidate_identity_fixed": True},
        )


def test_retrieval_eligible_when_all_guards_pass():
    now = datetime(2026, 8, 29, tzinfo=timezone.utc)
    result = validate_retrieval_eligibility(
        _approved(), requested_version=1, requested_scope="SupportRecord", now=now
    )
    assert result.eligible is True
    assert result.reasons == ()


@pytest.mark.parametrize(
    "overrides,reason",
    [
        ({"verification_state": VerificationState.UNKNOWN}, "VERIFICATION_NOT_PASS"),
        ({"applicability": Applicability.UNKNOWN}, "APPLICABILITY_NOT_ELIGIBLE"),
        ({"supersession_state": SupersessionState.SUPERSEDED}, "SUPERSEDED"),
        ({"sensitivity_state": SensitivityState.UNKNOWN}, "SENSITIVITY_NOT_PASS"),
    ],
)
def test_retrieval_fails_closed(overrides, reason):
    now = datetime(2026, 8, 29, tzinfo=timezone.utc)
    result = validate_retrieval_eligibility(
        _approved(**overrides), requested_version=1, requested_scope="SupportRecord", now=now
    )
    assert result.eligible is False
    assert reason in result.reasons
