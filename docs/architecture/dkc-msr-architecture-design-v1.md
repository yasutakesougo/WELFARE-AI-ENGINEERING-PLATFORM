# DKC-MSR-ARCHITECTURE-DESIGN-V1

```text
Document ID:              DKC-MSR-ARCHITECTURE-DESIGN-V1
State:                    DRAFT / DEFINITION IN PROGRESS
Authority:                Definition only
Definition Start:         GO
Definition Lock:          NOT AUTHORIZED
Implementation Start:     NOT AUTHORIZED
Runtime Activation:       NOT AUTHORIZED
WAEP Adoption:            NOT AUTHORIZED
Dependency Addition:      NOT AUTHORIZED
Knowledge Promotion:      NOT AUTHORIZED
PR Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Research Evidence Basis:  MSR-RESEARCH-REPORT-V1 ACCEPTED
Accepted Content Baseline: 0ab993f7fb3775460d5df4801f33175bd4e03059
Accepted Blob:            b6adb8b9d814d0ae9301c7f54e40af16ed87c83d
Definition Start Archive: docs/architecture/reviews/dkc-msr-architecture-definition-start-go.md
Human Research Acceptance: docs/research/reviews/human-research-evidence-acceptance-go.md
Artifact Path:            docs/architecture/dkc-msr-architecture-design-v1.md
Encoding:                 UTF-8
Content Baseline Commit:  34cc4e0f257c47b0a792415bb91d914b74bf4122
Content Baseline Blob:    87e3799cce22ff4465105842b45f612dc7f336a0
Content Baseline Bytes:   21083
Content Baseline SHA-256: 0f9179b7cc094709a8d5b4f7100345003a94927cf80b8e019f576782a3103e5c
Identity Note:            Baseline identity binds Definition Start semantic content.
                          Adding this identity block creates a new tip blob; it must
                          not be treated as a semantic redefinition of the baseline.
Independent Definition Review-1: CORRECTION REQUIRED
Review Archive:           docs/architecture/reviews/dkc-msr-architecture-independent-definition-review-1.md
P0 / P1 / P2:             0 / 3 / 2
Lockable:                 NO
Next Gate:                Definition Correction-1
```

---

## 1. Purpose / Non-goals

### 1.1 Purpose

Define the Architecture and contract boundaries for the Mining Software
Repositories (MSR) path of `DEVELOPMENT-KNOWLEDGE-COMPOUND-V1` (DKC):

- Read-only acquisition of development evidence from Source Systems
- Sensitive-data gated Canonical Evidence persistence
- Normalized Development Events and Link Analysis
- Derived Projections and Knowledge Candidate extraction
- Verification and Independent Review / Promotion boundaries

This Definition inherits Accepted Research Evidence from
`MSR-RESEARCH-REPORT-V1` as design input only.

### 1.2 Non-goals

```text
Definition Lock
Implementation Start
Repository implementation code
Runtime Dependency selection / addition
WAEP Adoption of any Candidate technology
Automatic Knowledge Promotion
Execution Authority design closure beyond boundary statements
Production data ingestion
LIVE WRITE
```

```text
Definition drafting
  != Technology Adopted
ADOPTION_CANDIDATE
  != ADOPTED
```

---

## 2. Authority Boundary

```text
Definition Start GO
  != Definition Lock
Definition Start GO
  != Implementation Start
Research Evidence Accepted
  != Technology Adopted
Research Evidence Accepted
  != Implementation Authority
Research Evidence Accepted
  != Execution Authority
Knowledge
  != Execution Authority
Knowledge Registry
  != Execution Authority
LLM Candidate
  != Authoritative Knowledge
```

DKC MSR Architecture Definition may inform WAEP Learning / Knowledge Plane
boundaries but must not override LOCKED WAEP-LEARNING-SYSTEM-V1 semantics:

```text
Knowledge Available != Execution Authority
INV-LRN-008 Promotion does not grant execution authority
Automatic Knowledge Promotion: PROHIBITED
```

Independent Definition Review PASS does not authorize Definition Lock,
Implementation Start, Ready, or Merge.

---

