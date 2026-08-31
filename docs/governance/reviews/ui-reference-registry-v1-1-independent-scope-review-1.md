# UI Reference Registry V1.1 — Independent Scope Review-1

Review target: PR #110

Target Scope HEAD: `17a6cf67561b99aa43fbcf9a9081f6cf71b4579c`

Parent locked Definition HEAD: `e484eaf89d81f7ce0d6c94dedef1ef7e47ac3961`

Verdict: CORRECTION REQUIRED

## P1 — Dependency justification contract is incomplete

The scope requires the validator to reject `DependencyImpact=NEW` when explicit dependency justification is missing, and acceptance test `UIR-A09` requires that behavior.

However, the Adoption Record required-field contract does not define a `dependencyJustification` field or any equivalent structured field.

This leaves the implementation contract under-specified: a validator cannot deterministically distinguish an absent justification from justification embedded arbitrarily in another free-text field.

Required correction:

- add an explicit `dependencyJustification` field to the Adoption Record contract
- define semantics for `DependencyImpact=NONE|EXISTING|NEW`
- require non-empty justification when `DependencyImpact=NEW`
- require the field to remain empty or non-authoritative when no new dependency is proposed
- update `UIR-A09` and add a positive NEW-with-justification case

## P1 — Agent usage sequence weakens the locked parent gate chain

The locked parent Definition standard sequence includes:

`Definition -> Independent Definition Review -> Authorized Implementation -> Rendered Browser Acceptance`.

The proposed agent-facing usage template omits `Independent Definition Review` and moves directly from `Definition` to `Rendered Browser Acceptance`.

Because this artifact is intended to become reusable agent guidance, that omission can mechanically teach a weaker workflow than the locked parent Definition.

Required correction:

- restore `Independent Definition Review` after `Definition`
- state that implementation begins only after the applicable implementation authority gate
- keep Rendered Browser Acceptance downstream of authorized implementation
- ensure the template cannot imply that Definition alone authorizes implementation

## P2 — Motion validation trigger is not deterministic

The validator must reject `motion adoption without motion justification`, but the scope does not define how the validator determines that a candidate is a motion adoption.

Required correction:

- add an explicit structured indicator such as `motionUsed: true|false` or an equivalent deterministic field
- require non-empty `motionJustification` when motion is used
- add PASS/FAIL acceptance tests for both motion and non-motion cases

## P2 — CONFIRMED evidence semantics need a deterministic field boundary

The scope says MCP/Skill/Registry marked `CONFIRMED` without evidence text must fail, but `referenceEvidence` currently serves both UI-pattern evidence and access-availability evidence.

This can make validator results ambiguous.

Required correction:

- either add explicit `accessAvailabilityEvidence` or precisely define which structured field proves access-path confirmation
- require confirmation evidence only for access methods that require environment availability confirmation
- preserve `WEB` / `MANUAL` semantics without inventing an MCP-style requirement

## Non-blocking checks that PASS

- Parent locked HEAD is exact.
- Scope is narrower than the locked Definition.
- Allowed future implementation paths are closed-world.
- Parent Definition remains read-only.
- External MCP/Skill installation and invocation are excluded.
- Product UI mutation is excluded.
- Cross-repository mutation is excluded.
- New dependencies are not silently authorized.
- Validator is constrained to PURE_LOCAL behavior.
- Exact-HEAD implementation evidence is required.

## Gate

```text
Independent Scope Review-1: CORRECTION REQUIRED
P1: 2
P2: 2
Human Implementation Start: BLOCKED
Ready: NOT AUTHORIZED
Merge: NOT AUTHORIZED
```

Next required step:

```text
Scope Correction-1
-> exact Scope diff re-read
-> Independent Scope Re-Review-1
```
