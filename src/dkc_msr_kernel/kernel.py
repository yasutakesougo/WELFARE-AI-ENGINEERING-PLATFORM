"""Pure-domain DKC-MSR Slice A: canonical identity / contract kernel."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Mapping, Optional, Sequence, Tuple
import re
import unicodedata

AUTHORITY = "NON_AUTHORITATIVE"

RESULT_VALID = "VALID"
RESULT_INVALID_SCHEMA = "INVALID_SCHEMA"
RESULT_INVALID_IDENTITY = "INVALID_IDENTITY"
RESULT_PERSISTENCE_PROHIBITED = "PERSISTENCE_PROHIBITED"
RESULT_HOLD_UNKNOWN = "HOLD_UNKNOWN"

SOURCE_OBJECT_KEY_V1 = "SOURCE_OBJECT_KEY_V1"
CANONICAL_SNAPSHOT_KEY_V1 = "CANONICAL_SNAPSHOT_KEY_V1"

OBJECT_TYPES = frozenset(
    {
        "ISSUE",
        "PULL_REQUEST",
        "REVIEW",
        "COMMIT",
        "CHANGED_FILE",
        "CHECK_RUN",
        "CHECK_SUITE",
        "WORKFLOW_RUN",
        "JOB",
        "TEST_EVIDENCE",
        "ADR",
        "DEFINITION",
        "REVIEW_RECORD",
        "OTHER",
    }
)
PROVIDER_OBJECT_ID_TYPES = frozenset(
    {
        "ISSUE",
        "PULL_REQUEST",
        "REVIEW",
        "CHECK_RUN",
        "CHECK_SUITE",
        "WORKFLOW_RUN",
        "JOB",
    }
)
PATH_COMMIT_TYPES = frozenset({"CHANGED_FILE", "ADR", "DEFINITION", "REVIEW_RECORD"})
REPO_PROVIDERS = frozenset({"GITHUB", "GIT", "OTHER"})
GATE_DECISIONS = frozenset({"ALLOW", "SANITIZE", "REJECT"})
EVIDENCE_FORMS = frozenset(
    {
        "SOURCE_NATIVE_CANONICAL",
        "SANITIZED_CANONICAL",
        "REDACTED_CANONICAL",
        "NONE",
    }
)
LINK_METHODS = frozenset(
    {
        "PLATFORM_RELATION",
        "EXPLICIT_DECLARATION",
        "DETERMINISTIC_DERIVATION",
        "HEURISTIC_INFERENCE",
        "MODEL_INFERENCE",
    }
)
EVIDENCE_CLASSES = frozenset(
    {"SOURCE_NATIVE", "DECLARED", "DETERMINISTIC", "HEURISTIC", "MODEL"}
)
LINK_METHOD_TO_EVIDENCE_CLASS = {
    "PLATFORM_RELATION": "SOURCE_NATIVE",
    "EXPLICIT_DECLARATION": "DECLARED",
    "DETERMINISTIC_DERIVATION": "DETERMINISTIC",
    "HEURISTIC_INFERENCE": "HEURISTIC",
    "MODEL_INFERENCE": "MODEL",
}
CONFLICT_STATES = frozenset({"NONE", "CONFLICT", "UNKNOWN"})
PROJECTION_TYPES = frozenset(
    {
        "AST",
        "CPG",
        "KNOWLEDGE_GRAPH",
        "REPOSITORY_MEMORY",
        "SEARCH_INDEX",
        "VECTOR_INDEX",
        "PROCESS_EVENT_LOG",
        "OTHER",
    }
)
IDENTITY_MEMBER_ORDER = (
    "providerObjectId",
    "exactCommitSha",
    "pathSnapshot",
    "contentBlobId",
    "testIdentity",
    "identityScheme",
    "identityValue",
)
SHA256_LOWER_HEX = re.compile(r"^[0-9a-f]{64}$")


@dataclass(frozen=True)
class KernelResult:
    contract_type: str
    result_class: str
    authority: str
    error_ids: Tuple[str, ...]
    hold_reason_ids: Tuple[str, ...]
    value: Optional[Dict[str, Any]] = None

    def as_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "contractType": self.contract_type,
            "resultClass": self.result_class,
            "authority": self.authority,
            "errorIds": list(self.error_ids),
            "holdReasonIds": list(self.hold_reason_ids),
        }
        if self.value is not None:
            payload["value"] = self.value
        return payload


def _is_mapping(value: Any) -> bool:
    return isinstance(value, Mapping) and not isinstance(value, (str, bytes))


def _non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and len(value) > 0


def _fail(
    contract_type: str,
    result_class: str,
    *error_ids: str,
    hold_reason_ids: Sequence[str] = (),
) -> KernelResult:
    return KernelResult(
        contract_type=contract_type,
        result_class=result_class,
        authority=AUTHORITY,
        error_ids=tuple(error_ids),
        hold_reason_ids=tuple(hold_reason_ids),
    )


def _ok(contract_type: str, value: Dict[str, Any]) -> KernelResult:
    return KernelResult(
        contract_type=contract_type,
        result_class=RESULT_VALID,
        authority=AUTHORITY,
        error_ids=(),
        hold_reason_ids=(),
        value=value,
    )


def normalize_path_snapshot(path: str) -> Optional[str]:
    """Normalize repository-relative pathSnapshot. None => INVALID/HOLD."""
    if not isinstance(path, str) or path == "":
        return None
    text = unicodedata.normalize("NFC", path)
    text = text.replace("\\", "/")
    if text.startswith("./"):
        text = text[2:]
    parts = []
    for segment in text.split("/"):
        if segment == "" or segment == ".":
            continue
        if segment == "..":
            return None
        parts.append(segment)
    if not parts:
        return None
    return "/".join(parts)


def stable_repository_identity(provider: str, repository_id: str) -> str:
    return f"{provider}:{repository_id}"


def validate_source_repository_identity(payload: Any) -> KernelResult:
    contract = "SourceRepositoryIdentityResult@v1"
    if not _is_mapping(payload):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-REPO-NOT-OBJECT")
    allowed = {
        "provider",
        "repositoryId",
        "repositoryNameSnapshot",
        "canonicalUrlSnapshot",
        "defaultBranchNameSnapshot",
    }
    if set(payload.keys()) - allowed:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-REPO-UNKNOWN-FIELD")
    provider = payload.get("provider")
    repository_id = payload.get("repositoryId")
    if provider not in REPO_PROVIDERS:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-REPO-PROVIDER-INVALID")
    if not _non_empty_string(repository_id):
        return _fail(contract, RESULT_INVALID_IDENTITY, "MSR-REPO-ID-MISSING")
    for field in (
        "repositoryNameSnapshot",
        "canonicalUrlSnapshot",
        "defaultBranchNameSnapshot",
    ):
        value = payload.get(field)
        if value is None:
            continue
        if not isinstance(value, str):
            return _fail(contract, RESULT_INVALID_SCHEMA, f"MSR-REPO-{field}-TYPE")
    value = {
        "provider": provider,
        "repositoryId": repository_id,
        "repositoryNameSnapshot": payload.get("repositoryNameSnapshot", ""),
        "canonicalUrlSnapshot": payload.get("canonicalUrlSnapshot", ""),
        "defaultBranchNameSnapshot": payload.get("defaultBranchNameSnapshot", ""),
        "stableRepositoryIdentity": stable_repository_identity(provider, repository_id),
    }
    return _ok(contract, value)


def _required_identity_members(object_type: str) -> Tuple[str, ...]:
    if object_type in PROVIDER_OBJECT_ID_TYPES:
        return ("providerObjectId",)
    if object_type == "COMMIT":
        return ("exactCommitSha",)
    if object_type in PATH_COMMIT_TYPES:
        return ("exactCommitSha", "pathSnapshot")
    if object_type == "TEST_EVIDENCE":
        return ("testIdentity",)
    if object_type == "OTHER":
        return ("identityScheme", "identityValue")
    return ()


def validate_source_object_key(payload: Any) -> KernelResult:
    contract = "SourceObjectKeyResult@v1"
    if not _is_mapping(payload):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-SOK-NOT-OBJECT")
    allowed = {"keyVersion", "provider", "repositoryId", "objectType", "identity"}
    if set(payload.keys()) - allowed:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-SOK-UNKNOWN-FIELD")
    if payload.get("keyVersion") != SOURCE_OBJECT_KEY_V1:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-SOK-KEY-VERSION")
    provider = payload.get("provider")
    repository_id = payload.get("repositoryId")
    object_type = payload.get("objectType")
    identity = payload.get("identity")
    if not _non_empty_string(provider):
        return _fail(contract, RESULT_INVALID_IDENTITY, "MSR-SOK-PROVIDER-MISSING")
    if not _non_empty_string(repository_id):
        return _fail(contract, RESULT_INVALID_IDENTITY, "MSR-SOK-REPO-ID-MISSING")
    if object_type not in OBJECT_TYPES:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-SOK-OBJECT-TYPE")
    if not _is_mapping(identity):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-SOK-IDENTITY-NOT-OBJECT")
    if set(identity.keys()) - set(IDENTITY_MEMBER_ORDER):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-SOK-IDENTITY-UNKNOWN-FIELD")

    normalized_identity: Dict[str, Any] = {name: None for name in IDENTITY_MEMBER_ORDER}
    for name in IDENTITY_MEMBER_ORDER:
        if name in identity:
            normalized_identity[name] = identity[name]

    required = _required_identity_members(object_type)
    for name in IDENTITY_MEMBER_ORDER:
        value = normalized_identity[name]
        if name in required:
            if not _non_empty_string(value):
                return _fail(
                    contract,
                    RESULT_INVALID_IDENTITY,
                    f"MSR-SOK-REQUIRED-{name}",
                    hold_reason_ids=("IDENTITY_UNVERIFIABLE",),
                )
        elif value is not None:
            return _fail(contract, RESULT_INVALID_SCHEMA, f"MSR-SOK-UNUSED-{name}")

    if "pathSnapshot" in required:
        normalized = normalize_path_snapshot(normalized_identity["pathSnapshot"])
        if normalized is None:
            return _fail(
                contract,
                RESULT_INVALID_IDENTITY,
                "MSR-SOK-PATH-INVALID",
                hold_reason_ids=("PATH_HOLD",),
            )
        normalized_identity["pathSnapshot"] = normalized

    value = {
        "keyVersion": SOURCE_OBJECT_KEY_V1,
        "provider": provider,
        "repositoryId": repository_id,
        "objectType": object_type,
        "identity": {name: normalized_identity[name] for name in IDENTITY_MEMBER_ORDER},
    }
    return _ok(contract, value)


def validate_sensitive_data_gate_record(payload: Any) -> KernelResult:
    contract = "SensitiveDataGateRecordResult@v1"
    if not _is_mapping(payload):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-NOT-OBJECT")
    allowed = {
        "decision",
        "policyVersion",
        "redactionClasses",
        "sanitizerVersion",
        "canonicalEvidenceForm",
        "prohibitedRawPersisted",
        "rawPayloadDigest",
    }
    if set(payload.keys()) - allowed:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-UNKNOWN-FIELD")
    decision = payload.get("decision")
    form = payload.get("canonicalEvidenceForm")
    if decision not in GATE_DECISIONS:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-DECISION")
    if form not in EVIDENCE_FORMS:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-FORM")
    if payload.get("prohibitedRawPersisted") is not False:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-PROHIBITED-RAW")

    if decision == "ALLOW" and form != "SOURCE_NATIVE_CANONICAL":
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-ALLOW-FORM")
    if decision == "SANITIZE":
        if form not in {"SANITIZED_CANONICAL", "REDACTED_CANONICAL"}:
            return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-SANITIZE-FORM")
        if not _non_empty_string(payload.get("sanitizerVersion")):
            return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-SANITIZER-VERSION")
    if decision == "REJECT" and form != "NONE":
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-REJECT-FORM")

    raw = payload.get("rawPayloadDigest")
    if raw is not None:
        if not _is_mapping(raw):
            return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-RAW-DIGEST-TYPE")
        status = raw.get("status")
        if status not in {"RECORDED", "SUPPRESSED"}:
            return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-GATE-RAW-DIGEST-STATUS")

    value = {
        "decision": decision,
        "policyVersion": payload.get("policyVersion", ""),
        "redactionClasses": list(payload.get("redactionClasses") or []),
        "sanitizerVersion": payload.get("sanitizerVersion"),
        "canonicalEvidenceForm": form,
        "prohibitedRawPersisted": False,
        "rawPayloadDigest": raw,
    }
    return _ok(contract, value)


def _validate_digest(digest: Any) -> Optional[str]:
    if not _is_mapping(digest):
        return "MSR-DIGEST-NOT-OBJECT"
    if set(digest.keys()) - {"algorithm", "value"}:
        return "MSR-DIGEST-UNKNOWN-FIELD"
    if digest.get("algorithm") != "SHA-256":
        return "MSR-DIGEST-ALGORITHM"
    value = digest.get("value")
    if not isinstance(value, str) or not SHA256_LOWER_HEX.fullmatch(value):
        return "MSR-DIGEST-VALUE"
    return None


def construct_canonical_snapshot_key(
    source_object_key: Any,
    canonicalization_version: Any,
    sanitized_payload_digest: Any,
    *,
    sensitive_data_gate: Any = None,
    retrieved_at: Any = None,
) -> KernelResult:
    """Build CANONICAL_SNAPSHOT_KEY_V1. retrieved_at is accepted and ignored."""
    contract = "CanonicalSnapshotKeyResult@v1"
    _ = retrieved_at

    if sensitive_data_gate is not None:
        gate = validate_sensitive_data_gate_record(sensitive_data_gate)
        if gate.result_class != RESULT_VALID:
            return KernelResult(
                contract_type=contract,
                result_class=gate.result_class,
                authority=AUTHORITY,
                error_ids=gate.error_ids,
                hold_reason_ids=gate.hold_reason_ids,
            )
        assert gate.value is not None
        if (
            gate.value["decision"] == "REJECT"
            or gate.value["canonicalEvidenceForm"] == "NONE"
        ):
            return _fail(
                contract,
                RESULT_PERSISTENCE_PROHIBITED,
                "MSR-SNAPSHOT-PERSISTENCE-PROHIBITED",
            )

    key = validate_source_object_key(source_object_key)
    if key.result_class != RESULT_VALID:
        return KernelResult(
            contract_type=contract,
            result_class=key.result_class,
            authority=AUTHORITY,
            error_ids=key.error_ids,
            hold_reason_ids=key.hold_reason_ids,
        )
    if not _non_empty_string(canonicalization_version):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-SNAPSHOT-CANON-VERSION")
    digest_error = _validate_digest(sanitized_payload_digest)
    if digest_error is not None:
        return _fail(contract, RESULT_INVALID_SCHEMA, digest_error)

    assert key.value is not None
    value = {
        "keyVersion": CANONICAL_SNAPSHOT_KEY_V1,
        "sourceObjectKey": key.value,
        "canonicalizationVersion": canonicalization_version,
        "sanitizedPayloadDigest": {
            "algorithm": "SHA-256",
            "value": sanitized_payload_digest["value"],
        },
    }
    return _ok(contract, value)


def validate_evidence_entity_link(payload: Any) -> KernelResult:
    contract = "EvidenceEntityLinkResult@v1"
    if not _is_mapping(payload):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-NOT-OBJECT")
    allowed = {
        "contractType",
        "linkId",
        "sourceObjectRef",
        "targetObjectRef",
        "linkMethod",
        "evidenceClass",
        "confidence",
        "evidenceRefs",
        "conflictState",
        "inferenceEnvelopeRef",
        "derivationManifestRef",
    }
    if set(payload.keys()) - allowed:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-UNKNOWN-FIELD")
    if payload.get("contractType") not in (None, "EvidenceEntityLink@v1"):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-CONTRACT-TYPE")
    link_method = payload.get("linkMethod")
    evidence_class = payload.get("evidenceClass")
    conflict_state = payload.get("conflictState", "NONE")
    if link_method not in LINK_METHODS:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-METHOD")
    if evidence_class not in EVIDENCE_CLASSES:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-EVIDENCE-CLASS")
    if LINK_METHOD_TO_EVIDENCE_CLASS[link_method] != evidence_class:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-METHOD-CLASS-MISMATCH")
    if conflict_state not in CONFLICT_STATES:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-CONFLICT-STATE")
    if not _non_empty_string(payload.get("sourceObjectRef")):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-SOURCE-REF")
    if not _non_empty_string(payload.get("targetObjectRef")):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-LINK-TARGET-REF")

    value = {
        "contractType": "EvidenceEntityLink@v1",
        "linkId": payload.get("linkId", ""),
        "sourceObjectRef": payload["sourceObjectRef"],
        "targetObjectRef": payload["targetObjectRef"],
        "linkMethod": link_method,
        "evidenceClass": evidence_class,
        "confidence": payload.get("confidence"),
        "evidenceRefs": list(payload.get("evidenceRefs") or []),
        "conflictState": conflict_state,
        "inferenceEnvelopeRef": payload.get("inferenceEnvelopeRef"),
        "derivationManifestRef": payload.get("derivationManifestRef"),
        "authoritative": False,
    }
    return _ok(contract, value)


def validate_derived_projection_manifest(payload: Any) -> KernelResult:
    contract = "DerivedProjectionManifestResult@v1"
    if not _is_mapping(payload):
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-PROJ-NOT-OBJECT")
    allowed = {
        "projectionId",
        "projectionType",
        "canonicalEvidenceRefs",
        "derivationTool",
        "derivationToolVersion",
        "derivationConfigDigest",
        "projectionSchemaVersion",
        "projectionContentDigest",
        "rebuildable",
        "canonicalAuthority",
    }
    if set(payload.keys()) - allowed:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-PROJ-UNKNOWN-FIELD")
    if payload.get("projectionType") not in PROJECTION_TYPES:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-PROJ-TYPE")
    if payload.get("rebuildable") is not True:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-PROJ-REBUILDABLE")
    if payload.get("canonicalAuthority") is not False:
        return _fail(contract, RESULT_INVALID_SCHEMA, "MSR-PROJ-CANONICAL-AUTHORITY")
    value = {
        "projectionId": payload.get("projectionId", ""),
        "projectionType": payload["projectionType"],
        "canonicalEvidenceRefs": list(payload.get("canonicalEvidenceRefs") or []),
        "derivationTool": payload.get("derivationTool", ""),
        "derivationToolVersion": payload.get("derivationToolVersion", ""),
        "derivationConfigDigest": payload.get("derivationConfigDigest", ""),
        "projectionSchemaVersion": payload.get("projectionSchemaVersion", ""),
        "projectionContentDigest": payload.get("projectionContentDigest", ""),
        "rebuildable": True,
        "canonicalAuthority": False,
    }
    return _ok(contract, value)
