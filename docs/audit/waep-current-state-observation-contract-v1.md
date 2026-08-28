# WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1

## Definition Correction-5

## 0. Correction Status

```text
Definition: WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1
Revision: Definition Correction-5
Source Review: Independent Definition Re-Review-4
Source Review Result: CORRECTION REQUIRED
Correction-4 Target Findings: 5 / 5 CLOSED
New Source Findings: P0: 0 / P1: 3 / P2: 1
Definition State: DRAFT / CORRECTED / NOT LOCKED
Human Definition Lock: NOT YET RECEIVED
Implementation Start: NOT AUTHORIZED
Repository Migration: NOT AUTHORIZED
Ready / Merge / Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Next Gate: Independent Definition Re-Review-5
```

Correction-5 targets only:

```text
CSOC-AUTH-PREACTION-REVALIDATION-001
CSOC-AUTH-POLICY-REVISION-BINDING-001
CSOC-AUTH-RESOLUTION-EVIDENCE-001
CSOC-CLAIM-EVENT-STATE-MACHINE-001
```

## 1. Preserved Semantics

```text
Current State != Stored Snapshot
Observed State != Current State
Historical Evidence != Current Authority
Technical State != Authority
GateBoundObservation: IMMUTABLE
Once claimed: GateBoundObservation is permanently non-reusable
Observation / Claim / Decision Evidence: APPEND-ONLY
No exclusive Claim -> No Mutation Attempt
Authority Policy != Authority Decision Instance
GO at revision A != GO at revision B
Conflicting applicable Authority -> HOLD
Technical PASS != Action Authority
Merge != Deploy
```

## 2. Correction C5-1 — Immediate Pre-Action Authority Revalidation

Exclusive Claim acquisition does not freeze Authority.

```text
Exclusive Claim acquired
!= Authority frozen

Authority GO observed earlier
!= Authority GO at execution time
```

### 2.1 PreActionAuthorityValidation@v1

Mutation start requires an immediate authority validation record after exclusive Claim acquisition and before the mutation API call.

Required fields:

```text
validationId
validatedAt
repositoryIdentity
targetIdentity
targetRevisionIdentity
action
gateObservationId
claimId
authorityResolutionId
currentAuthorityPolicyRevisionIdentity
decisionGraphValidationRef
applicableDecisionIds
result
evidenceReferences
```

`result` is one of:

```text
GO
HOLD
DENY
AUTHORITY_CONFLICT
UNRESOLVED
INVALIDATED
```

### 2.2 Pre-Action Authority Validation Order

```text
STEP 1  Claim binding recheck
STEP 2  Current applicable Authority Policy revision resolve
STEP 3  Authority Decision records retrieve
STEP 4  Decision graph validation
STEP 5  Applicable ACTIVE Decision Set resolve
STEP 6  scope overlap / precedence resolve
STEP 7  conditions / expiry / revocation / supersession re-evaluate
STEP 8  target revision binding recheck
STEP 9  Authority result derive
```

Only `GO` is an Authority-side PASS.

### 2.3 Authority Movement After Claim

If Authority changes after Claim:

```text
previous GateBoundObservation: SPENT / NON-REUSABLE
Mutation: NOT PERFORMED
Consumption result: NO_MUTATION
```

Recommended failure classes include:

```text
AUTHORITY_CHANGED
AUTHORITY_REVOKED
AUTHORITY_SUPERSEDED
AUTHORITY_CONFLICT
AUTHORITY_POLICY_CHANGED
AUTHORITY_UNRESOLVED
```

Retry requires:

```text
fresh GateBoundObservation
fresh Authority Resolution
fresh exclusive Claim
```

### 2.4 Final Technical / Authority Join

Mutation eligibility requires all of:

```text
PreActionTechnicalValidation: PASS
PreActionAuthorityValidation: GO
Exclusive Claim: VALID
Claim History: VALID
Gate Observation: BOUND / NON-REUSED
```

Otherwise: `NO MUTATION`.

```text
Technical pre-action PASS
+
stale or invalid Authority
!= Mutation eligibility
```

