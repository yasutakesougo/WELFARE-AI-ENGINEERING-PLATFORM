# WAEP-CURRENT-STATE-OBSERVATION-IMPLEMENTATION-DEFINITION-V1

## 0. Scope-definition status

```text
Definition: WAEP-CURRENT-STATE-OBSERVATION-IMPLEMENTATION-DEFINITION-V1
Revision: Implementation Scope Correction-3
Parent Definition: WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1
Parent Revision: Definition Correction-6
Parent Source Baseline Commit: 5c55d9383a34915c45619429d7e24488ade75337
Parent Semantic Baseline: 29ad48d7fc3080d16c966dc9a13cd3213584d7bd4f73e2964961d1e1c9cae7fb
Historical Lock Transition SHA: 26147297b3382181bc7acc69b81427a984c3aaf8fe0aaae8da8f82f375f9345b
Current Authoritative Parent Artifact SHA-256: ebeebd54422c8402812478fcb2b011cbe1f8f2d19a69b3be3b2a63135f81f3be
Current Authoritative Parent Artifact Bytes: 52265
Parent Definition State: LOCKED
Human Definition Lock: GO
Human Implementation Start: GO (scope-definition authority)
Scope Decision: PENDING INDEPENDENT SCOPE RE-REVIEW
Implementation Code: NOT AUTHORIZED
Repository Migration: NOT AUTHORIZED
Ready / Merge / Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
External Mutation: NOT AUTHORIZED
Next Gate: CSOC-IMPL-SLICE-A Independent Scope Re-Review-3
```

This document defines a candidate implementation slice against the locked
parent contract. It does not change the parent contract, establish technical
authority, or authorize implementation code. The separate `GO / HOLD` decision
must evaluate this exact scope.

```text
Parent Semantic Baseline
  != Historical Lock Transition SHA
  != Current Authoritative Parent Artifact SHA-256

Historical Lock Transition SHA
  = LOCK-transition historical evidence
  = HISTORICAL / NOT REQUIRED AS CURRENT ARTIFACT

Current Authoritative Parent Artifact
  = LOCKED + Human Definition Lock GO + Implementation Start GO
  = current parent authority for this Correction-3
```

```text
Implementation Start GO
  → permits this scope to be defined and evaluated
  != Scope GO
  != Implementation Code authorization
  != Repository Migration
  != Ready / Merge / Deploy
  != Runtime Activation
  != External Mutation
```

Source and correction lineage:

```text
Source Revision: Implementation Scope Draft-1
Source SHA-256: 2f11ce5e76d17736d957ef8b998f8c5413b45d2fa3e02dea07da6ece2dd75a68
Prior Revision: Implementation Scope Correction-2
Prior SHA-256: b125d8988c30a6fdc746b24725c5b6a21cebaaaf77b431d5c4fb2e53df1f544d
Prior Git blob: 6e612affc28c0cf5714e5980e8124b319c67b2db
Apply: Implementation Scope Correction-3
```

Correction-3 is a classification-only fix. It does not reopen closed
findings and does not change the Draft-1 kernel requirements restored by
Correction-2. It does not authorize implementation code.

Correction-3 unique change:

```text
CLAIM_REJECTED → WAIT / HOLD
NOT_AUTHORIZED = separately evaluated authority failure only
CLAIM_REJECTED != NOT_AUTHORIZED
Claim denial != Authority denial
```

Finding retained from Re-Review-2:

```text
Finding:
CSOC-IMPL-SCOPE-PRESERVATION-001

Severity:
P1

Closure Status:
CLOSED / RETAINED
```

Finding:

```text
Finding:
CSOC-IMPL-CLAIM-RESULT-CLASSIFICATION-001

Severity:
P2

Closure Status:
CORRECTED / PENDING INDEPENDENT SCOPE RE-REVIEW
```

## 1. Slice identity

