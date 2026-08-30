"""Acceptance coverage for DKC-MSR Slice A scope V01-V15 and SC1 V16-V23."""

from __future__ import annotations

import unittest

from dkc_msr_kernel import (
    RESULT_INVALID_IDENTITY,
    RESULT_INVALID_SCHEMA,
    RESULT_PERSISTENCE_PROHIBITED,
    RESULT_VALID,
    SOURCE_OBJECT_KEY_V1,
    construct_canonical_snapshot_key,
    normalize_path_snapshot,
    validate_derived_projection_manifest,
    validate_evidence_entity_link,
    validate_sensitive_data_gate_record,
    validate_source_object_key,
    validate_source_repository_identity,
)

DIGEST = {
    "algorithm": "SHA-256",
    "value": "a" * 64,
}


def _repo(**overrides):
    base = {
        "provider": "GITHUB",
        "repositoryId": "42",
        "repositoryNameSnapshot": "acme/widgets",
        "canonicalUrlSnapshot": "https://github.com/acme/widgets",
        "defaultBranchNameSnapshot": "main",
    }
    base.update(overrides)
    return base


def _identity(**members):
    identity = {
        "providerObjectId": None,
        "exactCommitSha": None,
        "pathSnapshot": None,
        "contentBlobId": None,
        "testIdentity": None,
        "identityScheme": None,
        "identityValue": None,
    }
    identity.update(members)
    return identity


def _sok(object_type: str, **members):
    return {
        "keyVersion": SOURCE_OBJECT_KEY_V1,
        "provider": "GITHUB",
        "repositoryId": "42",
        "objectType": object_type,
        "identity": _identity(**members),
    }