## 3. Correction C5-2 — Exact Immutable Authority Policy Revision Binding

### 3.1 AuthorityPolicyIdentity@v1

Logical policy identity:

```text
policyId
policyName
authorityDomain
```

Logical identity does not itself establish exact historical meaning.

### 3.2 AuthorityPolicyRevisionIdentity@v1

Required:

```text
policyId
policyVersion
policyRevisionId
effectiveAt
```

Where available:

```text
contentHash
sourceRepositoryIdentity
sourceCommitSha
sourcePath
```

For repository-backed Policy, `sourceCommitSha` and `contentHash` are the recommended minimum exact revision evidence.

### 3.3 Historical Interpretation Rule

AuthorityDecisionInstance MUST bind immutably to the `authorityPolicyRevisionIdentity` used when the Decision was made.

```text
Historical Decision meaning
MUST NOT change
because Authority Policy later changes
```

A Decision created under Policy Revision A remains historically interpreted under A even after Policy Revision B becomes current.

### 3.4 Current Execution Compatibility

Historical Decision meaning and current execution eligibility are separate.

Execution requires:

```text
historical Decision validity under its bound Policy revision
+
current Policy compatibility
```

If current Policy prohibits continued use:

```text
Decision historical record: VALID historical evidence
Current execution: NOT AUTHORIZED
```

Historical evidence is not rewritten.

### 3.5 Policy Revision Resolution Failure

If the exact historical Policy revision cannot be resolved:

```text
AUTHORITY_POLICY_UNRESOLVED
-> HOLD
```

Do not substitute the latest Policy or a logical Policy name.

```text
Policy identity
!= Policy revision identity
```

## 4. Correction C5-3 — Authority Resolution Evidence

A single `authorityDecisionRef` is not sufficient complete Authority provenance.

### 4.1 AuthorityResolutionEvidence@v1

Required:

```text
authorityResolutionId
resolvedAt
repositoryIdentity
targetIdentity
targetRevisionIdentity
action
authorityPolicyIdentity
authorityPolicyRevisionIdentity
decisionGraphValidationRef
applicableDecisionIds
scopeResolutionRuleRef
conditionsEvaluationRefs
result
evidenceReferences
```

Result:

```text
GO
HOLD
DENY
AUTHORITY_CONFLICT
UNRESOLVED
```

Optional:

```text
supersededDecisionIds
revokedDecisionIds
expiredDecisionIds
precedenceDecisionIds
```

The record MUST make it possible to determine:

```text
which Policy revision was used
which Decisions were evaluated
which Decisions were excluded and why
which graph validation was used
which scope precedence rule was used
which conditions were evaluated
which target revision was authorized
what final result was derived
```

### 4.2 Gate and Claim Binding

GateBoundObservation binds to `authorityResolutionId`, not one Decision ID as the complete Authority basis.

```text
GateBoundObservation
-> AuthorityResolutionEvidence
-> Authority Policy Revision
   + Applicable Decision Set
   + Graph Validation
   + Scope Resolution
   + Conditions
```

GateObservationClaim also binds exactly to `authorityResolutionId`.

```text
Claim.authorityResolutionId
== GateBoundObservation.authorityResolutionId
```

### 4.3 Initial vs Pre-Action Authority Resolution

Mutation workflows may have:

```text
R1: Gate-evaluation Authority Resolution
R2: immediate pre-action Authority Resolution
```

R2 need not equal R1. If R2 is not `GO`, Mutation MUST NOT occur.

Audit Evidence retains both:

```text
initialAuthorityResolutionId
preActionAuthorityResolutionId
```

### 4.4 Multiple Decision Authority

If Policy requires multiple Decisions, all applicable Decision IDs MUST be preserved in `applicableDecisionIds`. A single representative Decision ID MUST NOT replace the complete Authority basis.

## 5. Correction C5-4 — Claim Append-Only Event State Machine

### 5.1 GateObservationClaimEvent@v1

Required:

