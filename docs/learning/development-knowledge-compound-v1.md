# DEVELOPMENT-KNOWLEDGE-COMPOUND-V1

## Status

```text
Definition: DEVELOPMENT-KNOWLEDGE-COMPOUND-V1
Revision: Definition Correction-1
Supersedes: Definition Start (pre-repo draft reviewed as Independent Definition Review-1)
Independent Definition Review-1: CORRECTION REQUIRED → addressed herein
Independent Definition Re-Review-1: REQUIRED
Definition Lock: NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
Knowledge Extraction Prototype: NOT AUTHORIZED
Automatic Candidate Generation: NOT AUTHORIZED
Automatic Knowledge Promotion: PROHIBITED
Automation Enforcement: NOT AUTHORIZED
```

This document is **definition only**. It does not authorize implementation,
persistence, automatic candidate generation, knowledge promotion, or automation
enforcement.

```text
Definition Correction-1
  != Definition Lock
  != Implementation Start
  != Knowledge Extraction Prototype
  != Automatic Candidate Generation
  != Automatic Knowledge Promotion
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
evidenceRefs: []
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

Rules:

1. Full three-actor separation is **not** always required.
2. Self-approval by the same principal is permitted only under explicitly
   defined conditions in the external Verification / Promotion contracts.
3. For Production Runtime or safety-impacting Knowledge, **Independent
   Verification is mandatory** before Authority Decision.
4. One principal or one Agent must not be assumed safe to perform Candidate
   generation, Verification completion, and Approval without an explicit
   allowed-self-approval rule.

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

DKC submits Candidates to Knowledge Assetization through
`KnowledgeCandidateSubmission@v1` (see
`docs/learning/contracts/knowledge-candidate-submission-v1.md`).

DKC outputs Candidate proposals only. Knowledge Assetization outputs
Authoritative Knowledge state.

---

## 10. Cross-Repository Promotion (P1-4)

Local Knowledge Candidates are repository-scoped by default.

Cross-repository elevation follows a separate action:

```text
Local Knowledge Candidate
  ↓
Cross-Repository Applicability Review
  ↓
Platform Knowledge Candidate
```

Platform Knowledge Candidate creation is a **separate action** from Local
Candidate generation.

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

Rules:

```text
Repository-specific incidents must not silently generalize to platform rules.
SharePoint-specific failure must not become all-web-application rule without
  independent Promotion Decision and counterexample assessment.
Platform Candidate creation requires independent Promotion Decision authority.
```

DKC may package a Cross-Repository Promotion **request**. DKC must not create
Platform Knowledge Candidates as authoritative outputs without an external
Promotion Decision reference.

---

## 11. Reuse Event Capture (P2-3)

Reuse events measure development-side engagement with knowledge artifacts.
Simple reference is not successful reuse.

Required reuse stages:

```yaml
reuseStage:
  - DISCOVERED
  - CONSIDERED
  - APPLIED
  - VERIFIED_EFFECTIVE
  - REJECTED_NOT_APPLICABLE
```

Rules:

```text
Reference alone            != successful reuse
DISCOVERED / CONSIDERED    != VERIFIED_EFFECTIVE
VERIFIED_EFFECTIVE         requires explicit confirmation event
REJECTED_NOT_APPLICABLE    is a valid reuse outcome and must be retained
```

Reuse metrics for Knowledge Reuse Assessment must use stage-aware aggregation.
Do not count DISCOVERED or CONSIDERED as successful reuse.

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

### 12.2 Work time source (P2-4)

Work time values must retain measurement source:

```yaml
duration:
  minutes: 0
  source: MANUAL|TIMER|SYSTEM_EVENT|ESTIMATED
```

Rules:

```text
Estimated duration must not be aggregated as measured duration.
Analysis surfaces must preserve source separation.
Mixed-source rollups must label ESTIMATED separately from measured sources.
```

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

## 13. Knowledge Retrieval Request

DKC may emit retrieval requests against Derived retrieval planes and Canonical
GitHub artifacts.

Retrieval results must preserve authority labeling:

```text
Candidate result            ≠ Authoritative Knowledge result
Derived index result        ≠ Canonical state
Knowledge Available         ≠ Execution Authority
```

Retrieval does not grant runtime execution authority.

---

## 14. Retained Positive Findings

The following Definition Start decisions remain unchanged:

```text
GitHub Canonical / Derived rebuild model
Automatic Knowledge Promotion prohibition
Observation vs Generalized Rule separation
Known Failure Rework as process metric
Avoided Work estimate vs actual separation
```

---

## 15. Safety Invariants

```text
INV-DKC-001  Development Event ≠ Knowledge Candidate ≠ Authoritative Knowledge
INV-DKC-002  Candidate existence ≠ Knowledge existence
INV-DKC-003  Candidate Generation Authority ≠ Promotion Authority
INV-DKC-004  Candidate must record createdBy and creationMode
INV-DKC-005  DKC must not emit ACTIVE / CURRENT / Validated / Runtime Eligible
INV-DKC-006  Contradicting evidence must not be deleted to strengthen a Candidate
INV-DKC-007  Validated Scope is decided only in Knowledge Assetization authority
INV-DKC-008  Cross-Repository Promotion requires independent Promotion Decision
INV-DKC-009  Reference alone is not successful reuse
INV-DKC-010  Estimated work time must not be aggregated as measured work time
INV-DKC-011  Engineering Metrics must not be used for personal productivity ranking
INV-DKC-012  Agent direct Authoritative Knowledge activation is PROHIBITED
INV-DKC-013  Production Runtime / safety-impacting Knowledge requires Independent
             Verification before Authority Decision
