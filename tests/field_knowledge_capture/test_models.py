from datetime import datetime, timezone

from src.field_knowledge_capture.models import (
    Applicability,
    ApprovedKnowledgeVersion,
    KnowledgeStatus,
    SensitivityState,
    SupersessionState,
    VerificationState,
)


def test_approved_knowledge_version_is_immutable():
    knowledge = ApprovedKnowledgeVersion(
        knowledge_id="KNOW-FIELD-001",
        version=1,
        candidate_id="FIELD-CAND-001",
        scope="SupportRecord",
        statement="Use observable behavior wording.",
        valid_from=datetime(2026, 1, 1, tzinfo=timezone.utc),
        valid_until=None,
        local_status=KnowledgeStatus.LOCAL_APPROVED,
        verification_state=VerificationState.PASS,
        applicability=Applicability.SOURCE_ONLY,
        supersession_state=SupersessionState.ACTIVE,
        sensitivity_state=SensitivityState.PASS,
    )

    try:
        knowledge.version = 2
    except Exception as exc:
        assert exc.__class__.__name__ == "FrozenInstanceError"
    else:
        raise AssertionError("ApprovedKnowledgeVersion must be immutable")


def test_unknown_applicability_is_representable():
    assert Applicability.UNKNOWN.value == "UNKNOWN"


def test_local_and_waep_states_are_distinct():
    assert KnowledgeStatus.LOCAL_APPROVED is not KnowledgeStatus.WAEP_ADOPTED
