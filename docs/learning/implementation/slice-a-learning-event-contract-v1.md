# WAEP-LEARNING-SYSTEM-V1

## Implementation Definition / Slice A — Learning Event Contract

### 1. Status

```text
System: WAEP-LEARNING-SYSTEM-V1
Parent Definition: Definition Correction-3
Parent Definition State: LOCKED / CANONICAL ON MAIN
Canonical Main Baseline: bc2d4b02d2b674bdd047086bcfa6a9ce3a0457ca
Current Main Exact SHA: ebc13ef072a861a53043687af13d9b2c548c73ce
Source PR #15 Head: c561b13bc989617cb0a21681a65b206d4f82fbb7
Slice: A — Learning Event Contract
Phase: IMPLEMENTATION DEFINITION / CURRENT-MAIN RECONCILIATION
Review-1: PASS WITH CORRECTIONS
Correction-1: NOT COMPLETE
Implementation Start: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Automatic Knowledge Promotion: PROHIBITED
Automatic Runtime Distribution: NOT AUTHORIZED
Next Gate: Slice A Implementation Definition Correction-1
```

This Slice translates the LOCKED Learning Event semantics into an implementable
contract.

It does **not** change the locked Architecture Centerline.

```text
Implementation Definition
  != Implementation Start
  != Repository WRITE
  != Runtime Activation
```

---

### 2. Objective

Define the deterministic contract by which an observed source event may become a
Learning Event inside the WAEP Learning Plane.

Slice A establishes:

- Source identity
- Payload binding
- Release-authority binding
- Event immutability
- Duplicate detection
- Replay idempotency
- Source revision conflict handling
- Fail-closed ingestion
- Audit evidence

Slice A does **not** validate, promote, approve, distribute, bind, or execute
Knowledge.

---

### 3. Architecture Boundary

Canonical ingestion path:

```text
Source Event
    ↓
Source Identification
    ↓
Classification
    ↓
Redaction / Minimization
    ↓
Allowed Payload Construction
    ↓
Release Assessment
    ↓
LearningPayloadReleaseDecision
    ↓
Learning Event Eligibility Check
    ↓
Duplicate / Replay Resolution
    ↓
Immutable Learning Event
```

For non-production-sensitive sources, the Release Decision may not be required
unless source policy explicitly requires it.

For production-sensitive sources:

```text
Missing valid LearningPayloadReleaseDecision
  = Learning Event creation prohibited
```

Successful redaction alone is **not** Release Authority.

---

### 4. Core Invariant

```text
Source Observation
  != Learning Event
  != Evidence
  != Knowledge Candidate
  != Validated Knowledge
  != Approved Knowledge
  != Runtime Authority
```

Creation of a Learning Event proves only that an allowed observation envelope
was admitted to the Learning Plane.

A Learning Event does **not** itself establish:

- Truth
- Root Cause
- Evidence Independence
- Validation
- Promotion
- CURRENT
- Runtime Binding
- Execution Authority

---

### 5. Contract Identity

Canonical contract:

```text
LearningEvent@v1
```

Every persisted Learning Event must identify this contract explicitly.

```yaml
contractVersion: LearningEvent@v1
```

Unrecognized contract versions fail closed.

---

### 6. Learning Event Schema

Minimum canonical schema:

```yaml
learningEventId: "LE-..."
contractVersion: "LearningEvent@v1"
source:
  sourceRepository: ""
  sourceEventId: ""
  sourceArtifactRef: ""
  sourceRevision: ""
  observedAt: ""
  contentDigest: ""
classification:
  sourceClassification: ""
  classificationEvidenceRefs: []
payload:
  allowedPayloadRef: ""
  allowedPayloadDigest: ""
  destinationLearningPlane: ""
release:
  required: true|false
  learningPayloadReleaseDecisionRef: null
lineage:
  derivedFromLearningEventRefs: []
  derivedFromKnowledgeRefs: []
  derivedFromDecisionRefs: []
ingestion:
  ingestedAt: ""
  ingestionContractVersion: "LearningEvent@v1"
contentDigest: ""
```

---

### 7. Required Fields

The following are mandatory for every Learning Event:

```text
learningEventId
contractVersion
source.sourceRepository
source.sourceEventId
source.sourceArtifactRef
source.sourceRevision
source.observedAt
source.contentDigest
classification.sourceClassification
payload.allowedPayloadRef
payload.allowedPayloadDigest
payload.destinationLearningPlane
ingestion.ingestedAt
contentDigest
```

`release.learningPayloadReleaseDecisionRef` is additionally mandatory whenever:

```text
release.required = true
```

or the source is classified as production-sensitive.

Missing mandatory identity is not guessed or substituted.

```text
MISSING REQUIRED FIELD
  → INGESTION HOLD
  → NO LEARNING EVENT
```

---

### 8. Source Identity

The locked Definition establishes the source identity minimum:

```text
sourceRepository
sourceEventId
sourceArtifactRef
sourceRevision
observedAt
contentDigest
```

Implementation must preserve all six.

They represent different semantics.

| Field | Meaning |
| --- | --- |
| sourceRepository | Origin repository / source system identity |
| sourceEventId | Stable identity assigned to the observed source event |
| sourceArtifactRef | Artifact from which the event was observed |
| sourceRevision | Exact observed source revision |
| observedAt | Observation timestamp |
| contentDigest | Digest of the observed source content used by the event |

No field may silently substitute for another.

Examples of forbidden substitution:

```text
commit SHA → sourceEventId        # unless source contract explicitly defines it
observedAt → sourceRevision
filename → contentDigest
repository name → sourceArtifactRef
```

---

### 9. Event Identity

The locked event identity rule remains:

```text
Canonical Event Identity
  = stable identity over
    sourceEventId + source.contentDigest
```

Implementation must use one deterministic canonicalization algorithm.

Conceptually:

```text
eventIdentityMaterial =
  canonical(sourceEventId)
  +
  canonical(source.contentDigest)
```

The algorithm version must be explicit.

Example implementation metadata:

```yaml
identity:
  algorithm: "WAEP-LEARNING-EVENT-IDENTITY@v1"
```

The exact hash function is an implementation choice to be frozen before
persistence implementation begins.

Changing hash algorithms must not silently reinterpret historical event
identity.

---

### 10. learningEventId

`learningEventId` is the immutable identifier of the admitted Learning Event.

It must map deterministically or uniquely to one canonical Event Identity.

The same canonical Event Identity must not create multiple independent Learning
Events.

```text
same sourceEventId
+
same source.contentDigest
  = same Event Identity
```

Therefore:

```text
retry
replay
worker restart
queue redelivery
manual resubmission
```

must not manufacture additional evidence strength.

---

### 11. Payload Boundary

A Learning Event must not embed an unrestricted raw source payload.

It references only the admitted Learning Payload:

```yaml
payload:
  allowedPayloadRef: ""
  allowedPayloadDigest: ""
  destinationLearningPlane: ""
```

`allowedPayloadDigest` binds the Learning Event to the exact payload content
that entered the Learning Plane.

The implementation must not substitute:

```text
source.contentDigest
```

for:

```text
payload.allowedPayloadDigest
```

They represent different objects.

```text
Source Content
  → transformed/minimized payload
  → Allowed Payload
```

Therefore:

```text
source.contentDigest != allowedPayloadDigest
```

is valid and expected after transformation.

---

### 12. Production / Sensitive Source Boundary

Sources containing or potentially containing prohibited production-sensitive
material must pass Release Authority before Learning Event creation.

Examples include:

- personal information
- support records
- disability information
- disease / medical information
- family-specific information
- child-specific information
- customer production data
- credentials
- secrets

The presence of such material does not authorize copying it to the Learning
Plane.

Required path:

```text
Production-sensitive Source
    ↓
Classification
    ↓
Redaction / Minimization
    ↓
Allowed Payload
    ↓
LearningPayloadReleaseDecision@v1
    ↓
ALLOW / ALLOW_WITH_CONDITIONS
    ↓
Learning Event
```

---

### 13. Release Decision Binding

When Release Authority is required, the implementation must resolve the
referenced `LearningPayloadReleaseDecision@v1`.

The resolved effective Decision must bind exactly to:

```text
payload.allowedPayloadRef
+
payload.allowedPayloadDigest
+
payload.destinationLearningPlane
```

Required equality:

```text
LearningEvent.payload.allowedPayloadRef
  = ReleaseDecision.subject.payloadRef
LearningEvent.payload.allowedPayloadDigest
  = ReleaseDecision.subject.payloadDigest
LearningEvent.payload.destinationLearningPlane
  = ReleaseDecision.destination.learningPlane
```

Any mismatch is:

```text
MISSING_DEPENDENCY / AUTHORITY_MISMATCH
  → INGESTION HOLD
  → NO LEARNING EVENT
```

---

### 14. Release Decision Outcome

Only:

```text
ALLOW
ALLOW_WITH_CONDITIONS
```

may permit Learning Event creation.

The following prohibit creation:

```text
DENY
HOLD
UNKNOWN
AMBIGUOUS
INVALID_CHAIN
MISSING_DEPENDENCY
```

`ALLOW_WITH_CONDITIONS` requires all applicable conditions to be satisfied before
the Learning Event is admitted.

Conditions must not be silently ignored.

---

### 15. Classification Boundary

Every Learning Event requires an explicit source classification.

Minimum supported classes remain aligned with the locked Evidence model:

```text
UNTRUSTED
INTERNAL
PRODUCTION
SYNTHETIC
AI_GENERATED
LAB
```

Additional classification values require a versioned contract change.

Unknown classifications fail closed.

```text
UNKNOWN CLASSIFICATION
  → HOLD
  → NO LEARNING EVENT
```

Classification itself does not assert truth.

---

### 16. Duplicate Detection

Duplicate detection occurs **before** a new Learning Event is persisted.

Exact duplicate:

```text
existing.sourceEventId == incoming.sourceEventId
AND
existing.source.contentDigest == incoming.source.contentDigest
```

Result:

```text
DUPLICATE
  → existing Learning Event returned/resolved
  → no new Learning Event
  → no evidence-strength increase
```

A duplicate is not an error requiring automatic retry.

---

### 17. Replay Handling

Replay examples:

- queue redelivery
- manual replay
- worker restart
- network retry
- scheduled reprocessing
- same upstream event delivered twice

For the same canonical Event Identity:

```text
Replay
  → IDEMPOTENT NO-OP
```

It may generate ingestion-attempt audit evidence.

It must not generate:

- new independent evidence
- new Learning Event authority
- new Knowledge Candidate strength
- additional validation weight

---

### 18. Same sourceEventId / Different Digest

If the same `sourceEventId` is observed with a different
`source.contentDigest`, the implementation must not classify it as an exact
duplicate.

It must assess source revision identity.

Expected valid case:

```text
same sourceEventId
different sourceRevision
different contentDigest
```

This may represent a changed source artifact and may form a distinct Learning
Event.

Suspicious case:

```text
same sourceEventId
same sourceRevision
different contentDigest
```

Result:

```text
SOURCE_IDENTITY_CONFLICT
  → HOLD
  → NO AUTOMATIC INGESTION
```

The system must not guess which payload is authoritative.

---

### 19. Immutable Event Rule

Once admitted:

Learning Event content is immutable.

Later changes must not mutate the original event.

Examples:

- Source corrected
- Payload changed
- Classification corrected
- Release Decision superseded
- New root cause learned
- New Evidence generated

must produce appropriate new records, not rewrite the historical Learning Event.

Historical Learning Events remain auditable.

---

### 20. Supersession Boundary

Learning Events are observations.

They are not Knowledge versions and do not use Knowledge Supersession semantics.

A later event may reference an earlier event through lineage:

```yaml
lineage:
  derivedFromLearningEventRefs:
    - "LE-..."
```

but this does not delete or invalidate the prior event automatically.

If a previously admitted event later becomes known to be unreliable, that
reliability outcome must be represented by a separate Decision / Evidence path
defined by later Slices.

Slice A must not invent implicit event deletion authority.

---

### 21. Lineage

Learning Event lineage is provenance only.

```yaml
lineage:
  derivedFromLearningEventRefs: []
  derivedFromKnowledgeRefs: []
  derivedFromDecisionRefs: []
```

These fields allow circular dependency analysis later.

They do not establish independence.

```text
lineage metadata != Independent Evidence Decision
```

A Knowledge-derived output may become a Learning Event, but it cannot thereby
independently validate the Knowledge that produced it.

---