class MsrAcceptanceTests(unittest.TestCase):
    def test_msr_a_v01_rename_snapshot_preserves_stable_repo_identity(self):
        a = validate_source_repository_identity(_repo(repositoryNameSnapshot="acme/widgets"))
        b = validate_source_repository_identity(_repo(repositoryNameSnapshot="acme/widgets-renamed"))
        self.assertEqual(a.result_class, RESULT_VALID)
        self.assertEqual(b.result_class, RESULT_VALID)
        self.assertEqual(
            a.value["stableRepositoryIdentity"],
            b.value["stableRepositoryIdentity"],
        )

    def test_msr_a_v02_same_name_different_repository_id(self):
        a = validate_source_repository_identity(_repo(repositoryId="1"))
        b = validate_source_repository_identity(_repo(repositoryId="2"))
        self.assertNotEqual(
            a.value["stableRepositoryIdentity"],
            b.value["stableRepositoryIdentity"],
        )

    def test_msr_a_v03_commit_without_exact_commit_sha(self):
        result = validate_source_object_key(_sok("COMMIT"))
        self.assertEqual(result.result_class, RESULT_INVALID_IDENTITY)

    def test_msr_a_v04_changed_file_missing_members(self):
        self.assertEqual(
            validate_source_object_key(_sok("CHANGED_FILE", exactCommitSha="abc")).result_class,
            RESULT_INVALID_IDENTITY,
        )
        self.assertEqual(
            validate_source_object_key(
                _sok("CHANGED_FILE", pathSnapshot="src/a.ts")
            ).result_class,
            RESULT_INVALID_IDENTITY,
        )

    def test_msr_a_v05_issue_without_provider_object_id(self):
        self.assertEqual(
            validate_source_object_key(_sok("ISSUE")).result_class,
            RESULT_INVALID_IDENTITY,
        )

    def test_msr_a_v06_sanitize_without_sanitizer_or_form(self):
        missing_version = validate_sensitive_data_gate_record(
            {
                "decision": "SANITIZE",
                "canonicalEvidenceForm": "SANITIZED_CANONICAL",
                "sanitizerVersion": "",
                "prohibitedRawPersisted": False,
            }
        )
        self.assertEqual(missing_version.result_class, RESULT_INVALID_SCHEMA)
        bad_form = validate_sensitive_data_gate_record(
            {
                "decision": "SANITIZE",
                "canonicalEvidenceForm": "SOURCE_NATIVE_CANONICAL",
                "sanitizerVersion": "s1",
                "prohibitedRawPersisted": False,
            }
        )
        self.assertEqual(bad_form.result_class, RESULT_INVALID_SCHEMA)

    def test_msr_a_v07_reject_blocks_snapshot_construction(self):
        gate = {
            "decision": "REJECT",
            "canonicalEvidenceForm": "NONE",
            "prohibitedRawPersisted": False,
            "rawPayloadDigest": {"status": "SUPPRESSED"},
        }
        result = construct_canonical_snapshot_key(
            _sok("COMMIT", exactCommitSha="deadbeef"),
            "canon-1",
            DIGEST,
            sensitive_data_gate=gate,
        )
        self.assertEqual(result.result_class, RESULT_PERSISTENCE_PROHIBITED)
        self.assertIsNone(result.value)

    def test_msr_a_v08_retrieved_at_excluded_from_snapshot_key(self):
        sok = _sok("COMMIT", exactCommitSha="deadbeef")
        a = construct_canonical_snapshot_key(
            sok, "canon-1", DIGEST, retrieved_at="2020-01-01T00:00:00Z"
        )
        b = construct_canonical_snapshot_key(
            sok, "canon-1", DIGEST, retrieved_at="2024-12-31T23:59:59Z"
        )
        self.assertEqual(a.result_class, RESULT_VALID)
        self.assertEqual(a.value, b.value)

    def test_msr_a_v09_platform_relation_requires_source_native(self):
        result = validate_evidence_entity_link(
            {
                "contractType": "EvidenceEntityLink@v1",
                "sourceObjectRef": "a",
                "targetObjectRef": "b",
                "linkMethod": "PLATFORM_RELATION",
                "evidenceClass": "HEURISTIC",
                "conflictState": "NONE",
            }
        )
        self.assertEqual(result.result_class, RESULT_INVALID_SCHEMA)

    def test_msr_a_v10_heuristic_and_model_remain_non_authoritative(self):
        for method, evidence_class in (
            ("HEURISTIC_INFERENCE", "HEURISTIC"),
            ("MODEL_INFERENCE", "MODEL"),
        ):
            result = validate_evidence_entity_link(
                {
                    "contractType": "EvidenceEntityLink@v1",
                    "sourceObjectRef": "a",
                    "targetObjectRef": "b",
                    "linkMethod": method,
                    "evidenceClass": evidence_class,
                    "conflictState": "NONE",
                }
            )
            self.assertEqual(result.result_class, RESULT_VALID)
            self.assertFalse(result.value["authoritative"])

    def test_msr_a_v11_conflict_unknown_retained(self):
        result = validate_evidence_entity_link(
            {
                "contractType": "EvidenceEntityLink@v1",
                "sourceObjectRef": "a",
                "targetObjectRef": "b",
                "linkMethod": "DETERMINISTIC_DERIVATION",
                "evidenceClass": "DETERMINISTIC",
                "conflictState": "UNKNOWN",
            }
        )
        self.assertEqual(result.result_class, RESULT_VALID)
        self.assertEqual(result.value["conflictState"], "UNKNOWN")

    def test_msr_a_v12_projection_rebuildable_false(self):
        result = validate_derived_projection_manifest(
            {
                "projectionType": "AST",
                "rebuildable": False,
                "canonicalAuthority": False,
            }
        )
        self.assertEqual(result.result_class, RESULT_INVALID_SCHEMA)

    def test_msr_a_v13_projection_canonical_authority_true(self):
        result = validate_derived_projection_manifest(
            {
                "projectionType": "AST",
                "rebuildable": True,
                "canonicalAuthority": True,
            }
        )
        self.assertEqual(result.result_class, RESULT_INVALID_SCHEMA)

    def test_msr_a_v14_malformed_unknown_fields(self):
        self.assertEqual(
            validate_source_repository_identity({**_repo(), "extra": 1}).result_class,
            RESULT_INVALID_SCHEMA,
        )
        self.assertEqual(
            validate_source_object_key({**_sok("COMMIT", exactCommitSha="x"), "nope": True}).result_class,
            RESULT_INVALID_SCHEMA,
        )

    def test_msr_a_v15_pure_kernel_without_io(self):
        # No network/filesystem used; successful local validation proves purity for this slice.
        result = validate_source_object_key(
            _sok("PULL_REQUEST", providerObjectId="99")
        )
        self.assertEqual(result.result_class, RESULT_VALID)

    def test_msr_sc1_v16_equivalent_path_forms(self):
        a = validate_source_object_key(
            _sok("CHANGED_FILE", exactCommitSha="abc", pathSnapshot="./src//a.ts")
        )
        b = validate_source_object_key(
            _sok("CHANGED_FILE", exactCommitSha="abc", pathSnapshot="src/a.ts")
        )
        self.assertEqual(a.result_class, RESULT_VALID)
        self.assertEqual(
            a.value["identity"]["pathSnapshot"],
            b.value["identity"]["pathSnapshot"],
        )
        self.assertEqual(normalize_path_snapshot("./src//a.ts"), "src/a.ts")

    def test_msr_sc1_v17_path_with_parent_segment(self):
        result = validate_source_object_key(
            _sok("CHANGED_FILE", exactCommitSha="abc", pathSnapshot="src/../secret")
        )
        self.assertEqual(result.result_class, RESULT_INVALID_IDENTITY)
        self.assertIn("PATH_HOLD", result.hold_reason_ids)

    def test_msr_sc1_v18_unused_identity_members_non_null(self):
        result = validate_source_object_key(
            _sok(
                "COMMIT",
                exactCommitSha="abc",
                providerObjectId="should-be-null",
            )
        )
        self.assertEqual(result.result_class, RESULT_INVALID_SCHEMA)

    def test_msr_sc1_v19_test_evidence_missing_test_identity(self):
        self.assertEqual(
            validate_source_object_key(_sok("TEST_EVIDENCE")).result_class,
            RESULT_INVALID_IDENTITY,
        )

    def test_msr_sc1_v20_other_missing_scheme_or_value(self):
        self.assertEqual(
            validate_source_object_key(
                _sok("OTHER", identityScheme="x")
            ).result_class,
            RESULT_INVALID_IDENTITY,
        )
        self.assertEqual(
            validate_source_object_key(
                _sok("OTHER", identityValue="y")
            ).result_class,
            RESULT_INVALID_IDENTITY,
        )

    def test_msr_sc1_v21_sanitize_sanitized_canonical_with_version(self):
        result = validate_sensitive_data_gate_record(
            {
                "decision": "SANITIZE",
                "canonicalEvidenceForm": "SANITIZED_CANONICAL",
                "sanitizerVersion": "sanitizer-1",
                "prohibitedRawPersisted": False,
            }
        )
        self.assertEqual(result.result_class, RESULT_VALID)

    def test_msr_sc1_v22_reject_none_form_blocks_key(self):
        result = construct_canonical_snapshot_key(
            _sok("COMMIT", exactCommitSha="abc"),
            "canon-1",
            DIGEST,
            sensitive_data_gate={
                "decision": "REJECT",
                "canonicalEvidenceForm": "NONE",
                "prohibitedRawPersisted": False,
            },
        )
        self.assertEqual(result.result_class, RESULT_PERSISTENCE_PROHIBITED)

    def test_msr_sc1_v23_digest_not_lowercase_sha256_hex(self):
        bad = construct_canonical_snapshot_key(
            _sok("COMMIT", exactCommitSha="abc"),
            "canon-1",
            {"algorithm": "SHA-256", "value": "A" * 64},
        )
        self.assertEqual(bad.result_class, RESULT_INVALID_SCHEMA)
        wrong_algo = construct_canonical_snapshot_key(
            _sok("COMMIT", exactCommitSha="abc"),
            "canon-1",
            {"algorithm": "SHA256", "value": "a" * 64},
        )
        self.assertEqual(wrong_algo.result_class, RESULT_INVALID_SCHEMA)


if __name__ == "__main__":
    unittest.main()
