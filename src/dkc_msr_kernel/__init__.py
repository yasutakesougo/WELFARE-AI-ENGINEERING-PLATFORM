"""DKC-MSR Slice A pure canonical identity / contract kernel."""

from . import kernel as _kernel

# Preserve the reviewed Slice A implementations so Correction-1 can tighten the
# three identified contracts without recursively calling the patched functions.
_kernel._ORIGINAL_VALIDATE_SENSITIVE_DATA_GATE_RECORD = (
    _kernel.validate_sensitive_data_gate_record
)
_kernel._ORIGINAL_VALIDATE_EVIDENCE_ENTITY_LINK = _kernel.validate_evidence_entity_link

from .correction import (  # noqa: E402
    normalize_path_snapshot as _corrected_normalize_path_snapshot,
    validate_evidence_entity_link as _corrected_validate_evidence_entity_link,
    validate_sensitive_data_gate_record as _corrected_validate_sensitive_data_gate_record,
)

# Patch the module globals as well as package exports. Existing kernel functions
# resolve these names at call time, so source-object validation and canonical
# snapshot construction inherit the corrected path and gate semantics.
_kernel.normalize_path_snapshot = _corrected_normalize_path_snapshot
_kernel.validate_sensitive_data_gate_record = _corrected_validate_sensitive_data_gate_record
_kernel.validate_evidence_entity_link = _corrected_validate_evidence_entity_link

AUTHORITY = _kernel.AUTHORITY
CANONICAL_SNAPSHOT_KEY_V1 = _kernel.CANONICAL_SNAPSHOT_KEY_V1
RESULT_HOLD_UNKNOWN = _kernel.RESULT_HOLD_UNKNOWN
RESULT_INVALID_IDENTITY = _kernel.RESULT_INVALID_IDENTITY
RESULT_INVALID_SCHEMA = _kernel.RESULT_INVALID_SCHEMA
RESULT_PERSISTENCE_PROHIBITED = _kernel.RESULT_PERSISTENCE_PROHIBITED
RESULT_VALID = _kernel.RESULT_VALID
SOURCE_OBJECT_KEY_V1 = _kernel.SOURCE_OBJECT_KEY_V1
KernelResult = _kernel.KernelResult
construct_canonical_snapshot_key = _kernel.construct_canonical_snapshot_key
normalize_path_snapshot = _kernel.normalize_path_snapshot
stable_repository_identity = _kernel.stable_repository_identity
validate_derived_projection_manifest = _kernel.validate_derived_projection_manifest
validate_evidence_entity_link = _kernel.validate_evidence_entity_link
validate_sensitive_data_gate_record = _kernel.validate_sensitive_data_gate_record
validate_source_object_key = _kernel.validate_source_object_key
validate_source_repository_identity = _kernel.validate_source_repository_identity

__all__ = [
    "AUTHORITY",
    "CANONICAL_SNAPSHOT_KEY_V1",
    "RESULT_HOLD_UNKNOWN",
    "RESULT_INVALID_IDENTITY",
    "RESULT_INVALID_SCHEMA",
    "RESULT_PERSISTENCE_PROHIBITED",
    "RESULT_VALID",
    "SOURCE_OBJECT_KEY_V1",
    "KernelResult",
    "construct_canonical_snapshot_key",
    "normalize_path_snapshot",
    "stable_repository_identity",
    "validate_derived_projection_manifest",
    "validate_evidence_entity_link",
    "validate_sensitive_data_gate_record",
    "validate_source_object_key",
    "validate_source_repository_identity",
]
