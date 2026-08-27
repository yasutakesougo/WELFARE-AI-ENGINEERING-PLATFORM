# WAEP-LEARNING-SYSTEM-V1

## Status

```text
Definition: CORRECTION-1
Supersedes: Definition Start (pre-repo draft reviewed as Independent Definition Review-1)
Independent Definition Review-1: CORRECTION REQUIRED → addressed herein
Independent Definition Review-2: REQUIRED
Definition Lock: DENIED
Implementation Start: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Runtime Authorization: NO CHANGE
Automatic Knowledge Promotion: PROHIBITED
Automatic Runtime Distribution: NOT AUTHORIZED
```

This document is **definition only**. It does not authorize implementation,
persistence, Agent Control Plane wiring, runtime distribution, or production
policy mutation.

---

## 1. Purpose

Define a portfolio Learning System that capitalizes experience into reusable
engineering knowledge **without** allowing Knowledge Records to self-declare
authority, and without allowing the Learning Loop to self-reinforce from its
own outputs.

Core separations (retained from Definition Start):

```text
Experience
  != Knowledge
  != Approved Knowledge
  != Runtime Authority

System Learning
  != Model Learning

APPROVED
  != ACTIVE
```

Correction-1 centerline:

```text
Knowledge describes.
Evidence supports.
Validation assesses.
Promotion authorizes admission.
Lifecycle decides availability.
Verification asserts CURRENT eligibility.
Runtime Binding authorizes use.
Execution Gate authorizes action.
```

---

## 2. Non-goals

This definition does **not** authorize:

```text
automatic knowledge promotion
automatic runtime distribution / binding
model weight training / fine-tuning as System Learning
production policy mutation from Learning Events
copying production-sensitive data into the reusable Knowledge Plane
LABS-only evidence as sole basis for CORE Runtime promotion
implementation of Decision Record stores
Agent Control Plane / Execution Gate changes
```

---

## 3. Revised Authority Model

```text
Production / Engineering / Lab Event
        │
        ▼
Classification + Redaction / Minimization
        │
        ▼
Allowed Learning Payload
        │
        ▼
Observation / Learning Event Record
        │
        ▼
Knowledge Candidate (immutable versioned content)
        │
        ├──────── Evidence Records (provenance + lineage)
        │
        ▼
Validation Decision Record          ← KnowledgeValidationDecision@v1
        │
        ▼
Promotion Decision Record           ← KnowledgePromotionDecision@v1
        │
        ▼
Knowledge Record (content + refs only)
        │
        ├──────── Lifecycle Decision Record      ← KnowledgeLifecycleDecision@v1
        ├──────── Verification Decision Record   ← KnowledgeVerificationDecision@v1
        │
        ▼
Runtime Binding Decision Record     ← RuntimeKnowledgeBindingDecision@v1
        │
        ▼
Agent Control Plane (evaluation only; no self-binding)
        │
        ▼
Execution Gate
```

Each record class is a separate responsibility. No stage may infer a later
authority state from an earlier knowledge or evidence state.

---

## 4. State Derivation Principle

```text
Stored Knowledge State          ×  (authoritative fields forbidden)
Derived Knowledge State         ✓
```

Authoritative runtime-eligible state is derived only from:

```text
Knowledge Record (content + canonical refs)
+ latest valid Promotion Decision (bound to immutable knowledge version)
+ latest valid Lifecycle Decision
+ CURRENT Verification Decision
+ Runtime Binding Decision (for target)
        ↓
Authoritative Runtime State
```

A single-record field such as `status: ACTIVE` or `confidence: 0.9` inside a
Knowledge Record **must not** be trusted as authority.

---

## 5. Knowledge Record — Content Only

### 5.1 Allowed content fields

Knowledge Record holds **description**, not authority:

```yaml
knowledgeId: K-...
contractVersion: "WAEP-LEARNING-SYSTEM-V1"
knowledgeVersion: "1.0.0"          # immutable once published
title: ""
scopeClass: PROJECT|DOMAIN|ENGINEERING
applicability:
  appliesTo: []
  doesNotApplyTo: []
content:
  generalizedRule: ""
  rationale: ""
  nonGoals: []
source:
  candidateRef: ""
  candidateVersion: ""
evidenceRefs: []                   # supporting evidence identities only
decisionRefs:
  validationDecisionRef: ""        # optional pointer; not embedded decision
  promotionDecisionRef: ""
  lifecycleDecisionRef: ""
  verificationDecisionRef: ""
  runtimeBindingDecisionRefs: []   # refs only; never embedded outcomes
supersedes: []                     # knowledge identity + version refs
supersededBy: null
createdAt: ""
contentDigest: ""                  # digest of content payload only
```