```text
Slice ID: CSOC-IMPL-SLICE-A
Name: Contract Kernel — Append-Only Observation and Gate-State Semantics
Type: Pure domain model and deterministic validation
Execution mode: Side-effect-free, dependency-injected, fail-closed
External I/O: NONE
Persistence: NONE
Network access: NONE
Authority acquisition: NONE
Mutation execution: NONE
```

The slice provides a small, testable semantic kernel for the records and state
transitions defined by the parent contract. It must not retrieve current
repository state, decide human authority, or perform an action against a
remote or local system.

## 2. Objective

Implement the contract-level invariants that can be proven without selecting a
remote provider, persistence engine, runtime, or mutation mechanism:

1. Observation records are append-only and preserve source identity,
   provenance, interval, consistency, and failure evidence.
2. Gate-bound observations keep the immutable gate-critical evidence set and do
   not acquire mutable freshness, claim, or terminal projections.
3. Freshness verification is a separate append-only record and compares every
   required gate-critical evidence item.
4. Claim, freshness, authority result, mutation eligibility, and terminal
   outcome remain separate states and records.
5. Missing, unavailable, contradictory, expired, invalidated, or unresolved
   evidence fails closed to `HOLD` or `NOT AUTHORIZED`.
6. The domain model makes logical action identity and attempt generation
   explicit so a later atomic coordination adapter can enforce uniqueness.

## 3. Included scope

### 3.1 Versioned record contracts

The slice MUST provide deterministic in-memory implementation, including type
definitions, constructors or parsers, and validation, for these explicit
versioned record contracts:

```text
RepositoryObservation@v1
PullRequestObservation@v1
BranchRelationObservation@v1
GateBoundObservation@v1
GateFreshnessVerification@v1
GateUseClaim@v1
TerminalOutcome@v1
```

These `@v1` names are the normative Slice-A contract binding. Generic family
labels such as "observation records" or "claim records" are descriptive only
and MUST NOT replace the versioned contracts.

Record construction and validation are in-memory and side-effect-free. A
constructor or parser may accept a complete input value and return either a
valid record or a structured failure. It MUST NOT fetch, infer, or fill
missing fields.

The kernel MUST preserve the parent-contract separations:

```text
Current State       != Stored Snapshot
Observed State      != Current State
Historical Evidence != Current Authority
Observation         != Authority
Verification        != Authority
Claim               != Mutation
Freshness           != Claim
Terminal outcome    != Mutation eligibility
```

The slice MUST keep the following as distinct states and records. One record
MUST NOT silently acquire the semantics of another.

```text
RepositoryObservation@v1
PullRequestObservation@v1
BranchRelationObservation@v1
GateBoundObservation@v1
GateFreshnessVerification@v1
GateUseClaim@v1
TerminalOutcome@v1
Authority result
Mutation eligibility
```

A `GateBoundObservation@v1` carries the immutable gate-critical evidence set
required by the parent contract. It MUST NOT later mutate into a freshness
projection, a claim projection, or a terminal-outcome projection.

A later adapter may consume kernel outputs. That consumption is outside Slice A
and is not authorized by this definition.

### 3.2 Minimum validation fields

The slice MUST validate, as applicable to each versioned record, at least the
following fields. Absence of an applicable required field is a structured
failure, not an inferred success.

```text
observationId
observationStartedAt
observationCompletedAt
observationSource
sourceClass
observationResult
identityBefore
identityAfter
consistencyResult
evidenceReferences
retrievalProvenance
logicalMutationId
attemptGeneration
gateCriticalEvidence
authorityDecisionRef
```

Applicable also includes the parent-contract identity and result fields already
required by the locked parent, including repository identity, source class,
observation interval, consistency, and failure-evidence fields. Those parent
requirements remain in force.

`logicalMutationId` and `attemptGeneration` MUST be explicit on claim,
mutation-eligibility, and terminal-outcome related records. A missing
`attemptGeneration` MUST NOT be generated by the kernel.