### 22. AI-Generated Events

AI-generated observations must be classified:

```text
AI_GENERATED
```

where applicable.

AI-generated Learning Events may support later investigation.

They cannot by themselves:

- validate Knowledge
- promote Knowledge
- renew CURRENT
- bind Runtime Knowledge
- authorize Execution

No AI-generated event can self-promote.

---

### 23. LAB Events

LAB observations may become Learning Events when allowed by the source boundary.

They remain identifiable as:

```text
LAB
```

LAB Learning Events may contribute to Knowledge Candidate creation.

They must not be interpreted as sufficient CORE Runtime evidence by the
Learning Event layer.

```text
LAB Event admission != CORE adoption
```

---

### 24. Ingestion Attempt

Every attempt to create a Learning Event should be separately auditable.

Recommended contract:

```text
LearningEventIngestionAttempt@v1
```

Minimum shape:

```yaml
attemptId: ""
contractVersion: "LearningEventIngestionAttempt@v1"
requestedEventIdentity: ""
sourceRef: ""
attemptedAt: ""
result:
  ADMITTED
  DUPLICATE
  HOLD
  DENIED
  INVALID
reasonCodes: []
resolvedLearningEventRef: null
releaseDecisionRef: null
contentDigest: ""
```

An Ingestion Attempt is audit evidence.

It is **not** a Learning Event.

---

### 25. Failure Outcome

Invalid or prohibited input must not cause creation of a partial Learning Event.

Validation failure, Release failure, Identity conflict, Missing dependency,
Unsupported classification, Payload digest mismatch, Authority ambiguity:

```text
NO PARTIAL EVENT
+
AUDITABLE INGESTION RESULT
```

The implementation must not create placeholder Learning Events and later
upgrade them to valid events.

---

### 26. Atomicity

Learning Event admission must be atomic with respect to event identity.

Required invariant:

```text
At most one admitted Learning Event
per canonical Event Identity.
```

A pre-insert lookup alone is insufficient as the final uniqueness guarantee in
concurrent execution.

The persistence layer must enforce uniqueness for canonical Event Identity.

This requirement is implementation-level consistency, not Runtime Authority.

---

### 27. Idempotency Result Model

Recommended deterministic outcomes:

```text
ADMITTED
DUPLICATE_NO_OP
HELD
DENIED
INVALID
```

| Result | Meaning |
| --- | --- |
| ADMITTED | New immutable Learning Event stored |
| DUPLICATE_NO_OP | Existing canonical event already represents input |
| HELD | Required authority/dependency unresolved |
| DENIED | Explicit policy/Release Decision prohibits ingestion |
| INVALID | Contract/schema/identity invalid |

These are ingestion processing results.

They are **not** Knowledge Lifecycle states.

---

### 28. Retry Semantics

Retryable technical failures and policy/authority outcomes must remain distinct.

Potential technical retry:

- storage timeout
- transient network failure
- temporary infrastructure unavailable

Not retryable merely because execution is repeated:

- DENIED
- INVALID
- authority HOLD
- payload identity mismatch
- source identity conflict

A retry must never reinterpret DENY as transient failure.

---

### 29. Conditions

When an applicable Release Decision is:

```text
ALLOW_WITH_CONDITIONS
```

the ingestion layer must receive or resolve condition satisfaction evidence.

Unknown condition state:

```text
UNKNOWN
  → HOLD
  → NO LEARNING EVENT
```

No consumer may omit conditions to obtain ALLOW-equivalent behavior.

---

### 30. Digest Rules

Digests bind identity and content.

At minimum:

```text
source.contentDigest
allowedPayloadDigest
LearningEvent.contentDigest
```

represent separate canonical objects.

Implementation must define deterministic canonical serialization before hashing.

Digest verification failure:

```text
DIGEST_MISMATCH
  → INVALID / HOLD
  → NO LEARNING EVENT
```

The specific cryptographic algorithm is not authorized by this Definition and
must be fixed in Implementation Design before persistence code is accepted.

---

### 31. Timestamp Rules

Timestamps used in Learning Event contracts are audit/provenance timestamps.

```text
source.observedAt
ingestion.ingestedAt
```

They must be absolute instants.

Timestamp recency must not determine Authority.

Ingestion must not rewrite `source.observedAt` to the ingestion time.

