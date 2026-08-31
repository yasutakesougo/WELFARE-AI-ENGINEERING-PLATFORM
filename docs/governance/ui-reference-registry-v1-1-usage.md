# UI Reference Registry V1.1 — Agent Usage

This artifact is guidance only. External UI references are advisory and do not grant product, dependency, repository, Ready, Merge, Deploy, LIVE WRITE, or cross-repository authority.

## Standard sequence

```text
User Friction
-> Real Product Research
-> Pattern Synthesis
-> Existing Component Check
-> Implementation Reference
-> Optional Visual/Motion Research
-> Accessibility Check
-> Definition
-> Independent Definition Review
-> Human Definition Lock / applicable governing Definition authority
-> Human Implementation Start / applicable implementation authority
-> Authorized Implementation
-> Rendered Browser Acceptance
-> Human Friction Re-evaluation
```

Do not collapse or skip an applicable gate defined by the governing workflow.

## Reference access

Use the repository-local registry as the initial catalog.

For `MCP`, `SKILL`, or `REGISTRY` access, confirm availability in the current execution environment before recording `CONFIRMED`.

Do not infer an MCP endpoint, Skill, registry endpoint, installation, account entitlement, or current external capability from the resource name alone.

If preferred access is unavailable, use a documented fallback when allowed and record the actual access method.

`referenceEvidence` describes the UI/product pattern observed.

`accessAvailabilityEvidence` separately describes evidence that an agent-oriented access path was actually available.

## Adoption record

Begin with the user problem, not the visual reference.

Record at minimum the structured fields required by the reviewed implementation scope.

Key rules:

- `DependencyImpact=NEW` requires a non-empty rationale, but that rationale is not dependency-addition authority.
- `DependencyImpact=NONE` requires an empty dependency justification.
- `MotionUsed=YES` requires a state, hierarchy, causality, progress, or continuity justification.
- `SIMULATION` must never be relabeled as `HUMAN` acceptance.
- Rendered browser acceptance is technical evidence and is not human acceptance.
- Existing project components take precedence over new dependencies.

## Verification

Source inspection alone cannot produce a UI PASS.

After separately authorized product implementation, verify the rendered application at supported viewports and check relevant keyboard, focus, responsive, reduced-motion, loading/error, duplicate-render, data-preservation, and before/after friction conditions.

This repository-local Registry implementation does not itself invoke external MCPs or Skills and does not modify product UI.