### 3.3 Append-only, identity, and supersession checks

The slice MUST provide pure, side-effect-free checks that enforce:

```text
same observationId reuse rejection
original observation preservation
supersedesObservationId
correctsObservationId
stable repository identity precedence
composite identity movement → INVALIDATED / HOLD
sourceClass / provenance / evidence traceability
```

Normative rules:

```text
Existing observation record: MUST NOT be rewritten
Same observationId reuse:    PROHIBITED
Later state:                 new observation record
Correction / succession:     explicit supersedesObservationId
                             or correctsObservationId only
```

Identity comparison MUST prefer stable `repositoryId` over owner/name.
Owner and repository name remain display and fallback reconciliation data.

If composite `identityBefore` and `identityAfter` differ, or an equivalent
documented consistency verification fails:

```text
consistencyResult = INVALIDATED
observationResult = INVALIDATED
gate result = HOLD
```

The invalidated record is preserved. The consumer MUST retry with a new
observation or remain `HOLD`. A single timestamp is not a substitute for the
observation interval.

`sourceClass`, `retrievalProvenance`, and `evidenceReferences` MUST remain
traceable. The kernel MUST NOT treat missing provenance as sufficient
authority or as a complete observation.

### 3.4 Freshness verification invariants

Freshness is a separate append-only `GateFreshnessVerification@v1` record.
It MUST NOT be collapsed into the gate-bound observation, the claim, or the
terminal outcome.

Freshness status MUST be one of:

```text
FRESH
EXPIRED
INVALIDATED
UNVERIFIABLE
```

No other freshness status is permitted.

A freshness verification MUST:

```text
compare every required immutable gateCriticalEvidence item
match source-native version / optimistic-concurrency tokens when available
fail closed if required evidence is missing, contradictory, or ambiguous
```

Normative separations:

```text
TTL alone != FRESH
technical freshness != authority
earlier verification records remain byte-for-byte unchanged
ambiguous required evidence → HOLD
```

An earlier `GateFreshnessVerification@v1` record MUST remain byte-for-byte
unchanged. A later verification is a new record. `FRESH` does not grant
authority, mutation eligibility, or retry authority.

### 3.5 Claim, terminal state, and retry semantics

The slice MUST implement the provider-neutral claim/terminal state model on
`GateUseClaim@v1` and `TerminalOutcome@v1`:

```text
AVAILABLE
CLAIMED
TERMINAL_CONSUMED_SUCCESS
TERMINAL_INVALIDATED
TERMINAL_NOT_AUTHORIZED
TERMINAL_NO_MUTATION
TERMINAL_OUTCOME_UNKNOWN
```

Mandatory invariants:

```text
successful claims per observation <= 1
mutation attempts per observation <= 1
active mutation attempts per logicalMutationId + attemptGeneration <= 1
terminal state → never AVAILABLE again
ambiguous outcome → TERMINAL_OUTCOME_UNKNOWN and HOLD
```

A terminal state MUST NOT return to `AVAILABLE`. Ambiguous or unknown
terminal evidence MUST be recorded as `TERMINAL_OUTCOME_UNKNOWN` and MUST
fail closed to `HOLD`.

Finding retained from Re-Review-1:

```text
Finding:
CSOC-IMPL-CLAIM-RETRY-SEMANTICS-001

Severity:
P1

Closure Status:
CLOSED / RETAINED
```

Losing claimant semantics remain explicit and mandatory:

```text
CLAIM_REJECTED
→ mutationPerformed = false
→ mutation attempts = 0
→ WAIT / HOLD
→ winning attemptのterminal outcomeを待つ
```

A new executable attempt MUST NOT be started while the winning attempt is in
any of the following states:

```text
CLAIMED
ACTIVE
IN_FLIGHT
NON_TERMINAL
TERMINAL_OUTCOME_UNKNOWN
```

`NEW_OBSERVATION_REQUIRED` does not mean:

```text
immediate retry authorized
```

