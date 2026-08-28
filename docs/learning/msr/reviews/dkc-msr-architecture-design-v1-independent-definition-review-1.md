# DKC-MSR-ARCHITECTURE-DESIGN-V1 Independent Definition Review-1

## Review Status

```text
Review: DKC-MSR-ARCHITECTURE-DESIGN-V1 Independent Definition Review-1
Review Date: 2026-08-29 JST
Target Revision: Definition Start
Target Path: docs/learning/msr/dkc-msr-architecture-design-v1.md
Target Commit: 004d95be67302167626b0608d9e36879a87725b5
Target Blob: 86eabbb9b5328177e3197ae3d2168815219f6e0b
Target Bytes: 26246
Encoding: UTF-8
Parent DKC Locked Definition Blob: a17ede815d9c9f3efc4292e9db8d24edca19b9d3
Parent Submission Contract Blob: 26c9764abf41106b9faba5bd5f5bb25323961b7f
Parent Lock Record Blob: 15c9d391f6efdd2efddad7dab8db84abfe9cad39
Accepted MSR Research Content Blob: b6adb8b9d814d0ae9301c7f54e40af16ed87c83d
Research Acceptance Record Blob: 74d476fe53c4f5287b016e89d8d6ce65a8533b37
Verdict: CORRECTION REQUIRED
P0: 0
P1: 3
P2: 2
Architecture Centerline: RETAINED
Parent DKC Compatibility: PASS
Research Basis: ACCEPTED / VERIFIED
Definition Lock: NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: DKC-MSR-ARCHITECTURE-DESIGN-V1 Definition Correction-1
```

---

## 1. Review Scope

The review evaluates the fixed Definition Start artifact against:

```text
Issue #31 Definition Start requirements
Locked DEVELOPMENT-KNOWLEDGE-COMPOUND-V1 boundaries
Accepted MSR-RESEARCH-REPORT-V1 Research Evidence
15 AC-MSR acceptance criteria
Authority / Sensitive Data / Canonical-vs-Derived invariants
```

Research Evidence acceptance is not reopened by this review.

---

## 2. Positive Findings

The architecture centerline is coherent and should be retained:

```text
Source Systems
→ READ-ONLY Source Adapters
→ Sensitive Data Gate
→ Canonical Evidence Snapshot
→ Event Normalizer
→ Evidence-aware Entity Linker
→ Optional Specialized Analyzers
→ DevelopmentEvent@v1 projection
→ DKC Candidate Extraction
→ KnowledgeCandidateSubmission@v1
```

The following boundaries are correctly preserved:

```text
Canonical Evidence != Derived Projection
LLM output != Evidence
LLM output != Authoritative Knowledge
CI execution != specific test verification
SZZ / similarity / LLM inference != Verified Root Cause
Process deviation != Authority Violation
fork / mirror / duplicate != independent replication
Adapter capability != Repository Mutation / Promotion / Execution Authority
```

Sensitive Data Gate placement before Canonical Evidence persistence is correct.

No P0 authority leakage or prohibited automatic promotion was found.

---

## 3. P1 Findings

### P1-1 — MSR-IDENTITY-CANONICAL-KEY-001

**Finding**

`canonicalSnapshotKey.sourceObjectIdentity` is an opaque string while Source Object Identity permits multiple type-specific identity shapes.

The Definition does not specify a deterministic canonical construction / serialization for this field.

Current shape:

```yaml
canonicalSnapshotKey:
  provider: ""
  repositoryId: ""
  sourceObjectType: ""
  sourceObjectIdentity: ""
  canonicalizationVersion: ""
  sanitizedPayloadDigest: ""
```

**Impact**

Two conforming adapters may encode the same object differently, or distinct object identities may be reduced into ambiguous strings.

This weakens deterministic idempotent snapshot resolution and cross-adapter equivalence.

**Required Correction**

Definition Correction-1 must define one of:

```text
A. a typed canonical sourceObjectKey structure per objectType
or
B. a canonical serialization algorithm + field ordering + escaping/version rules
```

The construction must be covered by an invariant and validation scenario.

---

### P1-2 — MSR-LINK-METHOD-CLASS-MAPPING-001

**Finding**

`linkMethod` and `evidenceClass` are independently enumerated but no mandatory mapping is defined.

Current schema allows logically invalid combinations such as:

```text
linkMethod = PLATFORM_RELATION
evidenceClass = MODEL
```

or:

```text
linkMethod = MODEL_INFERENCE
evidenceClass = SOURCE_NATIVE
```

**Impact**

The central requirement to distinguish source-native relations from heuristic/model inference is not schema-deterministic.

**Required Correction**

Definition Correction-1 must define an exact mapping matrix, at minimum:

```text
PLATFORM_RELATION         → SOURCE_NATIVE
EXPLICIT_DECLARATION      → DECLARED
DETERMINISTIC_DERIVATION  → DETERMINISTIC
HEURISTIC_INFERENCE       → HEURISTIC
MODEL_INFERENCE           → MODEL
```

Invalid combinations must reject / HOLD.

Add an invariant and positive / negative validation cases.

---

### P1-3 — MSR-EXTERNAL-VERIFICATION-REF-001

**Finding**

`rationaleCandidate.verificationState` and `inferenceEnvelope.verificationState` allow:

