# DKC-IMPLEMENTATION-SCOPE-V1 — Independent Scope Review-1

## Review Status

```text
Review: DKC-IMPLEMENTATION-SCOPE-V1 Independent Scope Review-1
Review Date: 2026-08-29 JST
Scope ID: DKC-IMPLEMENTATION-SCOPE-V1
Target Slice: Slice A — Pure Domain Contracts / Candidate Resolution Kernel
Target Revision: Definition Start
Target Path: docs/learning/dkc-implementation-scope-v1.md
Target Commit: 0fa88bfa63ec7dbab87d08a339ff622e63cde144
Target Blob: daa96266c09b043cd27f7060b30b9f5fdd8bf7e3
Target Bytes: 13630
Parent DKC Locked Definition Blob: a17ede815d9c9f3efc4292e9db8d24edca19b9d3
Parent Submission Contract Blob: 26c9764abf41106b9faba5bd5f5bb25323961b7f
Parent Human Lock Record Blob: 15c9d391f6efdd2efddad7dab8db84abfe9cad39
Verdict: CORRECTION REQUIRED
P0: 0
P1: 3
P2: 2
Parent DKC Compatibility: PASS WITH SCOPE CORRECTIONS REQUIRED
Scope Boundary: RETAINED
Implementation Start: NOT AUTHORIZED
Repository Implementation Mutation: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime External I/O: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: DKC-IMPLEMENTATION-SCOPE-V1 Scope Correction-1
```

The proposed Slice A is appropriately narrower than the locked DKC Definition and preserves the core authority boundary. The review does not require widening the slice.

The remaining findings concern deterministic executable semantics and reproducibility before Human Implementation Start may be reconsidered.

---

## 1. Positive Findings

### PASS-1 — Parent locked identity is exact

The Scope binds the exact locked DKC Definition, Submission Contract, and Human Lock Record.

No Parent DKC semantic reopening was detected.

### PASS-2 — Slice A is materially narrower than the locked DKC Definition

Included responsibilities are limited to pure domain contracts, validation, candidate resolution identity, replay/version classification, and authority-field rejection.

The Scope explicitly excludes source acquisition, MSR adapters, LLM extraction, persistence, retrieval, metrics, external authority decisions, Runtime Binding, production I/O, and external mutation.

### PASS-3 — Allowed repository mutation paths are closed-world

Future implementation mutation is limited to:

```text
packages/development-knowledge-compound-kernel/**
docs/audit/dkc-impl-slice-a-*.md
```

No root workflow, root manifest, governance contract, locked Definition, production configuration, or unrelated package mutation is authorized by this Scope.

### PASS-4 — Runtime I/O boundary is PURE_DOMAIN

The Scope denies NETWORK, DATABASE, product FILESYSTEM I/O, PROCESS/SHELL, GIT, GitHub API, HTTP, queue/cache service, environment secret access, SharePoint/M365, cloud storage, and production log ingestion.

### PASS-5 — Persistence is explicitly denied

Candidate/Event/Evidence/Derived persistent stores are all outside Slice A.

### PASS-6 — Parent candidate resolution identity is preserved

The Scope retains the locked parent key members:

```text
contractType = KnowledgeCandidate@v1
sourceRepository
sourceEventId
contentDigest
```

It also retains replay idempotency and changed-digest new-version intent.

### PASS-7 — Structured evidence relation is preserved

The Scope retains:

```text
SUPPORTING
CONTRADICTING
INCONCLUSIVE
```

and rejects bare string `evidenceRefs`.

### PASS-8 — Independent implementation evidence remains mandatory

The Scope requires exact implementation commit, package tree, locked Definition identity, reviewed Scope identity, toolchain versions, exact commands, exit codes, test counts, repository status, and independent verifier environment.

Local implementer PASS alone is not accepted as Independent Implementation PASS.

### PASS-9 — Rollback does not mutate locked Definitions

Rollback is constrained to the Slice A package/audit artifacts and explicitly excludes locked DKC and DKC-MSR artifacts.

---

## 2. P1 Findings

