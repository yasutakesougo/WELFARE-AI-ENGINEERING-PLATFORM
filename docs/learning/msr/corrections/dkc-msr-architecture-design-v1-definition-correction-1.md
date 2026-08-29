# DKC-MSR-ARCHITECTURE-DESIGN-V1 — Definition Correction-1

## 0. Correction Status

```text
Definition: DKC-MSR-ARCHITECTURE-DESIGN-V1
Revision: Definition Correction-1
Correction Type: NORMATIVE DELTA
Applies To Revision: Definition Start
Reviewed Start Commit: 004d95be67302167626b0608d9e36879a87725b5
Reviewed Start Blob: 86eabbb9b5328177e3197ae3d2168815219f6e0b
Source Review: Independent Definition Review-1
Source Review Blob: 5bb7f398bb338ce898ddef76c39124338fc4250a
Architecture Centerline: RETAINED
Parent DKC Compatibility: RETAINED / PASS
Definition State: DRAFT / NOT LOCKED
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Repository Source Adapter Execution: NOT AUTHORIZED
Ready / Merge / Deploy / Runtime Activation / LIVE WRITE: NOT AUTHORIZED
Next Gate: Independent Definition Re-Review-1
```

This Correction is a normative delta over the exact Definition Start artifact above.

For Re-Review-1, the effective Definition is:

```text
Effective Definition
  = Definition Start blob 86eabbb9b5328177e3197ae3d2168815219f6e0b
  + this Definition Correction-1 artifact
```

Where this Correction conflicts with the Definition Start text, this Correction governs only the five Review-1 findings listed below.

No other Architecture, Parent DKC, authority, CI/Test, Root Cause, Process Mining, Cross-Repository, or Adapter Authority semantics are reopened.

---

## 1. Correction Scope

Definition Correction-1 closes only:

```text
P1  MSR-IDENTITY-CANONICAL-KEY-001
P1  MSR-LINK-METHOD-CLASS-MAPPING-001
P1  MSR-EXTERNAL-VERIFICATION-REF-001
P2  MSR-SANITIZED-DERIVED-TERM-001
P2  MSR-CONFIDENCE-CONTRACT-001
```

```text
P0 scope changes: 0
Architecture centerline changes: 0
Parent DKC authority changes: 0
Technology adoption decisions: 0
Implementation authorization: 0
```

---

## 2. P1-1 — Canonical Source Object Key Determinism

### 2.1 Opaque identity string is superseded

The Definition Start field:

```yaml
sourceObjectIdentity: ""
```

must not be used as an unconstrained opaque identity string.

It is superseded by `sourceObjectKey`.

### 2.2 Typed sourceObjectKey

```yaml
sourceObjectKey:
  keyVersion: SOURCE_OBJECT_KEY_V1
  provider: ""
  repositoryId: ""
  objectType: ISSUE|PULL_REQUEST|REVIEW|COMMIT|CHANGED_FILE|CHECK_RUN|CHECK_SUITE|WORKFLOW_RUN|JOB|TEST_EVIDENCE|ADR|DEFINITION|REVIEW_RECORD|OTHER
  identity:
    providerObjectId: null
    exactCommitSha: null
    pathSnapshot: null
    contentBlobId: null
    testIdentity: null
    identityScheme: null
    identityValue: null
```

Only the members required by the selected `objectType` participate in the canonical key.

Unused identity members MUST be `null` and MUST NOT be replaced by empty strings.

### 2.3 Required identity members by objectType

| objectType | Required canonical identity members |
| --- | --- |
| `ISSUE` | `providerObjectId` |
| `PULL_REQUEST` | `providerObjectId` |
| `REVIEW` | `providerObjectId` |
| `COMMIT` | `exactCommitSha` |
| `CHANGED_FILE` | `exactCommitSha` + `pathSnapshot` |
| `CHECK_RUN` | `providerObjectId` |
| `CHECK_SUITE` | `providerObjectId` |
| `WORKFLOW_RUN` | `providerObjectId` |
| `JOB` | `providerObjectId` |
| `TEST_EVIDENCE` | `testIdentity` + an execution/source object reference outside this key |
| `ADR` | `exactCommitSha` + `pathSnapshot`; `contentBlobId` SHOULD be retained when available |
| `DEFINITION` | `exactCommitSha` + `pathSnapshot`; `contentBlobId` SHOULD be retained when available |
| `REVIEW_RECORD` | `exactCommitSha` + `pathSnapshot`; `contentBlobId` SHOULD be retained when available |
| `OTHER` | `identityScheme` + `identityValue` |

