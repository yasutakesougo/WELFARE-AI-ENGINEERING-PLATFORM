# CONTROLLED-WRITE-READINESS-RESEARCH-REPORT-V1

```text
Document ID:        CWR-RESEARCH-REPORT-V1
Revision:           Research Report Correction-1
Research Mission:   CWR-RESEARCH-MISSION-V1
State:              RESEARCH EVIDENCE ACCEPTED
Source Review:      Independent Research Evidence Review-1 (PR #92)
Prior Verdict:      CORRECTION REQUIRED (P0:0 / P1:2 / P2:1)
Prior Content Commit: 5c9468c525c3120b94fdd09b98e1c2774547a410
Prior Report Blob:    7b5a12d14770cd0d4101d3196c6802643651b615
Content Baseline Commit: 985e93235d87964f8ab9495a0a05fd4e8f11fb80
Content Baseline Blob:   1bf7cbe866f0a3f36bf50d7091a9a67c78a417f5
Independent Re-Review-1: PASS / RESEARCH EVIDENCE ACCEPTABLE
Independent Validation:  12 / 12 PASS
Human Research Evidence Acceptance: GO
Research Evidence:       ACCEPTED
Design Input Eligibility: AUTHORIZED
Research Evidence Re-Review: CLOSED
Acceptance Archive:      docs/research/reviews/human-research-evidence-acceptance-go.md
Source Review Archive:   docs/research/reviews/independent-research-evidence-re-review-1.md
Authority:          Accepted Research Evidence / Design Input only
WAEP Adoption:      NOT AUTHORIZED BY THIS ARTIFACT
Definition Lock:    NOT AUTHORIZED BY THIS ARTIFACT
Implementation Start: NOT AUTHORIZED BY THIS ARTIFACT
Runtime Activation: NOT AUTHORIZED BY THIS ARTIFACT
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED BY THIS ARTIFACT
Cross-Repository Mutation: NOT AUTHORIZED BY THIS ARTIFACT
Production WRITE Execution: OUT OF SCOPE
```

## 0. Authority Boundary

```text
Research Evidence Accepted
  != Technology Adopted
ADOPTION_CANDIDATE
  != ADOPTED
Research Evidence Accepted
  != Implementation Authority
Research Evidence Accepted
  != Execution Authority
Human Research Evidence Acceptance GO
  != WAEP Adoption
Human Research Evidence Acceptance GO
  != Definition Lock
Human Research Evidence Acceptance GO
  != Implementation Start
Human Research Evidence Acceptance GO
  != Ready / Merge / Deploy / LIVE WRITE
Human Research Evidence Acceptance GO
  != Cross-Repository Mutation
Knowledge
  != Execution Authority
Recommended action
  != Human Governance GO
Existing Control mapping
  != New subsystem
```

This report collects primary Evidence for Controlled Write Readiness.
It does not authorize repository mutation, branch-protection apply, token
issuance, Control Plane activation, or Production WRITE.

### 0.1 Provenance note on Correction-1

Correction-1 is constrained to Independent Research Evidence Review-1 required
closures only:

1. P1-1 — FINDING-CWR-A04 ruleset plan / availability statement
2. P1-2 — FINDING-CWR-A01 coarse live `protected=false` observation
3. P2-1 — FINDING-CWR-B04 evidence-class labeling for exactly-once inference

Authority boundary, Mission scope, and Findings outside that closure set remain
unchanged from Research Report Start unless required for Evidence Registry
consistency with the closures above.

### 0.2 Provenance note on Human Acceptance status sync

Human Research Evidence Acceptance GO accepts Content Baseline Commit
`985e93235d87964f8ab9495a0a05fd4e8f11fb80` / blob
`1bf7cbe866f0a3f36bf50d7091a9a67c78a417f5`.

Status / Next Gate synchronization for Acceptance does not reopen or alter
Correction-1 Research Findings, Evidence Registry classifications, or Claim
index substance.

## 1. Purpose and Scope

### 1.1 Purpose

Supply PHASE 1–4 Gate judgment with primary Evidence for:

1. **Mission A** — mechanically enforcing Human Ready/Merge Gate on GitHub
2. **Mission B** — preventing TOCTOU, authority escalation, and duplicate WRITE
   in cross-repository mutation pilots

### 1.2 In scope

- GitHub official documentation for branch protection, rulesets, Apps, refs, compare
- Mapping findings onto existing WAEP Controls
- Explicit `KNOWN GAP` / `UNKNOWN` labeling

### 1.3 Out of scope

- New Agent product discovery, UI, LLM rankings, SaaS proposals
- Production WRITE execution
- Full primary survey of Themes 3–5 (deferred inventory only)

