# WELFARE-AI-ENGINEERING-PLATFORM

Cross-repository AI engineering, knowledge capitalization, governance, and welfare DX platform.

## Purpose

This repository is the portfolio-level source of truth for coordinating multiple repositories, extracting reusable engineering knowledge, governing cross-repository promotion, and measuring whether prior AI-assisted development experience improves future work.

It does **not** replace the source of truth of each product repository and does **not** grant implementation, merge, deployment, production, Microsoft 365, SharePoint, Entra, billing, or external-mutation authority.

## Portfolio

### CORE

| Repository | Role | Primary Knowledge |
| --- | --- | --- |
| `yasutakesougo/audit-management-system-mvp` | Production Learning | incidents, persistence, identity, failure knowledge |
| `yasutakesougo/severe-behavior-support-spfx` | Engineering Validation | definition/review/acceptance/safety methodology |
| `yasutakesougo/ai-development-control-center` | Agent Control Plane | worker, authority, routing, gate, verification, audit |
| `yasutakesougo/yasutakesougo-welfare-m365-dx-diagnostic` | Commercial Application | intake, diagnostic, proposal, estimate, continuous support |

### LABS

| Repository | Role | Primary Knowledge |
| --- | --- | --- |
| `yasutakesougo/zatsuzen-homepage` | Creative Engineering Lab | web, UI, visual, image and publication experiments |
| `yasutakesougo/hinata` | Child & Family Learning Lab | learning UX, accessibility and safe-AI patterns |

## Core Principle

```text
Experience
  -> Evidence-backed Knowledge
  -> Generalized Rule
  -> Policy / Test / Gate
  -> Cross-repository Reuse
  -> Measured Outcome
```

A lesson is not considered reusable merely because it appears in a conversation or one repository. Promotion requires evidence, scope classification, review, and appropriate enforcement maturity.

## Knowledge Classes

- `PROJECT` — repository-specific knowledge; stays with the source repository by default.
- `DOMAIN` — reusable welfare/domain knowledge with explicit privacy and authority boundaries.
- `ENGINEERING` — portable engineering rules potentially reusable across repositories.

Personal records, child-specific observations, family history, customer production data, credentials, secrets, and sensitive internal data are not cross-repository knowledge assets.

## Knowledge Maturity

```text
L0 OBSERVED
 -> L1 DOCUMENTED
 -> L2 GENERALIZED
 -> L3 ADOPTED
 -> L4 ENFORCED
 -> L5 PROVEN_CROSS_REPO
```

## Governance Invariants

- Knowledge != Authority.
- Schema validity != Authorization.
- Worker availability != Execution authority.
- Worker selection != Execution authority.
- Implementation Start GO != Acceptance Execution GO.
- Execution completed != Verified.
- Verified != Ready.
- Ready != Merge.
- Merge != Deploy.
- UNKNOWN / incomplete evidence must fail closed; it must not be silently converted to PASS.

## Current Program

1. `WAEP-PORTFOLIO-FOUNDATION-V1`
2. `WAEP-REPOSITORY-ROLE-REGISTRY-V1`
3. `CROSS-REPO-AGENT-KNOWLEDGE-EXTRACTION-V1`
4. `KNOWLEDGE-CLASSIFICATION-V1`
5. `KNOWLEDGE-PROMOTION-GATE-V1`
6. `AGENT-KNOWLEDGE-REGISTRY-V1`
7. `CONTROL-CENTER-EXECUTION-POLICY-V1`
8. `CROSS-REPO-CONTROL-CENTER-PILOT-V1`

See `docs/roadmap/waep-roadmap-v1.md` for the 12-month sequence.

## Initial Gate

```text
Portfolio Definition: IN PROGRESS
Repository Roles: PROPOSED
Knowledge Extraction: NOT STARTED
Cross-Repo Enforcement: NOT STARTED
Control Center Pilot: NOT STARTED
Commercial / Production Authority: NOT GRANTED BY THIS REPOSITORY
```