## 3. Source System Model

### 3.1 Rejected model

```text
GitHub = DKC唯一のCanonical Source
```

Rejected per Accepted Research Evidence (UNC-001).

### 3.2 Source Systems

A Source System is an external or host-native system that produces
source-native evidence. Examples (non-exhaustive):

- Git forges / hosting platforms (including GitHub)
- Git object stores / mirrors
- Issue / PR / review systems
- CI providers
- Incident / support systems (subject to Sensitive Data Gate)
- ADR / decision-record stores

```text
Source System
  != Canonical Evidence Snapshot
Hosting platform
  != Canonical Evidence
```

### 3.3 Knowledge extraction source types (after Sensitive Data Gate)

Non-exhaustive:

- Issue
- Pull Request
- ADR / design decision record
- Independent Review
- Definition Correction
- CI Failure
- Incident
- Regression Test
- Commit / review / release / comment events

---

## 4. Canonical Evidence Snapshot Model

### 4.1 Pipeline centerline

```text
Source Systems
        ↓
READ-ONLY MSR Adapters
        ↓
Sensitive Data Gate
        ↓
Canonical Evidence Snapshot
        ↓
Normalized Development Event
        ↓
Link Analysis
        ↓
Evidence-linked Observation
        ↓
Derived Projection
        ↓
Knowledge Candidate Extraction
        ↓
Verification Gate
        ↓
Independent Review / Promotion Boundary
```

### 4.2 Canonical Evidence Snapshot

A Canonical Evidence Snapshot is an immutable unit of acquired evidence after
Sensitive Data Gate completion.

Required properties (conceptual):

```text
evidenceSnapshotIdentity
sourceSystemIdentity
acquisitionAdapterId
acquiredAt
sensitiveDataGateResult
payloadDigest
provenanceReferences
```

Invariants:

```text
Source System != Canonical Evidence Snapshot
Canonical Evidence != Derived Projection
Knowledge Graph != Canonical Evidence
Raw Source must not bypass Sensitive Data Gate into Canonical Evidence
```

Canonical Evidence Snapshots are write-once. Corrections create new snapshots
or superseding decision records — they do not mutate prior snapshot content.

---

## 5. Development Event Model

### 5.1 Normalized Development Event

A Development Event is a normalized process/event entity derived from one or
more Canonical Evidence Snapshots.

Examples:

- commit recorded
- issue opened / closed
- pull request opened / reviewed / merged
- check run completed
- workflow run concluded
- release published
- comment created
- ADR accepted / superseded

### 5.2 Required conceptual fields

```text
developmentEventIdentity
eventType
repositoryIdentity (when applicable)
relatedArtifactIdentities[]
evidenceSnapshotReferences[]
occurredAt / observedAt
actorReferences[] (nullable; correlation != truth)
```

### 5.3 Invariants

```text
Development Event Identity != Artifact Identity
Development Event Identity != Evidence Snapshot Identity
Missing required observation fields
  → incomplete Observation
  → must not be treated as confirmed fact
```

---

## 6. Repository / Artifact / Event / Snapshot Identity

### 6.1 Identity domains (mandatory separation)

| Domain | Role |
| --- | --- |
| Repository Identity | Source System locator (forge + owner/name, mirror-aware ids) |
| Artifact Identity | Software artifacts (commit, tree, blob, release, SWHID, …) |
| Development Event Identity | Process/event entities |
| Evidence Snapshot Identity | Immutable post-gate Canonical Evidence unit |

```text
Repository Identity
  != Artifact Identity
  != Development Event Identity
  != Evidence Snapshot Identity
```

### 6.2 Git object identity

```text
repositoryIdentity
objectType
hashAlgorithm
objectId
```

- `objectType`: e.g. `commit` | `tree` | `blob` | `tag` | `snapshot`
- `hashAlgorithm`: explicit (e.g. `sha1`, future algorithms)
- `objectId`: algorithm-specific digest

```text
Commit Identity
  != 40-character SHA-1 only
```

### 6.3 SWHID boundary (DESIGN_REFERENCE)

```text
SWHID = Software Artifact Identity (design reference)
SWHID != Universal Development Event Identity
```

