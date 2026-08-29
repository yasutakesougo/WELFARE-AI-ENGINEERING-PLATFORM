# WAEP-LEARNING-SYSTEM-V1

## Slice A — Learning Event Contract

## Implementation Definition Correction-2

### 1. Status

```text
System: WAEP-LEARNING-SYSTEM-V1
Target Slice: Slice A — Learning Event Contract
Parent Definition: Definition Correction-3
Parent Definition State: LOCKED / CANONICAL ON MAIN
Source Implementation Definition: docs/learning/implementation/slice-a-learning-event-contract-v1.md
Prior Correction: docs/learning/implementation/slice-a-learning-event-contract-v1-correction-1.md
Prior Re-Review: Independent Implementation Definition Re-Review-2
Prior Re-Review Verdict: CORRECTION REQUIRED
Prior P0 / P1 / P2: 0 / 1 / 0
Open Finding: LE-A-IA-002
Revision: Implementation Definition Correction-2
Correction State: APPLIED / PENDING INDEPENDENT RE-REVIEW
Implementation Start: NOT AUTHORIZED
Repository Implementation Mutation: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: Independent Implementation Definition Re-Review-3
```

Correction-2 is a normative overlay on Correction-1 and the source Implementation Definition.

Where Correction-2 conflicts with Correction-1, Correction-2 governs for this revision. Unchanged Correction-1 rules remain in force.

```text
Correction-2
  != Parent Definition change
  != Implementation Start GO
  != Persistence authorization
  != Ready GO
  != Merge GO
  != Deploy authorization
  != LIVE WRITE authorization
```

---

### 2. Correction Scope

Correction-2 addresses only the Re-Review-2 finding:

```text
LE-A-IA-002 — INGESTION ATTEMPT AUDIT ATOMICITY GAP
```

The issue is that Correction-1 required every ingestion attempt to produce `LearningEventIngestionAttempt@v1`, but the admission order permitted a Learning Event to become durable before its required attempt audit record.

Correction-2 removes that partial-durability state.

---

### 3. Mandatory Audit Durability Invariant

For every ingestion attempt, the system MUST preserve the following invariant:

```text
No terminal ingestion outcome may be acknowledged
unless the corresponding LearningEventIngestionAttempt@v1
is durably recorded.
```

For an `ADMITTED` outcome, the stronger invariant applies:

```text
Learning Event durable
AND
required ingestion-attempt audit absent
=
PROHIBITED STATE
```

Therefore an implementation MUST NOT expose or commit a durable admitted Learning Event without also establishing durable audit evidence for the same admission attempt.

This requirement is technology-neutral. It defines observable durability semantics, not a database or queue product.

---

### 4. ADMITTED Commit Boundary

For `ADMITTED`, the following two records form one logical admission commit unit:

```text
LearningEvent@v1
+
LearningEventIngestionAttempt@v1
```

The commit unit MUST satisfy all of the following:

```text
1. At most one Learning Event becomes durable for the canonical Event Identity.
2. The corresponding ingestion-attempt audit becomes durable for that admitted event.
3. A crash or storage failure MUST NOT leave the event durable while the required attempt audit is absent.
4. The caller MUST NOT receive terminal ADMITTED until both durability obligations are satisfied.
5. Recovery MUST be deterministic and idempotent.
```

A conforming Implementation Design may satisfy this using a single atomic transaction or another mechanism that provides equivalent observable atomic durability and deterministic recovery.

If a selected persistence architecture cannot satisfy this invariant, it is not conformant with Slice A.

---

### 5. Non-ADMITTED Outcomes

For:

```text
DUPLICATE_NO_OP
HELD
DENIED
INVALID
```

no new Learning Event is persisted.

The required `LearningEventIngestionAttempt@v1` MUST become durable before the corresponding terminal result is acknowledged to the caller.

If attempt-audit persistence fails, the ingestion operation MUST NOT falsely report the intended terminal result as successfully recorded.