If required members cannot be established, the adapter MUST emit:

```text
identityState = UNVERIFIABLE
Canonical snapshot persistence = HOLD
```

It must not synthesize an identity from mutable title, branch, URL, timestamp, or display name.

### 2.4 Path normalization for canonical identity

When `pathSnapshot` participates in identity, adapters MUST normalize it as follows before key comparison:

```text
Encoding: UTF-8
Unicode normalization: NFC
Separator: "/"
Leading "./": removed
Repeated "/": collapsed to one
Dot segment ".": removed
Parent segment "..": MUST NOT be resolved; presence => INVALID / HOLD
Leading "/": removed for repository-relative paths
Case: preserved; no case folding
Percent / URL decoding: NOT performed
Trailing "/": removed except an empty path is invalid
```

### 2.5 Canonical snapshot key V1

The Definition Start `canonicalSnapshotKey` is superseded by:

```yaml
canonicalSnapshotKey:
  keyVersion: CANONICAL_SNAPSHOT_KEY_V1
  sourceObjectKey: {}
  canonicalizationVersion: ""
  sanitizedPayloadDigest:
    algorithm: SHA-256
    value: "lowercase-hex"
```

Equality is field-wise equality over the typed structure after the normalization rules above.

If a serialized key is required for storage or hashing, `CANONICAL_SNAPSHOT_KEY_V1` serialization is:

```text
UTF-8 JSON
Unicode strings normalized to NFC
No insignificant whitespace
Object member order exactly:
  keyVersion
  sourceObjectKey
  canonicalizationVersion
  sanitizedPayloadDigest
sourceObjectKey member order exactly:
  keyVersion
  provider
  repositoryId
  objectType
  identity
identity member order exactly:
  providerObjectId
  exactCommitSha
  pathSnapshot
  contentBlobId
  testIdentity
  identityScheme
  identityValue
sanitizedPayloadDigest member order exactly:
  algorithm
  value
JSON string escaping follows JSON syntax; no adapter-specific escaping is permitted
```

Different adapters observing the same canonical identity MUST produce equal canonical keys.

`retrievedAt`, URL snapshots, mutable names, branch names, and display metadata MUST NOT participate in `CANONICAL_SNAPSHOT_KEY_V1`.

---

## 3. P1-2 — Mandatory linkMethod ↔ evidenceClass Mapping

The link fields are not independent enumerations.

The following mapping is mandatory and one-to-one:

| linkMethod | required evidenceClass |
| --- | --- |
| `PLATFORM_RELATION` | `SOURCE_NATIVE` |
| `EXPLICIT_DECLARATION` | `DECLARED` |
| `DETERMINISTIC_DERIVATION` | `DETERMINISTIC` |
| `HEURISTIC_INFERENCE` | `HEURISTIC` |
| `MODEL_INFERENCE` | `MODEL` |

A record with any other combination is invalid.

```text
Invalid mapping
  → linkValidation = INVALID
  → valid EvidenceEntityLink@v1 MUST NOT be emitted
  → downstream single-link resolution = HOLD
```

Examples:

```text
PLATFORM_RELATION + MODEL       → INVALID / HOLD
MODEL_INFERENCE + SOURCE_NATIVE → INVALID / HOLD
HEURISTIC_INFERENCE + HEURISTIC → VALID mapping, subject to inference envelope rules
```

`evidenceClass` is therefore a deterministic function of `linkMethod` in V1.

Consumers MUST NOT overwrite the mapped class based on confidence.

---

## 4. P1-3 — External Verification Reference Contract

### 4.1 Machine-checkable external verification reference

Both `rationaleCandidate` and `inferenceEnvelope` are corrected to include:

```yaml
externalVerificationRef: null
```

The reference, when non-null, MUST resolve to a versioned external verification record.

Allowed V1 contract types are:

```text
KnowledgeVerificationDecision@v1
KnowledgeValidationDecision@v1
```

A future contract type is not automatically allowed by name similarity.

It requires a Definition revision or an explicitly versioned allowed-contract registry referenced by a later Definition.

### 4.2 Corrected rationaleCandidate

```yaml
rationaleCandidate:
  candidateId: ""
  statement: ""
  evidenceRefs: []
  inferenceEnvelopeRef: null
  verificationState: UNVERIFIED|EVIDENCE_LINKED|EXTERNALLY_VERIFIED
  externalVerificationRef: null
```

### 4.3 Corrected inferenceEnvelope