```text
EXTERNALLY_VERIFIED
```

but the schemas do not contain a mandatory external verification / decision reference tied to that state.

The Rationale section states that an external record is required, but its schema contains no field for that reference.

The Inference Envelope permits the state without an equivalent explicit requirement.

**Impact**

A record can self-declare `EXTERNALLY_VERIFIED` without machine-checkable authority provenance.

This creates avoidable ambiguity between inference-state metadata and external verification authority.

**Required Correction**

Add a field such as:

```yaml
externalVerificationRef: null
```

and require:

```text
verificationState = EXTERNALLY_VERIFIED
  → externalVerificationRef MUST be non-null and resolve to an allowed external verification contract

otherwise
  → reject / HOLD
```

The external verification state must remain distinct from Knowledge Promotion / Runtime Authority.

---

## 4. P2 Findings

### P2-1 — MSR-SANITIZED-DERIVED-TERM-001

**Finding**

The Sensitive Data section says a sanitized representation may become Canonical Evidence and may be labeled as `sanitized / redacted derived evidence`.

Elsewhere, `Derived Projection` has a specific non-canonical meaning.

**Impact**

The word `derived` can ambiguously classify sanitized Canonical Evidence as a Derived Projection.

**Required Correction**

Use a separate transformation label, for example:

```text
SANITIZED_CANONICAL_EVIDENCE
REDACTED_CANONICAL_EVIDENCE
```

or explicitly define `sanitizedDerivedEvidence` as a transformation flag that does not imply `DerivedProjection`.

---

### P2-2 — MSR-CONFIDENCE-CONTRACT-001

**Finding**

`confidence` is allowed for heuristic/model links but its type, range, producer, and calibration/version semantics are not defined.

The Definition correctly states that confidence is non-authoritative, so this is not an authority P1 by itself.

**Required Correction**

Either remove `confidence` from the minimum contract or define a bounded metadata structure, for example:

```yaml
confidence:
  value: 0.0
  scale: ZERO_TO_ONE
  producer: ""
  producerVersion: ""
  calibrationRef: null
  nonAuthoritative: true
```

No confidence value may substitute for verification.

---

## 5. Acceptance Criteria Assessment

```text
AC-MSR-01  PASS
AC-MSR-02  PASS
AC-MSR-03  PASS
AC-MSR-04  CORRECTION REQUIRED — P1-1
AC-MSR-05  CORRECTION REQUIRED — P1-2
AC-MSR-06  CORRECTION REQUIRED — P1-2 / P2-2
AC-MSR-07  PASS
AC-MSR-08  PASS
AC-MSR-09  PASS
AC-MSR-10  CORRECTION REQUIRED — P1-3
AC-MSR-11  PASS
AC-MSR-12  PASS
AC-MSR-13  PASS
AC-MSR-14  PASS WITH P2-1 TERMINOLOGY CORRECTION
AC-MSR-15  PASS
```

Summary:

```text
Acceptance Criteria Assessed: 15 / 15
PASS: 10
PASS WITH P2 CORRECTION: 1
CORRECTION REQUIRED: 4
```

---

## 6. Parent Compatibility Assessment

```text
Parent DKC Compatibility: PASS
```

The Definition does not reopen or usurp the locked DKC responsibilities for:

```text
Knowledge Promotion
Authoritative Lifecycle
Validated Scope
Runtime Binding / Eligibility
Execution Authority
```

No Parent DKC Correction is required by this review.

---

## 7. Research Basis Assessment

The accepted MSR Research Evidence identity is fixed and the Human Research Evidence Acceptance record confirms:

```text
Independent Re-Review-2: PASS
Independent Validation: 21 / 21 PASS
Human Research Evidence Acceptance: GO
Research Evidence: ACCEPTED
Design Input Eligibility: AUTHORIZED
```

This Definition Review does not change those research states.

---

## 8. Required Definition Correction-1 Scope

Correction-1 should be narrowly limited to:

```text
1. Canonical sourceObjectKey determinism
2. linkMethod ↔ evidenceClass mandatory mapping
3. mandatory external verification reference for EXTERNALLY_VERIFIED
4. sanitized-vs-derived terminology disambiguation
5. confidence metadata contract or removal
```

The architecture centerline, Parent DKC boundary, CI/Test separation, Root Cause boundary, Process Mining boundary, Cross-Repository independence rules, and Adapter Authority boundary should remain unchanged.

---

## 9. Verdict

```text
DKC-MSR-ARCHITECTURE-DESIGN-V1
Independent Definition Review-1

Target Commit:
004d95be67302167626b0608d9e36879a87725b5

Target Blob:
86eabbb9b5328177e3197ae3d2168815219f6e0b

Target Bytes:
26246

Verdict:
CORRECTION REQUIRED

P0:
0

P1:
3

P2:
2

Architecture Centerline:
RETAINED

Parent DKC Compatibility:
PASS

Definition Lock:
NOT AUTHORIZED

Implementation Start:
NOT AUTHORIZED
```

## 10. Next Gate

```text
DKC-MSR-ARCHITECTURE-DESIGN-V1
Definition Correction-1
```

Correction-1 does not authorize Implementation Start, dependency addition,
Ready, Merge, Deploy, Runtime Activation, or LIVE WRITE.