### P1-1 — DKC-SCOPE-PRIOR-STATE-CONTRACT-001

**Problem**

The Scope requires deterministic outcomes:

```text
VALID_NEW
VALID_EXISTING_IDEMPOTENT
VALID_NEW_VERSION
```

and states that equal input must produce equal resolution outcome when compared against the same supplied prior-domain state.

However, the Scope does not define the prior-domain state input contract.

There is no deterministic specification for:

```text
which prior candidate identities are supplied
how they are keyed
how an existing exact resolution key is represented
how prior versions sharing sourceRepository + sourceEventId are represented
how invalid / duplicate prior entries are handled
what happens when prior state is incomplete or contradictory
```

Without that input contract, two conforming implementations may classify the same Candidate as `VALID_NEW` or `VALID_NEW_VERSION` differently.

**Required Correction**

Define a pure input contract such as a versioned `CandidateResolutionContext` or equivalent that contains only already-provided prior-domain state.

It must deterministically define at minimum:

```text
exact-resolution-key lookup
same-source-event prior-version lookup
prior candidate reference identity
duplicate prior entry handling
incomplete / conflicting prior state → HOLD_UNKNOWN or explicit invalid result
```

The kernel must not read persistence to obtain this state.

---

### P1-2 — DKC-SCOPE-CANDIDATE-SCHEMA-CLOSED-WORLD-001

**Problem**

The Scope says Slice A performs `Pure schema validation`, but `KnowledgeCandidateDraft` is only named as a type and is not fully defined as a closed-world schema.

The locked DKC Definition requires minimum Candidate content including candidate/version identity, Observation/Problem/Suspected Root Cause/Proposed Rule separation, source refs, structured evidence refs, proposed scope, creation provenance, created time, and content digest.

The Scope currently specifies only selected sub-shapes.

Authority rejection is also expressed as `including at minimum`, while the locked DKC additionally prohibits self-declaration such as `selfApprovalEligible`, `verified`, and equivalent authority fields.

Therefore an implementation could pass the named tests while still accepting an incomplete Candidate or an unlisted authority-bearing field.

**Required Correction**

Define a versioned closed-world `KnowledgeCandidateDraft` validation contract for Slice A.

It must state:

```text
required fields
optional fields
unknown-field policy
field type constraints
empty/non-empty rules where material
forbidden authority fields
selfApprovalEligible / verified / equivalent authority declarations handling
nonAuthoritative annotation handling if supported
```

Unknown or authority-bearing fields must fail closed according to a deterministic result class.

Slice A must not invent new Authoritative Knowledge fields.

---

### P1-3 — DKC-SCOPE-TOOLCHAIN-REPRODUCIBILITY-001

**Problem**

The Scope requires future typecheck/schema conformance and independent exact-artifact test execution, but does not fix the implementation/toolchain contract.

At the parent branch identity reviewed here, no repository package/toolchain manifest is present for the proposed new kernel package.

The Scope simultaneously states:

```text
New runtime dependencies: NOT AUTHORIZED
Any new package dependency not already approved requires a separate dependency decision
root package manifest changes are outside allowed paths
```

Therefore the executable route for `typecheck` and tests is not reproducibly defined before Implementation Start.

A future implementer could otherwise choose incompatible languages, package managers, compiler versions, test runners, or introduce undeclared dev dependencies.

**Required Correction**

Fix the Slice A implementation toolchain boundary before Human Implementation Start.

At minimum define:

```text
implementation language
runtime/toolchain major version
package manager or no-package-manager rule
package-local manifest/lockfile policy
compiler/typecheck mechanism
unit-test mechanism
whether devDependencies are permitted
exact authority required before adding any dependency
allowed package-local configuration paths
```

If the design chooses a zero-new-dependency implementation, the exact reproducible verifier commands must be defined without relying on undeclared global tools.

---

## 3. P2 Findings

### P2-1 — DKC-SCOPE-EVIDENCE-DEDUP-SEMANTICS-001

`DKC-A-V04` requires replay not to duplicate `evidenceRefs`, but duplicate equality is not defined.

The Scope should define whether equality is based on:

```text
evidenceRef only
or evidenceRef + relation
or another versioned structured key
```

It must also define deterministic behavior when the same `evidenceRef` appears with different relations.

The correction must preserve contradictory evidence rather than silently rewriting or dropping it.

---

### P2-2 — DKC-SCOPE-RESULT-PAYLOAD-CONTRACT-001

The Scope enumerates result class names but does not define the returned result payload shape.

Define a versioned discriminated result contract that makes independent verification deterministic, including at minimum:

```text
result class
resolution key when valid
candidate/prior reference when applicable
validation error identifiers
HOLD_UNKNOWN reason identifiers
no-authority marker or equivalent non-authoritative boundary
```

This is especially important because downstream implementation review must compare exact behavior rather than only string labels.

---

## 4. Independent Scope Review Checklist

```text
[PASS] Parent DKC locked identity is exact.
[PASS] Slice A responsibilities are narrower than the locked DKC Definition.
[PASS] Allowed repository paths are closed-world.
[PASS] Runtime I/O boundary is PURE_DOMAIN.
[PASS] Persistence is explicitly prohibited.
[PARTIAL / P1] Dependency authority is not silently granted, but reproducible toolchain/dependency execution is not fixed.
[PARTIAL / P1] Candidate resolution key matches locked DKC, but prior-domain state contract required for deterministic result classification is absent.
[PARTIAL / P2] structured evidenceRefs match locked DKC, but duplicate/conflicting reference equality semantics are absent.
[PARTIAL / P1] Authority fields are outside Slice A, but closed-world Candidate schema and full authority-field rejection are not fixed.
[PARTIAL] Tests cover main scenarios but need new scenarios for the findings above.
[PASS] Independent exact-artifact implementation evidence is required.
[PASS] Rollback does not mutate locked Definition artifacts.
```

---

## 5. Required Scope Correction-1 Validation Additions

Scope Correction-1 should add tests/scenarios at minimum for:

```text
DKC-SC1-V15 Empty prior context + valid Candidate
            → VALID_NEW.

DKC-SC1-V16 Exact resolution key already present in supplied prior context
            → VALID_EXISTING_IDEMPOTENT.

DKC-SC1-V17 Same sourceRepository/sourceEventId but different prior contentDigest
            → VALID_NEW_VERSION.

DKC-SC1-V18 Conflicting/incomplete prior context
            → deterministic HOLD_UNKNOWN / invalid outcome.

DKC-SC1-V19 Candidate missing a locked required Candidate field
            → INVALID_SCHEMA.

DKC-SC1-V20 Candidate self-declares selfApprovalEligible or verified
            → INVALID_AUTHORITY_FIELD.

DKC-SC1-V21 Unknown Candidate field under closed-world schema
            → deterministic rejection.

DKC-SC1-V22 Duplicate evidenceRef under the defined equality key
            → deterministic dedup/rejection behavior.

DKC-SC1-V23 Same evidenceRef with conflicting relation
            → deterministic conflict-preserving behavior; no silent strengthening.

DKC-SC1-V24 Fresh verifier uses the exact declared toolchain with no undeclared global dependency
            → PASS.
```

---

## 6. Authority Boundary

This review does not authorize implementation.

```text
Independent Scope Review-1
  != Scope Correction closure
  != Human Implementation Start GO
  != Repository Implementation Mutation
  != Dependency Addition
  != Persistence
  != Runtime I/O
  != Ready
  != Merge
  != Deploy
  != LIVE WRITE
```

The locked Parent DKC Definition remains unchanged.

The Slice A centerline remains suitable after correction.

---

## 7. Final Verdict

```text
DKC-IMPLEMENTATION-SCOPE-V1
Independent Scope Review-1

Verdict: CORRECTION REQUIRED
P0: 0
P1: 3
P2: 2
Parent DKC Compatibility: PASS WITH SCOPE CORRECTIONS REQUIRED
Scope Boundary: RETAINED
Implementation Start: NOT AUTHORIZED
Next Gate: DKC-IMPLEMENTATION-SCOPE-V1 Scope Correction-1
```