### 5.2 Forbidden authoritative fields on Knowledge Record

The following **must not** appear as authoritative stored state on Knowledge
or Knowledge Candidate records:

```text
lifecycle status / status
confidence / confidenceScore
validationResult / validated
promotionResult / approved / approvedBy / approvedAt
runtimeBindingStatus / active / distributed
CURRENT self-declaration
effectivenessPass / effectivenessScore (as authority)
```

Non-authoritative draft annotations (e.g. author notes) are permitted only if
explicitly labeled `nonAuthoritative: true` and are ignored by all gates.

### 5.3 Knowledge Candidate

Candidates are immutable once `candidateVersion` is published. Amendments
create a new `candidateVersion`. Promotion / Validation Decisions bind to a
specific `candidateVersion` and do not auto-transfer to later versions.

Candidate may carry provisional non-authoritative assessment notes, but never
authoritative confidence or lifecycle state.

---

## 6. Canonical Decision Contracts

Full field contracts live under `docs/learning/contracts/`.
Summary of required external contracts:

| Contract | Role |
| --- | --- |
| `KnowledgeValidationDecision@v1` | Authoritative validation outcome |
| `KnowledgePromotionDecision@v1` | Authoritative admission to Knowledge Plane |
| `KnowledgeLifecycleDecision@v1` | Authoritative availability transition |
| `KnowledgeVerificationDecision@v1` | CURRENT eligibility for runtime-eligible knowledge |
| `RuntimeKnowledgeBindingDecision@v1` | Authoritative BIND / UNBIND / ROLLBACK for a runtime target |

Common requirements for every Decision Record:

```text
decisionId              unique, immutable
contractVersion         fixed contract identity + version
subjectRef              knowledge or candidate identity
subjectVersion          immutable bound version
decisionVersion         decision record version (append-only)
authorityRef            who/what decided
evidenceRefs            supporting evidence identities
decidedAt               audit timestamp (not part of subject identity)
conditions              optional constraints
contentDigest           digest of canonical decision facts
```

Decision Records are append-only. Correction creates a new decision that
supersedes a prior decision; prior decisions remain auditable.

---

## 7. Validation Authority

### 7.1 Evidence ≠ Decision

Validation methods (Independent Review, Automated Test, Synthetic Fixture,
Regression Test, Reproduction, Evidence Verification, Production Evidence,
Counter Evidence Review, Human Governance Review) produce **Evidence**.

Only `KnowledgeValidationDecision@v1` produces authoritative validation state.

```text
Test PASS              ≠ VALIDATED
Independent Review     ≠ VALIDATED
Evidence accumulation  ≠ Validation Decision
```

### 7.2 Decision vocabulary

```text
VALID
VALID_WITH_CONDITIONS
INVALID
HOLD
```

### 7.3 Contract pointer

See `docs/learning/contracts/knowledge-validation-decision-v1.md`.

---

## 8. Promotion Authority

`KnowledgePromotionDecision@v1` binds to an immutable candidate version.

```text
Promotion Decision for Candidate V1
  does not authorize Candidate V2
```

Decision vocabulary (minimum):

```text
PROMOTE
PROMOTE_WITH_CONDITIONS
HOLD
REJECT
SUPERSEDE_PRIOR_PROMOTION
```

Promotion admits content into the Knowledge Plane. It does **not**:

```text
activate runtime use
bind to Agent Control Plane
mutate Execution Gate policy
imply CURRENT verification
```

See `docs/learning/contracts/knowledge-promotion-decision-v1.md`.

---

## 9. Lifecycle Authority

Lifecycle is **derived** from `KnowledgeLifecycleDecision@v1`, never stored as
an authoritative field on the Knowledge Record.

### 9.1 Lifecycle labels (derived)

```text
CANDIDATE
VALIDATING
VALIDATED
HOLD
REJECTED
PROMOTION_PENDING
APPROVED
ACTIVE          # only when valid Runtime Binding exists + CURRENT verification
SUPERSEDED
RETIRED
```

`ACTIVE` is not granted by Lifecycle Decision alone. See §10 and §11.

### 9.2 Allowed Transition Matrix

