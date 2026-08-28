# WAEP-LEARNING-SYSTEM-V1 Slice A — Independent Implementation Definition Review-1

## Status

```text
Review: Slice A — Independent Implementation Definition Review-1
Target: docs/learning/implementation/slice-a-learning-event-contract-v1.md
Parent Definition: WAEP-LEARNING-SYSTEM-V1 Definition Correction-3 (LOCKED)
Canonical Main Baseline: bc2d4b02d2b674bdd047086bcfa6a9ce3a0457ca
Verdict: PASS WITH CORRECTIONS
P0: 0
P1: 4
P2: 5
Architecture Centerline: UNCHANGED / PASS
Parent Definition Alignment: PASS
Implementation Start: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Next Gate: Slice A Implementation Definition Correction-1
```

This file archives Independent Implementation Definition Review-1 for Slice A.

```text
Implementation Definition Review PASS
  != Implementation Start GO
  != Persistence Authorization
  != Decision Store Implementation
  != Runtime Activation
```

---

## 1. Review Scope

Independent review of Slice A — Learning Event Contract Implementation
Definition against the LOCKED parent Definition (`waep-learning-system-v1.md`
Definition Correction-3, §12, §17, AC-23, AC-28, AC-37) and
`LearningPayloadReleaseDecision@v1`.

Priority focus areas (per review charter):

1. Event identity collision / conflict handling
2. Release Decision exact binding
3. Duplicate vs revised-event distinction
4. Ingestion Attempt vs Learning Event separation

Out of scope for this review:

- Code implementation
- Decision Store implementation
- Persistence technology selection
- Runtime activation

---

## 2. Review Result

```text
Verdict: PASS WITH CORRECTIONS
P0: 0
P1: 4
P2: 5
Architecture Centerline: PASS (no drift detected)
Parent Lock Alignment: PASS
Fail-Closed Boundary: PASS (with P1 clarifications required)
Implementation Definition Lockability: CONDITIONAL
```

Slice A correctly translates locked Learning Event semantics into an
implementable contract without altering the Architecture Centerline.

No P0 blockers were found. Four P1 clarifications should be resolved in
Correction-1 before treating the Implementation Definition as lock-ready.

---

## 3. Parent Definition Alignment

| Locked element | Slice A mapping | Result |
| --- | --- | --- |
| §17.1 source identity (6 fields) | §8, §7 required fields | ALIGNED |
| §17.2 event identity = sourceEventId + contentDigest | §9, §10, INV-LE-A-003 | ALIGNED |
| §17.2 duplicate / replay idempotency | §16, §17, AC-LE-A-04/05 | ALIGNED |
| §12.2 Release resolution key (payloadRef + payloadDigest + destination) | §13, AC-LE-A-07 | ALIGNED |
| §12.3 resolution failure → HOLD | §14, §36 fail-closed matrix | ALIGNED |
| AC-28 production-sensitive Release required | §12, §7, AC-LE-A-06 | ALIGNED |
| AC-37 payload Release resolution identity | §13 exact binding | ALIGNED |
| AC-23 no evidence-strength increase on replay | §17, INV-LE-A-005 | ALIGNED |

Slice A expands the locked §17.1 flat sketch into a structured
`LearningEvent@v1` envelope. This is a contract elaboration, not an
Architecture change.

---

## 4. Focus Area 1 — Event Identity Collision

### 4.1 What Slice A gets right

The locked identity rule is preserved without expansion:

```text
Canonical Event Identity = sourceEventId + source.contentDigest
```

§18 correctly distinguishes:

| Case | sourceEventId | sourceRevision | contentDigest | Outcome |
| --- | --- | --- | --- | --- |
| Exact duplicate | same | any | same | DUPLICATE_NO_OP |
| Revised observation | same | different | different | distinct event permitted |
| Identity conflict | same | same | different | SOURCE_IDENTITY_CONFLICT → HOLD |

INV-LE-A-012 prohibits timestamp-recency resolution. §26 requires persistence
uniqueness under concurrency (FIX-A-012). These satisfy the locked idempotency
intent (LRN-IDEMPOTENCY-001 closure).

### 4.2 Findings

#### P1 — LE-A-ID-001: Undefined outcome for same sourceEventId + different sourceRevision + same contentDigest

§18 covers the suspicious case (same revision, different digest) and the
expected valid case (different revision, different digest). It does **not**
define the outcome when revision changes but digest does not.