```text
observedAt != ingestedAt
```

---

### 32. Sensitive Data Minimization

The Learning Event envelope itself must not become a bypass around the Allowed
Payload boundary.

Forbidden in Learning Event metadata:

- raw personal information
- raw support record content
- medical detail
- child/family-specific raw content
- customer production payload
- credentials
- secrets

References must be minimized and appropriate for the Learning Plane.

If an identifier itself is sensitive, the reference must be transformed or
tokenized under the applicable data-handling authority before admission.

---

### 33. Storage Boundary

Slice A defines required persistence semantics, but does not authorize a
specific database.

Required properties:

- append-only event content
- canonical identity uniqueness
- digest preservation
- auditability
- idempotent insert behavior
- transaction-safe uniqueness
- query by sourceEventId
- query by contentDigest
- query by sourceRevision
- query by classification
- query by allowedPayloadRef

Technology selection is out of scope.

---

### 34. API Boundary

Future implementation may expose a conceptual operation:

```text
ingestLearningEvent(candidate)
  → IngestionResult
```

It must not expose:

```text
forceIngest()
bypassRelease()
skipClassification()
ignoreDuplicate()
markIndependent()
autoPromote()
autoBind()
```

as ordinary successful paths.

Administrative repair, if later required, must have a separate authority
contract.

---

### 35. Deterministic Validation Order

Before admission:

1. Validate `LearningEvent@v1` contract version.
2. Validate required source identity.
3. Validate source classification.
4. Resolve allowed payload identity.
5. Determine whether Release Authority is required.
6. When required: resolve canonical `LearningPayloadReleaseDecision` effective head.
7. Validate exact: payloadRef, payloadDigest, destinationLearningPlane.
8. Validate applicable Release conditions.
9. Compute canonical Event Identity.
10. Check exact duplicate.
11. Detect same-sourceEventId identity conflict.
12. Enforce persistence uniqueness.
13. Persist immutable Learning Event atomically.
14. Emit ingestion audit result.

Any unresolved prerequisite before Step 13 means no new Learning Event.

---

### 36. Fail-Closed Matrix

| Condition | Result |
| --- | --- |
| Missing required source identity | INVALID / no event |
| Unsupported contract version | INVALID / no event |
| Unknown source classification | HOLD / no event |
| Required Release Decision missing | HOLD / no event |
| Release Decision DENY | DENIED / no event |
| Release Decision HOLD | HELD / no event |
| Release head ambiguous | HELD / no event |
| Payload ref mismatch | INVALID / no event |
| Payload digest mismatch | INVALID / no event |
| Destination mismatch | INVALID / no event |
| Required condition UNKNOWN | HELD / no event |
| Exact duplicate | DUPLICATE_NO_OP |
| Same event/revision but changed digest | HELD / identity conflict |
| Persistence transient failure | technical failure; no partial event |

---

### 37. Slice A Safety Invariants

```text
INV-LE-A-001  Source Observation does not itself become a Learning Event.
INV-LE-A-002  Learning Event admission does not establish truth or validation.
INV-LE-A-003  Canonical Event Identity is stable over sourceEventId + source contentDigest.
INV-LE-A-004  Exact duplicate ingestion is idempotent.
INV-LE-A-005  Replay does not increase independent evidence strength.
INV-LE-A-006  Production-sensitive ingestion requires applicable Release Authority.
INV-LE-A-007  Learning Event payload must match Release payloadRef + payloadDigest +
              destinationLearningPlane when Release Authority is required.
INV-LE-A-008  Missing / ambiguous / invalid Release Authority fails closed.
INV-LE-A-009  Learning Event content is immutable after admission.
INV-LE-A-010  No partial Learning Event may exist after failed admission.
INV-LE-A-011  Canonical Event Identity uniqueness must be enforced by persistence.
INV-LE-A-012  Source identity conflict must not be resolved by timestamp recency.
INV-LE-A-013  Learning Event lineage cannot self-authorize Evidence independence.
INV-LE-A-014  Learning Event creation grants no Promotion, Runtime, or Execution Authority.
INV-LE-A-015  Sensitive source content cannot bypass Allowed Payload minimization through
              Learning Event metadata.
```

---

### 38. Slice A Acceptance Criteria

