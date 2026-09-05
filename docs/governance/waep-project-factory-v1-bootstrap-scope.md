# WAEP-PROJECT-FACTORY-V1 — Minimal New Project / Bootstrap Plan Slice B

## Authority

```text
Issue: #70
Existing Project Slice A: CLOSED / ON MAIN
New Project / Bootstrap Plan Scope Definition: RECORDED
Ponytail / Minimality Scope Review: PASS
Independent Scope Review: PASS
Human Implementation Start GO: CONSUMED / SLICE B ONLY
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
```

## Objective

Implement only the deterministic planning surface required to convert a synthetic New Project Request into a Project Profile proposal and Bootstrap Plan without creating or mutating the target project.

```text
Synthetic New Project Request
→ explicit Project Type / Risk input
→ minimal Capability resolution
→ Project Profile proposal
→ declarative Adapter proposal
→ candidate Worker plan
→ Authority / Human Gate explanation
→ deterministic Bootstrap Plan
```

## Authorized implementation surface

```text
src/project_factory/**
tests/project_factory/**
docs/governance/waep-project-factory-v1-bootstrap-scope.md
```

No package, workflow, tsconfig, CLI, UI, repository creation, package installation, worker runtime, cloud/M365/SharePoint/Entra mutation, deploy, or LIVE WRITE path is authorized.

## Implemented boundary

`planNewProjectBootstrap` is pure and in-memory. It accepts a caller-supplied synthetic request plus bounded declarative defaults/candidates.

The function:

- requires explicit request, proposed project, and proposed repository identities
- requires explicit Project Type and Risk Class rather than inferring them
- combines small Project Type capability recommendations with explicitly required capabilities
- resolves one declarative adapter reference
- selects one compatible worker candidate for planning only
- resolves the referenced authority-policy explanation
- proposes a canonical Project Profile with lifecycle `PROPOSED`
- produces a deterministic Bootstrap Plan
- always returns repository/package/implementation/execution authorization flags as `false`
- returns `HOLD` when required planning state is unresolved

## Required separation

```text
Bootstrap Plan COMPLETE
!= Repository Created
!= Package Installed
!= Implementation Start GO
!= Ready GO
!= Merge GO
!= Deploy GO
!= LIVE WRITE
```

Worker selection and adapter resolution remain planning outputs only.

## Explicitly deferred

```text
Requirements classification engine
LLM free-form project architecture generation
Repository / branch / worktree creation
Package installation
Worker execution runtime
Parallel execution runtime
Durable resume runtime
Knowledge Registry / Learning integration
Automatic knowledge promotion
MCP / A2A runtime
Tool permission broker
Cloud resource creation
M365 / SharePoint / Entra mutation
Deploy / LIVE WRITE
```

## Focused verification target

```text
npm test -- --run tests/project_factory
npm run typecheck
```

Required behavior:

```text
valid synthetic New Project Request
→ deterministic PLANNED result
→ Project Profile proposal
→ Bootstrap Plan
→ all execution/mutation authority flags false

unknown request identity → HOLD
unknown project identity → HOLD
unknown repository → HOLD
unresolved Project Type → HOLD
unresolved Risk Class → HOLD
unresolved capability → HOLD
unresolved adapter → HOLD
unresolved worker → HOLD
unresolved authority policy → HOLD
```