| From | To | Required Authority |
| --- | --- | --- |
| CANDIDATE | VALIDATING | Validation intake authority |
| VALIDATING | VALIDATED | `KnowledgeValidationDecision` ∈ {VALID, VALID_WITH_CONDITIONS} |
| VALIDATING | HOLD | `KnowledgeValidationDecision` = HOLD |
| VALIDATING | REJECTED | `KnowledgeValidationDecision` = INVALID |
| VALIDATED | PROMOTION_PENDING | Promotion intake authority |
| PROMOTION_PENDING | APPROVED | `KnowledgePromotionDecision` ∈ {PROMOTE, PROMOTE_WITH_CONDITIONS} |
| PROMOTION_PENDING | HOLD | `KnowledgePromotionDecision` = HOLD |
| PROMOTION_PENDING | REJECTED | `KnowledgePromotionDecision` = REJECT |
| APPROVED | ACTIVE | Derived only when valid Runtime Binding + CURRENT verification exist |
| ACTIVE | SUPERSEDED | Lifecycle Decision + supersession rules (§14) |
| ACTIVE | RETIRED | Lifecycle Decision |
| any non-terminal | HOLD | Lifecycle Decision with HOLD |
| HOLD | prior eligible state | Lifecycle Decision restoring prior path (new decision) |

Implicit transitions are forbidden. Especially:

```text
APPROVED → ACTIVE     must not be automatic
VALIDATED → APPROVED  must not skip Promotion Decision
```

See `docs/learning/contracts/knowledge-lifecycle-decision-v1.md`.

---

## 10. Runtime Binding Authority

`APPROVED != ACTIVE`.

ACTIVE for a runtime target is derived only when **all** of the following hold:

```text
1. valid Promotion Decision for the immutable knowledge version
2. Lifecycle Decision does not place the knowledge in HOLD / REJECTED / RETIRED
3. CURRENT Verification Decision is present and valid
4. RuntimeKnowledgeBindingDecision = BIND | BIND_WITH_CONDITIONS
   for (knowledgeVersion, runtimeTargetRef)
```

### 10.1 RuntimeKnowledgeBindingDecision vocabulary

```text
BIND
BIND_WITH_CONDITIONS
DENY
UNBIND
HOLD
RESTORE          # rollback to a prior Last Known Good Binding
```

Knowledge Registry, Distribution Candidate processing, and Agent Control Plane
**must not** self-declare ACTIVE or invent Binding Decisions.

See `docs/learning/contracts/runtime-knowledge-binding-decision-v1.md`.

---

## 11. CURRENT Verification

Runtime-eligible Knowledge requires **CURRENT** verification evidence derived
from `KnowledgeVerificationDecision@v1`.

```text
reviewDueAt / drift signal     = observation aids only
Knowledge.selfCURRENT          = forbidden
missing CURRENT decision       = not runtime-eligible
```

Decision vocabulary (minimum):

```text
CURRENT
CURRENT_WITH_CONDITIONS
STALE
INVALIDATED
HOLD
```

See `docs/learning/contracts/knowledge-verification-decision-v1.md`.

---

## 12. Circular Self-Reinforcement Prevention

Learning Loop (allowed as a process):

```text
Knowledge
  → Runtime Application
  → Effectiveness Evaluation
  → Observation
  → Knowledge Candidate
  → Validation
  → Knowledge
```

Invariant:

```text
Knowledge-derived output cannot be the sole independent
evidence supporting that same Knowledge.
```

### 12.1 Evidence lineage

Every Evidence Record must carry lineage sufficient to detect cycles:

```yaml
evidenceId: ""
subjectRef: ""
sourceClassification: UNTRUSTED|INTERNAL|PRODUCTION|SYNTHETIC|AI_GENERATED|LAB
provenance:
  sourceEventId: ""
  sourceArtifactRef: ""
  sourceRevision: ""
  observedAt: ""
  contentDigest: ""
lineage:
  derivedFromKnowledgeRefs: []     # knowledge identities that produced this output
  derivedFromDecisionRefs: []
  independent: true|false
```

### 12.2 Cycle detection requirements

Between Candidate, Validation, Promotion, and Effectiveness:

```text
- reject sole-support cycles (A validates A via A's outputs only)
- require at least one independent evidence class for Validation Decision VALID*
- AI-generated evidence alone cannot close a Validation or Promotion Decision
- duplicated / replayed events do not increase independent evidence strength
```

---

## 13. Production Data Handling Boundary

Before Learning Ingestion:

```text
Production Event
  → Classification
  → Redaction / Minimization
  → Allowed Learning Payload
  → Learning Event
```

Rules:

```text
- Knowledge Records store reusable generalized information only
- original production evidence is referenced, not copied, by default
- personal / child / family / customer / secret / credential data
  must not enter the reusable Knowledge Plane
- Learning Event.observedFacts / resolution must contain only
  authorized minimized payloads
```

Unauthorized transfer of production-sensitive data into Learning Event,
Evidence, Candidate, or Knowledge Record is a definition violation.

---

## 14. Supersession vs Runtime Rollback

