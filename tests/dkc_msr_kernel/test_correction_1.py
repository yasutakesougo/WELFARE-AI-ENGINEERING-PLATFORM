"""Regression coverage for DKC-MSR Slice A Implementation Correction-1."""

from __future__ import annotations

import unittest

from dkc_msr_kernel import (
    RESULT_INVALID_SCHEMA,
    RESULT_VALID,
    SOURCE_OBJECT_KEY_V1,
    normalize_path_snapshot,
    validate_evidence_entity_link,
    validate_sensitive_data_gate_record,
    validate_source_object_key,
)


def _identity(**members):
    value = {
        "providerObjectId": None,
        "exactCommitSha": None,
        "pathSnapshot": None,
        "contentBlobId": None,
        "testIdentity": None,
        "identityScheme": None,
        "identityValue": None,
    }
    value.update(members)
    return value


def _gate(raw_payload_digest):
    return {
        "decision": "ALLOW",
        "policyVersion": "policy-v1",
        "redactionClasses": [],
        "sanitizerVersion": None,
        "canonicalEvidenceForm": "SOURCE_NATIVE_CANONICAL",
        "prohibitedRawPersisted": False,
        "rawPayloadDigest": raw_payload_digest,
    }


def _link(method, evidence_class, confidence):
    return {
        "contractType": "EvidenceEntityLink@v1",
        "linkId": "link-1",
        "sourceObjectRef": "source-1",
        "targetObjectRef": "target-1",
        "linkMethod": method,
        "evidenceClass": evidence_class,
        "confidence": confidence,
        "evidenceRefs": [],
        "conflictState": "NONE",
        "inferenceEnvelopeRef": None,
        "derivationManifestRef": None,
    }


class ImplementationCorrection1Tests(unittest.TestCase):
    def test_p1_1_backslash_does_not_collapse_to_slash_identity(self):
        self.assertEqual(normalize_path_snapshot("src\\a.ts"), "src\\a.ts")
        self.assertEqual(normalize_path_snapshot("src/a.ts"), "src/a.ts")
        self.assertNotEqual(
            normalize_path_snapshot("src\\a.ts"),
            normalize_path_snapshot("src/a.ts"),
        )
        key = validate_source_object_key(
            {
                "keyVersion": SOURCE_OBJECT_KEY_V1,
                "provider": "GITHUB",
                "repositoryId": "42",
                "objectType": "CHANGED_FILE",
                "identity": _identity(
                    exactCommitSha="a" * 40,
                    pathSnapshot="src\\a.ts",
                ),
            }
        )
        self.assertEqual(key.result_class, RESULT_VALID)
        self.assertEqual(key.value["identity"]["pathSnapshot"], "src\\a.ts")

    def test_p1_2_suppressed_digest_rejects_retained_material(self):
        result = validate_sensitive_data_gate_record(
            _gate(
                {
                    "status": "SUPPRESSED",
                    "algorithm": "SHA-256",
                    "value": "a" * 64,
                    "suppressionReason": "secret material",
                }
            )
        )
        self.assertEqual(result.result_class, RESULT_INVALID_SCHEMA)
        self.assertIn("MSR-GATE-RAW-DIGEST-SUPPRESSED-MATERIAL", result.error_ids)

    def test_p1_2_suppressed_digest_accepts_no_retained_material(self):
        result = validate_sensitive_data_gate_record(
            _gate(
                {
                    "status": "SUPPRESSED",
                    "algorithm": None,
                    "value": None,
                    "suppressionReason": "secret material",
                }
            )
        )
        self.assertEqual(result.result_class, RESULT_VALID)

    def test_p1_3_non_inference_confidence_must_be_null(self):
        result = validate_evidence_entity_link(
            _link(
                "PLATFORM_RELATION",
                "SOURCE_NATIVE",
                {
                    "value": 1.0,
                    "scale": "ZERO_TO_ONE",
                    "producer": "platform",
                    "producerVersion": "1",
                    "calibrationRef": None,
                    "nonAuthoritative": True,
                },
            )
        )
        self.assertEqual(result.result_class, RESULT_INVALID_SCHEMA)
        self.assertIn("MSR-LINK-CONFIDENCE-NON-INFERENCE", result.error_ids)

    def test_p1_3_inference_confidence_must_be_bounded_and_versioned(self):
        invalid = validate_evidence_entity_link(
            _link(
                "MODEL_INFERENCE",
                "MODEL",
                {
                    "value": 1.2,
                    "scale": "ZERO_TO_ONE",
                    "producer": "model-a",
                    "producerVersion": "v1",
                    "calibrationRef": None,
                    "nonAuthoritative": True,
                },
            )
        )
        self.assertEqual(invalid.result_class, RESULT_INVALID_SCHEMA)

        valid = validate_evidence_entity_link(
            _link(
                "MODEL_INFERENCE",
                "MODEL",
                {
                    "value": 0.82,
                    "scale": "ZERO_TO_ONE",
                    "producer": "model-a",
                    "producerVersion": "v1",
                    "calibrationRef": None,
                    "nonAuthoritative": True,
                },
            )
        )
        self.assertEqual(valid.result_class, RESULT_VALID)


if __name__ == "__main__":
    unittest.main()
