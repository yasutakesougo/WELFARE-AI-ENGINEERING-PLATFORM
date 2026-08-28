# WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1

## 0. Correction status

```text
Definition: WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1
Revision: Definition Correction-1
Source Review: Independent Definition Review-1
Source Review Result: CORRECTION REQUIRED
P0: 0 / P1: 5 / P2: 5
Definition State: CORRECTED / NOT LOCKED
Human Definition Lock: NOT RECEIVED
Implementation Start: NOT AUTHORIZED
Repository Migration: NOT AUTHORIZED
Ready / Merge / Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Next Gate: Independent Definition Re-Review-1
```

This document corrects the definition semantics identified by Independent
Definition Review-1. It defines an observation contract; it does not implement
a collector, authorize a repository mutation, or grant technical or human
authority.

```text
Definition Correction-1
  != Definition Lock
  != Implementation Start
  != Repository Migration
  != Ready / Merge / Deploy
  != Runtime Activation
```

## 1. Retained principles

```text
Current State       != Stored Snapshot
Observed State      != Current State
Historical Evidence != Current Authority
Observation         != Authority
Verification        != Authority
Mergeable           != Merge GO
Merge               != Deploy
```

Current state is resolved from fresh evidence. Observed state is recorded with
its provenance and validity interval. Historical evidence is preserved and is
never rewritten to represent a later state. Authority is resolved separately.

## 2. Separate resolution planes

Technical State Resolution and Authority Resolution are different planes. A
precedence rule in one plane MUST NOT override a result in the other plane.

### 2.1 Technical State Resolution

The technical state of a repository, pull request, branch relation, review, or
workflow is resolved in this order:

1. Live Authoritative Repository Metadata.
2. Gate-bound Verified Observation.
3. Latest Verified Observation.
4. Repository Snapshot.
5. Historical Evidence.

The selected result MUST retain its source class, retrieval time, identity, and
evidence references. A stale, unavailable, or contradictory source is not
silently promoted to current state.

### 2.2 Authority Resolution

Authority is resolved in this order:

1. Current Valid Authority Decision, with decision reference, actor, and time.
2. LOCKED Canonical Authority Contract.
3. Explicit Human Gate.
4. No authority: `HOLD` / `UNKNOWN`.

Technical State never grants Authority. Authority never rewrites Technical
State. For example, `MERGE GO` does not change a live `CLOSED` PR into an open
PR, and `mergeable=true` does not create `MERGE GO`.

## 3. Identity and source authority

### 3.1 Repository identity

Where available, a repository identity MUST include:

```text
repositoryId       stable host-provided repository identifier
host               repository host
owner              current owner or namespace
repository         current repository name
```

Identity comparison MUST prefer `repositoryId`. Owner and repository name are
retained for display and fallback reconciliation because repositories may be
renamed or transferred.

Branch identity MUST include the repository identity and the branch name. The
canonical default-branch field is `observedDefaultBranchSha`; `main` is only
a repository-specific display label.

### 3.2 Source class

`observationSource` identifies the retrieval mechanism. `sourceClass` identifies
the authority class of the evidence:

```text
REMOTE_AUTHORITATIVE
REMOTE_DERIVED
LOCAL_OBSERVATION
COMPOSITE_VERIFIED
```

Permitted retrieval mechanisms include `GITHUB_API`, `GITHUB_GRAPHQL`,
`LOCAL_GIT`, and `VERIFIED_COMPOSITE`.

`LOCAL_OBSERVATION` alone MUST NOT resolve Remote Current State. A local ref may
be stale, detached, un-fetched, worktree-specific, or include local-only
commits. A `COMPOSITE_VERIFIED` result MUST identify its remote component and
the consistency check that made the composite valid.

## 4. Observation record contract

Every observation record MUST be append-only and MUST contain:

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
```

`observationResult` is one of:

```text
COMPLETE
PARTIAL
FAILED
INVALIDATED
```

`COMPLETE` means all required fields for the observation type were retrieved
and the identity consistency check passed. `PARTIAL` means some fields were
retrieved but one or more required fields were unavailable. `FAILED` means the
observation could not be usefully retrieved. `INVALIDATED` means the state
changed during retrieval or the composite failed consistency verification.

For `PARTIAL`, `FAILED`, and `INVALIDATED`, the record MUST additionally carry:

```text
failureClass
unavailableFields
errorEvidenceReferences
retryability
```

No inferred value may be inserted for an unavailable field. Gate evaluation is
permitted only for `COMPLETE` observations with all required evidence present.
Otherwise the result is `HOLD` / `UNKNOWN`.

### 4.1 Composite consistency

Composite retrieval MUST record the retrieval interval and boundary identities.
At minimum, repository and target identities such as default-branch SHA,
PR base SHA, and PR head SHA MUST be read before and after component retrieval
where those identities are relevant.

```text
consistencyResult = PASS
  only when identityBefore == identityAfter
  or an equivalent documented consistency verification passes
