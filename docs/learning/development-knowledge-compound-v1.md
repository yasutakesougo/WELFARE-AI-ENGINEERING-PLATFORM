# DEVELOPMENT-KNOWLEDGE-COMPOUND-V1

## Status

```text
Definition: DEVELOPMENT-KNOWLEDGE-COMPOUND-V1
Revision: Definition Correction-2
Supersedes: Definition Correction-1
Review-1 Findings: 9 / 9 CLOSED
Independent Definition Re-Review-1: CORRECTION REQUIRED → addressed in Correction-2
Re-Review-1 Findings: 3 / 3 CLOSED by Independent Definition Re-Review-2
Independent Definition Re-Review-2: PASS
Independent Definition Re-Review-3: PASS / LOCKABLE
Human Definition Lock: GO
Definition State: LOCKED
Locked Definition Blob: a17ede815d9c9f3efc4292e9db8d24edca19b9d3
Locked Submission Contract Blob: 26c9764abf41106b9faba5bd5f5bb25323961b7f
Lock Decision Record: docs/learning/reviews/development-knowledge-compound-definition-lock-go.md
Implementation Start: NOT AUTHORIZED
Knowledge Extraction Prototype: NOT AUTHORIZED
Automatic Candidate Generation: NOT AUTHORIZED
Automatic Knowledge Promotion: PROHIBITED
Automation Enforcement: NOT AUTHORIZED
Next Gate: Implementation Start GO / HOLD
```

> NOTE: The locked Definition identity is the pre-lock content blob
> `a17ede815d9c9f3efc4292e9db8d24edca19b9d3`. This file header synchronization
> records the lock state only; it does not redefine or replace that locked
> semantic artifact. Any semantic change below this notice requires a new
> Definition review / lock chain.

Gate chain:

```text
Independent Definition Re-Review-3  PASS / LOCKABLE
        ↓
Human Definition Lock               GO
        ↓
Definition LOCKED
        ↓
Implementation Start              separate GO / HOLD
```

Review path to lock:

```text
Review-1 → Correction-1 → Re-Review-1 → Correction-2 → Re-Review-2 → Re-Review-3
                                                                    ↓
                                                          PASS / LOCKABLE
                                                                    ↓
                                                          Human Lock GO
```

Current position:

```text
Definition LOCKED → Implementation Start GO / HOLD pending
```

This document is **definition only**. It does not authorize implementation,
persistence, automatic candidate generation, knowledge promotion, or automation
enforcement.

```text
Definition Lock GO
  != Implementation Start
  != Automatic Knowledge Promotion

Definition LOCKED
  != Implementation Start (separate GO / HOLD gate)
```

Correction-2 does **not** change the Architecture. Correction-1 boundaries
remain:

```text
DKC = knowledge creation entry
Knowledge Assetization = knowledge formal asset authority
Candidate existence ≠ Knowledge existence
Automatic Knowledge Promotion = PROHIBITED
```

---

## 1. Purpose

Define the Development Knowledge Compound (DKC) as the **development-side
entry plane** that captures engineering events, extracts Knowledge Candidates,
preserves source traceability, records reuse events, and captures engineering
metrics — **without** owning Authoritative Knowledge lifecycle, verification,
promotion, supersession, or runtime eligibility.

Core separations (retained from Definition Start):

```text
Development Event
  != Knowledge Candidate
  != Authoritative Knowledge
  != Runtime Authority

Observation
  != Problem
  != Root Cause
  != Generalized Rule

Candidate existence
  != Knowledge existence
```

Correction-1 centerline:

```text
Development Event describes what happened.
Candidate proposes what might be reusable.
Knowledge Assetization decides what becomes Authoritative Knowledge.
Retrieval serves the next development cycle.
```

---

## 2. Non-goals

This definition does **not** authorize:

```text
automatic knowledge promotion
automatic candidate generation without explicit authority policy
Agent direct ACTIVE / CURRENT / Validated / Production Safe declaration
Authoritative Lifecycle ownership inside DKC
Confidence scoring as authority inside DKC
Canonical Supersession decision inside DKC
Runtime Binding / Runtime Eligibility decision inside DKC
worker productivity surveillance from collected metrics
personal ranking by knowledge count, rework count, or work time alone
implementation of Candidate stores, retrieval indexes, or metric pipelines
Automation Enforcement wiring
```

