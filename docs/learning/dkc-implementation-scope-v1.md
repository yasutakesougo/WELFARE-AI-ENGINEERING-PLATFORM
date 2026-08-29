# DKC-IMPLEMENTATION-SCOPE-V1

## 0. Status and Authority

```text
Scope ID: DKC-IMPLEMENTATION-SCOPE-V1
Target Slice: Slice A — Pure Domain Contracts / Candidate Resolution Kernel
Revision: Definition Start
Scope State: DRAFT / NOT LOCKED
Parent Definition: DEVELOPMENT-KNOWLEDGE-COMPOUND-V1 Definition Correction-2
Parent Definition State: LOCKED
Parent Locked Definition Blob: a17ede815d9c9f3efc4292e9db8d24edca19b9d3
Parent Submission Contract Blob: 26c9764abf41106b9faba5bd5f5bb25323961b7f
Parent Human Lock Record Blob: 15c9d391f6efdd2efddad7dab8db84abfe9cad39
Parent Branch Head at Scope Start: 4daad84a71dc1bd4f1c87cd5e5fe55d6deeac23a
Prior Human Implementation Start Gate: HOLD — IMPLEMENTATION SCOPE IDENTITY NOT FIXED
Definition Start: GO
Implementation Start: NOT AUTHORIZED
Repository Mutation for implementation: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: DKC-IMPLEMENTATION-SCOPE-V1 Independent Scope Review-1
```

This artifact fixes the first executable boundary beneath the locked DKC Definition.

```text
Scope Definition Start
  != Implementation Start
  != Repository Write Authority
  != Dependency Addition
  != Runtime Authority
```

---

## 1. Mission

Slice A establishes a pure, deterministic domain kernel for DKC candidate identity and schema validation before any source acquisition, persistence, retrieval, external verification, promotion, or runtime integration is introduced.

The slice proves only this narrow path:

```text
Already-provided Development Event identity + already-provided Candidate draft
        ↓
Pure schema validation
        ↓
Canonical Candidate Resolution Key
        ↓
Duplicate / Replay / New-Version Resolution
        ↓
Validated non-authoritative Candidate domain result
```

The slice does not acquire events and does not create Authoritative Knowledge.

---

## 2. Included Responsibilities

Slice A may implement only the following pure domain responsibilities.

### A1. Domain contract types

Types required to represent, without persistence or external I/O:

```text
DevelopmentEventIdentity
KnowledgeCandidateDraft
KnowledgeCandidateResolutionKey
StructuredEvidenceReference
CandidateResolutionResult
CandidateValidationResult
```

### A2. Candidate resolution identity

Implement the locked DKC resolution key semantics:

```yaml
resolutionKey:
  contractType: KnowledgeCandidate@v1
  sourceRepository: ""
  sourceEventId: ""
  contentDigest: ""
```

Required behavior:

```text
same sourceRepository + sourceEventId + contentDigest
  → same canonical candidate resolution identity

same sourceRepository + sourceEventId + changed contentDigest
  → new candidate version identity

same resolution identity replayed
  → idempotent existing-candidate result
  → must not create additional independent evidence strength
```

### A3. Structured evidenceRefs validation

The kernel must enforce:

```yaml
evidenceRefs:
  - evidenceRef: ""
    relation: SUPPORTING|CONTRADICTING|INCONCLUSIVE
```

Bare string `evidenceRefs` are invalid.

Contradicting and inconclusive evidence must be retained rather than dropped or rewritten as supporting evidence.

### A4. Candidate authority-field rejection

The kernel must reject Candidate input that attempts to self-declare locked external-authority state, including at minimum:

```text
ACTIVE
CURRENT
Confidence Score / authoritative confidence
Validated / Validation Result
Production Safe
Runtime Eligible / Runtime Binding
Maturity
Supersession State
Authoritative Lifecycle
```

A domain result may identify an invalid authority-field attempt, but must not resolve external authority itself.

### A5. Candidate provenance shape validation

The kernel may validate the locked provenance fields:

```yaml
createdBy:
  actorType: HUMAN|AGENT|SERVICE|AUTOMATION
  actorId: ""
creationMode: HUMAN|AGENT_ASSISTED|AUTOMATED
```

This validation establishes shape only.

It does not grant Candidate Generation Authority, Verification Authority, Promotion Authority, or Runtime Authority.

### A6. Candidate scope shape validation

The kernel may validate the non-authoritative scope separation:

```text
observedIn
proposedAppliesTo
explicitlyNotValidatedFor
```

The kernel must not emit `validatedScope` or an equivalent authoritative field.

---

## 3. Explicitly Excluded Responsibilities

