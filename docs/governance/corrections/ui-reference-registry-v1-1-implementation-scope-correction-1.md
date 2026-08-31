# UI Reference Registry V1.1 — Implementation Scope Correction-1

Correction target: `docs/governance/ui-reference-registry-v1-1-implementation-scope.md`

Parent locked Definition HEAD: `e484eaf89d81f7ce0d6c94dedef1ef7e47ac3961`

Authority effect: NONE

This correction is a normative overlay for the implementation scope only. It does not modify or re-lock the parent Definition and does not grant Implementation Start, dependency addition, Ready, Merge, Deploy, LIVE WRITE, or cross-repository mutation authority.

## C1 — Dependency justification semantics completion

Review-1 P1 required deterministic semantics for all `DependencyImpact` values and a positive NEW-with-justification acceptance case.

The corrected contract is:

```text
DependencyImpact=NONE
  -> dependencyJustification MUST be empty.
  -> no dependency change is proposed.

DependencyImpact=EXISTING
  -> dependencyJustification MAY be empty or may identify the already-present repository capability being reused.
  -> it MUST NOT claim or imply authority to add or upgrade a dependency.

DependencyImpact=NEW
  -> dependencyJustification MUST be non-empty.
  -> justification is rationale/evidence only.
  -> dependency addition remains NOT AUTHORIZED unless separately approved.
```

The validator must fail closed when these structural rules are violated.

Additional acceptance tests are mandatory:

```text
UIR-A19 DependencyImpact=NEW with non-empty dependencyJustification
        -> contract validation PASS
        -> dependency-addition authority remains NOT AUTHORIZED.

UIR-A20 DependencyImpact=NONE with non-empty dependencyJustification
        -> FAIL.

UIR-A21 DependencyImpact=EXISTING with an existing-component explanation
        -> PASS and no new-dependency authority is implied.
```

## C2 — Correction-1 completeness statement

Together, the corrected scope document and this overlay resolve all Review-1 findings:

```text
P1 dependencyJustification field: RESOLVED
P1 DependencyImpact NONE|EXISTING|NEW semantics: RESOLVED
P1 positive NEW-with-justification test: RESOLVED
P1 agent usage gate chain: RESOLVED
P2 deterministic MotionUsed trigger: RESOLVED
P2 accessAvailabilityEvidence separation: RESOLVED
```

## Gate

```text
Scope Correction-1: COMPLETE
Parent Definition: LOCKED / UNCHANGED
Implementation Start: NOT AUTHORIZED
Next: exact Scope diff re-read -> Independent Scope Re-Review-1
```
