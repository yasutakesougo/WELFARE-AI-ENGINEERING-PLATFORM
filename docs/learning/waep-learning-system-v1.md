# WAEP-LEARNING-SYSTEM-V1

## Status

```text
Definition: WAEP-LEARNING-SYSTEM-V1
Revision: Definition Correction-2
Supersedes: Definition Correction-1
Trigger: Independent Definition Re-Review-2
Re-Review-2 Result: P0 = 0 / P1 = 5 / P2 = 5
Definition Lock: DENIED
Implementation Start: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Runtime Authorization: NO CHANGE
Automatic Knowledge Promotion: PROHIBITED
Automatic Runtime Distribution: NOT AUTHORIZED
Next Gate: Independent Definition Re-Review-3
```

This document is **definition only**. It does not authorize implementation,
persistence, Agent Control Plane wiring, runtime distribution, registry
migration, or production policy mutation.

Correction-2 does **not** change the Architecture Centerline.

---

## 1. Purpose and Retained Principles

Define a portfolio Learning System that capitalizes experience into reusable
engineering knowledge **without** allowing Knowledge Records to self-declare
authority, and without allowing Knowledge Available / Knowledge Promoted to
imply Execution Authority.

Retained separations:

```text
Experience
  != Knowledge
  != Approved Knowledge
  != Runtime Authority

System Learning
  != Model Learning

Knowledge Available
  != Execution Authority
```

WAEP's current Authority also separates Knowledge Available / Knowledge
Promoted from Execution Authority.

Correction-2 centerline (Architecture Centerline retained):

```text
Immutable Knowledge Content
        │ subject identity
        ▼
Decision Records
        │ Validation / Promotion / Lifecycle / Verification /
        │ Runtime Binding / Payload Release / Effectiveness
        ▼
Canonical Decision Resolver
        │ effective head / supersession / conflict /
        │ expiry / fail-closed
        ▼
Derived Knowledge State
        ▼
Target-specific Runtime State
        ▼
Agent Control Plane
        ▼
Execution Gate
```

```text
Knowledge Record does not own Authority.
Decision Record alone is not final Runtime Authority.
Only Canonical Decision Resolver output is Derived State.
```

---

## 2. Correction-2 Scope

Correction-2 addresses Independent Definition Re-Review-2 findings:

| Priority | ID | Topic |
| --- | --- | --- |
| P1-1 | LRN-DECISION-RESOLUTION-001 | Canonical Decision Resolution Rule |
| P1-2 | LRN-ACTIVE-SCOPE-001 | Knowledge Lifecycle / Runtime Target State separation |
| P1-3 | LRN-IMMUTABLE-REF-001 | Immutable Knowledge / Mutable Decision Ref conflict |
| P1-4 | LRN-ROLLBACK-ELIGIBILITY-001 | RESTORE Runtime Eligibility re-evaluation |
| P1-5 | LRN-DATA-RELEASE-001 | Production Learning Payload Release Authority |
| P2-1 | LRN-CONFIDENCE-002 | Confidence semantics |
| P2-2 | LRN-EFFECTIVENESS-002 | Effectiveness Decision Contract |
| P2-3 | LRN-CURRENT-FRESHNESS-001 | CURRENT freshness policy |
| P2-4 | LRN-EVIDENCE-INDEPENDENCE-001 | Evidence independence authority |
| P2-5 | LRN-SUPERSESSION-ORDER-001 | Exclusive Supersession ordering |

Additionally defines Compatibility Rules with the existing WAEP Knowledge
Registry, Maturity Model, and Failure Knowledge Format.

Correction-1 content for Validation, Promotion, Circular Self-Reinforcement,
Learning Event Provenance, LABS→CORE boundary, and Knowledge Poisoning Defense
is retained unless superseded below.

---

## 3. Non-goals / Execution Boundary

Correction-2 is Definition only. The following remain **not** authorized:

```text
Decision Store implementation
Registry migration
Control Center wiring
Runtime binding
Repository mutation
Automatic promotion
Automatic Ready
Automatic Merge
Automatic Deploy
LIVE WRITE
automatic knowledge promotion
automatic runtime distribution / binding
model weight training / fine-tuning as System Learning
production policy mutation from Learning Events
copying production-sensitive data into the reusable Knowledge Plane
LABS-only evidence as sole basis for CORE Runtime promotion
```

Ready / Merge / Deploy / LIVE WRITE remain independent Gates under current
WAEP Authority.

---

## 4. Canonical Decision Resolution

### 4.1 Resolution Identity

Decision Resolution keys are composed per Decision contract type from at least:

```yaml
resolutionKey:
  contractType: ""
  subjectRef: ""
  subjectVersion: ""
  scopeRef: ""                 # omit when not applicable to the contract
  runtimeTargetRef: ""         # omit when not applicable to the contract
```

Unnecessary dimensions may be omitted per contract.

Decisions in the same Authority Domain must **not** be incorrectly separated
by divergent keys.

### 4.2 Effective Head

Decision Records are append-only.

```text
Decision D1
   ↓ superseded by
Decision D2
   ↓ superseded by
Decision D3

Effective Head = D3
```

Effective Head is resolved from the correct supersession chain terminus.

`decidedAt` recency alone must not determine the head.

### 4.3 Concurrent Heads

Concurrent unresolved heads are not an allowed steady state:

```text
       D1
      /  \
    D2    D3
```

If D2 and D3 both supersede D1 and neither supersedes the other:

```text
Resolution State: AMBIGUOUS
```

### 4.4 Fail-Closed Rule

If Canonical Decision Resolver cannot resolve a unique Authority Head:

```text
UNKNOWN
AMBIGUOUS
INVALID_CHAIN
MISSING_DEPENDENCY
EXPIRED
```

None of the above is Runtime Eligible.

```text
Resolution failure
    ↓
HOLD
    ↓
NOT RUNTIME ELIGIBLE
```

WAEP must not implicitly elevate UNKNOWN to PASS.

### 4.5 Decision Resolution Contract Invariants

All Decision Contracts share:

```text
append-only
immutable decision content
explicit supersession
subject version binding
authority reference required
ambiguous head fails closed
missing dependency fails closed
expired authority fails closed
```

Authority Resolution must not depend solely on timestamps inside Decision
Records.

---

## 5. Knowledge Lifecycle and Runtime State Separation

Correction-1 included `ACTIVE` inside Knowledge Lifecycle. Correction-2
**removes** `ACTIVE` from Knowledge Lifecycle.

### 5.1 Knowledge Lifecycle

```text
CANDIDATE
VALIDATING
VALIDATED
PROMOTION_PENDING
APPROVED
HOLD
REJECTED
SUPERSEDED
RETIRED
```

Lifecycle expresses Knowledge availability / historical state.

Lifecycle must **not** express Runtime Target application state.

### 5.2 Allowed Lifecycle Transition Matrix

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
| APPROVED | SUPERSEDED | Lifecycle Decision + supersession rules |
| APPROVED | RETIRED | Lifecycle Decision |
| APPROVED | HOLD | Lifecycle Decision with HOLD |
| any non-terminal | HOLD | Lifecycle Decision with HOLD |
| HOLD | prior eligible state | Lifecycle Decision restoring prior path (new decision) |
| SUPERSEDED / RETIRED | — | terminal unless explicit restore path Decision |

Implicit transitions are forbidden.

```text
VALIDATED → APPROVED   must not skip Promotion Decision
Lifecycle must not transition to ACTIVE (removed)
```

### 5.3 Runtime Binding State

Runtime State is resolved per:

```text
Knowledge Version
+
Runtime Target
```

Derived Runtime Binding State (minimum):

```text
BOUND
UNBOUND
DENIED
HELD
NOT_ELIGIBLE
```

### 5.4 Runtime Effective State

Consumer display may derive:

```text
Runtime Effective State = ACTIVE
```

`ACTIVE` is **not** a stored value.

Derive `ACTIVE` only when **all** hold:

```text
Knowledge Lifecycle = APPROVED
AND Verification = CURRENT | CURRENT_WITH_CONDITIONS
AND Runtime Binding = BOUND
AND no unresolved authority conflict
AND all binding conditions satisfied
AND CURRENT freshness policy is satisfied (§12)
```