These are distinct:

| Concept | Plane | Meaning |
| --- | --- | --- |
| Knowledge Supersession | Knowledge history | V2 replaces V1 as preferred content |
| Runtime Binding | Runtime | which version is bound to a target |
| Runtime Unbinding | Runtime | remove a binding |
| Runtime Rollback | Runtime | restore Last Known Good Binding |

Supersession **does not** constitute runtime rollback.

### 14.1 Rollback path

```text
Binding V1 (Last Known Good)
  → Binding V2
  → failure
  → UNBIND V2   (RuntimeKnowledgeBindingDecision)
  → RESTORE V1  (RuntimeKnowledgeBindingDecision)
```

Rollback requires an auditable authority decision. Runtime must be able to
identify Last Known Good Binding per `runtimeTargetRef`.

### 14.2 Supersession exclusivity

When V2 exclusively replaces V1 for the same scope and applicability:

```text
same scope + same applicability + exclusive replacement
  → prior version Runtime Binding must not remain ACTIVE
```

If coexistence is intended, scope or priority must be explicit on both
Knowledge content and Binding Decisions.

---

## 15. Learning Event Provenance & Idempotency

### 15.1 Source identity (minimum)

```yaml
learningEventId: ""
source:
  sourceRepository: ""
  sourceEventId: ""
  sourceArtifactRef: ""
  sourceRevision: ""
  observedAt: ""
  contentDigest: ""
classification: ""
allowedPayloadRef: ""
```

### 15.2 Duplicate / Replay

```text
Event identity          = stable identity over sourceEventId + contentDigest
Duplicate detection     = required at ingestion
Replay handling         = idempotent; does not create new independent evidence
Idempotent ingestion    = re-ingest of same identity is a no-op for evidence strength
```

Duplicate or replayed events **must not** artificially increase evidence counts
used by Validation, Promotion, or Effectiveness Decisions.

---

## 16. Effectiveness Evaluation

Metrics (failure recurrence, correction frequency, CI failure rate, review
finding rate, rollback frequency, human intervention rate, policy denial rate,
resolution time, acceptance pass rate) are **observations**.

Required for an Effectiveness Decision:

```text
baseline
measurementWindow
sampleSize
comparisonTarget
evaluationAuthority
evidenceRefs
```

```text
Effectiveness Observation  ≠ Effectiveness Decision
metric improvement alone   ≠ Knowledge validity or promotion authority
```

Effectiveness Decision cannot be the sole independent validation of the same
Knowledge that produced the measured outputs (§12).

---

## 17. LABS → CORE Promotion Boundary

```text
LABS Observation / Evidence
  → may create Knowledge Candidate
  → may support validation in non-production / synthetic contexts
  → MUST NOT be the sole basis for CORE Runtime Binding
```

CORE Runtime promotion / binding requires CORE-appropriate independent evidence
and CORE authority path. Lab success alone is insufficient.

---

## 18. Knowledge Poisoning Defense

Minimum trust path for untrusted input:

```text
Untrusted Source
  → Source Classification
  → Integrity Verification
  → Content Isolation
  → Candidate Extraction
  → Independent Evidence
  → Validation Decision
```

The following must not be treated at the same trust level as verified
independent evidence:

```text
Prompt Injection content
Manipulated Logs
Fabricated Evidence
Duplicated / Replayed Evidence
AI-generated Evidence
Compromised Repository Content
```

Retained prohibitions:

```text
AI-generated knowledge cannot self-promote
External Intelligence is untrusted until verified
CONFLICT_UNRESOLVED cannot be promoted
Production failure cannot automatically modify runtime policy
```

---

## 19. Safety Invariants

### 19.1 Retained baseline invariants

```text
INV-LRN-001  Experience ≠ Knowledge ≠ Approved Knowledge ≠ Runtime Authority
INV-LRN-002  System Learning ≠ Model Learning
INV-LRN-003  AI-generated knowledge cannot self-promote
INV-LRN-004  External Intelligence is untrusted until verified
INV-LRN-005  CONFLICT_UNRESOLVED cannot be promoted
INV-LRN-006  Production failure cannot automatically modify runtime policy
INV-LRN-007  APPROVED ≠ ACTIVE
INV-LRN-008  Promotion does not grant execution authority
INV-LRN-009  UNKNOWN / HOLD are not PASS-equivalent
INV-LRN-010  Sensitive / personal / secret data must not be exported as reusable knowledge
```

### 19.2 Correction-1 invariants

