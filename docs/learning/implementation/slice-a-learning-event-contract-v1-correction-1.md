# WAEP-LEARNING-SYSTEM-V1

## Slice A — Learning Event Contract

## Implementation Definition Correction-1

### 1. Status

```text
System: WAEP-LEARNING-SYSTEM-V1
Parent Definition: Definition Correction-3
Parent Definition State: LOCKED / CANONICAL ON MAIN
Parent Definition Merge Commit: bc2d4b02d2b674bdd047086bcfa6a9ce3a0457ca
Current-Main Baseline at Correction Start: ebc13ef072a861a53043687af13d9b2c548c73ce
Source Implementation Definition: docs/learning/implementation/slice-a-learning-event-contract-v1.md
Source Review: docs/learning/reviews/slice-a-implementation-definition-review-1.md
Source Review Verdict: PASS WITH CORRECTIONS
Prior P0 / P1 / P2: 0 / 4 / 5
Revision: Implementation Definition Correction-1
Correction State: APPLIED / PENDING INDEPENDENT RE-REVIEW
Implementation Start: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: Independent Implementation Definition Re-Review-2
```

This correction is a normative overlay to the replayed Slice A Implementation Definition.

Where this correction conflicts with the source Implementation Definition, this correction governs for the Correction-1 revision.

Unchanged sections of the source Implementation Definition remain in force.

```text
Correction-1
  != Parent Definition change
  != Implementation Start GO
  != Repository implementation authority
  != Persistence authorization
  != Runtime activation
```

---

### 2. Correction Scope

Correction-1 closes the four P1 findings from Independent Implementation Definition Review-1 and removes the identified P2 ambiguities that could produce divergent implementations.

```text
P1:
LE-A-ID-001
LE-A-RD-001
LE-A-RD-002
LE-A-IA-001
```

The Architecture Centerline and locked parent Definition are unchanged.

---

### 3. LE-A-ID-001 — Revision-only Change Outcome

Canonical Event Identity remains:

```text
sourceEventId + source.contentDigest
```

`sourceRevision` is provenance metadata and does not independently create a new canonical Event Identity.

The previously undefined case is fixed as follows.

```text
same sourceEventId
+
different sourceRevision
+
same source.contentDigest
=
DUPLICATE_NO_OP
```

Required result:

```text
no new Learning Event
existing canonical Learning Event resolved
resolvedLearningEventRef returned
revision metadata difference recorded in the ingestion-attempt audit record
no evidence-strength increase
```

A revision-only metadata change must not manufacture a new Learning Event.

The complete deterministic matrix is:

| sourceEventId | sourceRevision | source.contentDigest | Outcome |
| --- | --- | --- | --- |
| same | same | same | `DUPLICATE_NO_OP` |
| same | different | same | `DUPLICATE_NO_OP` + revision-metadata audit flag |
| same | different | different | distinct canonical Event Identity; admission may continue subject to all other gates |
| same | same | different | `HELD` / `SOURCE_IDENTITY_CONFLICT` |

A different digest does not itself authorize admission.

Release, classification, condition, schema, and other fail-closed checks still apply.

---

### 4. Event Identity Namespace Assumption

For `LearningEvent@v1`, `sourceEventId` must be unique within the Learning Plane identity namespace defined by the source contract.

The ingestion layer must not silently combine repository-local identifiers from incompatible namespaces.

If a source contract cannot establish the required namespace uniqueness, ingestion must return:

```text
HELD
reasonCode: SOURCE_EVENT_NAMESPACE_UNRESOLVED
```

The ingestion layer must not expand canonical Event Identity by silently adding `sourceRepository`.

Changing canonical identity material requires a new Definition correction cycle.

---

### 5. learningEventId Derivation Gate

`learningEventId` must resolve one-to-one to canonical Event Identity.

The concrete derivation algorithm remains an Implementation Design decision, but persistence implementation must not start until the following are version-fixed:

```text
canonicalization algorithm
hash / identifier algorithm
algorithm version
input encoding
collision handling
```

Required design identity:

```text
WAEP-LEARNING-EVENT-IDENTITY@v1
```

A future algorithm version must not reinterpret historical IDs.

---

### 6. Envelope contentDigest Scope

Top-level `LearningEvent.contentDigest` is the digest of the immutable canonical Learning Event envelope.

Its canonicalized input includes the persisted event fields except the top-level `contentDigest` field itself.

It must include the persisted values of:

```text
contractVersion
source
classification
payload
release
lineage
ingestion
learningEventId
```

It must not be substituted by either:

```text
source.contentDigest
payload.allowedPayloadDigest
```

The three digests bind three different objects.

```text
source.contentDigest
  = observed source content

payload.allowedPayloadDigest
  = admitted Learning Payload

LearningEvent.contentDigest
  = immutable canonical Learning Event envelope
```

Canonical serialization rules must be version-fixed before persistence implementation.

---

### 7. LE-A-RD-002 — Normative Release Field Aliases

The following mappings are normative aliases, not approximate semantic correspondence.

```text
LearningEvent.payload.allowedPayloadRef
  ≡ LearningPayloadReleaseDecision.subject.payloadRef

LearningEvent.payload.allowedPayloadDigest
  ≡ LearningPayloadReleaseDecision.subject.payloadDigest

LearningEvent.payload.destinationLearningPlane
  ≡ LearningPayloadReleaseDecision.destination.learningPlane
```

When Release Authority is required, equality of all three values is mandatory against the resolved effective Release Decision.

Any mismatch returns:

```text
HELD
reasonCode: RELEASE_SUBJECT_MISMATCH
no Learning Event
```

No implementation may introduce a second alias mapping without a versioned contract change.

---

### 8. LE-A-RD-001 — Release Resolver Failure Mapping

The ingestion layer consumes the effective Release Decision result but does not implement Decision Store resolution semantics in Slice A.

Resolver outcomes map deterministically as follows.

| Resolver outcome | Ingestion result | Required behavior |
| --- | --- | --- |
| effective `ALLOW` | continue | proceed to remaining admission checks |
| effective `ALLOW_WITH_CONDITIONS` and conditions satisfied | continue | proceed to remaining admission checks |
| effective `ALLOW_WITH_CONDITIONS` and condition state unresolved | `HELD` | no Learning Event |
| effective `DENY` | `DENIED` | no Learning Event |
| effective `HOLD` | `HELD` | no Learning Event |
| missing required Decision | `HELD` | `MISSING_DEPENDENCY`; no Learning Event |
| conflicting effective heads | `HELD` | `AMBIGUOUS_RELEASE_HEAD`; no Learning Event |
| invalid supersession chain | `HELD` | `INVALID_CHAIN`; no Learning Event |
| unresolved canonical resolution identity | `HELD` | `RELEASE_IDENTITY_UNRESOLVED`; no Learning Event |
| malformed resolved Decision contract | `INVALID` | no Learning Event |
| technical resolver failure with no policy result | `HELD` | `RELEASE_RESOLUTION_UNAVAILABLE`; no Learning Event; technical retry may be separately scheduled |

A technical resolver failure must not be interpreted as `ALLOW`.

A policy `DENY` must not be reclassified as a retryable infrastructure failure.

---

### 9. release.required Derivation

`release.required` is an ingestion-derived effective value.

It is derived from:

```text
source classification
+
source policy
+
locked production-sensitive boundary
```

Caller input may request stricter behavior, but it may not weaken the effective requirement.

```text
production-sensitive source
+
caller release.required = false
=
release.required effective = true
```

Unknown source-policy state returns:

```text
HELD
reasonCode: RELEASE_REQUIREMENT_UNRESOLVED
```

---

### 10. ALLOW_WITH_CONDITIONS Evidence Boundary

For `ALLOW_WITH_CONDITIONS`, admission requires condition-satisfaction evidence references sufficient to establish every applicable condition as satisfied.

Slice A does not define the internal schema of the condition evidence.

It does define the fail-closed interface requirement:

```text
all applicable conditions SATISFIED
  → admission may continue

any condition UNSATISFIED
  → DENIED

any condition UNKNOWN / missing / unresolved
  → HELD
```

The ingestion-attempt record must retain the applicable condition evidence references or the reason why resolution failed.

---

### 11. LE-A-IA-001 — Ingestion Attempt Is Mandatory

Every ingestion attempt must produce an auditable companion record.

The contract is mandatory:

```text
LearningEventIngestionAttempt@v1
```

The prior `recommended` wording is superseded.

Minimum required shape:

```yaml
attemptId: ""
contractVersion: "LearningEventIngestionAttempt@v1"
requestedEventIdentity: ""
sourceRef: ""
attemptedAt: ""
result: ""
reasonCodes: []
resolvedLearningEventRef: null
releaseDecisionRef: null
conditionEvidenceRefs: []
revisionMetadataDifference: false
contentDigest: ""
```