```yaml
inferenceEnvelope:
  inferenceId: ""
  isInferred: true
  inferenceMethod: HEURISTIC|MODEL
  modelId: null
  modelVersion: null
  heuristicId: null
  heuristicVersion: null
  sourceRefs: []
  schemaId: ""
  schemaValidation: PASS|FAIL|NOT_RUN
  referenceValidation: PASS|FAIL|PARTIAL|NOT_RUN
  producedAt: ""
  verificationState: UNVERIFIED|EVIDENCE_LINKED|EXTERNALLY_VERIFIED
  externalVerificationRef: null
  outputDigest: ""
```

### 4.4 State derivation rule

```text
verificationState = EXTERNALLY_VERIFIED
  requires:
    externalVerificationRef != null
    referenced record resolves successfully
    referenced contractType is allowed
    referenced decision applies to this candidate/inference identity
    referenced decision result satisfies that external contract's verification semantics

any requirement missing / unresolved / stale / mismatched
  → EXTERNALLY_VERIFIED is invalid
  → effective verification state MUST NOT exceed EVIDENCE_LINKED
  → authority-sensitive consumer = HOLD
```

`EXTERNALLY_VERIFIED` is therefore not a self-assertable boolean.

The external decision remains external authority.

```text
EXTERNALLY_VERIFIED
  != Knowledge Promotion
  != Validated Scope
  != Runtime Binding
  != Execution Authority
```

---

## 5. P2-1 — Sanitized Canonical Evidence Terminology

The Definition Start field and phrase:

```text
sanitizedDerivedEvidence
sanitized / redacted derived evidence
```

are superseded because `Derived Projection` already has a distinct non-canonical meaning.

### 5.1 Canonical evidence form

The Sensitive Data Gate output uses:

```yaml
sensitiveDataGate:
  decision: ALLOW|SANITIZE|REJECT
  policyVersion: ""
  redactionClasses: []
  sanitizerVersion: null
  canonicalEvidenceForm: SOURCE_NATIVE_CANONICAL|SANITIZED_CANONICAL|REDACTED_CANONICAL|NONE
  prohibitedRawPersisted: false
```

Rules:

```text
ALLOW    → SOURCE_NATIVE_CANONICAL unless another canonical transformation is explicitly defined
SANITIZE → SANITIZED_CANONICAL or REDACTED_CANONICAL
REJECT   → NONE and no Canonical Evidence payload persistence
```

`SANITIZED_CANONICAL` and `REDACTED_CANONICAL` are Canonical Evidence forms after the Sensitive Data Gate.

They are NOT `DerivedProjection` records.

A later AST, graph, index, inference, or process-log generated from them remains a Derived Projection under the existing Definition Start rules.

---

## 6. P2-2 — Confidence Metadata Contract

### 6.1 Corrected field

The opaque `confidence: null` field is superseded by the optional structure:

```yaml
confidence:
  value: 0.0
  scale: ZERO_TO_ONE
  producer: ""
  producerVersion: ""
  calibrationRef: null
  nonAuthoritative: true
```

### 6.2 Validity rules

For `HEURISTIC_INFERENCE` and `MODEL_INFERENCE`, `confidence` MAY be present.

If present:

```text
value:
  finite numeric value
  0.0 <= value <= 1.0

scale:
  exactly ZERO_TO_ONE

producer:
  non-empty stable producer/model/heuristic identifier

producerVersion:
  non-empty version identifier

nonAuthoritative:
  MUST equal true

calibrationRef:
  optional evidence/reference only
```

For `PLATFORM_RELATION`, `EXPLICIT_DECLARATION`, and `DETERMINISTIC_DERIVATION`:

```text
confidence MUST be null in EvidenceEntityLink@v1
```

A producer wishing to express source quality or declaration strength must use a separately defined evidence-quality contract; it must not overload inference confidence.

### 6.3 Authority rule

```text
confidence.value
  != probability of truth
  != Verification
  != Root Cause confirmation
  != Knowledge Promotion
  != Runtime Authority
```

A higher confidence value MUST NOT override `CONFLICT`, `UNKNOWN`, invalid link mapping, or missing external verification.

---

## 7. Corrected Invariants

The Definition Start invariants remain in force.

Definition Correction-1 adds:

```text
INV-MSR-018  Canonical Snapshot V1 uses typed sourceObjectKey; opaque adapter-defined source identity strings are prohibited.
INV-MSR-019  linkMethod deterministically maps to exactly one evidenceClass; invalid combinations fail closed.
INV-MSR-020  EXTERNALLY_VERIFIED requires a resolvable allowed external verification reference and is not self-assertable.
INV-MSR-021  SANITIZED_CANONICAL / REDACTED_CANONICAL are Canonical Evidence forms and are not Derived Projections.
INV-MSR-022  Inference confidence is bounded, versioned, non-authoritative metadata and cannot override conflict or verification state.
```