SWHID may inform Artifact Identity design. It must not be treated as a
universal identity for issues, PR reviews, CI checks, or comments.

---

## 7. MSR Adapter Boundary

### 7.1 Adapter role

READ-ONLY MSR Adapters acquire source-native evidence and emit acquisition
results for Sensitive Data Gate processing.

```text
MSR Adapter
  = READ-ONLY acquisition responsibility
MSR Adapter
  != Canonical Evidence writer bypassing Sensitive Data Gate
MSR Adapter
  != Execution Authority
MSR Adapter
  != Knowledge Promotion Authority
```

### 7.2 Adapter classes (conceptual)

| Adapter class | Responsibility |
| --- | --- |
| Git History Adapter | commits, trees, blobs, refs, diffs, authors |
| Forge Issue/PR Adapter | issues, PRs, reviews, comments |
| CI / Checks Adapter | provider-native CI and check events |
| Decision Record Adapter | ADR / design decision extraction sources |
| Specialized MSR Adapter | optional research/design-informed adapters |

### 7.3 Constraints

- Adapters must not select Runtime Dependencies in this Definition
- `ADOPTION_CANDIDATE` mapping is design guidance only (§16)
- Acquisition failures must be observable; silent omission must not become
  confirmed absence of events without explicit Observation semantics

---

## 8. GitHub Native Event Adapter Boundary

### 8.1 GitHub as Source System

GitHub is a Source System / hosting platform, not Canonical Evidence.

### 8.2 Native adapter responsibilities

A GitHub Native Event Adapter (conceptual) may acquire GitHub-native objects
that are not guaranteed to be covered by third-party MSR toolchains, including
but not limited to Checks-related APIs.

```text
GrimoireLab / Perceval capability boundary (Accepted Research):
  documented GitHub categories include issue / pull_request / repository
  Complete GitHub Checks acquisition via GrimoireLab
    = UNSUPPORTED / NOT EVIDENCED
```

Therefore GitHub Checks completeness is a separate adapter responsibility, not
assumed from GrimoireLab DESIGN_REFERENCE patterns.

### 8.3 Non-authority

```text
GitHub Native Adapter design
  != GitHub-only Canonical Source model
GitHub Agentic Memory (DESIGN_REFERENCE)
  != Adopted DKC memory runtime
```

---

## 9. CI / Checks Event Model

### 9.1 Decomposed types (must not collapse)

| Type | Meaning |
| --- | --- |
| CI Provider Event | Provider-native event envelope |
| GitHub Commit Status | Legacy commit status API object |
| CheckRun | Individual check run |
| CheckSuite | Suite aggregation |
| WorkflowRun | Actions workflow run |
| Job Result | Job-level result |
| Step Result | Step-level result |

### 9.2 Gate Skip / incomplete Observation — minimum fields

```text
repositoryIdentity
commitIdentity
checkIdentity
checkType
provider
startedAt
completedAt
conclusion
sourceReference
observedAt
```

Missing fields → observation incomplete → must not be treated as confirmed
gate behavior fact.

```text
CI Support != GitHub Checks完全取得
```

---

## 10. Link Taxonomy and Confidence Model

### 10.1 Link types (mandatory separation)

| linkType | Meaning |
| --- | --- |
| EXPLICIT_NATIVE | Platform-native explicit reference |
| EXPLICIT_TEXTUAL | Explicit textual reference |
| STRUCTURAL | Containment / ancestry |
| TEMPORAL | Time-window correlation only |
| IDENTITY_CORRELATION | Same actor / email / login correlation |
| SEMANTIC | Embedding / similarity / LLM semantic match |
| SZZ_INFERRED | SZZ-family bug-inducing inference |

### 10.2 Required link fields

```text
linkId
sourceEntity
targetEntity
linkType
evidenceReferences
confidenceClass
algorithm
algorithmVersion
verificationState
```

### 10.3 Confidence

Absolute “guaranteed truth” / “near-zero false positives” wording is prohibited
without Evidence that directly supports the guarantee.

Recommended class for strong explicit native links:

```text
HIGH_CONFIDENCE
```

### 10.4 Prohibited equivalences

```text
Identity Correlation != Link Truth
Temporal Correlation != Causation
Semantic Similarity != Observed Fact
SZZ Result != Confirmed Root Cause
```

Heuristic / inferred links MUST retain provenance
(`algorithm`, `algorithmVersion`, `verificationState`).

---

## 11. SZZ / Failure Mining Boundary

```text
Observed Failure / Symptom != Root Cause
Bug Fix Commit != Bug-Inducing Commit certainty
Correlation != Causation
SZZ Result = Bug-Inducing Commit Candidate
  unless independently verified
SZZ Candidate != Confirmed Root Cause
```

### 11.1 Classification input

- SZZ algorithm family: usable as research/design input
- PySZZ original: DESIGN_REFERENCE / RESEARCH_REFERENCE; Direct Adoption HOLD
- Successor implementations require separate Candidate IDs and individual
  evaluation (maintenance, license, reproducibility, algorithm version)

### 11.2 HOLD / UNKNOWN

```text
UNKNOWN must not be silently converted to PASS
HOLD != PASS
Correlation / SZZ Candidate must not be coerced into Causation
```

When root cause is not confirmed, retain `UNKNOWN` (aligned with WAEP Failure
Knowledge convention).

---

## 12. Derived Projection / Knowledge Graph Boundary

```text
Derived Projection
  = computed / projected view over Evidence-linked Observations
Knowledge Graph
  = Derived Projection (for DKC MSR scope)
Knowledge Graph
  != Canonical Evidence
Canonical Evidence
  != Derived Projection
```

Projections may be rebuilt. Canonical Evidence Snapshots must not be treated
as mutable projection state.

```text
Projection is never Authority Source
Knowledge Registry != Execution Authority
```

---

## 13. LLM Candidate Extraction Boundary

```text
LLM = Candidate Generator
LLM Output != Canonical Evidence
LLM Candidate != Authoritative Knowledge
LLM must not write Canonical Evidence Snapshots
```

LLM may emit Knowledge Candidates only after Verification Gate processing
paths defined by this Architecture (and WAEP Learning boundaries where
applicable).

Citation / JIT citation verification (design input from Accepted Research and
GitHub Agentic Memory DESIGN_REFERENCE patterns):

```text
Citation Verified != Reasoning Correct
Citation Verified != Causal Claim Verified
Citation Verified != Knowledge Promotion PASS
```

---

## 14. Verification Boundary

### 14.1 Verification Gate role

Verification tests whether Candidate claims remain supportable by Evidence /
Observation / Snapshot references under stated verification rules.

```text
Verification PASS
  != Knowledge Promotion PASS
Verification PASS
  != Execution Authority
Verification PASS
  != Implementation Start
```

### 14.2 Alignment with WAEP Learning (LOCKED)

Where DKC Candidates enter WAEP Knowledge Plane processes:

```text
Knowledge Available != Execution Authority
Promotion != Execution Authority
Automatic Knowledge Promotion: PROHIBITED
INV-LRN-008 Promotion does not grant execution authority
```

Independent Review / Promotion Boundary remains outside MSR Adapter authority.

---

## 15. Sensitive Data Boundary

Canonical Evidence persistence is forbidden until Sensitive Data Gate completes.

```text
Raw Source
        ↓
Sensitive Data Inspection
        ↓
Reject / Redact / Sanitize
        ↓
Canonical Evidence Snapshot
```

### 15.1 Must not persist into DKC / reusable WAEP Knowledge

- Personal Data
- Customer Production Data
- Support Records
- Medical Data
- Disability Data
- Child-specific Data
- Family-specific Data
- Credentials
- Tokens
- Cookies
- API Keys
- Private Keys
- Passwords
- Secrets

Aligned with WAEP LOCKED learning sensitive-data prohibitions
(`EV-WAEP-SENS-001` / INV-LRN-017 family). Shared Knowledge may retain
necessary Evidence References and generalized Observations only — never raw
prohibited payloads.

---

## 16. Candidate Technology Mapping