This can occur when:

- source revision metadata is corrected without content change
- re-observation of identical content under a new revision label
- upstream re-emits the same payload with updated revision bookkeeping

Without an explicit rule, implementations may diverge between DUPLICATE_NO_OP
(same canonical identity) and HELD (revision metadata inconsistency).

**Required correction:** Add an explicit rule. Recommended:

```text
same sourceEventId + different sourceRevision + same contentDigest
  → DUPLICATE_NO_OP (canonical identity unchanged)
  → optional revision-metadata audit flag; no new Learning Event
```

Alternatively, if revision metadata must be authoritative even when digest is
unchanged, declare HOLD — but the Definition must choose one deterministic
outcome.

#### P2 — LE-A-ID-002: Event identity excludes sourceRepository

Locked §17.2 and Slice A §9 intentionally omit `sourceRepository` from
canonical Event Identity. Cross-repository `sourceEventId` collision with
identical digest would resolve as DUPLICATE_NO_OP.

This is inherited from the locked Definition, not a Slice A drift. Slice A
should document the assumption explicitly:

```text
sourceEventId must be globally unique within the Learning Plane scope,
OR cross-repository collision is intentionally idempotent.
```

#### P2 — LE-A-ID-003: learningEventId derivation algorithm deferred

§9–§10 define canonical Event Identity material but defer hash function and
`learningEventId` derivation to Implementation Design. Acceptable at this
phase, but Correction-1 should add a placeholder contract field or reference
to a forthcoming `WAEP-LEARNING-EVENT-IDENTITY@v1` design artifact gate.

#### P2 — LE-A-ID-004: LearningEvent.contentDigest semantics underspecified

Three digests coexist (`source.contentDigest`, `payload.allowedPayloadDigest`,
top-level `contentDigest`). §30 states they are separate objects but does not
define what the envelope-level `contentDigest` canonicalizes (full event minus
id? admission-time snapshot?).

**Recommended correction:** Define envelope digest scope in Correction-1.

**Focus Area 1 Verdict:** PASS WITH CORRECTIONS (P1-001 must close)

---

## 5. Focus Area 2 — Release Decision Exact Binding

### 5.1 What Slice A gets right

§13 states the required triple equality against the resolved effective
`LearningPayloadReleaseDecision@v1`:

```text
allowedPayloadRef     = subject.payloadRef
allowedPayloadDigest  = subject.payloadDigest
destinationLearningPlane = destination.learningPlane
```

This matches locked §12.2 and `LearningPayloadReleaseDecision@v1` Canonical
Resolution Identity (AC-37 / LRN-PAYLOAD-RESOLUTION-001 closure).

§14 fail-closed vocabulary aligns with the parent contract:

```text
ALLOW / ALLOW_WITH_CONDITIONS → may admit
DENY / HOLD / UNKNOWN / AMBIGUOUS / INVALID_CHAIN / MISSING_DEPENDENCY → prohibit
```

§3 and §7 correctly retain:

```text
production-sensitive → Release Decision mandatory regardless of release.required flag
redaction success ≠ Release Authority
```

Validation order (§35 steps 5–8) places Release resolution before identity
computation and duplicate check — correct authority ordering.

Synthetic fixtures FIX-A-004 through FIX-A-009 provide adequate binding test
coverage at Definition level.

### 5.2 Findings

#### P1 — LE-A-RD-001: Effective-head resolution error taxonomy not mapped to ingestion results

§13 and §35 step 6 require resolving the canonical effective
`LearningPayloadReleaseDecision` head but defer resolver mechanics (correctly —
Decision Store is out of scope).

However, Slice A mixes ingestion result codes without mapping parent resolver
failures:

| Parent resolver failure | Slice A result today |
| --- | --- |
| conflicting effective heads | HELD (§36) |
| invalid supersession chain | not explicitly mapped |
| missing payloadRef/digest/destination | INVALID / HELD (implicit) |

**Required correction:** Add a resolver-failure → ingestion-result mapping table
referencing parent §4 / §12.3 without defining Decision Store implementation.

#### P1 — LE-A-RD-002: Field naming aliasing must be frozen

Learning Event uses `payload.allowedPayloadRef` / `allowedPayloadDigest`.
Release Decision uses `subject.payloadRef` / `payloadDigest`.