Therefore:

```text
Knowledge Lifecycle ACTIVE   # FORBIDDEN — do not use
```

Retained meaning of INV-LRN-007 / APPROVED ≠ ACTIVE: APPROVED Knowledge is
not automatically Runtime Effective ACTIVE.

---

## 6. Knowledge Record Immutability

Knowledge Version content is immutable after publication.

```text
Knowledge K-10 V1 content
  must not be updated because Lifecycle, Verification, or Binding changed
```

### 6.1 Allowed Knowledge Record fields

```yaml
knowledgeId: K-...
knowledgeVersion: "1.0.0"          # immutable once published
contractVersion: "WAEP-LEARNING-SYSTEM-V1"
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
evidenceRefs: []
promotionProvenanceRef: ""         # immutable provenance fixed at Knowledge creation
supersedes: []                     # prior knowledgeRef + knowledgeVersion
createdAt: ""
contentDigest: ""                  # digest of content payload only
```

`promotionProvenanceRef` may hold immutable provenance fixed at Knowledge
generation time.

### 6.2 Removed mutable references

Knowledge Record must **not** store:

```text
lifecycleDecisionRef
verificationDecisionRef
runtimeBindingDecisionRefs
supersededBy
latestDecisionRef
currentState
decisionRefs.* (as mutable authority pointers)
```

Resolve Decision Registry by reverse lookup:

```text
subjectRef
+
subjectVersion
```

### 6.3 Supersession Direction

When Knowledge V2 replaces V1:

```yaml
# on V2 only
supersedes:
  - knowledgeRef: K-10
    knowledgeVersion: "1.0.0"
```

Do **not** append `supersededBy: V2` onto V1.

`supersededBy` may be derived as a Registry Query result.

### 6.4 Forbidden authoritative fields

Must not appear as authoritative stored state on Knowledge or Candidate:

```text
lifecycle status / status / ACTIVE
confidence / confidenceScore (as authority)
validationResult / validated
promotionResult / approved / approvedBy / approvedAt
runtimeBindingStatus / active / distributed
CURRENT self-declaration
effectivenessPass / effectivenessScore (as authority)
maturity (as self-declared authority)
independent: true|false (on Evidence as authority)
```

Candidate may carry human-readable non-authoritative assessment only when
explicitly labeled, e.g.:

```yaml
nonAuthoritativeAssessment:
  confidenceNote: ""
```

---

## 7. Canonical Decision Contracts

Full field contracts live under `docs/learning/contracts/`.

| Contract | Role |
| --- | --- |
| `KnowledgeValidationDecision@v1` | Authoritative validation outcome |
| `KnowledgePromotionDecision@v1` | Authoritative admission to Knowledge Plane |
| `KnowledgeLifecycleDecision@v1` | Authoritative availability transition (no ACTIVE) |
| `KnowledgeVerificationDecision@v1` | CURRENT eligibility + freshness inputs |
| `RuntimeKnowledgeBindingDecision@v1` | BIND / UNBIND / RESTORE for a runtime target |
| `LearningPayloadReleaseDecision@v1` | Production/sensitive → Learning Plane release |
| `KnowledgeEffectivenessDecision@v1` | Effectiveness observation evaluation |

Common Decision Record requirements:

```text
decisionId              unique, immutable
contractVersion         fixed contract identity + version
subjectRef              knowledge or candidate identity (as applicable)
subjectVersion          immutable bound version (as applicable)
decisionVersion         decision record version (append-only)
authorityRef            who/what decided
evidenceRefs            supporting evidence identities
decidedAt               audit timestamp (not sole head selector)
conditions              optional constraints
contentDigest           digest of canonical decision facts
supersedesDecisionRef   prior decision in chain (when applicable)
```

Decision Records are append-only. Correction creates a new decision that
supersedes a prior decision; prior decisions remain auditable.

---

## 8. Validation Authority

### 8.1 Evidence ≠ Decision

Validation methods produce **Evidence**.

Only `KnowledgeValidationDecision@v1` produces authoritative validation state.