Engineering Metrics are limited to:

```text
Process Improvement
Rework Reduction
Knowledge Reuse Assessment
Automation Effectiveness
```

The following uses are **prohibited** at Definition level:

```text
Knowledge count based personal evaluation
Rework count based personal evaluation
Productivity ranking from work time alone
```

### 2.1 Correction-1 (retained)

Correction-1 addressed Independent Definition Review-1 findings:

| Priority | ID | Topic |
| --- | --- | --- |
| P1-1 | DKC-AUTH-CANDIDATE-001 | Candidate generation authority and creation provenance |
| P1-2 | DKC-AUTH-VERIFY-001 | Verification vs Authority Decision boundary |
| P1-3 | DKC-BOUNDARY-KA-001 | Knowledge Assetization responsibility separation |
| P1-4 | DKC-CROSSREPO-001 | Cross-Repository Promotion authority |
| P2-1 | DKC-GENERALIZATION-001 | Observed / Proposed / Validated scope separation |
| P2-2 | DKC-EVIDENCE-NEGATIVE-001 | Contradicting evidence retention |
| P2-3 | DKC-REUSE-001 | Reuse event stage separation |
| P2-4 | DKC-METRIC-TIME-001 | Work time measurement source |
| P2-5 | DKC-METRIC-GOVERNANCE-001 | Personal metric use prohibition |

### 2.2 Correction-2 Scope

Correction-2 addresses **only** Independent Definition Re-Review-1 residuals:

| Priority | ID | Topic |
| --- | --- | --- |
| P1-1 | DKC-AUTH-SELF-APPROVAL-001 | Self-Approval Eligibility Matrix |
| P1-2 | DKC-RESOLUTION-001 | Candidate / Submission Resolution Identity |
| P2-1 | DKC-SCHEMA-CONSISTENCY-001 | evidenceRefs structured relation consistency |

Correction-2 does **not** add Lifecycle, Promotion, or Runtime Authority inside
DKC.

---

## 3. Corrected Responsibility Model

```text
Development Event
       │
       ▼
DEVELOPMENT-KNOWLEDGE-COMPOUND
       │
       ├─ Event Capture
       ├─ Candidate Extraction
       ├─ Source Traceability
       ├─ Reuse Event Capture
       └─ Engineering Metrics
       │
       ▼
Knowledge Candidate
       │
       ▼
KNOWLEDGE-ASSETIZATION
  (WAEP-LEARNING-SYSTEM-V1 external contract plane)
       │
       ├─ Verification
       ├─ Confidence Assessment
       ├─ Authority Decision
       ├─ Lifecycle
       ├─ Supersession
       └─ Runtime Eligibility
       │
       ▼
Canonical Knowledge
       │
       ▼
Development Knowledge Retrieval
       │
       ▼
Next Development
```

```text
DKC = knowledge creation entry
Knowledge Assetization = knowledge formal asset authority
```

DKC **must not** own:

```text
Authoritative Lifecycle
Maturity
Confidence
Validation Result
Runtime Binding
Canonical Supersession Decision
```

Verification, Lifecycle, Authority Decision, and Supersession are referenced
only through **external contracts** owned by
`WAEP-LEARNING-SYSTEM-V1` (Knowledge Assetization plane).

---

## 4. Canonical Authority

Retained from Definition Start:

```text
GitHub            = Canonical
Vector DB         = Derived
Search Index      = Derived
Knowledge Graph   = Derived
Agent Memory      = Derived
```

Derived systems may be lost and rebuilt from GitHub canonical artifacts.
DKC does not treat Derived retrieval state as Authoritative Knowledge state.

Retained promotion prohibition:

```text
AI Observation
  → Candidate
  → Verification
  → Authority Decision

Agent direct ACTIVE activation is PROHIBITED.
```

---

## 5. Development Event Capture

### 5.1 Supported source events

The following event classes may produce Knowledge Candidates:

```text
Issue
Pull Request
Review
CI Failure
Incident
Post-Merge Reconciliation
```

Event capture records provenance only. Event capture does **not** imply
Candidate validity, Knowledge existence, or promotion eligibility.