§13 binding equalities are explicit and sufficient for review, but
implementations could drift if aliasing is not normative.

**Required correction:** Add a normative alias note:

```text
LearningEvent.payload.allowedPayloadRef ≡ ReleaseDecision.subject.payloadRef
LearningEvent.payload.allowedPayloadDigest ≡ ReleaseDecision.subject.payloadDigest
LearningEvent.payload.destinationLearningPlane ≡ ReleaseDecision.destination.learningPlane
```

#### P2 — LE-A-RD-003: ALLOW_WITH_CONDITIONS satisfaction evidence contract deferred

§29 correctly requires condition satisfaction and fails closed on UNKNOWN.
The evidence shape for condition satisfaction is not defined in Slice A.

Acceptable as out-of-scope **if** Correction-1 references a later Slice or
companion contract. Otherwise FIX-A-009 cannot be validated beyond HOLD semantics.

#### P2 — LE-A-RD-004: release.required derivation source unspecified

§7 mandates `learningPayloadReleaseDecisionRef` when `release.required = true`
**or** production-sensitive. The Definition does not state who sets
`release.required` (candidate producer vs ingestion layer derivation from
classification + source policy).

**Recommended correction:** State that ingestion layer must derive
`release.required` from classification and source policy; caller-supplied
`release.required = false` must not override production-sensitive requirement
(INV-LE-A-006).

**Focus Area 2 Verdict:** PASS WITH CORRECTIONS (P1-001, P1-002 must close)

---

## 6. Focus Area 3 — Duplicate vs Revised-Event Distinction

### 6.1 What Slice A gets right

The Definition cleanly separates three classes:

```text
Exact duplicate     → same sourceEventId + same contentDigest → DUPLICATE_NO_OP
Valid revision      → same sourceEventId + different sourceRevision + different contentDigest → new event
Identity conflict   → same sourceEventId + same sourceRevision + different contentDigest → HOLD
```

This satisfies AC-LE-A-09 and preserves the locked rule that event identity
is digest-based, not revision-based.

§16 places duplicate detection before persistence. §19 immutability prevents
retroactive correction of admitted events. §20 rejects Knowledge-style
supersession for Learning Events — revised content must arrive as a new event
with distinct canonical identity.

FIX-A-002 and FIX-A-003 cover replay and conflict. FIX-A-012 covers concurrent
admission.

### 6.2 Findings

#### P1 — LE-A-DUP-001: Gap case — different revision, same digest (see LE-A-ID-001)

Duplicate vs revised distinction is incomplete until LE-A-ID-001 closes.
Revision-only change without digest change sits outside all three defined cases.

#### P2 — LE-A-DUP-002: Duplicate resolution must return existing learningEventId

§16 says "existing Learning Event returned/resolved" but does not require the
response to include `learningEventId` and canonical identity in the ingestion
result. Recommended for Correction-1 ingestion result schema.

#### P2 — LE-A-DUP-003: "May form distinct Learning Event" wording

§18 valid-revision case uses "may form" language. Because canonical identity
includes digest, a different digest always yields a different identity and
therefore a **distinct admissible event** unless blocked by another rule.
Correction-1 should replace "may" with "forms" to remove discretionary admission
language.

**Focus Area 3 Verdict:** PASS WITH CORRECTIONS (blocked on LE-A-ID-001)

---

## 7. Focus Area 4 — Ingestion Attempt vs Learning Event Separation

### 7.1 What Slice A gets right

§24 introduces `LearningEventIngestionAttempt@v1` as a separate audit artifact.

§25 prohibits partial Learning Events. §27 defines ingestion processing results
distinct from Knowledge Lifecycle states. INV-LE-A-010 reinforces no partial
events.

Conceptual separation is clear:

```text
LearningEventIngestionAttempt = audit evidence of an attempt
LearningEvent               = admitted immutable observation envelope
```

API boundary (§34) forbids bypass paths. Failed admissions produce auditable
results without event persistence.

### 7.2 Findings

#### P1 — LE-A-IA-001: Ingestion Attempt contract strength inconsistent with AC-LE-A-13

§24 uses "Recommended contract" and "should be separately auditable."

AC-LE-A-13 states: "Every ingestion attempt produces an auditable result."

These conflict at Definition level. If AC-LE-A-13 is mandatory (it should be),
`LearningEventIngestionAttempt@v1` must be elevated from recommended to
**required companion contract**, or AC-LE-A-13 must define a minimum audit
envelope that does not require the named contract.