Accepted Research Classifications are design inputs only.
**No Runtime Dependency is selected by this Definition.**

| Candidate | Classification | Mapping to Architecture component (design only) |
| --- | --- | --- |
| PyDriller | ADOPTION_CANDIDATE | Informs Git History Adapter patterns; Adoption HOLD |
| codebase-memory-mcp | ADOPTION_CANDIDATE (verification conditions) | Informs indexing / retrieval Candidate patterns; independent benchmark pending |
| PySZZ original | DESIGN_REFERENCE / RESEARCH_REFERENCE | Informs SZZ Candidate boundary; Direct Adoption HOLD |
| PySZZ v2 | RESEARCH_REFERENCE (separate Candidate) | Separate evaluation required; HOLD |
| SWHID | DESIGN_REFERENCE | Informs Artifact Identity only |
| GrimoireLab / Perceval | DESIGN_REFERENCE | Informs event acquisition patterns; Checks completeness not assumed |
| ADR practices | DESIGN_REFERENCE | Informs Decision Record Adapter / extraction source pattern |
| GitHub Agentic Memory | DESIGN_REFERENCE | Informs citation-style Candidate validation patterns; not Adopted runtime |
| World of Code | RESEARCH_REFERENCE | Research scale metadata only; not DKC Canonical Source |
| Kaiaulu | RESEARCH_REFERENCE | Social/technical network mining reference; HOLD |
| git2net | RESEARCH_REFERENCE | Fine-grained co-editing network reference; HOLD |
| RepoDriller | HISTORICAL / SPECIALIZED REFERENCE | Historical Java MSR predecessor context; HOLD |

```text
ADOPTION_CANDIDATE != ADOPTED
DESIGN_REFERENCE / RESEARCH_REFERENCE / HISTORICAL REFERENCE
  != Runtime dependency authorization
Definition drafting != Dependency Addition
```

---

## 17. Failure / HOLD Semantics

```text
Observed Failure != Root Cause
Bug Fix Commit != Bug-Inducing Commit certainty
Correlation != Causation
SZZ Candidate != Confirmed Root Cause
UNKNOWN != PASS
HOLD != PASS
Incomplete Observation != Confirmed Fact
```

Fail-closed expectations for Definition scope:

- Ambiguous identity → do not collapse identity domains
- Ambiguous link type → do not upgrade to EXPLICIT_NATIVE without evidence
- Missing Sensitive Data Gate result → forbid Canonical Evidence persistence
- Unverified causal claim → retain Candidate / UNKNOWN; do not promote

---

## 18. Audit / Provenance Requirements

Every Canonical Evidence Snapshot, Link, Observation, Derived Projection
rebuild, and Knowledge Candidate extraction path must retain provenance
sufficient to answer:

```text
What Source System produced the raw material?
Which adapter acquired it?
When was it acquired?
What Sensitive Data Gate decision was applied?
Which Evidence Snapshot(s) support an Observation or Link?
Which algorithm / algorithmVersion produced inferred links?
What verificationState applies?
```

Minimum provenance anchors:

```text
evidenceSnapshotIdentity
sourceReference
acquiredAt
adapterId
sensitiveDataGateResult
link.algorithm / link.algorithmVersion / link.verificationState
candidate.extractionProvenance
```

Audit records must not store prohibited sensitive payloads (§15).

---

## 19. Validation Scenarios

Synthetic / conceptual scenarios for Independent Definition Review preparation.
These are Definition validation scenarios — not Implementation tests and not
Runtime activation.