The operation MUST fail closed and surface an infrastructure/audit-durability failure according to the later Implementation Design error transport contract.

That transport error MUST NOT be reclassified as policy `ALLOW`, `DENY`, or successful `DUPLICATE_NO_OP`.

---

### 6. Recovery and Retry Invariant

Recovery and retry MUST preserve both event idempotency and audit completeness.

For an admission retry after an uncertain commit outcome:

```text
canonical Event Identity
+
attempt identity / recovery evidence
```

MUST be sufficient to determine whether:

```text
A. neither record became durable,
B. the logical commit unit completed,
C. a non-conformant partial state is detected.
```

Case C MUST NOT be silently accepted as success.

A detected partial state MUST enter fail-closed recovery / incident handling and MUST NOT create a second Learning Event merely to repair audit evidence.

Concrete recovery storage, transaction protocol, outbox mechanics, or coordinator technology remain Implementation Design decisions.

---

### 7. Corrected Admission Finalization Order

Correction-1 §15 steps 12–13 are superseded by the following finalization sequence:

```text
1–11. Unchanged from Correction-1.

12. Construct the terminal LearningEventIngestionAttempt@v1 audit record for the evaluated outcome.

13A. If outcome = ADMITTED:
     establish one logical atomic durability unit containing
     the at-most-one LearningEvent@v1 and its corresponding
     LearningEventIngestionAttempt@v1.

13B. If outcome != ADMITTED:
     durably persist LearningEventIngestionAttempt@v1;
     persist no new Learning Event.

14. Only after the applicable durability obligation succeeds,
    acknowledge the terminal ingestion outcome to the caller.
```

Internal optimization is allowed only when the externally observable semantics are equivalent to this sequence.

No optimization may introduce an observable state in which an admitted Learning Event is durable without its required attempt audit.

---

### 8. Acceptance Requirements

Before Implementation Start can be considered for this Slice, the later Implementation Design / test plan MUST include verification for at least:

```text
LE-A-IA-ATOMIC-001
ADMITTED success durably binds event + attempt audit.

LE-A-IA-ATOMIC-002
failure before logical commit leaves no admitted event.

LE-A-IA-ATOMIC-003
failure during commit cannot produce acknowledged ADMITTED with missing attempt audit.

LE-A-IA-ATOMIC-004
DUPLICATE_NO_OP persists attempt audit before terminal acknowledgement.

LE-A-IA-ATOMIC-005
HELD / DENIED / INVALID persist attempt audit before terminal acknowledgement.

LE-A-IA-ATOMIC-006
retry after uncertain commit is idempotent and does not create a second Learning Event.

LE-A-IA-ATOMIC-007
detected partial state fails closed and is not silently normalized to success.
```

These are contract-level acceptance requirements. They do not authorize implementation.

---

### 9. Finding Closure Map

| Finding | Correction-2 rule | Author status |
| --- | --- | --- |
| `LE-A-IA-002` | logical atomic durability / terminal acknowledgement / recovery invariant fixed | CORRECTED / PENDING INDEPENDENT RE-REVIEW |

Closure is not claimed by the correction author.

Only Independent Implementation Definition Re-Review-3 may determine closure.

---

### 10. Authority Boundary

```text
Parent Definition: LOCKED / UNCHANGED
Correction-1: RETAINED EXCEPT WHERE SUPERSEDED
Correction-2: APPLIED
Independent Re-Review-3: PENDING
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Repository Implementation Mutation: NOT AUTHORIZED
Persistence Implementation: NOT AUTHORIZED
Runtime External I/O: NOT AUTHORIZED
Automatic Knowledge Promotion: PROHIBITED
Ready: NOT AUTHORIZED
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
LIVE WRITE: NOT AUTHORIZED
```

The next permissible governance action is Independent Implementation Definition Re-Review-3 against the fixed Correction-2 artifact together with Correction-1, the source Implementation Definition, and prior review evidence.
