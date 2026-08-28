# Knowledge Classification V1

## Status

```text
Definition: KNOWLEDGE-CLASSIFICATION-V1
State: PROPOSED / PORTFOLIO DEFINITION CANDIDATE
Source: PR #9
Current-Main Reconciliation: V2 STATUS CLARIFICATION
Definition Lock: NOT AUTHORIZED
Implementation: NOT AUTHORIZED
```

## Objective

Classify extracted knowledge before any cross-repository promotion.

## Classes

### PROJECT

Repository-specific knowledge whose semantics depend on local schema, identifiers, architecture, environment or workflow.

Default: remain in source repository.

### DOMAIN

Reusable welfare or service-domain knowledge that may apply across multiple welfare repositories.

Requires explicit privacy, legal, evidence and applicability review before promotion.

### ENGINEERING

Portable software/AI engineering knowledge that may apply across repositories independent of welfare-domain semantics.

Examples include authority separation, fail-closed behavior, concurrency patterns, verification rules and review gates.

## Applicability

Each record must declare one of:

- `SOURCE_ONLY`
- `CANDIDATE`
- `ADOPTED_EQUIVALENT`
- `ADOPTED_EXACT`
- `SUPERSEDED`
- `NOT_APPLICABLE`

Do not claim causal transfer from one repository to another unless evidence supports it.

Structural equivalence is recorded as `ADOPTED_EQUIVALENT`, not as copied knowledge.

## Required Evidence

A promoted candidate must identify:

- source repository;
- source Issue/PR/ADR/test/incident or equivalent evidence;
- observed failure or motivating condition;
- root cause, when known;
- generalized rule;
- scope class;
- enforcement type;
- last verification state.

Authoritative Promotion state is not stored or decided by this classification document.

Authoritative Promotion follows the LOCKED `WAEP-LEARNING-SYSTEM-V1` Decision Contracts.

## Prohibited Classification Behavior

- Do not convert missing evidence to `PROJECT`, `DOMAIN` or `ENGINEERING` by guess.
- Do not infer identity semantics from field names or value shapes.
- Do not treat a corrected historical failure as if the failure never occurred.
- Do not export personal or sensitive records as generic examples.
- Do not treat classification as Promotion Authority or Execution Authority.
