"""Implementation Correction-1 for DKC-MSR Slice A contract enforcement."""

from __future__ import annotations

import math
import unicodedata
from typing import Any, Mapping, Optional

from . import kernel as _kernel


def _invalid(contract_type: str, error_id: str) -> _kernel.KernelResult:
    return _kernel.KernelResult(
        contract_type=contract_type,
        result_class=_kernel.RESULT_INVALID_SCHEMA,
        authority=_kernel.AUTHORITY,
        error_ids=(error_id,),
        hold_reason_ids=(),
    )


def _is_mapping(value: Any) -> bool:
    return isinstance(value, Mapping) and not isinstance(value, (str, bytes))


def _non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and len(value) > 0


def normalize_path_snapshot(path: str) -> Optional[str]:
    """Apply only the locked pathSnapshot normalization rules.

    Backslash is preserved as ordinary path content. It is not treated as an
    alternate separator and therefore cannot collapse into slash-based identity.
    """
    if not isinstance(path, str) or path == "":
        return None
    text = unicodedata.normalize("NFC", path)
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


def validate_sensitive_data_gate_record(payload: Any) -> _kernel.KernelResult:
    """Validate the retained rawPayloadDigest closed-world semantics."""
    result = _kernel._ORIGINAL_VALIDATE_SENSITIVE_DATA_GATE_RECORD(payload)
    if result.result_class != _kernel.RESULT_VALID:
        return result

    raw = payload.get("rawPayloadDigest") if _is_mapping(payload) else None
    if raw is None:
        return result

    allowed = {"status", "algorithm", "value", "suppressionReason"}
    if set(raw.keys()) - allowed:
        return _invalid(result.contract_type, "MSR-GATE-RAW-DIGEST-UNKNOWN-FIELD")

    status = raw.get("status")
    algorithm = raw.get("algorithm")
    value = raw.get("value")
    suppression_reason = raw.get("suppressionReason")

    if status == "SUPPRESSED":
        if algorithm is not None or value is not None:
            return _invalid(result.contract_type, "MSR-GATE-RAW-DIGEST-SUPPRESSED-MATERIAL")
        if suppression_reason is not None and not _non_empty_string(suppression_reason):
            return _invalid(result.contract_type, "MSR-GATE-RAW-DIGEST-SUPPRESSION-REASON")
        return result

    if status == "RECORDED":
        if not _non_empty_string(algorithm) or not _non_empty_string(value):
            return _invalid(result.contract_type, "MSR-GATE-RAW-DIGEST-RECORDED-MATERIAL")
        if suppression_reason is not None:
            return _invalid(result.contract_type, "MSR-GATE-RAW-DIGEST-RECORDED-SUPPRESSION")
        return result

    return _invalid(result.contract_type, "MSR-GATE-RAW-DIGEST-STATUS")


def validate_evidence_entity_link(payload: Any) -> _kernel.KernelResult:
    """Enforce the locked EvidenceEntityLink confidence contract."""
    result = _kernel._ORIGINAL_VALIDATE_EVIDENCE_ENTITY_LINK(payload)
    if result.result_class != _kernel.RESULT_VALID:
        return result

    link_method = payload.get("linkMethod")
    confidence = payload.get("confidence")

    if link_method in {
        "PLATFORM_RELATION",
        "EXPLICIT_DECLARATION",
        "DETERMINISTIC_DERIVATION",
    }:
        if confidence is not None:
            return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-NON-INFERENCE")
        return result

    if confidence is None:
        return result
    if not _is_mapping(confidence):
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-NOT-OBJECT")

    allowed = {
        "value",
        "scale",
        "producer",
        "producerVersion",
        "calibrationRef",
        "nonAuthoritative",
    }
    if set(confidence.keys()) - allowed:
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-UNKNOWN-FIELD")

    value = confidence.get("value")
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-VALUE-TYPE")
    if not math.isfinite(float(value)) or not 0.0 <= float(value) <= 1.0:
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-VALUE-RANGE")
    if confidence.get("scale") != "ZERO_TO_ONE":
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-SCALE")
    if not _non_empty_string(confidence.get("producer")):
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-PRODUCER")
    if not _non_empty_string(confidence.get("producerVersion")):
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-PRODUCER-VERSION")
    if confidence.get("nonAuthoritative") is not True:
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-AUTHORITY")
    calibration_ref = confidence.get("calibrationRef")
    if calibration_ref is not None and not _non_empty_string(calibration_ref):
        return _invalid(result.contract_type, "MSR-LINK-CONFIDENCE-CALIBRATION-REF")

    return result