---

## 8. Correction Validation Scenarios

```text
MSR-C1-V18 Same GitHub issue observed by REST and GraphQL adapters
          → identical SOURCE_OBJECT_KEY_V1 and CANONICAL_SNAPSHOT_KEY_V1 when canonical payload digest matches.

MSR-C1-V19 CHANGED_FILE paths "./src//a.ts" and "src/a.ts"
          → normalize to the same canonical path; path containing ".." → INVALID / HOLD.

MSR-C1-V20 PLATFORM_RELATION + SOURCE_NATIVE
          → valid link mapping.

MSR-C1-V21 PLATFORM_RELATION + MODEL
          → invalid mapping; no valid EvidenceEntityLink@v1 emitted; HOLD.

MSR-C1-V22 verificationState=EXTERNALLY_VERIFIED with externalVerificationRef=null
          → invalid; state cannot exceed EVIDENCE_LINKED; authority-sensitive consumer HOLD.

MSR-C1-V23 EXTERNALLY_VERIFIED with resolved allowed KnowledgeVerificationDecision@v1 applying to target identity
          → state may be EXTERNALLY_VERIFIED; no Promotion/Runtime authority implied.

MSR-C1-V24 Sensitive Data Gate SANITIZE
          → canonicalEvidenceForm=SANITIZED_CANONICAL or REDACTED_CANONICAL; not DerivedProjection.

MSR-C1-V25 MODEL_INFERENCE confidence value=1.2 or nonAuthoritative=false
          → invalid confidence metadata.

MSR-C1-V26 MODEL_INFERENCE confidence value=0.82 with producer + producerVersion + nonAuthoritative=true
          → valid metadata only; Verification state unchanged.

MSR-C1-V27 Higher model confidence conflicts with source-native evidence
          → conflict preserved; confidence cannot resolve or suppress CONFLICT.
```

---

## 9. Acceptance Criteria Closure Mapping

```text
AC-MSR-04
  → sourceObjectKey typed identity + CANONICAL_SNAPSHOT_KEY_V1 deterministic equality/serialization

AC-MSR-05
  → mandatory one-to-one linkMethod ↔ evidenceClass mapping

AC-MSR-06
  → deterministic mapping + bounded optional confidence metadata

AC-MSR-10
  → externalVerificationRef required for EXTERNALLY_VERIFIED + versioned inference metadata retained

AC-MSR-14 P2 terminology
  → canonicalEvidenceForm distinguishes sanitized canonical forms from DerivedProjection
```

All other Definition Start Acceptance Criteria and boundaries are unchanged.

---

## 10. Review-1 Finding Closure Claim

Correction author claims the following are addressed, subject to Independent Re-Review-1:

| Finding | Correction | Closure Claim |
| --- | --- | --- |
| `MSR-IDENTITY-CANONICAL-KEY-001` | §§2, 7, 8 | ADDRESSED / PENDING RE-REVIEW |
| `MSR-LINK-METHOD-CLASS-MAPPING-001` | §§3, 7, 8 | ADDRESSED / PENDING RE-REVIEW |
| `MSR-EXTERNAL-VERIFICATION-REF-001` | §§4, 7, 8 | ADDRESSED / PENDING RE-REVIEW |
| `MSR-SANITIZED-DERIVED-TERM-001` | §§5, 7, 8 | ADDRESSED / PENDING RE-REVIEW |
| `MSR-CONFIDENCE-CONTRACT-001` | §§6, 7, 8 | ADDRESSED / PENDING RE-REVIEW |

Correction author does not mark these findings independently CLOSED.

---

## 11. Authority Boundary

```text
Definition Correction-1
  != Independent Re-Review PASS
  != Human Definition Lock GO
  != Implementation Start GO
  != Technology Adoption
  != Dependency Addition
  != Ready GO
  != Merge GO
  != Deploy GO
  != Runtime Activation
  != LIVE WRITE
```

Parent DKC remains locked at its separately fixed identity.

This Correction grants no authority to modify the locked Parent DKC artifact.

---

## 12. Next Gate

```text
DKC-MSR-ARCHITECTURE-DESIGN-V1
Independent Definition Re-Review-1

Review Target:
  Definition Start blob 86eabbb9b5328177e3197ae3d2168815219f6e0b
  + Definition Correction-1 exact artifact identity
```
