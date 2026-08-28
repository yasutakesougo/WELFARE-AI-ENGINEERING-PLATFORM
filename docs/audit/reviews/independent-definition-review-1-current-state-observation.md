# Independent Definition Review-1 Evidence Record

Definition: WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1
Review: Independent Definition Review-1
Review date: 2026-08-28 JST
Review result: CORRECTION REQUIRED
P0: 0
P1: 5
P2: 5
Definition Lock: NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
Repository Migration: NOT AUTHORIZED
Ready / Merge / Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED

## Evidence status

This record preserves the review supplied for Correction-1. It is historical
review evidence, not a current authority decision. The review's central
principles are retained:

Current State is resolved.
Observed State is recorded.
Historical Evidence is preserved.
Authority is decided separately.

## Findings preserved for Correction-1

| ID | Finding | Required correction |
| --- | --- | --- |
| CSOC-AUTH-PLANE-001 | Technical State and Authority precedence were mixed. | Separate Technical State Resolution and Authority Resolution. |
| CSOC-OBS-ATOMICITY-001 | Composite Observation had no interval or identity consistency contract. | Add start/completion times, before/after identities, and consistency result. |
| CSOC-SOURCE-TRUST-001 | LOCAL_GIT could be mistaken for remote authority. | Add source authority class and prohibit local-only remote resolution. |
| CSOC-FAILURE-CONTRACT-001 | Retrieval failure had no canonical record shape. | Add result, failure class, unavailable fields, error references, retryability. |
| CSOC-GATE-BINDING-001 | Live Observation was not formally bound to Mutation Action. | Add GateBoundObservation, expected SHA semantics, immediate rereads, and single-use consumption. |
| CSOC-DEFAULT-BRANCH-NAME-001 | observedMainSha was not branch-general. | Rename to observedDefaultBranchSha. |
| CSOC-REPO-IDENTITY-001 | Owner/name identity was rename-sensitive. | Add stable repositoryId and host; prefer stable ID. |
| CSOC-BRANCH-RELATION-NULL-001 | Failed relation resolution had no nullability semantics. | Require relation fields only for complete resolution; prohibit guesses. |
| CSOC-PROVENANCE-001 | Retrieval provenance was insufficient. | Require source system, method, resource, and retrieval time. |
| CSOC-RECORD-IMMUTABILITY-001 | Observation immutability and supersession were undefined. | Make records append-only and prohibit ID reuse or overwrite. |

## Review conclusion

Architecture direction was supported, but Definition Lock was not authorized.
Correction-1 was required before Independent Definition Re-Review-1. The
corresponding corrected contract is recorded in
docs/audit/waep-current-state-observation-contract-v1.md.