Slice A must not implement or simulate:

```text
Repository / GitHub event acquisition
MSR Source Adapters
Issue / PR / Review / CI API clients
Git history mining
LLM or heuristic Candidate extraction
Automatic Candidate generation
Knowledge Extraction Prototype connected to real sources
Candidate persistence
Evidence payload persistence
Database / filesystem stores
Vector DB / search index / Knowledge Graph
Development Knowledge Retrieval
Reuse Event Capture
Engineering Metric Capture
Knowledge Verification
Knowledge Validation
Knowledge Promotion
Knowledge Lifecycle
Knowledge Supersession
Runtime Knowledge Binding
Cross-Repository Promotion
External Authority Decision execution
Production telemetry
SharePoint / M365 integration
Network mutation
Repository mutation executor
```

`DKC-MSR-ARCHITECTURE-DESIGN-V1` remains a separate locked architecture line and is not implementation-authorized by this Scope.

---

## 4. Allowed Repository Paths for a Future Slice A Implementation

After a separate Human Implementation Start GO bound to this exact Scope identity, implementation mutation may be limited to:

```text
packages/development-knowledge-compound-kernel/**
docs/audit/dkc-impl-slice-a-*.md
```

No other repository path is authorized by this Scope.

Changes to root workflows, root package manifests, governance contracts, locked Definitions, other packages, deployment files, or production configuration require a separate scope decision.

---

## 5. I/O Boundary

### 5.1 Allowed I/O class

Slice A is PURE_DOMAIN.

Allowed runtime interaction is limited to:

```text
function arguments
returned values
in-memory immutable/mutable values internal to the pure function call
synthetic test fixtures stored inside the Slice A package
```

### 5.2 Denied I/O classes

The implementation must not perform:

```text
NETWORK
DATABASE
FILESYSTEM runtime reads/writes
PROCESS execution
SHELL
GIT
GITHUB API
HTTP
QUEUE
CACHE service
ENVIRONMENT secret access
SHAREPOINT
M365
CLOUD storage
PRODUCTION LOG ingestion
```

Build/test tooling may read package source files as part of ordinary compilation/test execution; this does not authorize product/runtime filesystem I/O.

---

## 6. Persistence Boundary

```text
Persistent Candidate Store: NOT AUTHORIZED
Persistent Event Store: NOT AUTHORIZED
Persistent Evidence Store: NOT AUTHORIZED
Persistent Derived Index: NOT AUTHORIZED
```

Slice A output exists only as returned in-memory domain values during execution/tests.

No generated file may be treated as a product persistence mechanism.

---

## 7. Dependency Boundary

```text
New runtime dependencies: NOT AUTHORIZED
External SDK / API client dependencies: NOT AUTHORIZED
Database dependencies: NOT AUTHORIZED
LLM / embedding dependencies: NOT AUTHORIZED
MSR library dependencies: NOT AUTHORIZED
```

A future implementation may use repository-approved language/compiler/test tooling only if no new external dependency authority is required.

Any new package dependency that is not already approved by the repository requires a separate dependency decision before addition.

---

## 8. Determinism Requirements

The Slice A kernel must be deterministic for equal inputs.

```text
Equal valid input
  → equal validation result
  → equal resolution key
  → equal resolution outcome when compared against the same supplied prior-domain state
```

The kernel must not depend on:

```text
current wall clock
random values
network state
filesystem state
environment variables
hidden global mutable state
model inference
```

If time metadata is required in a future slice, it must be supplied as explicit input rather than read implicitly.

---

## 9. Failure Semantics

Minimum result classes:

```text
VALID_NEW
VALID_EXISTING_IDEMPOTENT
VALID_NEW_VERSION
INVALID_SCHEMA
INVALID_EVIDENCE_REFERENCE
INVALID_AUTHORITY_FIELD
INVALID_IDENTITY
HOLD_UNKNOWN
```

`HOLD_UNKNOWN` must not be converted to a valid candidate result.

Errors must not create or mutate persistent state because persistence is outside this Slice.

---

## 10. Acceptance Tests

Independent implementation review must require at minimum the following scenarios once implementation is separately authorized.

