# WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1
## Slice A Independent Implementation Review-1

```text
Definition: WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1
Locked Revision: Definition Correction-5
Locked Source Commit: 4b81b7900669b998a65ecf1ce90c953f94458739
Implementation Start Record: ad24e82d789075cd511110ecf2633b5c75e93f8e
Reviewed Implementation Commit: 1beaca47b67b87b100055715abf9a758ad6cf7b3
Slice: A — Contracts / Pure Resolver / Synthetic Fixtures / Shadow Evaluation
Review: Independent Implementation Review-1
Verdict: CORRECTION REQUIRED
P0: 0
P1: 5
P2: 2
PR Publication: NOT AUTHORIZED
PR Ready: NOT AUTHORIZED
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
```

## Positive Verification

- Slice is isolated in a dependency-free package.
- Local validation evidence reported 15 / 15 tests PASS under Node 22.
- Shadow evaluator exposes no mutation adapter and records `mode = SHADOW_READ_ONLY` and `mutationAttempted = false`.
- `ELIGIBLE` is explicitly separated from mutation execution authority.
- `UNAVAILABLE` / `UNKNOWN` material states fail closed to HOLD.
- Claim terminal-state reactivation is rejected in the implemented state-machine subset.

## P1 Findings

### CSOC-IMPL-ACTOR-AUTHORITY-DEFAULT-ALLOW-001

`validateAuthorityDecisionGraph()` rejects only `actorAuthorized === false`. Missing / unknown actor authority evidence therefore passes graph validation and can participate in a `GO` resolution.

Required correction:

```text
actor authority evidence missing / unknown -> UNRESOLVED / HOLD
actor authority must be positively established
actorAuthorityBasis / policy binding must be validated
```

### CSOC-IMPL-REVOCATION-APPLICABILITY-001

`resolveAuthority()` derives `supersededOrRevokedIds` from every decision before determining whether the superseding / revoking decision is applicable, active, non-expired, and policy-valid. A future, expired, or target-inapplicable edge can therefore suppress an otherwise applicable HOLD / DENY.

Required correction:

```text
Only valid effective lifecycle edges may supersede / revoke.
Lifecycle edge validity must include actor authority, policy/domain compatibility, effective time, and applicable lifecycle semantics.
```

### CSOC-IMPL-CLAIM-EVENT-BINDING-001

`validateClaimHistory()` validates only event type sequence. It does not require each event to bind to the exact `claimId` / `gateObservationId`, and does not validate the required event identity/evidence fields. Events from another claim can therefore satisfy `observationSpent = true` for the current claim.

Required correction:

```text
Every Claim event must bind to the exact claimId and gateObservationId.
Required append-only event identity / provenance fields must be validated.
Mixed-claim histories -> INVALID / HOLD.
```

### CSOC-IMPL-MATERIAL-PRESENT-SOURCE-001

`PRESENT` material evidence requires only `value` and `evidenceRef`. It does not require authoritative source evidence. The locked Definition requires PRESENT to be established from authoritative evidence.

Required correction:

```text
PRESENT without authoritative source provenance -> PARTIAL / HOLD
Do not treat local / unknown provenance as COMPLETE.
```

### CSOC-IMPL-AUTHORITY-EVIDENCE-CONTRACT-001

Slice A does not implement or validate the locked Correction-5 Authority evidence contracts. `policyRevision` can contain only a free `policyRevisionId`; `AuthorityResolutionEvidence@v1` and `PreActionAuthorityValidation@v1` are not materialized, and the Observation's `authorityResolutionId` is not proven to reference the resolution that was actually evaluated.

Required correction:

```text
Implement exact AuthorityPolicyRevisionIdentity validation.
Materialize immutable AuthorityResolutionEvidence@v1.
Materialize PreActionAuthorityValidation@v1.
Bind Gate / Claim to verified initial authorityResolutionId.
Retain initial and pre-action resolution identities separately.
Unresolved provenance -> HOLD.
```

## P2 Findings

### CSOC-IMPL-IDENTITY-CANONICALIZATION-001

`sameJsonIdentity()` uses raw `JSON.stringify()`. Semantically identical objects with different key insertion order compare unequal.

Required correction: use deterministic structural/canonical comparison for identity objects.

### CSOC-IMPL-DECISION-ID-UNIQUENESS-001

Duplicate `decisionId` values are not rejected before graph construction. Graph references to a duplicated identity are ambiguous.

Required correction:

```text
Duplicate decisionId -> INVALID / HOLD
```

## Test Gap Mapping

Add synthetic regressions for at least:

```text
missing actor authority -> HOLD
future/inapplicable revocation cannot suppress DENY
mixed claimId events -> INVALID
PRESENT with LOCAL_OBSERVATION / missing source provenance -> HOLD
unresolved Authority Policy exact revision -> HOLD
Gate authorityResolutionId not backed by evidence -> HOLD
same revision object with reordered keys -> same identity
serialized duplicate decisionId -> INVALID
```

## Verdict

```text
Independent Implementation Review-1: CORRECTION REQUIRED
P0 / P1 / P2: 0 / 5 / 2
Shadow Boundary: PASS
Implementation Semantics: NOT YET ACCEPTABLE
PR Publication: NOT AUTHORIZED
Ready / Merge / Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
```

## Next Gate

```text
WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1
Implementation Slice A Correction-1
↓
Independent Implementation Re-Review-1
```