| ID | Scenario | Expected |
| --- | --- | --- |
| DKC-MSR-V01 | GitHub is not universal Canonical Source | PASS iff Source System ≠ Canonical Evidence |
| DKC-MSR-V02 | Snapshot/source separation | PASS iff Raw Source cannot become Canonical Evidence without Sensitive Data Gate |
| DKC-MSR-V03 | Four identity domains remain distinct | PASS iff Repository / Artifact / Event / Snapshot identities are not collapsed |
| DKC-MSR-V04 | Git object identity not SHA-1-only | PASS iff repositoryIdentity+objectType+hashAlgorithm+objectId model is required |
| DKC-MSR-V05 | SWHID not universal event identity | PASS iff SWHID scoped to Artifact Identity |
| DKC-MSR-V06 | CI types remain decomposed | PASS iff CheckRun/CheckSuite/WorkflowRun/Job/Step not collapsed |
| DKC-MSR-V07 | GrimoireLab Checks completeness not assumed | PASS iff GitHub Checks assigned separate adapter boundary |
| DKC-MSR-V08 | Link taxonomy complete | PASS iff all seven linkTypes are distinct |
| DKC-MSR-V09 | Identity correlation ≠ link truth | PASS |
| DKC-MSR-V10 | Temporal correlation ≠ causation | PASS |
| DKC-MSR-V11 | Semantic similarity ≠ observed fact | PASS |
| DKC-MSR-V12 | SZZ ≠ confirmed root cause | PASS |
| DKC-MSR-V13 | HIGH_CONFIDENCE used instead of guaranteed truth | PASS |
| DKC-MSR-V14 | LLM cannot write Canonical Evidence | PASS |
| DKC-MSR-V15 | Citation verified ≠ promotion PASS | PASS |
| DKC-MSR-V16 | Knowledge Graph is Derived Projection only | PASS |
| DKC-MSR-V17 | Sensitive gate precedes persistence | PASS |
| DKC-MSR-V18 | UNKNOWN/HOLD not converted to PASS | PASS |
| DKC-MSR-V19 | ADOPTION_CANDIDATE ≠ ADOPTED; no Runtime Dependency selected | PASS |
| DKC-MSR-V20 | Definition Start ≠ Definition Lock / Implementation Start | PASS |
| DKC-MSR-V21 | Incomplete Gate Skip Observation not treated as confirmed fact | PASS |

```text
Definition Validation Scenarios: conceptual only
Implementation test execution: NOT AUTHORIZED by this Definition
```

---

## 20. Definition Closure Criteria

This Definition draft was submitted to Independent Definition Review-1 when:

1. Sections 1–20 are present and internally consistent
2. Design centerline matches Accepted Research Evidence pipeline
3. Identity, Link, CI, Sensitive Data, Failure, and LLM boundaries are explicit
4. Candidate Technology Mapping contains no Runtime Dependency selection
5. Authority Boundary retains all Explicit Non-Authorizations from Definition Start GO
6. Validation scenarios DKC-MSR-V01…V21 are represented
7. No span residue / unresolved placeholders remain
8. Document State remains `DRAFT / DEFINITION IN PROGRESS` until Review outcomes

Independent Definition Review-1 result:

```text
Verdict: CORRECTION REQUIRED
P0 / P1 / P2: 0 / 3 / 2
Lockable: NO
Archive: docs/architecture/reviews/dkc-msr-architecture-independent-definition-review-1.md
Next: Definition Correction-1
```

Open Correction-1 finding IDs:

```text
P1 DKC-MSR-PARENT-OUTPUT-CONTRACT-001
P1 DKC-MSR-SNAPSHOT-KEY-001
P1 DKC-MSR-LINK-CONFIDENCE-MAPPING-001
P2 DKC-MSR-VERIFICATION-AUTHORITY-REF-001
P2 DKC-MSR-PARENT-LOCK-BINDING-001
```

```text
Definition draft complete
  != Definition Lock
Independent Definition Review PASS
  != Definition Lock
  != Implementation Start
Independent Definition Review CORRECTION REQUIRED
  != Definition Lock
  != Implementation Start
  != Ready
  != Merge
```

---

## 21. Document End State

```text
State:                DRAFT / DEFINITION IN PROGRESS
Authority:            Definition only
Definition Start:     GO
Independent Definition Review-1: CORRECTION REQUIRED
Definition Lock:      NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
Runtime Activation:   NOT AUTHORIZED
WAEP Adoption:        NOT AUTHORIZED
Dependency Addition:  NOT AUTHORIZED
Knowledge Promotion:  NOT AUTHORIZED
PR Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate:            DKC-MSR-ARCHITECTURE-DESIGN-V1 Definition Correction-1
```