### 5.2 Minimum event identity

```yaml
developmentEventId: ""
source:
  sourceRepository: ""
  sourceEventType: ""
  sourceEventId: ""
  sourceArtifactRef: ""
  sourceRevision: ""
  observedAt: ""
  contentDigest: ""
classification: ""
```

Duplicate / replay handling follows idempotent ingestion semantics. Re-ingest
of the same identity must not artificially increase evidence strength.

### 5.3 Candidate extraction resolution (Correction-2)

Candidate extraction from a Development Event must compute a canonical resolution
identity:

```yaml
resolutionKey:
  contractType: KnowledgeCandidate@v1
  sourceRepository: ""
  sourceEventId: ""
  contentDigest: ""
```

Rules:

```text
Candidate identity     = stable over sourceRepository + sourceEventId + contentDigest
Duplicate extraction   = required detection at candidate creation
Replay handling        = idempotent; does not create a new independent candidate
Re-extraction          = returns existing candidateRef unless contentDigest changes
```

A changed `contentDigest` creates a new candidate version; it does not mutate
prior candidate content in place.

---

## 6. Knowledge Candidate Generation

### 6.1 Candidate content structure

Candidates preserve the retained Observation → Problem → Root Cause →
Generalized Rule separation. Observation must not be stored as a finalized
General Rule.

Minimum candidate content:

```yaml
candidateId: ""
contractVersion: "DEVELOPMENT-KNOWLEDGE-COMPOUND-V1"
candidateVersion: "1.0.0"
observation: ""
problem: ""
suspectedRootCause: ""
proposedRule: ""
sourceRefs: []
evidenceRefs:
  - evidenceRef: ""
    relation: SUPPORTING|CONTRADICTING|INCONCLUSIVE
scope:
  observedIn: []
  proposedAppliesTo: []
  explicitlyNotValidatedFor: []
createdBy:
  actorType: HUMAN|AGENT|SERVICE|AUTOMATION
  actorId: ""
creationMode: HUMAN|AGENT_ASSISTED|AUTOMATED
createdAt: ""
contentDigest: ""
```

### 6.2 Scope separation (P2-1)

Candidate scope is **proposed**, not validated:

| Field | Meaning |
| --- | --- |
| `observedIn` | Where the observation actually occurred |
| `proposedAppliesTo` | Where the author proposes the rule may apply |
| `explicitlyNotValidatedFor` | Known exclusions not yet validated away |

At Knowledge promotion, **Validated Scope** is determined only by Authority
Decision in the Knowledge Assetization plane. DKC must not emit
`validatedScope` or equivalent authoritative scope fields.

### 6.3 Evidence classification (P2-2)

Evidence references attached to a Candidate must be classifiable at submission
time:

```yaml
evidenceRefs:
  - evidenceRef: ""
    relation: SUPPORTING|CONTRADICTING|INCONCLUSIVE
```

Rules:

```text
Contradicting evidence must not be deleted to strengthen a Candidate.
Contradicting evidence remains visible through Authority Decision evaluation.
Inconclusive evidence does not count as supporting validation.
```

### 6.4 Forbidden candidate authority fields

DKC Candidates and submissions **must not** output or self-declare:

```text
ACTIVE
CURRENT
Confidence Score
Validated
Production Safe
Runtime Eligible
Maturity
Validation Result
Supersession State
```

Non-authoritative draft annotations are permitted only when explicitly labeled
`nonAuthoritative: true` and ignored by all downstream gates.

### 6.5 evidenceRefs schema consistency (Correction-2)

The structured `evidenceRefs` shape in §6.1 is mandatory everywhere Candidate
content appears, including:

```text
Candidate draft records
KnowledgeCandidateSubmission@v1 payloads
Cross-Repository Promotion request attachments
```

Bare string arrays for `evidenceRefs` are **not** permitted. Every evidence
reference must declare `relation`.

---

## 7. Candidate Generation Authority (P1-1)

### 7.1 Required provenance

Every Candidate **must** record generation provenance:

```yaml
createdBy:
  actorType: HUMAN|AGENT|SERVICE|AUTOMATION
  actorId: ""
creationMode: HUMAN|AGENT_ASSISTED|AUTOMATED
```