A new executable Observation may be considered only if:

```text
authoritative TERMINAL_NO_MUTATION
```

or:

```text
reconciliation proves a new attempt is safe
```

Every new execution attempt MUST use a new:

```text
attemptGeneration
```

```text
CLAIM_REJECTED
  != mutationPerformed
  != retry authorized
  != new attemptGeneration already consumed
  != NOT_AUTHORIZED

NEW_OBSERVATION_REQUIRED
  != immediate retry authorized
  != permission to start a concurrent executable attempt

terminal state
  != AVAILABLE

Claim denial
  != Authority denial
```

Finding:

```text
Finding:
CSOC-IMPL-CLAIM-RESULT-CLASSIFICATION-001

Severity:
P2

Closure Status:
CORRECTED / PENDING INDEPENDENT SCOPE RE-REVIEW
```

The kernel MUST record `CLAIM_REJECTED` and MUST return `WAIT / HOLD` for
claim rejection. It MUST NOT start, schedule, or imply a follow-on
executable attempt.

```text
NOT_AUTHORIZED:
reserved for a separately evaluated authority failure,
not for the competing-claim rejection itself.
```

`logicalMutationId` plus `attemptGeneration` uniqueness is a kernel
invariant. A later distributed coordination adapter may enforce it across
processes; Slice A MUST still reject in-memory violations of the same rule.

### 3.6 Mandatory behavioral testing and governance split

Finding retained from Re-Review-1:

```text
Finding:
CSOC-IMPL-GOVERNANCE-TEST-BOUNDARY-001

Severity:
P2

Closure Status:
CLOSED / RETAINED
```

Validation coverage remains split:

```text
Runtime Domain Validation:
CSOC-C1-V17 through CSOC-C5-V47

Governance Traceability:
CSOC-C6-V48
```

Slice A MUST provide table-driven or equivalent deterministic kernel
behavioral tests for `CSOC-C1-V17` through `CSOC-C5-V47` against in-memory
values. Scenario titles and expected results remain those of the locked
parent contract; this definition does not rename them.

Where a scenario has both an authorizing path and a fail-closed path, the
tests MUST include both:

```text
positive result
+
fail-closed result
```

`MUST` is the acceptance requirement. Slice A implementation MUST NOT omit
these contract behavioral tests.

`CSOC-C6-V48` is governance traceability only. It MAY be verified by:

```text
documentation verification
static metadata verification
review evidence verification
definition-level governance test
```

Do not add a production or domain API solely for `CSOC-C6-V48`.
`CSOC-C6-V48` MUST NOT be treated as a runtime/domain kernel behavioral test.

```text
CSOC-C1-V17 through CSOC-C5-V47
  = mandatory runtime/domain behavioral tests
  = table-driven or equivalent
  = positive + fail-closed assertions where applicable

CSOC-C6-V48
  != runtime/domain kernel behavioral test
  != production/domain API requirement
  != reason to expand Slice A I/O
```

## 4. Excluded scope

Slice A excludes the following. They remain unauthorized even if a later
review grants `CSOC-IMPL-SLICE-A GO`.

```text
Network I/O
Filesystem I/O
Database I/O
GitHub I/O
SharePoint / M365 I/O
Mutation I/O
Runtime activation
Distributed coordination implementation
Mutation executor
Authority decision-making
Repository current-state retrieval
Package publication
Ready / Merge / Deploy
```

Test doubles are not production evidence of distributed atomicity. A test
double MAY exercise kernel inputs and outputs in memory. It MUST NOT be
cited as proof that a later claim, lock, or mutation protocol is atomic.

```text
Test double
  != production distributed atomicity evidence
  != authorization for a coordination adapter
```

## 5. Kernel boundary, serialization, and error policy

### 5.1 Layering

