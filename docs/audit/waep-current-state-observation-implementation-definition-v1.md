# WAEP-CURRENT-STATE-OBSERVATION-IMPLEMENTATION-DEFINITION-V1

## 0. Scope-definition status

```text
Definition: WAEP-CURRENT-STATE-OBSERVATION-IMPLEMENTATION-DEFINITION-V1
Revision: Implementation Scope Correction-1
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
Next Gate: CSOC-IMPL-SLICE-A Independent Scope Re-Review-1
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
  = current parent authority for this Correction-1
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

Source revision for this apply:

```text
Source Revision: Implementation Scope Draft-1
Source SHA-256: 2f11ce5e76d17736d957ef8b998f8c5413b45d2fa3e02dea07da6ece2dd75a68
Apply: Implementation Scope Correction-1
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

### 3.1 Contract records and value validation

The slice includes type definitions, constructors or parsers, and deterministic
validation for:

```text
Observation records
GateBoundObservation records
Freshness verification records
Claim records
Authority-result records
Mutation-eligibility records
Terminal-outcome records
Logical action identity
attemptGeneration
Repository identity and source-class values
Observation interval, consistency, and failure-evidence fields
```

Record construction and validation are in-memory and side-effect-free. A
constructor or parser may accept a complete input value and return either a
valid record or a structured failure. It must not fetch, infer, or fill missing
fields.

The kernel must preserve the parent-contract separations:

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

### 3.2 Distinct state and record families

The slice must keep the following as distinct states and records. One record
must not silently acquire the semantics of another.

```text
Observation
Gate-bound observation
Freshness verification
Claim
Authority result
Mutation eligibility
Terminal outcome
```

A gate-bound observation carries the immutable gate-critical evidence set
required by the parent contract. It must not later mutate into a freshness
projection, a claim projection, or a terminal-outcome projection.

A later adapter may consume kernel outputs. That consumption is outside Slice A
and is not authorized by this definition.

### 3.3 Claim and retry semantics

Finding:

```text
Finding:
CSOC-IMPL-CLAIM-RETRY-SEMANTICS-001

Severity:
P1

Closure Status:
CORRECTED / PENDING INDEPENDENT SCOPE RE-REVIEW
```

Losing claimant semantics are explicit:

```text
CLAIM_REJECTED
→ mutationPerformed = false
→ mutation attempts = 0
→ WAIT / HOLD
→ winning attemptのterminal outcomeを待つ
```

A new executable attempt must not be started while the winning attempt is in
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

Every new execution attempt must use a new:

```text
attemptGeneration
```

```text
CLAIM_REJECTED
  != mutationPerformed
  != retry authorized
  != new attemptGeneration already consumed

NEW_OBSERVATION_REQUIRED
  != immediate retry authorized
  != permission to start a concurrent executable attempt
```

The kernel may record `CLAIM_REJECTED` and return `HOLD` or `NOT_AUTHORIZED`.
It must not start, schedule, or imply a follow-on executable attempt.

### 3.4 Runtime domain validation versus governance traceability

Finding:

```text
Finding:
CSOC-IMPL-GOVERNANCE-TEST-BOUNDARY-001

Severity:
P2

Closure Status:
CORRECTED / PENDING INDEPENDENT SCOPE RE-REVIEW
```

Validation coverage is split:

```text
Runtime Domain Validation:
CSOC-C1-V17 through CSOC-C5-V47

Governance Traceability:
CSOC-C6-V48
```

`CSOC-C1-V17` through `CSOC-C5-V47` are parent-contract runtime/domain
scenarios. Slice A may implement them as deterministic kernel behavioral
tests against in-memory values. Scenario titles and expected results remain
those of the locked parent contract; this definition does not rename them.

`CSOC-C6-V48` is governance traceability. It may be verified by:

```text
documentation verification
static metadata verification
review evidence verification
definition-level governance test
```

Do not add a production or domain API solely for `CSOC-C6-V48`.

```text
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
double may exercise kernel inputs and outputs in memory. It must not be
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
pure domain records, validation, and state semantics
        ▼
Structured result
PASS / HOLD / NOT_AUTHORIZED / INVALIDATED /
UNVERIFIABLE / PARTIAL / FAILED
        │
        ✕ no I/O, persistence, network, or mutation
              ▼
Future adapter, persistence, or executor slice
```

The slice may return a structured result such as `PASS`, `HOLD`,
`NOT_AUTHORIZED`, `INVALIDATED`, `UNVERIFIABLE`, `PARTIAL`, or `FAILED`,
but it must not turn that result into an external action.

### 5.2 Serialization policy

In-memory values that cross the public API must use:

```text
JSON-compatible representation
ISO-8601 timestamps
explicit string enums
SHA / repository identity = strings
```

Missing or unavailable values must not be auto-completed.

Forbidden coercions:

```text
missing → PASS
UNKNOWN → false
unavailable count → 0
missing identity generation
repository state inference
authority inference
```

An unavailable field remains unavailable. The structured result must carry
the failure or partial classification required by the parent contract.

### 5.3 Error and structured-result policy

Expected contract failure is not throw-only. The public API must be able to
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

A structured failure or non-pass result may also carry:

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
must be represented as structured results.

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
```

The current repository is documentation-only and does not expose an existing
package manifest or test runner. That fact remains a scope-decision input.
This Correction-1 names the authorized new substrate above. It must not be
read as permission to create that substrate before Independent Scope
Re-Review-1 returns `GO`.

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
Decision Revision: Implementation Scope Correction-1
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
P1 CSOC-IMPL-CLAIM-RETRY-SEMANTICS-001: <CLOSED | OPEN | HOLD>
P2 CSOC-IMPL-GOVERNANCE-TEST-BOUNDARY-001: <CLOSED | OPEN | HOLD>
Reason: <evidence-backed decision>
```

`GO` authorizes only the included scope after all required preconditions are
recorded and Independent Scope Re-Review-1 closes both findings. `HOLD` is
required if the target, toolchain, paths, test boundary, claim/retry
semantics, governance-test boundary, or any required evidence remains
unknown, contradictory, or unavailable.

The author of this Correction-1 must not promote findings to `CLOSED` or
promote the slice to `Scope GO`.

## 8. Current decision state

```text
CSOC-IMPL-SLICE-A:
CORRECTED / AWAITING INDEPENDENT SCOPE RE-REVIEW

Implementation Scope Correction-1:
COMPLETE WHEN APPLIED

P1 CSOC-IMPL-CLAIM-RETRY-SEMANTICS-001:
CORRECTED / PENDING INDEPENDENT SCOPE RE-REVIEW

P2 CSOC-IMPL-GOVERNANCE-TEST-BOUNDARY-001:
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
CSOC-IMPL-SLICE-A Independent Scope Re-Review-1
```