`creationMode` semantics:

| Mode | Meaning |
| --- | --- |
| `HUMAN` | Human authored the candidate without agent drafting |
| `AGENT_ASSISTED` | Human authority with agent assistance |
| `AUTOMATED` | System or automation generated without human authorship |

AI Agent generation of Candidates is permitted. Human, Agent-assisted, and
Automated Candidates are **not** equivalent authority classes for promotion.

### 7.2 Generation authority ≠ promotion authority

```text
Candidate Generation Authority
  != Knowledge Promotion Authority
  != Verification Authority
  != Authority Decision Authority
```

Creating a Candidate grants no promotion, verification, lifecycle, or runtime
authority. Candidate existence must not be displayed or indexed in a way that
implies Knowledge existence.

Retrieval and review surfaces must distinguish:

```text
Candidate
  != Authoritative Knowledge
```

---

## 8. Verification and Authority Decision Boundary (P1-2)

DKC does **not** perform Authoritative Verification or Authority Decision.
Those authorities belong to the Knowledge Assetization external contract plane.

Required actor separation for Authoritative Knowledge promotion:

```text
Candidate Author
Verification Actor
Authority Decision Actor
```

### 8.1 Self-Approval Eligibility Matrix (Correction-2)

Self-approval by the same principal is **not** uniformly permitted. DKC must
classify each submission into exactly one eligibility class:

| Class | Meaning |
| --- | --- |
| `PROHIBITED` | Same principal must not perform Verification and Authority Decision |
| `CONDITIONAL` | Same principal may proceed only when external contract conditions are met |
| `INDEPENDENT_VERIFICATION_REQUIRED` | Different Verification Actor is mandatory before Authority Decision |

Default classification by impact:

```text
Production Runtime impact          → INDEPENDENT_VERIFICATION_REQUIRED
Safety-impacting Knowledge         → INDEPENDENT_VERIFICATION_REQUIRED
Cross-Repository Promotion         → INDEPENDENT_VERIFICATION_REQUIRED
creationMode = AUTOMATED           → PROHIBITED for Verification / Authority Decision
                                      by the same actorId
Local / non-production draft       → CONDITIONAL
```

Rules:

1. Full three-actor separation is **not** always required.
2. `CONDITIONAL` self-approval still requires external Verification and
   Promotion Decision records; DKC must not infer approval from eligibility
   class alone.
3. `PROHIBITED` and `INDEPENDENT_VERIFICATION_REQUIRED` submissions must carry
   a different `verificationActor.actorId` from `createdBy.actorId` before
   Knowledge Assetization accepts downstream Authority Decisions.
4. Candidates and submissions **must not** self-declare
   `selfApprovalEligible`, `verified`, or equivalent authority fields.

### 8.2 Circular self-reinforcement boundary

At the DKC submission boundary, bind to `WAEP-LEARNING-SYSTEM-V1`
`INV-LRN-016`:

```text
Knowledge-derived output cannot be the sole independent evidence
supporting that same Knowledge.
```

DKC submissions must preserve evidence lineage sufficient for downstream
Validation Authority to detect circular support:

```yaml
evidenceRefs:
  - evidenceRef: ""
    relation: SUPPORTING|CONTRADICTING|INCONCLUSIVE
    lineage:
      derivedFromKnowledgeRefs: []
      derivedFromDecisionRefs: []
```

DKC must not treat prior Candidate or Authoritative Knowledge output as
independent evidence when it is the sole support for the same candidate chain.

### 8.3 Submission actor separation

`createdBy` records Candidate authorship. `submittedBy` records submission
action. They may differ (for example, human author with automation-assisted
submission).

Rules:

```text
submittedBy.actorId = createdBy.actorId
  → permitted, but subject to Self-Approval Eligibility Matrix
submittedBy.actorType = AUTOMATION with creationMode = HUMAN
  → requires explicit human author in createdBy
```

DKC may submit Candidates and capture verification requests. DKC must not
record verification or approval outcomes as authoritative state.

---

## 9. Knowledge Assetization Boundary (P1-3)

### 9.1 DKC-owned responsibilities

DKC owns only:

```text
Development Event Capture
Knowledge Candidate Generation
Candidate Source Traceability
Reuse Event Capture
Development Metric Capture
Knowledge Retrieval Request
```

### 9.2 External contract references

DKC references, but does not own:

```text
KnowledgeVerificationDecision@v1
KnowledgeValidationDecision@v1
KnowledgePromotionDecision@v1
KnowledgeLifecycleDecision@v1
RuntimeKnowledgeBindingDecision@v1
KnowledgeEffectivenessDecision@v1
LearningPayloadReleaseDecision@v1
```

External contract definitions live under `docs/learning/contracts/` in
`WAEP-LEARNING-SYSTEM-V1`.

### 9.3 Submission contract

DKC submits Candidates to Knowledge Assetization through the versioned contract:

```text
KnowledgeCandidateSubmission@v1
```

Mandatory submission fields:

```yaml
submissionId: ""
contractVersion: KnowledgeCandidateSubmission@v1
submissionVersion: "1"
resolutionKey:
  contractType: KnowledgeCandidateSubmission@v1
  candidateId: ""
  candidateVersion: ""
  contentDigest: ""
selfApprovalEligibility: PROHIBITED|CONDITIONAL|INDEPENDENT_VERIFICATION_REQUIRED
candidate:
  candidateId: ""
  candidateVersion: ""
  observation: ""
  problem: ""
  suspectedRootCause: ""
  proposedRule: ""
  sourceRefs: []
  scope:
    observedIn: []
    proposedAppliesTo: []
    explicitlyNotValidatedFor: []
  evidenceRefs:
    - evidenceRef: ""
      relation: SUPPORTING|CONTRADICTING|INCONCLUSIVE
      lineage:
        derivedFromKnowledgeRefs: []
        derivedFromDecisionRefs: []
  createdBy:
    actorType: HUMAN|AGENT|SERVICE|AUTOMATION
    actorId: ""
  creationMode: HUMAN|AGENT_ASSISTED|AUTOMATED
  contentDigest: ""
submittedAt: ""
submittedBy:
  actorType: HUMAN|AGENT|SERVICE|AUTOMATION
  actorId: ""
sourceRepository: ""
crossRepositoryPromotionRequest: null
contentDigest: ""
```

Rules:

```text
DKC Candidate submission
  != Verification Decision
  != Promotion Decision
  != Lifecycle Decision
```

Submission may reference external Verification or Promotion decision identifiers,
but must not encode their outcome as DKC authority state.

### 9.4 Submission resolution identity (Correction-2)

Each submission must compute a canonical resolution identity:

```yaml
resolutionKey:
  contractType: KnowledgeCandidateSubmission@v1
  candidateId: ""
  candidateVersion: ""
  contentDigest: ""
```

Rules:

```text
Duplicate submission → detected before Knowledge Assetization intake
Same resolutionKey   → idempotent; does not create new candidate visibility
Resubmission          → new submission identity only when candidateVersion or
                        contentDigest changes
```

---

## 10. Cross-Repository Promotion Boundary (P1-4)

DKC may create a **promotion request** for cross-repository reuse, but must not
self-promote local knowledge into Platform Knowledge.

Required stages:

```text
Local Candidate
       ↓
Verification
       ↓
Cross-Repository Promotion Decision
       ↓
Platform Candidate
       ↓
Knowledge Assetization
```

Minimum required evidence for Cross-Repository Promotion Decision:

```yaml
crossRepositoryPromotionRequest:
  localCandidateRef: ""
  sourceRepositoryEvidence: []
  applicabilityEvidence: []
  counterexampleAssessment: []
  targetDomainDefinition: ""
  promotionDecisionRef: ""          # external authority only
```

A single repository observation is insufficient for automatic platform-level
promotion.

---

## 11. Development Knowledge Retrieval

DKC can request retrieval of Authoritative Knowledge after Knowledge Assetization.

Retrieval inputs:

```text
Task
Repository Role
Language
Framework
Error
Historical Context
```

Retrieval outputs must distinguish:

```text
Candidate results
Authoritative Knowledge results
```

A Candidate must not be presented as if it were `CURRENT` Authoritative Knowledge.

Derived retrieval systems remain rebuildable:

```text
GitHub Canonical
     │
     ├─ Vector DB
     ├─ Search Index
     ├─ Knowledge Graph
     └─ Agent Memory
```

Loss of a derived store does not modify Canonical Knowledge state.

---

## 12. Engineering Metrics

### 12.1 Rework and avoided work (retained)

Retained from Definition Start:

```text
Known Failure Rework is a preferred process metric over raw total work time.
Avoided Work estimate
  != Avoided Work actual
Estimated reduction must not be treated as measured outcome.
```

### 12.2 Work time measurement (P2-4)

Raw `WorkTime` is not a single-source metric.

Possible sources include:

```text
Human start / stop records
Agent task start / completion timestamps
Git commit intervals
PR activity intervals
CI duration
Issue state intervals
```

Metric records must declare source and measurement type:

```yaml
metric:
  name: ""
  measurementType: MEASURED|ESTIMATED|DERIVED
  source: ""
  observedAt: ""
  value: 0
  unit: ""
```

Mixed-source rollups must label ESTIMATED separately from measured sources.

### 12.3 Metric governance (P2-5)

Engineering Metrics collected by DKC are for process improvement only.

Prohibited downstream uses:

```text
Personal evaluation by Knowledge Candidate count
Personal evaluation by Rework count
Productivity ranking from work time alone
```

Aggregations for process improvement must be scoped to team, repository,
domain, or workflow — not individual performance ranking — unless a separate
explicit governance definition authorizes otherwise.

---

## 13. Reuse Event Capture (P2-3)

A reuse event is recorded in stages:

```text
Retrieved
Suggested
Accepted
Applied
Outcome Observed
```

These stages must not be collapsed into one boolean `reused=true`.

Minimum record:

```yaml
reuseEventId: ""
knowledgeRef: ""
repository: ""
stage: RETRIEVED|SUGGESTED|ACCEPTED|APPLIED|OUTCOME_OBSERVED
actorType: HUMAN|AGENT|SERVICE|AUTOMATION
observedAt: ""
evidenceRefs: []
```

`APPLIED` does not imply successful outcome.

`OUTCOME_OBSERVED` must reference result evidence.

---

## 14. Data Flow

```text
Repository / Issue / PR / CI / Incident
              │
              ▼
       Development Event
              │
              ▼
DEVELOPMENT-KNOWLEDGE-COMPOUND
              │
              ├─ Candidate Generation
              │       │
              │       ▼
              │  KnowledgeCandidateSubmission@v1
              │       │
              │       ▼
              │  Knowledge Assetization
              │       │
              │       ├─ Verification
              │       ├─ Validation
              │       ├─ Promotion
              │       ├─ Lifecycle
              │       └─ Runtime Eligibility
              │
              ├─ Reuse Event Capture
              │
              └─ Engineering Metrics
```

---

## 15. Invariants

```text
INV-DKC-001  Candidate existence != Knowledge existence
INV-DKC-002  DKC does not own Authoritative Knowledge lifecycle
INV-DKC-003  DKC does not own Runtime Binding / Eligibility
INV-DKC-004  Candidate Generation Authority != Promotion Authority
INV-DKC-005  Automated Candidate requires createdBy + creationMode provenance
INV-DKC-006  Verification and Authority Decision are external contracts
INV-DKC-007  Contradicting evidence must be preserved
INV-DKC-008  Candidate scope must not declare validatedScope
INV-DKC-009  Cross-Repository Promotion requires external Promotion Decision
INV-DKC-010  Reuse event stages must not collapse into one boolean
INV-DKC-011  Engineering Metrics must not be used for personal productivity ranking
INV-DKC-012  Agent direct Authoritative Knowledge activation is PROHIBITED
INV-DKC-013  Production Runtime / safety-impacting Knowledge requires Independent
             Verification before Authority Decision
INV-DKC-014  Derived retrieval state is not Canonical Authority
INV-DKC-015  Self-Approval Eligibility Matrix class is mandatory on submission
INV-DKC-016  Candidate and Submission resolutionKey identities are mandatory
             and duplicate / replay handling is idempotent
INV-DKC-017  evidenceRefs must use structured relation form everywhere
```

---

## 16. Validation Scenarios