```text
DKC-A-V01 Same sourceRepository/sourceEventId/contentDigest twice
          → same resolution key; second resolution is VALID_EXISTING_IDEMPOTENT.

DKC-A-V02 Same sourceRepository/sourceEventId with changed contentDigest
          → distinct resolution key; VALID_NEW_VERSION.

DKC-A-V03 Different sourceEventId with same digest
          → distinct candidate resolution identity.

DKC-A-V04 Replay of identical Candidate does not increase independent evidence count or duplicate evidenceRefs.

DKC-A-V05 Structured SUPPORTING evidenceRef
          → accepted.

DKC-A-V06 Structured CONTRADICTING evidenceRef
          → retained as CONTRADICTING.

DKC-A-V07 Structured INCONCLUSIVE evidenceRef
          → retained as INCONCLUSIVE and not promoted to SUPPORTING.

DKC-A-V08 Bare string evidenceRefs
          → INVALID_EVIDENCE_REFERENCE.

DKC-A-V09 Candidate attempts `validatedScope`, `ACTIVE`, or `runtimeEligible`
          → INVALID_AUTHORITY_FIELD.

DKC-A-V10 `creationMode=AUTOMATED` with valid provenance shape
          → schema may validate; no Verification/Promotion authority is implied.

DKC-A-V11 Same logical object with object-member input order differences
          → equal canonical resolution key.

DKC-A-V12 Missing required source identity member
          → INVALID_IDENTITY / no valid resolution key.

DKC-A-V13 Kernel execution with forbidden external I/O mocked as unavailable
          → behavior unchanged because no external I/O is required.

DKC-A-V14 Typecheck / schema conformance
          → PASS.
```

Test PASS does not authorize persistence, external I/O, promotion, Ready, Merge, Deploy, or runtime activation.

---

## 11. Implementation Evidence Requirements

A later Implementation Review must bind evidence to:

```text
exact implementation commit SHA
exact package tree SHA
exact locked DKC Definition blob
exact DKC-IMPLEMENTATION-SCOPE-V1 reviewed identity
toolchain versions
exact test commands
exact typecheck command
exit codes
test counts
post-verification repository status
independent verifier identity / environment
```

Local implementation-agent PASS alone is insufficient for Independent Implementation PASS.

---

## 12. Rollback Boundary

Before merge, rollback is deletion/reversion of only the Slice A package and Slice A audit artifacts on its feature branch.

After a separately authorized merge, rollback must be a repository-visible revert that removes only Slice A changes unless a broader rollback is separately authorized.

Rollback must not alter:

```text
locked DKC Definition artifacts
DKC Human Definition Lock record
DKC-MSR locked architecture artifacts
other implementation packages
```

---

## 13. Scope Invariants

```text
INV-DKC-IMPL-A-001  Slice A is pure domain logic only.
INV-DKC-IMPL-A-002  Candidate Resolution Identity is deterministic and replay-idempotent.
INV-DKC-IMPL-A-003  Evidence relation is structured and contradicting evidence is retained.
INV-DKC-IMPL-A-004  Slice A cannot emit external-authority state.
INV-DKC-IMPL-A-005  Scope validation does not grant Candidate Generation or Promotion Authority.
INV-DKC-IMPL-A-006  Runtime external I/O is prohibited.
INV-DKC-IMPL-A-007  Persistence is prohibited.
INV-DKC-IMPL-A-008  New runtime dependencies are prohibited.
INV-DKC-IMPL-A-009  Allowed repository mutation paths are closed-world and explicit.
INV-DKC-IMPL-A-010  Unknown / unresolved state fails closed as HOLD or invalid.
```

---

## 14. Independent Scope Review Checklist

Independent Scope Review-1 must verify at minimum:

```text
[ ] Parent DKC locked identity is exact.
[ ] Slice A responsibilities are narrower than the locked DKC Definition.
[ ] Allowed repository paths are closed-world.
[ ] Runtime I/O boundary is PURE_DOMAIN.
[ ] Persistence is explicitly prohibited.
[ ] Dependency authority is not silently granted.
[ ] Candidate resolution key semantics match locked DKC.
[ ] structured evidenceRefs semantics match locked DKC.
[ ] forbidden authority fields remain outside Slice A.
[ ] tests cover replay/idempotency/new-version/evidence/authority rejection.
[ ] implementation evidence requirements require independent exact-artifact verification.
[ ] rollback does not mutate locked Definition artifacts.
```

---

## 15. Gate Chain

```text
DKC-IMPLEMENTATION-SCOPE-V1 Definition Start
↓
Independent Scope Review-1
↓
Scope Correction-N if required
↓
Independent Scope Re-Review-N
↓
Human Implementation Start GO / HOLD
↓
Implementation Slice A
↓
Independent Implementation Review
↓
Ready GO / HOLD
↓
Merge GO / HOLD
```

Every downstream gate is separate.

---

## 16. Exit State

```text
Scope State: DRAFT / NOT LOCKED
Implementation Start: NOT AUTHORIZED
Repository Implementation Mutation: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime External I/O: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: DKC-IMPLEMENTATION-SCOPE-V1 Independent Scope Review-1
```