INV-DKC-014  Derived retrieval state is not Canonical Authority
```

---

## 16. Acceptance Criteria

```text
AC-DKC-01  DKC scope is limited to event capture, candidate extraction,
           traceability, reuse, metrics, and retrieval request.
AC-DKC-02  Candidate records createdBy.actorType, createdBy.actorId, and
           creationMode.
AC-DKC-03  Candidate Generation Authority is separated from Promotion Authority.
AC-DKC-04  Verification Actor and Authority Decision Actor separation rules
           are defined with Independent Verification required for production /
           safety-impacting Knowledge.
AC-DKC-05  DKC does not own Authoritative Lifecycle, Maturity, Confidence,
           Validation Result, Runtime Binding, or Canonical Supersession.
AC-DKC-06  Cross-Repository Promotion requires separate action and external
           Promotion Decision evidence.
AC-DKC-07  Candidate scope distinguishes observedIn, proposedAppliesTo, and
           explicitlyNotValidatedFor.
AC-DKC-08  Evidence refs support SUPPORTING / CONTRADICTING / INCONCLUSIVE.
AC-DKC-09  Reuse events distinguish DISCOVERED, CONSIDERED, APPLIED,
           VERIFIED_EFFECTIVE, REJECTED_NOT_APPLICABLE.
AC-DKC-10  Work time preserves MANUAL / TIMER / SYSTEM_EVENT / ESTIMATED source.
AC-DKC-11  Personal evaluation uses from metrics are prohibited at Definition
           level.
AC-DKC-12  GitHub Canonical / Derived separation is retained.
AC-DKC-13  Automatic Knowledge Promotion remains PROHIBITED.
AC-DKC-14  KnowledgeCandidateSubmission@v1 contract defines the DKC output
           boundary to Knowledge Assetization.
```

---

## 17. Correction Mapping (Review-1)

| Finding | ID | Correction location |
| --- | --- | --- |
| P1-1 Candidate generation authority undefined | DKC-AUTH-CANDIDATE-001 | §6.1, §7, INV-DKC-003/004, AC-DKC-02/03 |
| P1-2 Verification vs Authority Decision boundary | DKC-AUTH-VERIFY-001 | §8, INV-DKC-013, AC-DKC-04 |
| P1-3 Knowledge Assetization authority overlap | DKC-BOUNDARY-KA-001 | §3, §9, INV-DKC-005/007, AC-DKC-01/05/14 |
| P1-4 Cross-Repository Promotion authority | DKC-CROSSREPO-001 | §10, INV-DKC-008, AC-DKC-06 |
| P2-1 Over-generalization detection weak | DKC-GENERALIZATION-001 | §6.2, INV-DKC-007, AC-DKC-07 |
| P2-2 Negative evidence handling missing | DKC-EVIDENCE-NEGATIVE-001 | §6.3, INV-DKC-006, AC-DKC-08 |
| P2-3 Reuse success definition missing | DKC-REUSE-001 | §11, INV-DKC-009, AC-DKC-09 |
| P2-4 Work time input reliability | DKC-METRIC-TIME-001 | §12.2, INV-DKC-010, AC-DKC-10 |
| P2-5 Personal metric use boundary | DKC-METRIC-GOVERNANCE-001 | §2, §12.3, INV-DKC-011, AC-DKC-11 |

---

## 18. Next Gate

```text
Next: Independent Definition Re-Review-1
on:   DEVELOPMENT-KNOWLEDGE-COMPOUND-V1 Definition Correction-1

Until Re-Review-1 passes and Definition Lock is granted:

  Definition Lock              = NOT AUTHORIZED
  Implementation Start         = NOT AUTHORIZED
  Knowledge Extraction Prototype = NOT AUTHORIZED
  Automatic Candidate Generation = NOT AUTHORIZED
  Automatic Knowledge Promotion  = PROHIBITED
  Automation Enforcement       = NOT AUTHORIZED
```