```text
Test PASS              ≠ VALIDATED
Independent Review     ≠ VALIDATED
Evidence accumulation  ≠ Validation Decision
```

### 8.2 Decision vocabulary

```text
VALID
VALID_WITH_CONDITIONS
INVALID
HOLD
```

See `docs/learning/contracts/knowledge-validation-decision-v1.md`.

---

## 9. Promotion Authority

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
grant Execution Authority
```

See `docs/learning/contracts/knowledge-promotion-decision-v1.md`.

---

## 10. Runtime Binding Authority

`APPROVED != Runtime Effective ACTIVE`.

Runtime Effective ACTIVE for a target requires §5.4 conditions.

### 10.1 RuntimeKnowledgeBindingDecision vocabulary

```text
BIND
BIND_WITH_CONDITIONS
DENY
UNBIND
HOLD
RESTORE
```

Knowledge Registry, Distribution Candidate processing, and Agent Control Plane
**must not** self-declare ACTIVE or invent Binding Decisions.

See `docs/learning/contracts/runtime-knowledge-binding-decision-v1.md`.

### 10.2 RESTORE Runtime Eligibility

```text
Historical Last Known Good
  != Currently Eligible LKG
```

`RESTORE` on `RuntimeKnowledgeBindingDecision@v1` must re-evaluate **all**:

```text
1. Knowledge version exists
2. valid Promotion Decision exists
3. Lifecycle is runtime-eligible (APPROVED; not HOLD/REJECTED/RETIRED/SUPERSEDED)
4. CURRENT Verification is valid now
5. Verification Policy has not expired it
6. Runtime Target policy is compatible
7. no exclusive supersession conflict exists
8. Human / local Authority requirement is satisfied
```

Prior Binding Decisions must **not** be re-enabled as-is.

RESTORE creates a **new** Decision Record.

### 10.3 Restore Failure

```text
RESTORE REQUEST
    ↓
DENY or HOLD
```

If the prior version cannot be restored, the system must **not** automatically
continue on the newer version solely because restore failed.

---

## 11. CURRENT Verification and Freshness

Runtime-eligible Knowledge requires CURRENT verification from
`KnowledgeVerificationDecision@v1`.

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

### 11.1 Verification Policy

Minimum policy:

```yaml
verificationPolicy:
  policyVersion: ""
  knowledgeClass: ""
  expiryRequired: true|false
  maximumAge: ""
  reverificationTriggers: []
```

### 11.2 Runtime Resolution of freshness

Even if a CURRENT Decision exists, Knowledge is **not** Runtime Eligible when:

```text
validUntil expired
OR maximumAge exceeded
OR mandatory reverification trigger unresolved
OR verification Decision conflict exists
```

Derived states may be:

```text
CURRENT_EXPIRED
NOT_CURRENT
```

Knowledge Record itself does not mutate CURRENT.

See `docs/learning/contracts/knowledge-verification-decision-v1.md`.

---

## 12. Learning Payload Release Authority

Production → Learning Plane transfer is an independent Authority.

Current WAEP rules already prohibit storing as Knowledge:

```text
production personal information
support records
disability / disease / medical information
family-specific information
child-specific information
customer production data
credentials / secrets
```

Canonical Production Learning repositories likewise prohibit Knowledge Export of
production personal / customer-specific data / credentials / secrets.

### 12.1 Ingestion Path

```text
Source Event
    ↓
Data Classification
    ↓
Redaction / Minimization
    ↓
Release Assessment
    ↓
LearningPayloadReleaseDecision@v1
    ↓
Allowed Learning Payload
    ↓
Learning Event
```

### 12.2 Fail-Closed

For production-sensitive sources:

```text
Missing Release Decision
  = Ingestion Prohibited
```

Successful redaction alone does **not** mean ALLOW.

See `docs/learning/contracts/learning-payload-release-decision-v1.md`.

---

## 13. Confidence Semantics

In WAEP-LEARNING-SYSTEM-V1 V1, Confidence is **not** Runtime Authority.

```text
Confidence
  = non-authoritative assessment only