```text
INV-LRN-011  Knowledge Record cannot self-declare authoritative lifecycle state.
INV-LRN-012  Confidence assessment must not be authoritative when stored
             inside the Knowledge Record.
INV-LRN-013  Validation evidence is not a Validation Decision.
INV-LRN-014  Promotion Decision must bind to an immutable candidate version.
INV-LRN-015  ACTIVE state requires a valid external Runtime Binding Decision.
INV-LRN-016  Knowledge-derived evidence cannot independently validate
             the same Knowledge.
INV-LRN-017  Production-sensitive data must not enter the reusable
             Knowledge Plane without an authorized data-handling step.
INV-LRN-018  Supersession does not constitute runtime rollback.
INV-LRN-019  Runtime rollback requires an auditable authority decision.
INV-LRN-020  Runtime-eligible Knowledge requires CURRENT verification evidence.
```

---

## 20. Acceptance Criteria

### 20.1 Retained baseline ACs

```text
AC-01  Experience / Knowledge / Approved Knowledge / Runtime Authority are separated.
AC-02  System Learning is defined without Model Learning authority.
AC-03  AI-generated knowledge cannot self-promote.
AC-04  External Intelligence remains untrusted until verified.
AC-05  CONFLICT_UNRESOLVED cannot be promoted.
AC-06  Production failure cannot automatically modify runtime policy.
AC-07  APPROVED ≠ ACTIVE is explicit.
AC-08  Distribution path to Agent Control Plane / Runtime Gate is defined without
       self-authorization.
AC-09  Evidence provenance is required for candidates.
AC-10  Version / supersession relationship exists for Knowledge content.
AC-11  Auditability of promotion path is defined at definition level.
AC-12  Automatic Knowledge Promotion and Automatic Runtime Distribution are prohibited.
```

### 20.2 Correction-1 ACs

```text
AC-13  Validation Result is derived from an external Decision Record.
AC-14  Confidence Assessment is externalized from the Knowledge Record.
AC-15  Promotion Decision Contract is version-fixed and binds immutable subject version.
AC-16  Lifecycle Authority is defined as an external Decision.
AC-17  ACTIVE Authority is derived from Runtime Binding Decision (+ CURRENT).
AC-18  Circular Evidence Dependency is prohibited or detectable.
AC-19  Production Data → Learning Payload Data Handling Boundary is defined.
AC-20  Runtime Unbind / Rollback path is defined as authority decisions.
AC-21  CURRENT Verification Evidence is mandatory for runtime eligibility.
AC-22  Lifecycle / Supersession / Runtime Binding consistency rules are defined.
AC-23  Learning Event duplicate / replay cannot artificially increase evidence strength.
```

---

## 21. Correction Mapping (Review-1)

| Finding | ID | Correction location |
| --- | --- | --- |
| P1-1 Knowledge self-held authority | LRN-AUTH-001 | §4, §5, INV-011/012, AC-13/14 |
| P1-2 Validation Decision missing | LRN-VALIDATION-001 | §7, contract, INV-013, AC-13 |
| P1-3 Promotion contract incomplete | LRN-PROMOTION-001 | §6, §8, contract, INV-014, AC-15 |
| P1-4 Lifecycle transition undefined | LRN-LIFECYCLE-001 | §9, contract, AC-16 |
| P1-5 ACTIVE / Binding unseparated | LRN-RUNTIME-001 | §10, contract, INV-015, AC-17 |
| P1-6 Circular self-reinforcement | LRN-CIRCULAR-001 | §12, INV-016, AC-18 |
| P1-7 Production data boundary | LRN-DATA-001 | §13, INV-017, AC-19 |
| P1-8 Rollback vs supersession | LRN-ROLLBACK-001 | §14, INV-018/019, AC-20/22 |
| P1-9 CURRENT verification | LRN-CURRENT-001 | §11, INV-020, AC-21 |
| P2-1 Weak source identity | LRN-PROVENANCE-001 | §15.1 |
| P2-2 Duplicate / replay | LRN-IDEMPOTENCY-001 | §15.2, AC-23 |
| P2-3 Supersession exclusivity | LRN-SUPERSESSION-001 | §14.2, AC-22 |
| P2-4 Effectiveness contract | LRN-EFFECTIVENESS-001 | §16 |
| P2-5 LABS→CORE boundary | LRN-LAB-BOUNDARY-001 | §17 |

---

## 22. Next Gate

```text
Next: Independent Definition Review-2
on:   WAEP-LEARNING-SYSTEM-V1 Definition Correction-1

Until Review-2 passes and Definition Lock is granted:

  Implementation Start     = NOT AUTHORIZED
  Runtime Activation       = NOT AUTHORIZED
  Automatic Promotion      = PROHIBITED
  Automatic Distribution   = NOT AUTHORIZED
```