### 1.4 Method

Primary sources were retrieved from official GitHub documentation endpoints on
2026-08-30. Blog/SNS were not used as sole Evidence. Live WAEP repository
observation used `gh api` under the connected integration (read-only where
permitted).

### 1.5 Evidence registry

| Evidence ID | Class | Source |
| --- | --- | --- |
| EV-GH-BP-001 | Primary | [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) |
| EV-GH-RS-001 | Primary | [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) (capabilities; org-level Team/Enterprise wording) |
| EV-GH-RS-002 | Primary | [REST API endpoints for rules](https://docs.github.com/en/rest/repos/rules) |
| EV-GH-RS-003 | Primary | GitHub Docs reusable `data/reusables/gated-features/repo-rules.md` (plan gate: public Free; public+private Pro/Team/GHEC; push rulesets separately gated) — source: [github/docs](https://raw.githubusercontent.com/github/docs/main/data/reusables/gated-features/repo-rules.md) |
| EV-GH-RS-004 | Primary | [Creating rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository) (org rulesets for Team/Enterprise; push rulesets for private/internal) |
| EV-GH-APP-001 | Primary | [Generating an installation access token for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app) |
| EV-GH-REF-001 | Primary | [REST API endpoints for Git references](https://docs.github.com/en/rest/git/refs) |
| EV-GH-GQL-001 | Primary | [GitHub GraphQL Git reference](https://docs.github.com/en/graphql/reference/git) (`RefUpdate.beforeOid`, `updateRef`, compare) |
| EV-GH-CMP-001 | Primary | [Compare two commits](https://docs.github.com/en/rest/commits/commits#compare-two-commits) |
| EV-WAEP-OBS-001 | Observation | Live API (2026-08-30): `GET .../branches/main` → `protected=false`, `protection.enabled=false`; `GET .../branches/main/protection` → 403; `GET .../rulesets` → 403 “Upgrade to GitHub Pro or make this repository public…”; `risk-detector-ci.yml` path-scoped |
| EV-WAEP-BP-GO-001 | Internal Governance | Stage 1 Human Governance GO on branch `docs/main-branch-protection-governance-v1` (mechanical apply pending) |
| EV-WAEP-SB-001 | Internal Control | `src/security_boundary/` generation / write_target / fail-closed decisions |
| EV-WAEP-DARK-001 | Internal Control | `src/durable_run_kernel/` lease / fence / effect reconciliation |
| EV-WAEP-RISK-001 | Internal Control | `docs/governance/waep-risk-based-execution-governance-v1.md` FAST/GOVERNED/BLOCKED |
| EV-WAEP-REG-001 | Internal Control | `docs/governance/repository-role-registry-v1.md` mutation authority NONE |

Discovery-only materials (not sole Evidence): third-party blogs about ruleset
bypass/auto-merge quirks. Where behavior is not confirmed in official docs,
status is `UNKNOWN`.

---

## 2. Mission A Findings — GitHub Human Gate mechanical enforcement

### FINDING-CWR-A01 — Minimal mechanical merge friction without required checks

**Finding**  
Classic branch protection can require: pull request before merge, conversation
resolution, deny force-push, deny deletion — without requiring status checks or
approving reviews. This is a valid minimal mechanical baseline when stable CI
check names do not yet exist.

**Primary Evidence**  
EV-GH-BP-001 (settings: require PR reviews optional; require conversation
resolution; allow force pushes default blocked; allow deletions default blocked;
require status checks optional).

**WAEP relevance**  
Matches already-recorded Stage 1 Human Governance GO intent (PR required,
0 approvals, conversation resolution, no force-push/delete, no required checks).

**Existing WAEP control**  
EV-WAEP-BP-GO-001 Stage 1 GO; EV-WAEP-RISK-001 Human Merge Authority remains
separate from GitHub approval count.

**Gap**  
`KNOWN GAP` — Human Governance GO for Stage 1 is recorded, but mechanical Stage 1
apply is **INCOMPLETE**. Coarse live branch metadata observes protection OFF
(`protected=false` / `protection.enabled=false`). Detailed protection endpoint
readback remains capability-blocked (403) and must not be confused with an
unknown/unconfirmed protected state.

**Recommended action**  
Treat Stage 1 apply as a Human Governance execution task with admin-capable
actor; do not invent a new Definition. After apply, re-verify both coarse
(`protected=true`) and detailed protection readback where capability permits.
Keep `required approving reviews = 0` until a second human reviewer model exists
(per Stage 1 rationale).

**Confidence**  
`HIGH` for GitHub capability; `HIGH` for WAEP Stage 1 mapping; `HIGH` for
current coarse live state OFF (`protected=false`); detailed settings readback
remains capability-blocked (403).

---

### FINDING-CWR-A02 — Admin bypass must be explicitly closed or WAEP Human Gate is bypassable

**Finding**  
By default, classic branch protection restrictions do **not** apply to
repository admins (or roles with “bypass branch protections”). GitHub provides
“Do not allow bypassing the above settings” to apply restrictions to admins as
well. Without that (or an equivalent ruleset non-bypass design), a privileged
actor can still merge without the intended mechanical gate.

**Primary Evidence**  
EV-GH-BP-001 sections “Do not allow bypassing the above settings” and default
admin behavior.

**WAEP relevance**  
WAEP separates Human Merge GO from GitHub approval. If admins (or agent tokens
with admin) can bypass protection, Human Gate policy and mechanical enforcement
diverge.

**Existing WAEP control**  
EV-WAEP-RISK-001 (`Human GO` cannot clear `BLOCKED`; Merge Authority separate);
EV-WAEP-REG-001 (WAEP mutation authority NONE — does not itself grant admin).

**Gap**  
`KNOWN GAP` — Stage 1 GO text authorized PR/conversation/force-push/deletion
controls but did not explicitly lock “do not allow bypassing” / enforce-admins.
Ruleset bypass_actors policy also unset.

**Recommended action**  
Map to existing branch-protection governance Correction Candidate: decide
explicitly whether Stage 1 includes enforce-admins / no-bypass. Prefer fail-closed
for agent-held credentials (agents must not hold admin). Do not equate GitHub
admin capability with WAEP Human Merge GO.

**Confidence**  
`HIGH`

---

### FINDING-CWR-A03 — Required status checks are the mechanical stand-in for “verification before merge,” not for Human GO

**Finding**  
Required status checks block merge until named checks are `successful` /
`skipped` / `neutral`. Checks may be bound to a specific GitHub App as the
expected status source. Strict mode requires the branch to be up to date with
the base before merge (reduces stale-head merge). Loose mode allows merge without
up-to-date base (higher incompatible-change risk).

**Primary Evidence**  
EV-GH-BP-001 “Require status checks before merging” and strict/loose table.

**WAEP relevance**  
Useful for binding independent verification / Risk Detector CI to merge.
Does **not** replace Human Ready/Merge GO. Aligns with Stage 2 recommendation
in existing assessment (enable only after stable persistent check names).

**Existing WAEP control**  
`.github/workflows/risk-detector-ci.yml` (path-scoped; check name
`risk-detector-ci`); EV-WAEP-RISK-001 Fast Lane evidence includes required check
results; Stage 2 not authorized by Stage 1 GO.

**Gap**  
`KNOWN GAP` — no repository-wide persistent “WAEP Core Verification” required
check; current CI is path-filtered and not bound as required. Enabling required
checks before stable names exist risks merge deadlock (already noted in Stage 1
assessment).

**Recommended action**  
Map to existing Stage 2 path: first land stable always-on verification workflow
with exact observed check names across multiple PRs; only then authorize required
checks + prefer strict up-to-date if merge-queue compatibility is evaluated.
Do not treat check PASS as Human Merge GO.

**Confidence**  
`HIGH`

---

### FINDING-CWR-A04 — Rulesets are preferable long-term; current private path lacks repository rulesets until Pro or public

**Finding**  
Rulesets provide named rules, evaluate/active/disabled enforcement, layered
aggregation (most restrictive wins), readable active rules for auditors, and
explicit `bypass_actors` with modes (`always`, `pull_request`, `exempt`).

Plan / product availability must be split by ruleset class:

1. **Repository branch/tag rulesets** — available in **public** repositories on
   GitHub Free / Free for organizations, and in **public and private**
   repositories on GitHub Pro, GitHub Team, and GitHub Enterprise Cloud
   (EV-GH-RS-003 gated-features reusable).
2. **Organization-level rulesets** (multi-repo) — documented for customers on
   GitHub Team and GitHub Enterprise plans (EV-GH-RS-001 / EV-GH-RS-004).
3. **Push rulesets** — separately gated (private/internal; Team / GHEC wording in
   EV-GH-RS-003 / EV-GH-RS-004). Do not conflate with branch/tag repository
   rulesets.

The opening sentence of About rulesets that mentions Team/Enterprise refers to
org-scoped multi-repo application and must not be read as the sole repository
branch/tag availability matrix.

Classic branch protection remains available and layers with rulesets when both
exist. Live WAEP observation: private repository rulesets API returns 403 with
“Upgrade to GitHub Pro or make this repository public…”, which is consistent
with EV-GH-RS-003.

**Primary Evidence**  
EV-GH-RS-003 (plan gate); EV-GH-RS-001 / EV-GH-RS-004 (org-level and push
distinctions; capabilities); EV-GH-RS-002 (`bypass_actors`,
`required_status_checks`, `strict_required_status_checks_policy`);
EV-WAEP-OBS-001 (live 403 plan message).

**WAEP relevance**  
Rulesets better match “Human GO + mechanical enforcement + audited bypass”
because bypass is named and modes can preserve PR audit trail
(`bypass_mode: pull_request`). Current WAEP **private** repository cannot use
repository rulesets without upgrading to Pro or making the repository public.

**Existing WAEP control**  
Existing assessment already chose classic branch protection as practical
candidate when rulesets unavailable.

**Gap**  
`KNOWN GAP` — repository ruleset enforcement unavailable under the **observed
current private/non-Pro plan path** (bound to EV-WAEP-OBS-001).  
`UNKNOWN` — whether org-level Enterprise/Team rulesets will later apply (no org
Enterprise Evidence collected in this report).

**Recommended action**  
Continue Stage 1/2 on classic protection; record repository rulesets as
ADOPTION_CANDIDATE contingent on Pro upgrade or public visibility — not as
“Team/Enterprise only.” Do not create a new WAEP subsystem for ruleset
management beyond governance documentation.

**Confidence**  
`HIGH` for repository ruleset plan gate (EV-GH-RS-003 + live 403); `HIGH` for
current private unavailability; `UNKNOWN` for future org Enterprise applicability.

---

### FINDING-CWR-A05 — GitHub approval count ≠ WAEP Human Gate; prevent approval-less merge by platform settings + credential scope

**Finding**  
Physical prevention of “merge without intended gate” is a composition of:

1. Require pull request (no direct push to protected branch)
2. Optional required reviews / conversation resolution / required checks
3. Close admin bypass (FINDING-CWR-A02)
4. Ensure automation credentials cannot bypass (no admin; no bypass_actor grant;
   App permissions least privilege)
5. Keep auto-merge unauthorized unless separately GO’d

GitHub does not natively understand WAEP “Human Ready GO” records. Mapping must
be contractual: either a human with Merge Authority performs merge after GO, or
a narrowly scoped App is permitted to merge only after an independently verified
GO evidence binding (Control Plane concern — not implemented by GitHub alone).

**Primary Evidence**  
EV-GH-BP-001; EV-GH-RS-001; EV-GH-APP-001; EV-WAEP-RISK-001.

**WAEP relevance**  
Core PHASE 2–3 need: Human Gate and mechanical enforcement must agree.

**Existing WAEP control**  
Risk governance; Authority Claim Resolution (evidence provenance); repository
role registry NONE mutation from WAEP.

**Gap**  
`KNOWN GAP` — no verified binding from WAEP Human Ready/Merge GO artifact →
GitHub merge permission grant. `UNKNOWN` — whether a GitHub App environment
protection / deployment review gate can be used as a PEP for Merge without new
subsystem (not fully surveyed here; Theme 3 deferred).

**Recommended action**  
Short term: Stage 1 protection + humans-only merge + agents without admin.
Medium term: Control Center Execution Policy maps GO evidence → allowlisted merge
actor; prefer existing authority-claim provenance over new Definition. Negative
test: attempt merge with agent token lacking bypass and assert platform denial.

**Confidence**  
`HIGH` for composition pattern; `MEDIUM` for Control Plane PEP design details.

---

### FINDING-CWR-A06 — Installation tokens can be narrowed below installation grant (repo + permissions)

**Finding**  
GitHub App installation access tokens expire in ~1 hour. When minting a token,
callers may pass `repositories` / `repository_ids` and `permissions` to issue a
token strictly smaller than the installation grant. The token cannot exceed
installation permissions or access repos outside the installation.

**Primary Evidence**  
EV-GH-APP-001.

**WAEP relevance**  
Primary mechanical control against cross-repo authority escalation and credential
misuse by agents. Classic PATs (especially classic `repo` scope) are a poorer
default for agent WRITE pilots.

**Existing WAEP control**  
EV-WAEP-SB-001 credential generation bindings / credential operations;
EV-WAEP-DARK-001 capability snapshot includes `credential_capability_class` /
`mutation_capability_class`.

**Gap**  
`KNOWN GAP` — no accepted Research→Design binding that WAEP/Control Plane must
mint per-task narrowed installation tokens for PHASE 3 WRITE. Live agent
credentials in this environment lack admin/protection write (observation), but
WRITE pilot credential architecture is unspecified on `main`.

**Recommended action**  
Map to security_boundary + Control Plane policy: WRITE pilot MUST use
repo-scoped, permission-narrowed, short-lived installation tokens; deny classic
broad PATs for mutation. Separate rollback credentials from routine WRITE
credentials (see FINDING-CWR-B08).

**Confidence**  
`HIGH`

---

## 3. Mission B Findings — Cross-repository WRITE safety

### FINDING-CWR-B01 — Bind every WRITE to repository + ref + exact SHA

**Finding**  
Safe mutation design must treat `owner/repo`, fully-qualified ref
(e.g. `refs/heads/<branch>`), and exact commit OID/SHA as the authority target
triplet. Branch names alone are mutable labels; SHA is the stable preflight
anchor.

**Primary Evidence**  
EV-GH-REF-001 (refs store SHA); EV-GH-GQL-001 (`RefUpdate` name + OID fields);
EV-WAEP-DARK-001 (`target_repository_identity`, `target_resource_identity`,
`authority_generation`); EV-WAEP-SB-001 (`write_target_set` generation binding).

**WAEP relevance**  
PHASE 3 Cross-Repo Pilot Stage 4 WRITE must not authorize “whatever main is now.”

**Existing WAEP control**  
DARK authority binding dimensions; security_boundary write_target generation;
roadmap Draft-PR-only constraint.

**Gap**  
`KNOWN GAP` — no WAEP Cross-Repo WRITE protocol artifact that mandates the
triplet in preflight + mutate + readback evidence. Internal kernels model the
idea; GitHub adapter binding is missing.

**Recommended action**  
Map into Control Center Execution Policy / WRITE pilot contract Candidate:
require `repo + ref + expected_sha` on every mutation request. Prefer extending
existing DARK/security_boundary fields over a new kernel.

**Confidence**  
`HIGH`

---

### FINDING-CWR-B02 — Optimistic concurrency via expected OID closes the main TOCTOU window

**Finding**  
GitHub GraphQL `RefUpdate.beforeOid` requires the ref to point to a given OID
before update; `0000…0` asserts non-existence. GraphQL docs also describe
compare-from-ref patterns. REST `PATCH .../git/refs/{ref}` with `force: false`
(default) rejects non-fast-forward updates but does **not** by itself assert an
exact previous SHA in the REST body — exact expected-OID compare-and-swap is the
GraphQL `beforeOid` / `createCommitOnBranch`-style expected head pattern.

**Primary Evidence**  
EV-GH-GQL-001 (`RefUpdate.beforeOid` semantics); EV-GH-REF-001 (`force` default
false = fast-forward only).

**WAEP relevance**  
Preflight observes SHA_T0; mutation must fail if HEAD ≠ SHA_T0 at apply time.
This is the primary TOCTOU countermeasure for branch tip drift.

**Existing WAEP control**  
security_boundary `GENERATION_MISMATCH` / `STALE`; DARK `lease_write_decision`
fence token; effect `attempt_generation`.

**Gap**  
`KNOWN GAP` — WAEP has generation/fence concepts locally, but no documented
GitHub adapter requirement to use `beforeOid` / expected head OID on WRITE.
`UNKNOWN` — exact GraphQL `createCommitOnBranch` field matrix under current API
version was only partially resolved via Git reference docs in this pass (official
mutations index fetch did not return full field text).

**Recommended action**  
Design-input: Cross-Repo WRITE MUST use compare-and-swap expected OID. On
mismatch → fail-closed (`DENY` / `HOLD`), not retry-with-force. Map decision
classes to existing `STALE` / `GENERATION_MISMATCH` / `HOLD_REQUIRED`.

**Confidence**  
`HIGH` for `beforeOid` semantics; `MEDIUM` for complete createCommitOnBranch
field enumeration.

---

### FINDING-CWR-B03 — Preflight drift detection requires fresh read of target SHA + compare readback

**Finding**  
After preflight and before/after WRITE:

1. Re-read ref OID immediately before mutate (detect stale preflight)
2. Mutate with expected OID binding (FINDING-CWR-B02)
3. Readback via `GET /repos/{owner}/{repo}/compare/{base}...{head}` (or GraphQL
   compare) and fail-closed if unexpected files/commits appear

Compare API returns ahead/behind status and file list between two commits/refs.

**Primary Evidence**  
EV-GH-CMP-001; EV-GH-REF-001; EV-WAEP-DARK-001 reconciliation observation
requires matching `logical_mutation_id`, `target_identity`, `attempt_generation`,
and evidence refs.

**WAEP relevance**  
Independent verification stage in PHASE 3; unexpected diff must not be
auto-accepted.

**Existing WAEP control**  
DARK `effect_decision` + `ReconciliationObservation`; authority claim evidence
provenance.

**Gap**  
`KNOWN GAP` — no specified unexpected-diff policy for GitHub WRITE readback
(allowlist paths, max files, max churn). Kernels provide reconciliation hooks
without GitHub compare adapter.

**Recommended action**  
Map readback to DARK reconciliation evidence refs; define fail-closed compare
policy inside WRITE pilot contract Candidate (not a new runtime kernel).
Negative tests: mutate after tip drift; assert rejection; mutate success then
tamper expectation and assert HOLD.

**Confidence**  
`HIGH`

---

### FINDING-CWR-B04 — At-least-once delivery requires idempotency keys; do not assume exactly-once WRITE

**Finding**  
Platform APIs and agents retry. Safe design **assumes at-least-once invocation**.
DARK already distinguishes:

- `EFFECT_APPLIED` → `DUPLICATE_MUTATION_PROHIBITED`
- `EFFECT_UNKNOWN` without matching reconciliation → `RECONCILIATION_REQUIRED`
- `EFFECT_NOT_APPLIED` → `REAUTHORIZE_REQUIRED`

Logical mutation identity + attempt generation is the WAEP-native idempotency
approach.

**Evidence class (explicit)**  
- **Primary:** GitHub concurrency primitives — expected OID / `beforeOid`,
  fast-forward-only ref update (`force: false`) (EV-GH-GQL-001, EV-GH-REF-001).
- **Primary (internal Control):** DARK effect ledger / lease / fence
  (EV-WAEP-DARK-001).
- **Design inference / absence-of-guarantee:** “no universal exactly-once WRITE
  semantic across GitHub mutation APIs” is **not** a direct quotation from the
  cited refs/GraphQL pages. Those pages document concurrency controls, not
  delivery/retry semantics. The inference is architectural: because retries and
  partial failures exist in distributed clients, WAEP must not rely on
  exactly-once unless a primary source asserts it.

**Primary Evidence**  
EV-WAEP-DARK-001 (`effect_decision`, `logical_mutation_id`,
`attempt_generation`); EV-GH-REF-001; EV-GH-GQL-001 (concurrency primitives
only).

**WAEP relevance**  
Multi-agent duplicate Draft-PR / duplicate commit prevention for PHASE 3.

**Existing WAEP control**  
DARK effect ledger + lease/fence; security_boundary budgets/containment.

**Gap**  
`KNOWN GAP` — idempotency key is not yet mandated as GitHub client header /
PR title fingerprint / branch name discipline for cross-repo pilot.
`NONE` at kernel decision-model layer (model exists).

**Recommended action**  
Do not build a new exactly-once subsystem. Require `logical_mutation_id` in
WRITE pilot evidence; on retry, reconcile before second mutate. Prefer lease
ownership + fence token for single-writer critical sections.

**Confidence**  
`HIGH` for at-least-once design posture and DARK mapping; `HIGH` that cited
GitHub docs provide concurrency primitives rather than an exactly-once delivery
guarantee.

---

### FINDING-CWR-B05 — Lease + fencing token is the existing multi-writer safety primitive

**Finding**  
`lease_write_decision` rejects expired lease, owner mismatch, fence mismatch, or
stale fence `< current`. This is the in-repo pattern for preventing concurrent
WRITE races among agents.

**Primary Evidence**  
EV-WAEP-DARK-001.

**WAEP relevance**  
Theme 4 overlaps Mission B for duplicate execution. Prefer this Control over
new distributed-lock Definitions.

**Existing WAEP control**  
DARK lease/fence (direct).

**Gap**  
`KNOWN GAP` — lease store is local kernel semantics; cross-repo shared lease
authority / storage for Control Plane workers is not evidenced as deployed.
`UNKNOWN` — whether Control Center already implements an equivalent lease
service (out of this repository).

**Recommended action**  
Map PHASE 3 single-writer sections to DARK lease semantics in Control Plane
worker design; Research must not invent a second lock framework. Confirm
Control Center capabilities in a later scoped recon (separate from this report).

**Confidence**  
`HIGH` for kernel semantics; `UNKNOWN` for Control Center deployment parity.

---

### FINDING-CWR-B06 — Repo-scoped installation tokens are the primary authority-escalation brake

**Finding**  
Combined with FINDING-CWR-A06: a WRITE pilot token should be minted per task for
exactly one target repository and minimal permissions (e.g. contents:write +
pull_requests:write, not administration, not workflows unless required). Token
lifetime ~1 hour bounds misuse window.

**Primary Evidence**  
EV-GH-APP-001; EV-WAEP-REG-001 (portfolio mutation NONE until separately
authorized elsewhere).

**WAEP relevance**  
Prevents agent with WAEP credentials from writing unrelated CORE/LAB repos.

**Existing WAEP control**  
security_boundary credential generation + write_target_set; repository role
registry.

**Gap**  
`KNOWN GAP` — credential minting policy for PHASE 3 not locked; negative test
suite for unauthorized repo WRITE not specified.

**Recommended action**  
Unauthorized WRITE negative testing matrix (design-input):

| Case | Expect |
| --- | --- |
| Token for repo A used on repo B | platform deny |
| permissions without contents:write | platform deny |
| expired token | platform deny |
| write to protected main without PR path | platform deny |
| expected OID mismatch | fail-closed |

**Confidence**  
`HIGH`

---

### FINDING-CWR-B07 — Draft-PR-only keeps Ready/Merge/Deploy/LIVE WRITE separable

**Finding**  
Roadmap PHASE 3 already constrains pilot WRITE to Draft PR only, with Ready,
Merge, Deploy, LIVE WRITE as separate gates. GitHub draft PRs are not mergeable
until marked ready (platform behavior relied upon by many workflows). This report
treats “Draft PR creation” as the maximum mutation class for the pilot unless a
later Human GO widens it.

**Primary Evidence**  
`docs/roadmap/waep-roadmap-v1.md` Phase 3 stages; EV-GH-BP-001 (merge still
subject to protection when marking ready/merging).

**WAEP relevance**  
Reduces blast radius while testing SHA binding, readback, and authz.

**Existing WAEP control**  
Roadmap Candidate; risk governance gate separation.

**Gap**  
`NONE` at roadmap intent level. `KNOWN GAP` — mechanical enforcement that agents
cannot mark ready / merge (requires permission narrowing: omit pull request
“write” sub-operations where possible, or policy PEP denying those tools).

**Recommended action**  
Keep Draft-PR-only; ensure agent tool authorization denies `mark ready` /
`merge` / direct ref update to protected default branch. Map to Control Center
tool authorization (Theme 3) rather than new WAEP repo feature.

**Confidence**  
`HIGH` for gate separation intent; `MEDIUM` for fine-grained PR permission
limits (GitHub permission model coarseness may force policy PEP instead of
token bit).

---

### FINDING-CWR-B08 — Separate rollback authority from retry authority

**Finding**  
DARK already separates outcomes:

- Duplicate after applied effect → prohibit (not “retry write”)
- Not applied → reauthorize (retry needs fresh authority)
- Unknown → reconcile first

Rollback / compensating action is a **different authority class** from retry:
it mutates in the opposite direction and must carry its own Human GO when in
GOVERNED/BLOCKED lanes. Combining rollback credentials with routine WRITE
credentials expands blast radius.

**Primary Evidence**  
EV-WAEP-DARK-001; EV-WAEP-RISK-001 (Human GO is operation-scoped; cannot clear
BLOCKED); EV-GH-APP-001 (mint distinct narrowed tokens per operation class).

**WAEP relevance**  
PHASE 3 independent verification may request compensating Draft PR; must not
silently reuse WRITE lease/token as rollback superpower.

**Existing WAEP control**  
DARK effect decisions; risk lane GOVERNED/BLOCKED; security_boundary operation
sensitivity (`DATA_MUTATION` vs `AUTHORITY_MUTATION`).

**Gap**  
`KNOWN GAP` — no explicit WRITE pilot rule text separating
`RETRY_AUTHORITY` vs `ROLLBACK_AUTHORITY` vs `RECONCILE_AUTHORITY`.

**Recommended action**  
Map three authority classes into Control Center Execution Policy Candidate using
existing decision enums; mint distinct tokens/scopes; require reauthorization
after `EFFECT_NOT_APPLIED` / authority STALE.

**Confidence**  
`HIGH`

---

## 4. Deferred Themes 3–5 (inventory only)

These are **not** completed primary surveys. Exit for full Mission Themes 3–5
remains open.

| Theme | Deferred target | Preliminary mapping | Status |
| --- | --- | --- | --- |
| 3 Agent runtime governance | MCP authz, Agents SDK tool authorization, policy enforcement point, DENY vs execution failure vs retry | security_boundary decisions `DENY`/`HOLD`/`ASK_HUMAN`; risk BLOCKED≠GOVERNED | `KNOWN GAP` — external primary Evidence not collected in this revision |
| 4 Multi-agent coordination | shared-state, cancellation, duplicate execution | DARK lease/fence/effect idempotency (FINDINGS B04–B05) | Partial via Mission B; Control Center parity `UNKNOWN` |
| 5 Production evidence | SLSA / attestations / immutable audit / production-readonly verification | Learning payload release decision; promotion gate; roadmap Phase 4 synthetic evidence | `KNOWN GAP` — minimum production evidence profile not researched here (official GitHub attestations / SLSA docs identified as next primary sources, not analyzed) |

---

## 5. PHASE 1–4 Gate Evidence Sufficiency

| Phase need | Covered by this report? | Residual |
| --- | --- | --- |
| PHASE 1 deterministic enforcement candidates | Partial — A01–A05 are enforcement candidates | Need promotion packaging as Knowledge Candidates (separate) |
| PHASE 2 Human Gate + Worker Authority without widening authority | Partial — A05–A06, B06–B08 | Control Plane PEP binding still `KNOWN GAP` |
| PHASE 3 SHA-bound WRITE + Human GO + Draft PR | Primary Mission B findings | Adapter protocol + negative tests still `KNOWN GAP` |
| PHASE 4 production evidence discipline | Deferred | Theme 5 `KNOWN GAP` |

**Mission A/B exit judgment (this revision):**

```text
Mission A primary Evidence: SUFFICIENT FOR DESIGN INPUT
Mission B primary Evidence: SUFFICIENT FOR DESIGN INPUT
Unresolved items: explicitly KNOWN GAP / UNKNOWN above
Human Research Evidence Acceptance: NOT YET
Implementation / WRITE execution: NOT AUTHORIZED
```

---

## 6. Consolidated Recommended Actions (Research / Design-input only)

1. **Execute Stage 1 classic protection** under existing Human Governance GO with
   admin-capable human/ops path; re-observe protection state (A01–A02).
2. **Do not enable required checks** until stable always-on check names exist (A03).
3. **Treat repository rulesets as ADOPTION_CANDIDATE** contingent on Pro or public
   visibility; do not treat them as Team/Enterprise-only (A04).
4. **Agents: no admin, no bypass_actor, narrowed installation tokens** (A05–A06, B06).
5. **WRITE pilot contract Candidate** (map to Control Center Execution Policy, not
   new WAEP kernel):
   - `repo + ref + expected_sha`
   - expected-OID compare-and-swap
   - compare readback fail-closed
   - `logical_mutation_id` idempotency
   - DARK lease/fence for single-writer
   - Draft-PR-only
   - separate RETRY / ROLLBACK / RECONCILE authorities
6. **Unauthorized WRITE negative test matrix** before any Human GO for pilot WRITE.
7. **Defer Themes 3–5** to subsequent Research slices; do not broaden into Agent
   product discovery.

---

## 7. Claim index

| Claim ID | Finding IDs | Verification |
| --- | --- | --- |
| CLAIM-CWR-A-MIN-PROTECTION | A01, A02 | Primary docs + Stage 1 GO mapping |
| CLAIM-CWR-A-CHECKS-VS-HUMAN | A03, A05 | Primary docs |
| CLAIM-CWR-A-RULESET-PLAN-GATE | A04 | Primary docs + live 403 observation |
| CLAIM-CWR-A-TOKEN-NARROWING | A06 | Primary App docs |
| CLAIM-CWR-B-SHA-BIND | B01, B02, B03 | Primary ref/compare/GraphQL + WAEP kernels |
| CLAIM-CWR-B-IDEMPOTENCY | B04, B05 | WAEP DARK primary-in-repo + GitHub concurrency primitives; exactly-once absence = design inference |
| CLAIM-CWR-B-AUTHZ-SEPARATION | B06, B07, B08 | Primary App docs + WAEP risk/DARK |

---

## 8. Next Gate

```text
Independent Research Evidence Re-Review-1: PASS / RESEARCH EVIDENCE ACCEPTABLE
  Archive: docs/research/reviews/independent-research-evidence-re-review-1.md
Exact Diff Inspection: PASS
  Archive: docs/research/reviews/cwr-research-report-correction-1-exact-diff-inspection.md
Human Research Evidence Acceptance: GO
  Archive: docs/research/reviews/human-research-evidence-acceptance-go.md
Research Evidence: ACCEPTED
Design Input Eligibility: AUTHORIZED
Research Evidence Re-Review: CLOSED
Next permissible gate:
  Control Center Execution Policy /
  Cross-Repo WRITE Pilot contract Candidate
  Definition Start GO / HOLD
Definition Lock / Implementation Start / WRITE: NOT AUTHORIZED BY THIS ARTIFACT
```