```text
claimEventId
claimId
gateObservationId
eventType
occurredAt
actorIdentity
evidenceReferences
```

`eventType`:

```text
CLAIM_ACQUIRED
CLAIM_CONSUMED
CLAIM_ABORTED
CLAIM_RELEASED
```

`CLAIM_RECOVERY_RECORDED` may be added as audit evidence but MUST NOT restore Gate Observation reuse.

### 5.2 Derived Claim State

```text
NO_CLAIM
-> CLAIM_ACQUIRED
-> ACTIVE
```

Allowed terminal transitions:

```text
ACTIVE -> CLAIM_CONSUMED
ACTIVE -> CLAIM_ABORTED
ACTIVE -> CLAIM_RELEASED
```

Derived terminal states:

```text
CONSUMED
ABORTED
RELEASED
```

### 5.3 Terminal State Rule

Terminal states MUST NOT transition back to ACTIVE.

```text
Terminal Claim State
-> No reactivation
```

Gate Observation eligibility also does not recover.

### 5.4 Invalid Event Sequences

Prohibited sequences include:

```text
CLAIM_CONSUMED before CLAIM_ACQUIRED
CLAIM_ABORTED before CLAIM_ACQUIRED
CLAIM_RELEASED before CLAIM_ACQUIRED
CLAIM_CONSUMED -> CLAIM_ACQUIRED
CLAIM_ABORTED -> CLAIM_CONSUMED
CLAIM_RELEASED -> CLAIM_CONSUMED
```

Conflicting terminal events produce `CLAIM_HISTORY_INVALID`.

### 5.5 ClaimHistoryValidation@v1

Required:

```text
claimHistoryValidationId
claimId
evaluatedAt
result
eventIds
findingIds
evidenceReferences
```

Result:

```text
PASS
INVALID
UNRESOLVED
```

Mutation eligibility requires `ClaimHistoryValidation = PASS`.

Multiple incompatible terminal events MUST NOT be automatically merged.

### 5.6 Release Semantics

`CLAIM_RELEASED` means the exclusive execution resource was released. It does not mean Gate Observation eligibility was restored.

```text
Once claimed
-> permanently non-reusable
```

## 6. Correction-5 Normative Invariants

```text
CSOC-C5-I01  Claim acquired != Authority frozen
CSOC-C5-I02  Mutation requires immediate pre-action Authority revalidation
CSOC-C5-I03  PreActionAuthorityValidation != GO -> No Mutation
CSOC-C5-I04  Policy identity != Policy revision identity
CSOC-C5-I05  Historical Decision interpretation uses its bound immutable Policy revision
CSOC-C5-I06  Historical Decision validity != Current execution eligibility
CSOC-C5-I07  Authority Resolution is an immutable Evidence Record
CSOC-C5-I08  Gate / Claim binding uses authorityResolutionId
CSOC-C5-I09  Single Decision reference != Complete Authority provenance
CSOC-C5-I10  Claim lifecycle is append-only
CSOC-C5-I11  Terminal Claim State -> No reactivation
CSOC-C5-I12  Invalid Claim history -> HOLD / No Mutation
```

## 7. Validation Scenarios

### CSOC-C5-V62 — Authority Revoked After Claim

Initial authority is MERGE GO and Claim is acquired. GO is revoked before Mutation.

Expected:

```text
PreActionAuthorityValidation: NOT GO
Mutation: NOT PERFORMED
Gate Observation: SPENT
Consumption: NO_MUTATION / AUTHORITY_REVOKED
```

### CSOC-C5-V63 — Authority Conflict Appears After Claim

Initial Authority is GO. After Claim, a new applicable HOLD becomes ACTIVE.

Expected:

```text
PreAction Authority Resolution: AUTHORITY_CONFLICT
Mutation: NO
Gate: HOLD
```

### CSOC-C5-V64 — Policy Changes After Decision

Decision D is bound to Policy Revision A. Current Policy becomes Revision B.

Expected:

```text
Historical interpretation of D: uses A
Current execution compatibility: evaluated under current applicable Policy
D: not silently reinterpreted under B
```