```

Forbidden:

```text
confidence >= threshold → auto promotion
confidence >= threshold → runtime binding
confidence >= threshold → CURRENT
```

Do not store authoritative confidence on Knowledge Records.

---

## 14. KnowledgeEffectivenessDecision@v1

Separate Effectiveness Observation from Decision.

Effectiveness Decision is an observation evaluation. Alone it cannot perform:

```text
Promotion
Lifecycle transition
CURRENT renewal
Runtime Binding
Execution Authorization
```

Effectiveness results may trigger re-Validation.

See `docs/learning/contracts/knowledge-effectiveness-decision-v1.md`.

---

## 15. Evidence Independence Authority

Evidence Records must not self-authorize independence.

Correction-1 field `independent: true|false` is **not** an authoritative field.

### 15.1 Evidence Record (provenance only)

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
  derivedFromKnowledgeRefs: []
  derivedFromDecisionRefs: []
```

### 15.2 Independence Resolution

Evidence Independence is evaluated by Validation Authority from:

```text
Provenance
+
Lineage
+
Validation Context
```

Do not treat `Evidence.independent = true` alone as Independent Evidence.

### 15.3 Circular Self-Reinforcement (retained)

```text
Knowledge-derived output cannot be the sole independent
evidence supporting that same Knowledge.
```

Between Candidate, Validation, Promotion, and Effectiveness:

```text
- reject sole-support cycles
- require at least one independent evidence class for Validation Decision VALID*
- AI-generated evidence alone cannot close Validation or Promotion
- duplicated / replayed events do not increase independent evidence strength
```

---

## 16. Exclusive Supersession Ordering

For exclusive replacement of same scope / applicability, temporary dual ACTIVE
is not allowed.

### 16.1 Required Sequence

```text
V2 eligibility confirmed
        ↓
V1 UNBIND authorized
        ↓
V1 UNBIND verified
        ↓
V2 BIND authorized
        ↓
V2 BIND verified
```

If V1 UNBIND cannot be verified:

```text
V2 Binding: HOLD
```

### 16.2 Atomic Decision Alternative

If Runtime Control Plane later provides atomic transition:

```text
UNBIND V1 + BIND V2
  as a single Authority Transaction
```

Partial success must not be treated as ACTIVE.

### 16.3 Supersession vs Runtime Rollback

| Concept | Plane | Meaning |
| --- | --- | --- |
| Knowledge Supersession | Knowledge history | V2 replaces V1 as preferred content |
| Runtime Binding | Runtime | which version is bound to a target |
| Runtime Unbinding | Runtime | remove a binding |
| Runtime Rollback | Runtime | RESTORE after re-evaluated eligibility |

Supersession does **not** constitute runtime rollback.

---

## 17. Learning Event Provenance & Idempotency

### 17.1 Source identity (minimum)

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
learningPayloadReleaseDecisionRef: ""   # required for production-sensitive sources
```

### 17.2 Duplicate / Replay

```text
Event identity          = stable identity over sourceEventId + contentDigest
Duplicate detection     = required at ingestion
Replay handling         = idempotent; does not create new independent evidence
Idempotent ingestion    = re-ingest of same identity is a no-op for evidence strength
```

---

## 18. LABS → CORE Promotion Boundary

```text
LABS Observation / Evidence
  → may create Knowledge Candidate
  → may support validation in non-production / synthetic contexts
  → MUST NOT be the sole basis for CORE Runtime Binding
```

CORE Runtime promotion / binding requires CORE-appropriate independent evidence
and CORE authority path. Lab success alone is insufficient.

---

## 19. Knowledge Poisoning Defense

Minimum trust path for untrusted input:

```text
Untrusted Source
  → Source Classification
  → Integrity Verification
  → Content Isolation
  → Candidate Extraction
  → Independent Evidence (authority-evaluated)
  → Validation Decision