```text
Caller (Vitest or a later authorized adapter)
        ▼
Public API
packages/current-state-observation-kernel/src/index.ts
        ▼
CSOC-IMPL-SLICE-A kernel
@versioned records, validation, append-only checks,
freshness, claim/terminal invariants, structured result
        ▼
Structured result
PASS / HOLD / NOT_AUTHORIZED / INVALIDATED /
UNVERIFIABLE / PARTIAL / FAILED
        │
        ✕ no I/O, persistence, network, or mutation
              ▼
Future adapter, persistence, or executor slice
```

The slice MAY return a structured result such as `PASS`, `HOLD`,
`NOT_AUTHORIZED`, `INVALIDATED`, `UNVERIFIABLE`, `PARTIAL`, or `FAILED`,
but it MUST NOT turn that result into an external action.

### 5.2 Serialization policy

In-memory values that cross the public API MUST use:

```text
JSON-compatible representation
ISO-8601 timestamps
explicit string enums
SHA / repository identity = strings
```

Missing or unavailable values MUST NOT be auto-completed.

Forbidden coercions:

```text
missing → PASS
UNKNOWN → false
unavailable count → 0
missing identity generation
repository state inference
authority inference
```

An unavailable field remains unavailable. The structured result MUST carry
the failure or partial classification required by the parent contract.

### 5.3 Error and structured-result policy

Expected contract failure is not throw-only. The public API MUST be able to
return a structured result that at least distinguishes:

```text
PASS
HOLD
NOT_AUTHORIZED
INVALIDATED
UNVERIFIABLE
PARTIAL
FAILED
```

A structured failure or non-pass result MAY also carry:

```text
code
classification
message
field
evidenceReferences
retryability
```

Exceptions are permitted only for programmer error or an impossible
invariant violation. Contract-expected states such as `HOLD`,
`NOT_AUTHORIZED`, `PARTIAL`, `FAILED`, `INVALIDATED`, and `UNVERIFIABLE`
MUST be represented as structured results.

```text
Expected contract failure
  != exception-only control flow
Programmer error / impossible invariant
  = exception permitted
```

## 6. Required implementation preconditions

Before `CSOC-IMPL-SLICE-A GO`, the following values are recorded as the
scope-definition resolution. Recording them here does not create the
package and does not authorize implementation code.

```text
Parent contract identity and Lock Baseline: verified
Parent Semantic Baseline: 29ad48d7fc3080d16c966dc9a13cd3213584d7bd4f73e2964961d1e1c9cae7fb
Current Authoritative Parent Artifact SHA-256: ebeebd54422c8402812478fcb2b011cbe1f8f2d19a69b3be3b2a63135f81f3be
Historical Lock Transition SHA: 26147297b3382181bc7acc69b81427a984c3aaf8fe0aaae8da8f82f375f9345b
  (HISTORICAL / NOT REQUIRED AS CURRENT ARTIFACT)

Implementation Language: TypeScript
Language Mode: strict TypeScript
Supported Runtime: Node.js 22 LTS
Module Format: ES Modules
Package Manager: npm
Test Framework: Vitest

Package boundary:
packages/current-state-observation-kernel/

Source:
packages/current-state-observation-kernel/src/

Tests:
packages/current-state-observation-kernel/test/

Public API:
packages/current-state-observation-kernel/src/index.ts

Required verification commands:
npm --prefix packages/current-state-observation-kernel test
npm --prefix packages/current-state-observation-kernel run typecheck

Serialization and error-reporting policy: resolved in §5.2 and §5.3
No external I/O or mutation in Slice A: required and retained
Versioned @v1 record contracts: required and restored
Minimum validation fields: required and restored
Append-only / identity / supersession checks: required and restored
Freshness invariants: required and restored
Claim / terminal state model and invariants: required and restored
logicalMutationId + attemptGeneration invariants: required and restored
C1–C5 table-driven behavioral tests with positive + fail-closed: required
C6-V48: governance traceability only
```