```text
AC-LE-A-01  LearningEvent@v1 has a version-fixed schema.
AC-LE-A-02  All canonical source identity fields are required.
AC-LE-A-03  Canonical Event Identity follows the locked sourceEventId + contentDigest rule.
AC-LE-A-04  Exact duplicate ingestion returns DUPLICATE_NO_OP.
AC-LE-A-05  Duplicate/replay does not create additional evidence strength.
AC-LE-A-06  Production-sensitive events cannot be admitted without a valid effective
            LearningPayloadReleaseDecision.
AC-LE-A-07  Release Decision binding is checked against exact payloadRef, payloadDigest,
            and destinationLearningPlane.
AC-LE-A-08  DENY / HOLD / UNKNOWN / AMBIGUOUS do not admit a Learning Event.
AC-LE-A-09  Same sourceEventId + same sourceRevision + different digest fails closed.
AC-LE-A-10  Learning Event is immutable once admitted.
AC-LE-A-11  Persistence guarantees at-most-one admitted event per canonical identity.
AC-LE-A-12  Failed admission leaves no partial Learning Event.
AC-LE-A-13  Every ingestion attempt produces an auditable result.
AC-LE-A-14  AI_GENERATED / LAB classification remains visible in provenance.
AC-LE-A-15  Learning Event admission does not grant validation, promotion, CURRENT,
            binding, or execution authority.
```

---

### 39. Synthetic Acceptance Fixture Matrix

Implementation validation should begin with synthetic fixtures only.

| Fixture | Case | Expected |
| --- | --- | --- |
| FIX-A-001 | Valid SYNTHETIC event | ADMITTED |
| FIX-A-002 | Exact replay of FIX-A-001 | DUPLICATE_NO_OP |
| FIX-A-003 | Same sourceEventId + same revision + changed digest | HELD / SOURCE_IDENTITY_CONFLICT |
| FIX-A-004 | Production-sensitive event + missing Release Decision | HELD / no event |
| FIX-A-005 | Production-sensitive event + DENY | DENIED / no event |
| FIX-A-006 | Production-sensitive event + ALLOW with exact payload binding | ADMITTED |
| FIX-A-007 | ALLOW Decision but payloadDigest mismatch | INVALID / no event |
| FIX-A-008 | ALLOW Decision for different destination | INVALID / no event |
| FIX-A-009 | ALLOW_WITH_CONDITIONS + condition unresolved | HELD / no event |
| FIX-A-010 | AI_GENERATED event | ADMITTED as AI_GENERATED; no promotion implication |
| FIX-A-011 | LAB event | ADMITTED as LAB; no CORE adoption implication |
| FIX-A-012 | Concurrent identical ingestion attempts | exactly one ADMITTED; remaining DUPLICATE_NO_OP |

No production personal data is required for Slice A acceptance testing.

---

### 40. Out of Scope

Slice A does **not** define:

- Knowledge Candidate schema
- Evidence promotion
- Evidence independence Decision
- Validation implementation
- Promotion implementation
- Knowledge Registry persistence
- Decision Store implementation
- Runtime Binding
- Agent Control Plane integration
- Effectiveness evaluation
- automatic extraction
- automatic promotion
- automatic distribution
- model retraining
- production LIVE WRITE

These belong to later Slices / separate Gates.

---

### 41. Implementation Authorization Boundary

Completion or approval of this Implementation Definition does not authorize
code implementation.

```text
Implementation Definition PASS
  != Implementation Start GO
```

After independent review, a separate Human Gate is required.

---

### 42. Slice A Definition Verdict

```text
WAEP-LEARNING-SYSTEM-V1
Implementation Definition
Slice A — Learning Event Contract
Parent Definition: LOCKED
Architecture Centerline: UNCHANGED
LearningEvent@v1: DEFINED
Source Identity: DEFINED
Payload Binding: DEFINED
Release Authority Binding: DEFINED
Duplicate Handling: DEFINED
Replay Idempotency: DEFINED
Identity Conflict: FAIL-CLOSED
Immutability: DEFINED
Atomic Uniqueness: REQUIRED
Sensitive Data Boundary: RETAINED
Implementation Start: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Next Gate: Slice A — Independent Implementation Definition Review-1
```
