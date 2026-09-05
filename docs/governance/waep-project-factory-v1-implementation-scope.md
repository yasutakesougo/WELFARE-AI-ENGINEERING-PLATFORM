# WAEP-PROJECT-FACTORY-V1 — Minimal Existing Project Slice A

## Authority

```text
Issue: #70
Human Definition Lock GO: CONSUMED
Implementation Scope Correction-1: RECORDED
Ponytail / Minimality Scope Re-Review: PASS
Independent Scope Review: PASS
Human Implementation Start GO: CONSUMED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
```

This artifact records the implemented Slice A boundary. It does not expand authority.

## Objective

Implement only the Existing Project ingress needed to prove that a synthetic WAEP-managed project can be represented and routed deterministically without execution or external mutation.

```text
Synthetic Existing Project
→ Canonical Project Profile
→ minimal Capability resolution
→ declarative Project Adapter resolution
→ candidate Worker routing explanation
→ Authority / Human Gate explanation
```

## Authorized implementation surface

```text
src/project_factory/**
tests/project_factory/**
docs/governance/waep-project-factory-v1-implementation-scope.md
```

No package, workflow, tsconfig, existing runtime, registry, learning, security, template, fixture, CLI, UI, deploy, or external-system path is authorized.

## Implemented boundary

`src/project_factory/index.ts` contains only in-memory types and the pure `explainExistingProjectRoute` function.

The function:

- validates project, task, and repository identity
- checks required capabilities against project bindings
- resolves one declarative repository adapter
- selects one compatible worker candidate from capability + risk compatibility
- resolves the referenced authority-policy explanation
- reads Human Gate requirement from that resolved policy explanation rather than inferring it from risk class alone
- always returns `executionAuthorized: false` on success
- returns `HOLD` for unresolved required state

Adapter command strings are descriptive data only and are never executed.

## Explicitly deferred

```text
New Project ingress
Bootstrap Plan generation
Parallel execution identity implementation
Worker execution runtime
Durable resume runtime
Worker Output → Evidence → Knowledge implementation
Knowledge Registry / Learning integration
MCP / A2A runtime
worktree / sandbox creation
distributed locking
repository creation or mutation outside this branch implementation
Human Gate resolution or consumption by runtime
Ready / Merge / Deploy / LIVE WRITE
```

## Focused verification target

```text
npm test -- --run tests/project_factory
npm run typecheck
```

Required behavior:

```text
valid synthetic project → deterministic EXPLAINED result
executionAuthorized → false
Human Gate explanation → authority-policy bound
unknown project identity → HOLD
unknown task identity → HOLD
unknown repository → HOLD
unresolved capability → HOLD
unresolved adapter → HOLD
unresolved worker → HOLD
unresolved authority policy → HOLD
```
