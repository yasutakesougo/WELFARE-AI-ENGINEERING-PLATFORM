# WAEP RESEARCH MISSION — CONTROLLED WRITE READINESS V1

```text
Document ID:        CWR-RESEARCH-MISSION-V1
Artifact:           CONTROLLED-WRITE-READINESS-RESEARCH-MISSION-V1
State:              RESEARCH MISSION CANDIDATE
Authority:          Research Mission Instruction only
WAEP Adoption:      NOT AUTHORIZED BY THIS ARTIFACT
Definition Lock:    NOT AUTHORIZED BY THIS ARTIFACT
Implementation Start: NOT AUTHORIZED BY THIS ARTIFACT
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED BY THIS ARTIFACT
Cross-Repository Mutation: NOT AUTHORIZED BY THIS ARTIFACT
Production WRITE Execution: OUT OF SCOPE
```

## 0. Authority Boundary

```text
Research Mission
  != Research Evidence Accepted
Research Evidence Accepted
  != Technology Adopted
Knowledge
  != Execution Authority
Existing WAEP Control mapping
  != New subsystem authorization
Roadmap Phase progress
  != Gate GO
```

This artifact instructs Research Evidence collection only. It does not authorize
Definition Lock, Implementation Start, Ready, Merge, Deploy, LIVE WRITE,
external repository mutation, credential issuance, or Production WRITE execution.

## 1. Objective

Collect the external primary Evidence required for WAEP to safely progress:

```text
Repository Safety
  → Control Plane policy binding
  → Cross-Repository WRITE Pilot (Draft PR only)
  → Production Evidence readiness
```

Research must enable PHASE 1–4 implementation judgment without inventing new WAEP
subsystems when existing Controls can absorb the requirement.

## 2. Priority

| Rank | Theme | Mission weight |
| --- | --- | --- |
| 1 | GitHub mechanical repository protection | **Primary Mission A** |
| 2 | Cross-repository mutation safety | **Primary Mission B** |
| 3 | Agent runtime authorization enforcement | Secondary (Evidence inventory only until A/B exit) |
| 4 | Multi-agent concurrency / shared-state safety | Secondary (prefer mapping to DARK / security_boundary) |
| 5 | Production evidence / provenance | Secondary (minimum requirements inventory) |

**This revision’s execution focus:** Primary Mission A and Primary Mission B only.
Themes 3–5 are recorded as deferred Evidence targets, not broad product discovery.

## 3. Research Rules

1. Prefer primary sources: GitHub / Microsoft / OpenAI / MCP official specs,
   standards bodies, and peer-reviewed papers.
2. Blog / SNS may be used for Discovery only. They MUST NOT be sole Evidence for
   material judgments.
3. Do not perform broad “interesting Agent framework” exploration.
4. Do not casually propose new WAEP subsystems.
5. If an existing WAEP Control can absorb the requirement, recommend mapping to
   that Control rather than a new Definition.
6. Knowledge does not grant Execution Authority.
7. Facts that cannot be confirmed from external primary sources are `UNKNOWN`.
8. Gaps that are confirmed missing relative to WAEP needs are `KNOWN GAP`.

## 4. Finding Schema

Every Finding MUST use:

```text
Finding
→ Primary Evidence
→ WAEP relevance
→ Existing WAEP control
→ Gap
→ Recommended action
→ Confidence
```

Allowed Confidence values: `HIGH` | `MEDIUM` | `LOW` | `UNKNOWN`.

Allowed Gap values:

- `NONE` — existing Control already covers the requirement at Evidence level
- `KNOWN GAP` — requirement is clear; WAEP lacks binding Evidence or mechanical enforcement
- `UNKNOWN` — external primary source insufficient to decide

Recommended action MUST remain Research / Design-input scoped unless a separate
Human Governance GO already exists for a mechanical apply step.

## 5. Explicit Investigation Targets

### Mission A — GitHub Human Gate mechanical enforcement

- Minimal GitHub configuration that physically prevents merge without required
  Human / mechanical gates
- Rulesets vs classic branch protection; required checks; conversation resolution
- Bypass actors / admin bypass / “do not allow bypassing”
- GitHub App / PAT / administrator least privilege
- Alignment pattern between WAEP Human Ready/Merge GO and GitHub enforcement
- How to prevent “approval-less merge” at the platform layer

### Mission B — Cross-repository WRITE safety

- Binding WRITE to `repository + branch + exact SHA`
- Detecting and rejecting target drift after preflight (TOCTOU)
- Idempotency and optimistic concurrency
- Duplicate / concurrent WRITE prevention (lease / lock / fencing)
- WRITE-after readback and fail-closed unexpected-diff handling
- Repo-scoped authority via GitHub App installation tokens
- Separation of rollback authority vs retry authority
- Unauthorized WRITE negative-testing requirements

## 6. Explicit Out of Scope

- New Agent product discovery
- UI improvements
- LLM performance comparisons / model rankings
- SaaS proposals / new commercial features
- Production WRITE execution
- Broad Agent framework catalogs

## 7. Existing WAEP Controls to Prefer for Mapping

Research MUST attempt mapping before proposing new Definitions:

| Area | Existing control / artifact |
| --- | --- |
| Risk lanes / Human GO vs BLOCKED | `docs/governance/waep-risk-based-execution-governance-v1.md` |
| Authority claim / evidence provenance | `docs/governance/waep-authority-claim-resolution-contract-v1.md` |
| Mutation authority from WAEP | `docs/governance/repository-role-registry-v1.md` (NONE) |
| Branch protection Stage 1 Human GO | branch `docs/main-branch-protection-governance-v1` (not yet on `main`) |
| Generation / target binding / fail-closed authz | `src/security_boundary/` |
| Lease / fence / effect reconciliation | `src/durable_run_kernel/` |
| Roadmap PHASE 1–4 path | `docs/roadmap/waep-roadmap-v1.md` |
| Path-scoped CI | `.github/workflows/risk-detector-ci.yml` |

## 8. Exit Condition

This Mission exits when, for PHASE 1–4 Gate judgment:

1. Primary Evidence for Mission A and Mission B is recorded with Finding IDs
2. Unresolved items are explicitly labeled `KNOWN GAP` or `UNKNOWN`
3. Recommended actions prefer Existing Control mapping over new subsystems
4. No Finding grants Execution Authority

Companion report for this Mission Candidate:

```text
docs/research/controlled-write-readiness-research-report-v1.md
```

## 9. PHASE Alignment (informational only)

```text
PHASE 1 Knowledge Extraction
  → needs portable / policy / deterministic-enforcement Evidence candidates
PHASE 2 Control Center Knowledge Integration
  → needs Human Gate + Worker Authority binding Evidence without widening authority
PHASE 3 Cross-Repo Control Center Pilot
  → needs SHA-bound WRITE + Human GO + Draft-PR-only Evidence
PHASE 4 Commercial Validation
  → needs production-readonly / synthetic evidence discipline (theme 5 deferred)
```

Roadmap Phase text does not authorize any Gate GO.