**Required correction:** Elevate §24 to required companion contract **or**
define minimum mandatory audit fields inline and reference them in AC-LE-A-13.

#### P2 — LE-A-IA-002: Ingestion Attempt persistence boundary unspecified

§33 storage properties apply to Learning Events. It is unclear whether
ingestion attempts are persisted in the same store, an audit log, or emitted
only as events. Acceptable deferral, but Correction-1 should state minimum
retention/query requirements for attempts (by attemptId, requestedEventIdentity,
result).

#### P2 — LE-A-IA-003: Result vocabulary mismatch between §24 and §27

§24 attempt result enum:

```text
ADMITTED | DUPLICATE | HOLD | DENIED | INVALID
```

§27 idempotency model:

```text
ADMITTED | DUPLICATE_NO_OP | HELD | DENIED | INVALID
```

`DUPLICATE` vs `DUPLICATE_NO_OP` and `HOLD` vs `HELD` should be unified in
Correction-1.

**Focus Area 4 Verdict:** PASS WITH CORRECTIONS (P1-001 must close)

---

## 8. P0 / P1 / P2 Summary

### P0 (0)

No Architecture drift, no fail-open Release path, no authority leakage, no
partial-event admission path identified.

### P1 (4) — Correction required before lock-ready

| ID | Focus | Finding |
| --- | --- | --- |
| LE-A-ID-001 | Identity | Undefined outcome: same sourceEventId + different sourceRevision + same contentDigest |
| LE-A-RD-001 | Release binding | Resolver failure → ingestion result mapping incomplete |
| LE-A-RD-002 | Release binding | Normative field aliasing between Learning Event and Release Decision |
| LE-A-IA-001 | Ingestion attempt | Recommended vs required contract tension with AC-LE-A-13 |

### P2 (5) — Clarify in Correction-1 or defer to Implementation Design gate

| ID | Focus | Finding |
| --- | --- | --- |
| LE-A-ID-002 | Identity | sourceRepository excluded from event identity — document assumption |
| LE-A-ID-003 | Identity | learningEventId / hash algorithm deferred |
| LE-A-ID-004 | Identity | Envelope contentDigest scope undefined |
| LE-A-RD-003 | Release binding | ALLOW_WITH_CONDITIONS evidence shape deferred |
| LE-A-RD-004 | Release binding | release.required derivation source unspecified |
| LE-A-DUP-002 | Duplicate | Duplicate response should include resolved learningEventId |
| LE-A-DUP-003 | Duplicate | "may form" → "forms" for valid revision case |
| LE-A-IA-002 | Ingestion attempt | Attempt persistence/retention boundary unspecified |
| LE-A-IA-003 | Ingestion attempt | Result vocabulary mismatch §24 vs §27 |

(P2 count consolidated to 5 thematic items in status header; 9 line items above.)

---

## 9. Safety Invariant / AC Spot Check

All fifteen INV-LE-A-* invariants are consistent with the locked parent
Definition. No invariant grants promotion, runtime, or execution authority.

Acceptance criteria AC-LE-A-01 through AC-LE-A-15 are testable at Definition
level via §39 synthetic fixtures once P1 items close.

Fixture matrix coverage assessment:

| Fixture | Covered by Definition? |
| --- | --- |
| FIX-A-001 .. FIX-A-012 | YES (FIX-A-003 blocked on LE-A-ID-001 clarification) |

---

## 10. Explicit Non-Actions Confirmed

This review confirms the following were correctly **not** included in Slice A:

```text
Decision Store implementation
Knowledge Candidate schema
Validation / Promotion implementation
Registry persistence
Runtime Binding
Automatic promotion / distribution
Production LIVE WRITE
```

---

## 11. Conclusion

Slice A — Learning Event Contract Implementation Definition is **architecturally
sound** and faithful to the LOCKED parent Definition.

```text
Verdict: PASS WITH CORRECTIONS
P0: 0
P1: 4
P2: 5
Implementation Start: NOT AUTHORIZED
Next: Slice A Implementation Definition Correction-1
```

Correction-1 should close all P1 items without changing the Architecture
Centerline. After Correction-1, a Slice A Implementation Definition Re-Review-2
may assess lock-readiness.

Human Implementation Start GO remains a separate gate after Implementation
Definition lock.