Canonical result vocabulary is fixed to:

```text
ADMITTED
DUPLICATE_NO_OP
HELD
DENIED
INVALID
```

`DUPLICATE` and `HOLD` are not separate canonical result values.

They normalize to:

```text
DUPLICATE → DUPLICATE_NO_OP
HOLD      → HELD
```

No attempt may disappear merely because no Learning Event was admitted.

---

### 12. Duplicate Result Payload

`DUPLICATE_NO_OP` must return enough identity to prove which existing event resolved the request.

Required result payload includes:

```text
result = DUPLICATE_NO_OP
requestedEventIdentity
resolvedLearningEventRef
resolvedLearningEventId
resolvedLearningEventContentDigest
reasonCodes
```

A duplicate result with no resolved event identity is invalid.

---

### 13. Revised-event Wording

The prior phrase `may form a distinct Learning Event` is narrowed.

For:

```text
same sourceEventId
+
different sourceRevision
+
different source.contentDigest
```

a distinct canonical Event Identity is formed.

Admission of that distinct identity still depends on all other gates.

Normative wording:

```text
different digest
  → distinct canonical Event Identity
  → continue admission evaluation
  → ADMITTED only if every required gate passes
```

---

### 14. Ingestion Attempt Retention / Query Boundary

The storage technology is not selected by this correction.

The implementation must nevertheless preserve each ingestion-attempt record so that it can be queried by at least:

```text
attemptId
requestedEventIdentity
result
resolvedLearningEventRef
releaseDecisionRef
```

Retention duration is not fixed by this correction and requires a later storage/retention design decision.

Until that decision exists, implementation must not introduce a retention policy that silently deletes audit evidence required by an unresolved review, incident, or authority investigation.

---

### 15. Corrected Admission Order

The deterministic admission order is:

```text
1. Validate LearningEvent input contract.
2. Resolve source identity namespace.
3. Resolve source classification and source policy.
4. Derive effective release.required.
5. Resolve required LearningPayloadReleaseDecision effective head.
6. Apply resolver-failure mapping.
7. Verify normative payload / destination triple binding.
8. Resolve ALLOW_WITH_CONDITIONS evidence when applicable.
9. Compute canonical Event Identity.
10. Resolve duplicate / revision-only / identity-conflict matrix.
11. Apply all remaining validation and authority checks.
12. Atomically persist at most one Learning Event for the canonical Event Identity when admitted.
13. Produce LearningEventIngestionAttempt@v1 for every outcome.
```

Steps may be optimized internally only when observable semantics and fail-closed behavior are unchanged.

No optimization may persist a partial Learning Event before required authority checks complete.

---

### 16. Correction Closure Map

| Finding | Correction | Correction-1 status |
| --- | --- | --- |
| `LE-A-ID-001` | revision-only change deterministically becomes `DUPLICATE_NO_OP` | CORRECTED / PENDING INDEPENDENT RE-REVIEW |
| `LE-A-RD-001` | resolver failure → ingestion result mapping fixed | CORRECTED / PENDING INDEPENDENT RE-REVIEW |
| `LE-A-RD-002` | Release field aliases made normative | CORRECTED / PENDING INDEPENDENT RE-REVIEW |
| `LE-A-IA-001` | ingestion attempt companion contract made mandatory | CORRECTED / PENDING INDEPENDENT RE-REVIEW |

P2 clarifications addressed in this correction include:

```text
sourceEventId namespace assumption
learningEventId derivation design gate
LearningEvent.contentDigest scope
ALLOW_WITH_CONDITIONS fail-closed interface
release.required derivation
resolved duplicate identity payload
revised-event wording
attempt retention/query minimum
canonical result vocabulary
```

Closure is not claimed by the correction author.

Only Independent Implementation Definition Re-Review-2 may determine whether the findings are closed.

---

### 17. Authority Boundary

```text
Parent Definition: LOCKED / UNCHANGED
Implementation Definition Correction-1: APPLIED
Independent Re-Review-2: PENDING
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Repository implementation mutation: NOT AUTHORIZED
Persistence implementation: NOT AUTHORIZED
Decision Store implementation: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Automatic Knowledge Promotion: PROHIBITED
Ready: NOT AUTHORIZED
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
LIVE WRITE: NOT AUTHORIZED
```

The next permissible governance action is independent review of this fixed Correction-1 artifact together with its source Implementation Definition and Review-1 evidence.