### CSOC-C5-V65 — Policy Revision Cannot Be Resolved

Expected:

```text
Authority: AUTHORITY_POLICY_UNRESOLVED
Action: HOLD
```

No fallback to latest Policy.

### CSOC-C5-V66 — Multiple Decision Authority Basis

If Authority depends on D1, D2, and D3:

```text
AuthorityResolutionEvidence.applicableDecisionIds = [D1,D2,D3]
Gate binds to authorityResolutionId
```

### CSOC-C5-V67 — Initial GO, Pre-Action GO

```text
R1: GO
R2: GO
Technical pre-action: PASS
Claim history: PASS
Action: ELIGIBLE
```

### CSOC-C5-V68 — Initial GO, Pre-Action DENY

```text
R1: GO
R2: DENY
Mutation: NOT PERFORMED
```

### CSOC-C5-V69 — Claim Consumed Then Reactivated

```text
CLAIM_ACQUIRED
CLAIM_CONSUMED
CLAIM_ACQUIRED
```

Expected: `ClaimHistoryValidation = INVALID`; Action = HOLD.

### CSOC-C5-V70 — Multiple Terminal Events

```text
CLAIM_ACQUIRED
CLAIM_ABORTED
CLAIM_CONSUMED
```

Expected: `CLAIM_HISTORY_INVALID`; HOLD.

### CSOC-C5-V71 — Release Is Terminal for Observation Eligibility

```text
CLAIM_ACQUIRED
CLAIM_RELEASED
```

Expected:

```text
Claim state: RELEASED
Gate Observation: NON-REUSABLE
Retry: fresh Observation required
```

### CSOC-C5-V72 — Current Policy Rejects Historical GO

Historical GO remains valid historical evidence under Policy A, but current Policy B prohibits its use.

Expected: Current Action = NOT AUTHORIZED.

## 8. Closure Mapping

```text
CSOC-AUTH-PREACTION-REVALIDATION-001
-> PreActionAuthorityValidation@v1 + post-Claim, pre-Mutation Authority re-resolution

CSOC-AUTH-POLICY-REVISION-BINDING-001
-> AuthorityPolicyRevisionIdentity@v1 + immutable Decision-to-Policy revision binding

CSOC-AUTH-RESOLUTION-EVIDENCE-001
-> AuthorityResolutionEvidence@v1 + complete applicable Decision set + authorityResolutionId binding

CSOC-CLAIM-EVENT-STATE-MACHINE-001
-> GateObservationClaimEvent@v1 + ClaimHistoryValidation@v1 + terminal transition rules
```

Status of all four:

```text
CORRECTED / VERIFIED BY INDEPENDENT DEFINITION RE-REVIEW-5
```

## 9. Independent Definition Re-Review-5 Result

```text
Independent Definition Re-Review-5: PASS / LOCKABLE
Correction-5 Findings: 4 / 4 CLOSED
Historical Findings: ALL CLOSED
New Findings: P0: 0 / P1: 0 / P2: 0
Architecture Direction: PASS
Definition Semantics: LOCKABLE
```

Remaining implementation responsibilities such as host-specific atomic Claim implementation, GitHub-specific optimistic preconditions, append-only evidence storage, canonical serialization implementation, clock/time-source implementation, and recovery procedures are Implementation Definition / Implementation Review concerns and do not block Definition Lockability.

## 10. Authority Boundary

```text
Human Definition Lock: NOT YET RECEIVED
Implementation Start: NOT AUTHORIZED
Repository Migration: NOT AUTHORIZED
Ready: NOT AUTHORIZED
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
M365 / SharePoint / Entra Mutation: NOT AUTHORIZED
```

Publication or Re-Review PASS does not itself grant Definition Lock.

## 11. Publication / Next Gate

```text
Definition Correction-5: COMPLETE
Independent Definition Re-Review-5: PASS / LOCKABLE
Definition State: CORRECTED / REVIEWED / NOT YET LOCKED
Next Gate: Human Definition Lock GO / HOLD after exact-artifact verification
```