```

Not equivalent to verified independent evidence:

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

## 20. Existing WAEP Registry Compatibility

Current WAEP Roadmap / Knowledge Registry may hold:

```text
Knowledge ID
Generalized Rule
Evidence Reference
Scope
Applicability
Maturity
Verification State
Supersession State
Enforcement Candidate
```

Required Fields historically include Maturity, Validation Result, Verification
State, Supersession State, Last Verified.

After Correction-2, these must **not** be Authoritative Stored Fields on the
Knowledge Record.

### 20.1 Registry Projection

Machine-readable Registry may provide Derived Projection:

```yaml
knowledgeId: ""
knowledgeVersion: ""
contentRef: ""
derived:
  maturity: ""
  validationState: ""
  verificationState: ""
  supersessionState: ""
  enforcementCandidate: ""
resolution:
  resolvedAt: ""
  resolverVersion: ""
  decisionRefs: []
```

`derived` is Cache / Projection, **not** Authority Source.

### 20.2 Projection Staleness

When Registry Projection and Decision Registry disagree:

```text
Decision Registry
  >
Derived Registry Projection
```

If Projection is STALE or Resolution fails, do not use it for Runtime
Authority.

WAEP information-source priority already places Current Authority / Current
Decision above Knowledge Registry.

---

## 21. Maturity Model Compatibility

Roadmap Maturity Model:

```text
L0 OBSERVED
L1 DOCUMENTED
L2 GENERALIZED
L3 ADOPTED
L4 ENFORCED
L5 PROVEN_CROSS_REPO
```

Correction-2 treats Maturity as a Classification Projection derived from
multiple Decisions / Evidence — not Knowledge self-declared Authority.

Example derivation:

```text
L0  Observation exists
L1  Documented candidate exists
L2  Generalization validated
L3  Promotion / adoption evidence exists
L4  authorized runtime binding exists
L5  cross-repository verified evidence exists
```

Maturity Level itself never grants Execution Authority.

---

## 22. Failure Knowledge Compatibility

Current Failure Knowledge Format may include:

```text
Root Cause Confidence
Current State
Superseded By
```

After Correction-2:

```text
Root Cause Confidence  → non-authoritative assessment
Current State          → Derived Projection from Decision Resolution
Superseded By          → derived from reverse Knowledge reference
```

Historical Failure Evidence remains retained.

---

## 23. WAEP Portfolio Boundary

Repository Role Registry boundaries are unchanged:

```text
audit-management-system-mvp     = Production Learning Source
severe-behavior-support-spfx    = Engineering Validation Source
ai-development-control-center   = Agent Control Plane
                                  (Knowledge does not expand Worker Authority)
welfare-m365-dx-diagnostic      = Commercial success ≠ Engineering Authority
LAB success                     ≠ CORE Adoption
```

---

## 24. Safety Invariants

### 24.1 Retained baseline invariants

```text
INV-LRN-001  Experience ≠ Knowledge ≠ Approved Knowledge ≠ Runtime Authority
INV-LRN-002  System Learning ≠ Model Learning
INV-LRN-003  AI-generated knowledge cannot self-promote
INV-LRN-004  External Intelligence is untrusted until verified
INV-LRN-005  CONFLICT_UNRESOLVED cannot be promoted
INV-LRN-006  Production failure cannot automatically modify runtime policy
INV-LRN-007  APPROVED ≠ ACTIVE (Runtime Effective)
INV-LRN-008  Promotion does not grant execution authority
INV-LRN-009  UNKNOWN / HOLD are not PASS-equivalent
INV-LRN-010  Sensitive / personal / secret data must not be exported as reusable knowledge
```

### 24.2 Correction-1 invariants (retained)

```text
INV-LRN-011  Knowledge Record cannot self-declare authoritative lifecycle state.
INV-LRN-012  Confidence assessment must not be authoritative when stored
             inside the Knowledge Record.
INV-LRN-013  Validation evidence is not a Validation Decision.
INV-LRN-014  Promotion Decision must bind to an immutable candidate version.
INV-LRN-015  Runtime Effective ACTIVE requires a valid external Runtime Binding
             Decision (plus CURRENT and other §5.4 conditions).
INV-LRN-016  Knowledge-derived evidence cannot independently validate
             the same Knowledge.
INV-LRN-017  Production-sensitive data must not enter the reusable
             Knowledge Plane without an authorized data-handling step.