```text
DKC-V01  Development Event without Candidate → permitted
DKC-V02  Candidate without promotion → Candidate only
DKC-V03  Automated Candidate with missing createdBy → reject / HOLD
DKC-V04  Candidate self-declares ACTIVE → reject
DKC-V05  Contradicting evidence removed before promotion → reject / HOLD
DKC-V06  Local Candidate promoted cross-repo without Promotion Decision → reject
DKC-V07  Candidate claims validatedScope → reject
DKC-V08  Reuse APPLIED without outcome evidence → do not mark outcome success
DKC-V09  Avoided work estimate displayed as measured actual → reject
DKC-V10  Derived index lost → rebuild from GitHub Canonical without changing
         Knowledge lifecycle state
DKC-V11  Agent direct Authoritative Knowledge activation → prohibited
DKC-V12  Production runtime knowledge uses same Candidate Author, Verification Actor,
         and Authority Decision Actor without independent verification → reject / HOLD
DKC-V13  Knowledge-derived output is the sole independent evidence for the same
         candidate chain → reject / HOLD under INV-LRN-016
DKC-V14  Candidate submitted using KnowledgeCandidateSubmission@v1 with full
         provenance and external Decision ownership → accept for downstream review only
DKC-V15  AUTOMATED candidate submitted with same actor attempting Verification /
         Authority Decision → classify PROHIBITED; do not promote
DKC-V16  Same Development Event + same contentDigest is re-extracted → resolve to
         existing candidate identity; no evidence-strength increase
DKC-V17  Submission uses bare string evidenceRefs → reject; structured relation is
         mandatory
```

---

## 17. Acceptance Criteria

```text
AC-DKC-01  DKC responsibility excludes Authoritative Lifecycle and Runtime Binding.
AC-DKC-02  Candidate Generation records actor and creationMode.
AC-DKC-03  Verification / Authority Decision are represented as external contracts.
AC-DKC-04  Observation / Problem / Root Cause / Generalized Rule remain distinct.
AC-DKC-05  Observed / Proposed / Validated scope are distinct.
AC-DKC-06  Contradicting evidence is retained.
AC-DKC-07  Cross-Repository Promotion requires independent evidence and Decision.
AC-DKC-08  Reuse stages are distinguishable.
AC-DKC-09  Work time metric sources and measurementType are declared.
AC-DKC-10  Personal productivity ranking from DKC metrics is prohibited.
AC-DKC-11  Engineering Metrics remain process-improvement inputs only at Definition
           level.
AC-DKC-12  GitHub Canonical / Derived separation is retained.
AC-DKC-13  Automatic Knowledge Promotion remains PROHIBITED.
AC-DKC-14  KnowledgeCandidateSubmission@v1 contract defines the DKC output
           boundary to Knowledge Assetization.
AC-DKC-15  Self-Approval Eligibility Matrix defines PROHIBITED / CONDITIONAL /
           INDEPENDENT_VERIFICATION_REQUIRED classes.
AC-DKC-16  Candidate extraction and Submission resolutionKey identities are
           defined with idempotent duplicate / replay handling.
AC-DKC-17  evidenceRefs structured relation schema is consistent across Candidate
           and Submission surfaces.
```

---

## 18. Correction Mapping (Re-Review-1)

| Finding | ID | Correction location |
| --- | --- | --- |
| P1-1 Self-Approval Eligibility Matrix undefined | DKC-AUTH-SELF-APPROVAL-001 | §8.1–§8.3, INV-DKC-015, AC-DKC-15 |
| P1-2 Candidate / Submission Resolution Identity undefined | DKC-RESOLUTION-001 | §5.3, §9.4, contract, INV-DKC-016, AC-DKC-16 |
| P2-1 evidenceRefs schema inconsistency | DKC-SCHEMA-CONSISTENCY-001 | §6.1, §6.5, contract, INV-DKC-017, AC-DKC-17 |

---

## 19. Exit Gate

```text
Human Definition Lock: GO
Definition State: LOCKED
Lock Decision Record: docs/learning/reviews/development-knowledge-compound-definition-lock-go.md
Implementation Start: separate GO / HOLD
Automatic Knowledge Promotion: PROHIBITED
```

No Implementation Start is implied by Definition Lock.
