# WAEP Portfolio Architecture V1

## Status

```text
Definition: PROPOSED
Independent Portfolio Review: REQUIRED
Lock: NOT YET
Implementation / Merge / Deploy Authority: NOT GRANTED
```

## Objective

Define the portfolio-level architecture for `WELFARE-AI-ENGINEERING-PLATFORM` without replacing repository-local sources of truth.

## Architecture

```text
WELFARE-AI-ENGINEERING-PLATFORM
|
+-- CORE
|   +-- audit-management-system-mvp
|   |   +-- Production Learning / Failure Knowledge
|   +-- severe-behavior-support-spfx
|   |   +-- Engineering Method Validation
|   +-- ai-development-control-center
|   |   +-- Agent Control Plane
|   +-- yasutakesougo-welfare-m365-dx-diagnostic
|       +-- Commercial / Service Application
|
+-- LABS
    +-- zatsuzen-homepage
    |   +-- Creative Engineering Lab
    +-- hinata
        +-- Child & Family Learning Lab
```

## System Boundary

This repository may define:

- portfolio roles and dependencies;
- cross-repository knowledge records;
- evidence references;
- promotion criteria;
- roadmap and metrics;
- portable policy candidates;
- pilot definitions.

This repository does not itself authorize:

- source-repository code changes;
- Ready or Merge transitions in another repository;
- deployment or production changes;
- GitHub mutation outside separately authorized actions;
- SharePoint / M365 / Entra mutation;
- customer production use;
- billing, payment, contract or sales action;
- reuse of personal, child-specific, family-specific, customer-sensitive or secret data.

## Knowledge Flow

```text
Source Repository Evidence
  -> Candidate Extraction
  -> Source Validation
  -> Scope Classification
  -> Generalization Review
  -> Promotion Gate
  -> Portable Registry
  -> Policy/Test/Gate Candidate
  -> Target Repository Adoption
  -> Outcome Measurement
  -> Reconciliation
```

No stage may infer a later authority state from an earlier knowledge state.

## CORE vs LABS

CORE repositories use stronger review and authority boundaries because they support production learning, welfare-domain engineering, agent control, or commercial delivery.

LABS prioritize experimentation speed. A Lab result may become a knowledge candidate, but Lab success alone is not sufficient for CORE adoption.

## Cross-Repository Invariants

1. Source evidence remains attributable to the source repository.
2. Repository-specific semantics are not silently generalized.
3. Sensitive or personal data is not promoted as reusable knowledge.
4. `UNKNOWN` is preserved when applicability or evidence is incomplete.
5. Promotion does not grant execution authority.
6. Target adoption requires target-repository authority.
7. Historical failures are preserved; later corrections do not rewrite history.
8. Measured cross-repository success is required for `PROVEN_CROSS_REPO` status.

## V1 Success Condition

V1 becomes lockable when:

- all six repository roles are reviewed;
- knowledge classes and prohibited export categories are defined;
- promotion states are deterministic;
- initial metrics are defined;
- no portfolio artifact claims product-repository authority.