INV-LRN-018  Supersession does not constitute runtime rollback.
INV-LRN-019  Runtime rollback requires an auditable authority decision.
INV-LRN-020  Runtime-eligible Knowledge requires CURRENT verification evidence.
```

### 24.3 Correction-2 invariants

```text
INV-LRN-021  Multiple unresolved authoritative Decision heads for the same
             resolution key must fail closed.
INV-LRN-022  Knowledge lifecycle and target-specific runtime binding state
             are distinct authority domains.
INV-LRN-023  Immutable Knowledge content must not require mutation to track
             later Lifecycle, Verification, Binding, or Supersession decisions.
INV-LRN-024  RESTORE must re-evaluate current runtime eligibility.
INV-LRN-025  Production-sensitive Learning ingestion requires an explicit
             Learning Payload Release Decision.
INV-LRN-026  Evidence independence cannot be self-authorized by Evidence metadata.
INV-LRN-027  Exclusive supersession must not create simultaneous effective
             bindings unless coexistence is explicitly authorized.
INV-LRN-028  Confidence is non-authoritative in WAEP-LEARNING-SYSTEM-V1 V1.
INV-LRN-029  Expired CURRENT verification is not runtime eligible.
INV-LRN-030  Derived Registry Projection is not an Authority Source.
```

---

## 25. Acceptance Criteria

### 25.1 Retained baseline ACs

```text
AC-01  Experience / Knowledge / Approved Knowledge / Runtime Authority are separated.
AC-02  System Learning is defined without Model Learning authority.
AC-03  AI-generated knowledge cannot self-promote.
AC-04  External Intelligence remains untrusted until verified.
AC-05  CONFLICT_UNRESOLVED cannot be promoted.
AC-06  Production failure cannot automatically modify runtime policy.
AC-07  APPROVED ≠ Runtime Effective ACTIVE is explicit.
AC-08  Distribution path to Agent Control Plane / Runtime Gate is defined without
       self-authorization.
AC-09  Evidence provenance is required for candidates.
AC-10  Version / supersession relationship exists for Knowledge content.
AC-11  Auditability of promotion path is defined at definition level.
AC-12  Automatic Knowledge Promotion and Automatic Runtime Distribution are prohibited.
```

### 25.2 Correction-1 ACs (retained)

```text
AC-13  Validation Result is derived from an external Decision Record.
AC-14  Confidence Assessment is externalized from the Knowledge Record.
AC-15  Promotion Decision Contract is version-fixed and binds immutable subject version.
AC-16  Lifecycle Authority is defined as an external Decision.
AC-17  Runtime Effective ACTIVE is derived from Runtime Binding (+ CURRENT + §5.4).
AC-18  Circular Evidence Dependency is prohibited or detectable.
AC-19  Production Data → Learning Payload Data Handling Boundary is defined.
AC-20  Runtime Unbind / Rollback path is defined as authority decisions.
AC-21  CURRENT Verification Evidence is mandatory for runtime eligibility.
AC-22  Lifecycle / Supersession / Runtime Binding consistency rules are defined.
AC-23  Learning Event duplicate / replay cannot artificially increase evidence strength.
```

### 25.3 Correction-2 ACs

```text
AC-24  Canonical Decision Resolution produces one deterministic
       effective head or fail-closed conflict.
AC-25  Knowledge lifecycle does not contain target-specific ACTIVE state.
AC-26  Knowledge Record remains immutable when Lifecycle,
       Verification, Binding, and Supersession decisions change.
AC-27  RESTORE performs CURRENT runtime eligibility evaluation.
AC-28  Production-sensitive Learning Payload requires explicit
       release authority.
AC-29  Confidence is explicitly non-authoritative and does not
       participate directly in runtime eligibility.
AC-30  KnowledgeEffectivenessDecision has canonical subject,
       decision vocabulary, and append-only supersession.
AC-31  CURRENT freshness is evaluated through Verification Policy.
AC-32  Evidence independence is derived from provenance / lineage
       and authoritative assessment rather than Evidence self-declaration.
AC-33  Exclusive supersession prevents unintended simultaneous bindings.
AC-34  Existing Knowledge Registry authority-like fields are treated
       as derived projections, not canonical authority.