The current repository is documentation-only and does not expose an existing
package manifest or test runner. That fact remains a scope-decision input.
This Correction-3 names the authorized new substrate above. It MUST NOT be
read as permission to create that substrate before Independent Scope
Re-Review-3 returns `GO`.

```text
Named package/runtime substrate
  != package creation
  != implementation source creation
  != npm install
  != test-substrate creation
```

## 7. GO / HOLD decision record template

The next gate must record a decision against this exact revision:

```text
Decision: GO | HOLD
Decision Target: CSOC-IMPL-SLICE-A
Decision Definition: WAEP-CURRENT-STATE-OBSERVATION-IMPLEMENTATION-DEFINITION-V1
Decision Revision: Implementation Scope Correction-3
Parent Semantic Baseline: 29ad48d7fc3080d16c966dc9a13cd3213584d7bd4f73e2964961d1e1c9cae7fb
Current Authoritative Parent Artifact SHA-256: ebeebd54422c8402812478fcb2b011cbe1f8f2d19a69b3be3b2a63135f81f3be
Historical Lock Transition SHA: 26147297b3382181bc7acc69b81427a984c3aaf8fe0aaae8da8f82f375f9345b
Reviewed Scope Hash: <sha256 of this definition>
Implementation Language / Runtime: TypeScript / strict / Node.js 22 LTS
Source Paths: packages/current-state-observation-kernel/src/
Test Paths / Commands:
  packages/current-state-observation-kernel/test/
  npm --prefix packages/current-state-observation-kernel test
  npm --prefix packages/current-state-observation-kernel run typecheck
External I/O: NONE for Slice A
Repository / SharePoint / M365 Mutation: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
P1 CSOC-IMPL-CLAIM-RETRY-SEMANTICS-001: CLOSED / RETAINED
P2 CSOC-IMPL-GOVERNANCE-TEST-BOUNDARY-001: CLOSED / RETAINED
P1 CSOC-IMPL-SCOPE-PRESERVATION-001: CLOSED / RETAINED
P2 CSOC-IMPL-CLAIM-RESULT-CLASSIFICATION-001: <CLOSED | OPEN | HOLD>
Reason: <evidence-backed decision>
```

`GO` authorizes only the included scope after all required preconditions are
recorded and Independent Scope Re-Review-3 closes
`CSOC-IMPL-CLAIM-RESULT-CLASSIFICATION-001`. `HOLD` is required if claim
rejection is classified as `NOT_AUTHORIZED`, or if restored Draft-1 kernel
requirements, toolchain, paths, test boundary, claim/retry semantics,
governance-test boundary, or any required evidence remains unknown,
contradictory, unavailable, or weakened.

The author of this Correction-3 MUST NOT promote
`CSOC-IMPL-CLAIM-RESULT-CLASSIFICATION-001` to `CLOSED` and MUST NOT
promote the slice to `Scope GO`.

## 8. Current decision state

```text
CSOC-IMPL-SLICE-A:
CORRECTED / AWAITING INDEPENDENT SCOPE RE-REVIEW

Implementation Scope Correction-3:
COMPLETE WHEN APPLIED

P1 CSOC-IMPL-CLAIM-RETRY-SEMANTICS-001:
CLOSED / RETAINED

P2 CSOC-IMPL-GOVERNANCE-TEST-BOUNDARY-001:
CLOSED / RETAINED

P1 CSOC-IMPL-SCOPE-PRESERVATION-001:
CLOSED / RETAINED

P2 CSOC-IMPL-CLAIM-RESULT-CLASSIFICATION-001:
CORRECTED / PENDING INDEPENDENT SCOPE RE-REVIEW

Implementation Code:
NOT AUTHORIZED

Repository Migration:
NOT AUTHORIZED

Ready / Merge / Deploy:
NOT AUTHORIZED

Runtime Activation:
NOT AUTHORIZED

External Mutation:
NOT AUTHORIZED

Next Gate:
CSOC-IMPL-SLICE-A Independent Scope Re-Review-3
```