```

If the identity moves, the composite MUST be recorded as `INVALIDATED`; the
consumer MUST retry or remain `HOLD`. A single `observedAt` timestamp is not
a substitute for the observation interval.

### 4.2 Provenance

Each component evidence reference MUST be traceable to minimum retrieval
provenance:

```text
sourceSystem
sourceMethod
sourceResource
retrievedAt
```

Raw API payloads are not required by this contract, but the source and method
used to derive every material field MUST be reproducible or inspectable.

### 4.3 Immutability and supersession

Observation records are append-only.

```text
Existing observation record: MUST NOT be rewritten
Same observationId reuse:    PROHIBITED
Later state:                 new observation record
Correction / succession:     explicit reference only
```

When needed, a new record MAY carry `supersedesObservationId` or
`correctsObservationId`. Historical review and observation records remain
unchanged.

## 5. Observation types

### 5.1 RepositoryObservation@v1

The record identifies the repository, default branch, observed default-branch
SHA, source class, observation interval, result, consistency, and provenance.
`observedDefaultBranchSha` is required only when default-branch resolution is
`COMPLETE`.

### 5.2 PullRequestObservation@v1

The record identifies the repository and PR, state, draft status, merged state,
base SHA, head SHA, mergeability when available, reviews, review threads, CI,
workflow, and branch-policy evidence. Each required component is covered by
the result and failure fields. A failed component makes a gate-bound composite
`PARTIAL` or `FAILED`, not complete by inference.

### 5.3 BranchRelationObservation@v1

The record may contain:

```text
mergeBaseSha
relation
aheadBy
behindBy
```

These values are required only when relation resolution is `COMPLETE`.
If relation calculation fails, `mergeBaseSha` and counts remain unavailable;
they MUST NOT be guessed or copied from a stale snapshot.

## 6. Gate-bound action contract

Any mutation gate that depends on live state MUST create a single-use
`GateBoundObservation@v1` containing:

```text
gateType
repositoryIdentity
targetIdentity
observedBaseSha
observedHeadSha
observationCompletedAt
authorityDecisionRef
validForAction
consumed
```

The observation is valid only for the named action, target, repository identity,
and authority decision. It MUST be marked consumed after use and MUST NOT be
reused for a later action or changed state.

For Merge, when the API supports an optimistic precondition,
`expectedHeadSha` MUST equal `observedHeadSha`; relevant base identity MUST
also be checked immediately before mutation. If the precondition fails, no
mutation is authorized by the observation.

For Ready or another action without an API SHA precondition, the executor MUST
perform an immediate pre-action identity re-read and a post-action identity
readback. Any mismatch invalidates the prior observation and requires a new
evaluation.

Gate evaluation MUST satisfy all of the following:

```text
observationResult = COMPLETE
consistencyResult = PASS
required evidence is present
source authority is sufficient for the gate
authorityDecisionRef resolves to valid authority
observation is not consumed
```

Technical PASS without valid authority is `NOT AUTHORIZED`. Authority GO with
invalid technical state is also `NOT AUTHORIZED` for the technical action.

## 7. Failure and fail-closed rules

The following are non-authorizing states:

```text
UNKNOWN
HOLD
UNVERIFIED
PARTIAL
FAILED
INVALIDATED
IN PROGRESS
NOT YET AVAILABLE
REVIEW REQUIRED
```

Timeout, permission denial, unavailable compare data, unknown mergeability,
failed CI retrieval, and partial composite reads MUST be recorded using the
failure contract. They MUST NOT be represented as empty success, zero counts,
or inferred PASS.

## 8. Validation scenarios

### CSOC-C1-V17 — Composite Observation Head Movement

Head before is A and head after is B. Expected result: `INVALIDATED`; gate
result: `HOLD`; no action may consume the invalid observation.

### CSOC-C1-V18 — Authority GO but Technical State Invalid

Authority is `MERGE GO`, but the live PR is closed or its head moved. Expected
result: technical state is not overridden; Merge is not performed.

### CSOC-C1-V19 — Technical PASS but No Authority

Mergeable is true, CI passes, and reviews are clear, but Authority is absent.
Expected result: `MERGE NOT AUTHORIZED`.

### CSOC-C1-V20 — Local Git Stale

`LOCAL_GIT` reports default-branch SHA A while the remote reports B. Expected
result: A remains local evidence and cannot resolve Remote Current State.

### CSOC-C1-V21 — Partial Observation

PR metadata and CI are retrieved, but review-thread retrieval fails. Expected
result: `observationResult=PARTIAL`; gate result: `HOLD`.

### CSOC-C1-V22 — Ready Race

Pre-read head is A and the head changes to B before Ready mutation. Expected
result: identity mismatch; previous observation invalid; new evaluation required.

### CSOC-C1-V23 — Append-Only Observation

Observation O1 records A. The branch later moves to B. Expected result: O1 is
unchanged and a new O2 records B.

### CSOC-C1-V24 — Repository Rename

Owner/name changes while `repositoryId` remains constant. Expected result: the
same repository identity is reconciled using the stable ID.

## 9. Correction closure map

| Finding | Correction-1 closure |
| --- | --- |
| CSOC-AUTH-PLANE-001 | Sections 2 and 6 separate Technical and Authority planes. |
| CSOC-OBS-ATOMICITY-001 | Sections 4.1 and 6 define interval, boundary identity, consistency, and invalidation. |
| CSOC-SOURCE-TRUST-001 | Section 3 separates source mechanism from source authority class. |
| CSOC-FAILURE-CONTRACT-001 | Sections 4 and 7 define canonical result and failure fields. |
| CSOC-GATE-BINDING-001 | Section 6 defines GateBoundObservation and action binding. |
| CSOC-DEFAULT-BRANCH-NAME-001 | Sections 3.1 and 5 use `observedDefaultBranchSha`. |
| CSOC-REPO-IDENTITY-001 | Section 3.1 adds stable `repositoryId` and `host`. |
| CSOC-BRANCH-RELATION-NULL-001 | Section 5.3 defines unavailable relation semantics. |
| CSOC-PROVENANCE-001 | Section 4.2 defines minimum provenance. |
| CSOC-RECORD-IMMUTABILITY-001 | Section 4.3 defines append-only and supersession rules. |

## 10. Next gate

```text
Definition Correction-1: COMPLETE WHEN APPLIED
Independent Definition Re-Review-1: NOT STARTED
Definition Lock: NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
Repository Migration: NOT AUTHORIZED
Ready / Merge / Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
```