AC-35  Registry Projection conflict or staleness fails closed.
AC-36  Maturity level does not grant execution authority.
```

---

## 26. Correction Mapping

### 26.1 Review-1 → Correction-1 (historical)

| Finding | ID | Correction location |
| --- | --- | --- |
| P1-1 Knowledge self-held authority | LRN-AUTH-001 | §6, INV-011/012, AC-13/14 |
| P1-2 Validation Decision missing | LRN-VALIDATION-001 | §8, contract, INV-013, AC-13 |
| P1-3 Promotion contract incomplete | LRN-PROMOTION-001 | §7, §9, contract, INV-014, AC-15 |
| P1-4 Lifecycle transition undefined | LRN-LIFECYCLE-001 | §5, contract, AC-16 |
| P1-5 ACTIVE / Binding unseparated | LRN-RUNTIME-001 | §5, §10, contract, INV-015, AC-17 |
| P1-6 Circular self-reinforcement | LRN-CIRCULAR-001 | §15, INV-016, AC-18 |
| P1-7 Production data boundary | LRN-DATA-001 | §12, INV-017, AC-19 |
| P1-8 Rollback vs supersession | LRN-ROLLBACK-001 | §10, §16, INV-018/019, AC-20/22 |
| P1-9 CURRENT verification | LRN-CURRENT-001 | §11, INV-020, AC-21 |
| P2-1 Weak source identity | LRN-PROVENANCE-001 | §17.1 |
| P2-2 Duplicate / replay | LRN-IDEMPOTENCY-001 | §17.2, AC-23 |
| P2-3 Supersession exclusivity | LRN-SUPERSESSION-001 | §16, AC-22 |
| P2-4 Effectiveness contract | LRN-EFFECTIVENESS-001 | §14 |
| P2-5 LABS→CORE boundary | LRN-LAB-BOUNDARY-001 | §18 |

### 26.2 Re-Review-2 → Correction-2

| Finding | Correction |
| --- | --- |
| LRN-DECISION-RESOLUTION-001 | §4, INV-021, AC-24 |
| LRN-ACTIVE-SCOPE-001 | §5, INV-022, AC-25 |
| LRN-IMMUTABLE-REF-001 | §6, INV-023, AC-26 |
| LRN-ROLLBACK-ELIGIBILITY-001 | §10.2–10.3, INV-024, AC-27 |
| LRN-DATA-RELEASE-001 | §12, contract, INV-025, AC-28 |
| LRN-CONFIDENCE-002 | §13, INV-028, AC-29 |
| LRN-EFFECTIVENESS-002 | §14, contract, AC-30 |
| LRN-CURRENT-FRESHNESS-001 | §11, INV-029, AC-31 |
| LRN-EVIDENCE-INDEPENDENCE-001 | §15, INV-026, AC-32 |
| LRN-SUPERSESSION-ORDER-001 | §16, INV-027, AC-33 |

Registry / Maturity / Failure compatibility: §20–§22, INV-030, AC-34..36.

---

## 27. Definition Correction-2 Verdict

```text
WAEP-LEARNING-SYSTEM-V1
Definition Correction-2
Architecture Centerline: RETAINED
Canonical Decision Resolver: DEFINED
Knowledge Lifecycle / Runtime State: SEPARATED
Knowledge Immutability: CORRECTED
RESTORE Eligibility: CORRECTED
Production Payload Release: EXTERNALIZED
Confidence Authority: REMOVED FROM V1
Effectiveness Decision: DEFINED
CURRENT Freshness: DEFINED
Evidence Independence: EXTERNALIZED
Exclusive Supersession: ORDERED
Legacy Registry Compatibility: DEFINED
Definition Lock: DENIED
Implementation Start: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Next Gate: Independent Definition Re-Review-3
```

Until Re-Review-3 passes and Definition Lock is granted:

```text
Implementation Start     = NOT AUTHORIZED
Runtime Activation       = NOT AUTHORIZED
Automatic Promotion      = PROHIBITED
Automatic Distribution   = NOT AUTHORIZED
```
