# CONTROL-CENTER-CROSS-REPO-WRITE-PILOT-V1

## 0. Status and Authority

```text
Definition: CONTROL-CENTER-CROSS-REPO-WRITE-PILOT-V1
Revision: Definition Correction-1
Definition State: DRAFT / NOT LOCKED
Definition Start: GO
Roadmap Alignment: WAEP-ROADMAP-V1 Phase 3 (Candidate; Phase text != Gate GO)
Research Evidence: CWR-RESEARCH-REPORT-V1 ACCEPTED
Accepted Research Content Baseline: 985e93235d87964f8ab9495a0a05fd4e8f11fb80
Accepted Research Content Blob: 1bf7cbe866f0a3f36bf50d7091a9a67c78a417f5
Human Research Evidence Acceptance: GO
Acceptance Archive: docs/research/reviews/human-research-evidence-acceptance-go.md
Definition Start GO Archive: docs/governance/reviews/control-center-cross-repo-write-pilot-definition-start-go.md
Parent / Related Controls (existing; not reopened):
  - docs/governance/waep-risk-based-execution-governance-v1.md
  - docs/governance/waep-authority-claim-resolution-contract-v1.md
  - docs/governance/repository-role-registry-v1.md
  - src/security_boundary/
  - src/durable_run_kernel/
Control Plane Home: ai-development-control-center (Agent Control Plane)
Pilot Target Repository: severe-behavior-support-spfx
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Cross-Repository Mutation Execution: NOT AUTHORIZED
Production WRITE Execution: NOT AUTHORIZED
Next Gate: exact diff inspection → Independent Definition Re-Review-1
```

```text
Definition Start
  != Definition Lock
Definition Start
  != Implementation Start
Definition Start
  != Cross-Repository WRITE execution
Definition Start
  != LIVE WRITE
Knowledge
  != Execution Authority
Accepted Research Evidence
  != Technology Adoption
Existing Control mapping
  != New subsystem authorization
```

This Definition owns the **pilot contract** for Control Center–mediated
cross-repository WRITE readiness: target binding, authority classes, Draft-PR
mutation class, TOCTOU/idempotency/readback requirements, and negative tests.

It does **not** grant mutation authority from WAEP to any repository
(registry remains NONE until separately authorized elsewhere). It prefers
mapping onto existing WAEP Controls and Control Center Execution Policy rather
than inventing a new WAEP runtime kernel.

---

## 1. Purpose

Define a fail-closed pilot contract so that a future Cross-Repo Control Center
Pilot (Roadmap Phase 3) can progress:

```text
READ ONLY
  → PLAN
  → worker routing
  → WRITE gated by explicit Human GO
  → independent verification
  → Draft PR only
```

…using Accepted Controlled Write Readiness Research Evidence, without widening
Ready / Merge / Deploy / LIVE WRITE authority.

---

## 2. Non-Goals

- Production WRITE execution
- Auto Merge
- Mark-ready / merge of Draft PRs by agents
- Broad Agent framework adoption
- New distributed-lock subsystem when DARK lease/fence suffices
- Replacing Human Ready/Merge GO with GitHub approval counts
- Enabling required status checks before stable CI names exist
- Organization-wide ruleset rollout (plan-contingent ADOPTION_CANDIDATE)

---

## 3. Design Centerline (from Accepted Research)

```text
Human GO / Governance Record
        ↓
Control Center Execution Policy binding (PEP)
        ↓
Authority class selection
  DRAFT_PR_WRITE | RETRY | ROLLBACK | RECONCILE | (no MERGE/READY)
        ↓
Per-task narrowed GitHub App installation token
  (exact repository + minimal permissions + ~1h)
        ↓
Preflight: bind repository + ref + expected SHA
        ↓
DARK lease + fence for every mutating single-writer critical section
        ↓
Mutate with expected-OID compare-and-swap
        ↓
Readback compare + unexpected-diff fail-closed
        ↓
Effect ledger / logical_mutation_id reconciliation
        ↓
Independent verification Evidence
        ↓
Human Ready / Merge remain SEPARATE gates
```

Invariants:

```text
GitHub check PASS
  != Human Merge GO
GitHub approval count
  != WAEP Human Gate
Draft PR creation
  != Ready
Ready
  != Merge
Merge
  != Deploy
Deploy
  != LIVE WRITE
DRAFT_PR_WRITE_AUTHORITY
  != RETRY_AUTHORITY
EFFECT_APPLIED
  != retry WRITE
expected OID mismatch
  != force update
HOLD
  != residual-risk acceptance
Knowledge / Research / Definition
  != Execution Authority
```

---

## 4. Scope

### 4.1 In scope (Definition)

| Area | Requirement |
| --- | --- |
| Pilot target | `severe-behavior-support-spfx` only for first WRITE pilot |
| Mutation class | **Draft PR only** (create/update allowlisted non-protected working branch content required for a Draft PR, then create Draft PR) |
| Initial mutation authority | Explicit `DRAFT_PR_WRITE_AUTHORITY`; required for the first mutation attempt and never implied by RETRY/ROLLBACK/RECONCILE |
| Target binding | `owner/repo` + fully-qualified ref + **exact expected SHA/OID** |
| TOCTOU | Re-read tip before mutate; mutate with expected-OID CAS; reject on drift |
| Idempotency | `logical_mutation_id` + `attempt_generation`; at-least-once assumption |
| Concurrency | DARK lease + fence required for each mutating single-writer critical section |
| Readback | Compare API / equivalent; policy schema violation → HOLD/DENY |
| Credentials | Per-task installation token; repo-scoped; permission-narrowed; no admin; no bypass_actor |
| Authority classes | Separate `DRAFT_PR_WRITE_AUTHORITY`, `RETRY_AUTHORITY`, `ROLLBACK_AUTHORITY`, `RECONCILE_AUTHORITY` |
| Tool policy | Explicit allowlist/denylist; mark-ready, merge, direct default-branch mutation, force-push denied |
| Negative tests | Unauthorized repo, expired token, OID mismatch, protected-main direct write, mark-ready/merge denied |
| Evidence | Every attempt emits provenance-bearing Evidence suitable for Authority Claim Resolution |

### 4.2 Out of scope (Definition Start)

| Area | Status |
| --- | --- |
| Themes 3–5 full research (MCP PEP detail, SLSA profile, etc.) | Deferred; may HOLD related Definition clauses as UNKNOWN |
| Stage 1/2 branch protection mechanical apply on WAEP `main` | Separate Human Governance / ops authority |
| Control Center product UI | Out of scope |
| Multi-repo simultaneous WRITE | Out of scope for V1 pilot |

---

## 5. Mapping to Existing WAEP Controls

| Pilot need | Existing control | Mapping rule |
| --- | --- | --- |
| Risk lane / Human GO vs BLOCKED | `waep-risk-based-execution-governance-v1` | WRITE remains GOVERNED until explicit Human GO; BLOCKED uncleared by Human GO |
| Evidence provenance | `waep-authority-claim-resolution-contract-v1` | WRITE Evidence must carry independent provenance facts |
| Mutation authority from WAEP | `repository-role-registry-v1` | Remains NONE; pilot authority is Control Center / target-repo local, not WAEP-as-mutator |
| Target / generation binding | `src/security_boundary/` | Bind `write_target_set` + generations; STALE / GENERATION_MISMATCH → fail-closed |
| Lease / fence / effect reconcile | `src/durable_run_kernel/` | Reuse `logical_mutation_id`, lease_write_decision, effect_decision |
| Portfolio Control Plane role | `portfolio-architecture-v1` | `ai-development-control-center` owns PEP / worker routing |

```text
Prefer Existing Control mapping
  != authorize new WAEP subsystem
Prefer Control Center Execution Policy binding
  != expand WAEP mutation authority
```

---

## 6. Authority Classes

| Class | Permitted effects | Preconditions | Not permitted |
| --- | --- | --- | --- |
| `DRAFT_PR_WRITE_AUTHORITY` | First allowlisted Draft-PR mutation attempt for one exact target binding and one `logical_mutation_id` | Explicit operation-scoped Human GO; repository safety eligibility PASS; authority CURRENT | Retry by implication; force push; default-branch direct mutation; mark ready/merge |
| `RETRY_AUTHORITY` | Re-attempt the same `logical_mutation_id` only | Reconcile proves `EFFECT_NOT_APPLIED`; fresh explicit retry authority; target/capability still CURRENT | Initial WRITE; force push; silent target rebinding; mark ready/merge |
| `ROLLBACK_AUTHORITY` | Compensating Draft PR / reverse patch | Separate Human GO and distinct operation identity | Reuse routine WRITE token; silent overwrite; mark ready/merge |
| `RECONCILE_AUTHORITY` | Readback, compare, ledger update, Evidence emission | Target/read authority CURRENT | Any mutating GitHub write |
| `READY_AUTHORITY` / `MERGE_AUTHORITY` | **Out of pilot agent scope** | N/A | Agents must not hold these for V1 |

Human GO is **operation-scoped** and cannot clear BLOCKED. `RETRY_AUTHORITY` can
never bootstrap the initial mutation. `ROLLBACK_AUTHORITY` can never be inferred
from either initial WRITE or retry authority.

---

## 7. WRITE Attempt Protocol (normative for Definition)

1. **Safety eligibility** — require Repository Safety Preconditions in §8 to PASS. If absent, failed, or UNKNOWN, Pilot WRITE is NOT ELIGIBLE.
2. **Authorize** — verify Human GO identity, risk lane, exact authority class, capability snapshot. First attempt requires `DRAFT_PR_WRITE_AUTHORITY`.
3. **Mint credential** — installation token narrowed to pilot repo + minimal permissions; record token scope Evidence (not secret material).
4. **Bind target** — persist `repo`, `ref`, `expected_sha`, `logical_mutation_id`, `attempt_generation`.
5. **Acquire lease** — owner + fence for mutating critical section; reject missing/expired/stale fence.
6. **Preflight re-read** — current tip OID must equal `expected_sha` else HOLD/DENY (stale preflight).
7. **Mutate** — only an operation in §8.2 allowlist; expected-OID compare-and-swap; `force=false` / no force.
8. **Readback** — evaluate §8.3 unexpected-diff policy; violation → HOLD + no auto-accept.
9. **Ledger** — record EFFECT_APPLIED / NOT_APPLIED / UNKNOWN / CONFLICT with Evidence refs.
10. **Release lease** — only after ledger durable.
11. **Stop** — do not mark ready, merge, deploy, or LIVE WRITE.

Failure modes map to existing decisions: `DENY` / `HOLD` / `ASK_HUMAN` / `REAUTHORIZE_REQUIRED` / `RECONCILIATION_REQUIRED` / `DUPLICATE_MUTATION_PROHIBITED` / `STALE_LEASE_REJECTED`.

---

## 8. Repository Safety Preconditions and Tool Policy (pilot)

### 8.1 Mandatory repository-safety eligibility

Pilot WRITE to the target repository **MUST NOT begin** unless all of the following
are positively observed and recorded as PASS immediately before the authorized
pilot attempt:

1. Target default branch has mechanical protection at least equivalent to WAEP
   Stage 1 intent: pull request required, conversation resolution required,
   force-push disabled, deletion disabled.
2. Agent credential is non-admin and is not a branch-protection/ruleset bypass actor.
3. Draft-PR-only PEP policy is active and denies every operation in §8.2 denylist.
4. Target repository/ref identity and expected default-branch SHA are readable and CURRENT.

If any required observation is `UNKNOWN`, unavailable, failed, or stale:

```text
Pilot WRITE eligibility = NOT ELIGIBLE
Decision = HOLD / DENY as appropriate
Human HOLD = record of unresolved state, NOT permission to accept residual risk
```

No Human HOLD/GO may waive these V1 mechanical prerequisites. Changing these
prerequisites requires a separately reviewed Definition revision; it cannot be
performed as runtime risk acceptance.

WAEP `main` Stage 1 mechanical apply remains a **separate** governance/ops gate.
This pilot eligibility rule concerns the selected target repository and does not
itself authorize any branch-protection mutation.

### 8.2 V1 GitHub operation allowlist / denylist

The Control Center PEP MUST default-deny all GitHub mutations and expose only the
following V1 mutation surface after `DRAFT_PR_WRITE_AUTHORITY` is valid.

**Allowlist**

- create one uniquely named non-default working branch from the bound `expected_sha`
- create/update/delete files **only on that working branch** and only within the Human-GO-bound path allowlist
- create one **Draft** PR from that working branch to the bound target default branch
- read repository/ref/commit/compare/PR state needed for preflight and readback
- write non-secret effect-ledger / Evidence references required by the pilot contract

**Denylist**

- direct mutation of the default/protected branch
- force push or forced ref update
- deletion or rewrite of protected/default refs
- mark-ready / convert Draft PR to ready
- merge / auto-merge / rebase-merge / squash-merge
- branch-protection, ruleset, repository-setting, permission, collaborator, secret, workflow-permission, or installation mutation
- release, deploy, environment approval, Production/LIVE WRITE
- target repository/ref/path widening not present in the exact Human GO
- creation of additional PRs for the same `logical_mutation_id` without reconcile + fresh authority

An API permission being technically available does not make an operation
allowlisted. PEP authorization is required independently.

### 8.3 Unexpected-diff policy schema

Each Human GO / mutation plan MUST bind a `diff_policy` before credential minting:

```text
diff_policy:
  allowed_paths: exact path/prefix allowlist (non-empty)
  forbidden_paths: explicit denylist; denylist wins
  max_files_changed: positive integer
  max_additions: non-negative integer
  max_deletions: non-negative integer
  allow_binary: false by default
  allow_renames: false by default
  expected_commit_count: exact integer for the attempt plan
```

Readback compares the bound base/expected SHA to the resulting working-branch
head. The result is accepted only when **all** bound constraints pass. Any
unlisted path, forbidden path, numeric threshold exceedance, unexpected binary,
unexpected rename, unexpected commit count, or inability to evaluate a required
constraint yields:

```text
Effect acceptance = NO
Decision = HOLD
Auto-retry = PROHIBITED
Next = RECONCILE or fresh Human authority as dictated by effect state
```

Numeric values are not global WAEP constants; they are mandatory per-attempt
Human-GO-bound constraints. Absence of a required value is fail-closed.

---

## 9. Negative Testing Matrix (Definition requirement)

| Case | Expected |
| --- | --- |
| No `DRAFT_PR_WRITE_AUTHORITY` on first mutation | PEP DENY |
| RETRY authority presented for first mutation | PEP DENY |
| Repository safety observation missing / UNKNOWN | NOT ELIGIBLE / HOLD |
| Token for repo A used on repo B | Platform DENY |
| Missing contents/PR write permission | Platform DENY |
| Expired token | Platform DENY |
| Direct update to protected default branch | Platform / PEP DENY |
| `expected_sha` ≠ current tip | Fail-closed HOLD/DENY |
| Missing/expired/stale lease or fence | STALE_LEASE_REJECTED / DENY |
| Retry after EFFECT_APPLIED without new authority | DUPLICATE_MUTATION_PROHIBITED |
| Mark ready / merge tool invocation | PEP DENY |
| Branch protection / ruleset mutation invocation | PEP DENY |
| Path outside `diff_policy.allowed_paths` | HOLD |
| `diff_policy` threshold exceeded | HOLD |
| Required `diff_policy` field absent/unreadable | HOLD |

---

## 10. Evidence Minimum for a WRITE Attempt

Each attempt Evidence package MUST include:

- Human GO reference (identity + operation class)
- exact authority class, including `DRAFT_PR_WRITE_AUTHORITY` for first mutation
- Repository Safety Preconditions observation + PASS identity
- `logical_mutation_id`, `attempt_generation`
- `repo`, `ref`, `expected_sha`, observed tip before/after
- capability snapshot id / digest
- credential scope summary (never token material)
- lease owner/fence ids for every mutating critical section
- bound `diff_policy` identity/digest
- compare/readback summary refs (no secrets)
- effect state + reconciliation refs when UNKNOWN

Raw tokens, private keys, and customer/personal data are prohibited in Evidence.

---

## 11. Relationship to CONTROL-CENTER-EXECUTION-POLICY-V1

```text
CONTROL-CENTER-CROSS-REPO-WRITE-PILOT-V1
  = pilot contract / WRITE-safety profile
CONTROL-CENTER-EXECUTION-POLICY-V1
  = broader Control Center policy surface (routing, knowledge binding, Human Gate)

This pilot Definition supplies WRITE-safety clauses that Execution Policy MUST
bind without widening Worker Authority beyond Draft-PR pilot scope.
```

If Execution Policy already covers a clause, this Definition references it rather
than duplicating a second authority model.

---

## 12. Open Items after Definition Correction-1

| ID | Item | Status |
| --- | --- | --- |
| OPEN-CWR-P-001 | Exact Control Center PEP implementation location/API | `KNOWN IMPLEMENTATION-SCOPE DEPENDENCY` — must be resolved in Implementation Scope Definition before Implementation Start |
| OPEN-CWR-P-002 | Fine-grained denial of mark-ready vs PR write permission coarseness | `CLOSED AT DEFINITION` — explicit PEP allowlist/denylist in §8.2; implementation binding remains future scope |
| OPEN-CWR-P-003 | Unexpected-diff numeric thresholds | `CLOSED AT DEFINITION` — mandatory per-attempt `diff_policy` schema in §8.3; values bound by exact Human GO/plan |
| OPEN-CWR-P-004 | Shared lease store across Control Center workers | `KNOWN IMPLEMENTATION-SCOPE DEPENDENCY` — semantics fixed to DARK; concrete store must be resolved before Implementation Start |
| OPEN-CWR-P-005 | Themes 3–5 deferred research | `DEFERRED / NON-BLOCKING FOR DEFINITION LOCK` only where clauses are not required by this V1 contract; any Implementation Scope dependency must be made explicit |

Definition Lock may close with implementation-location dependencies unresolved
only when their **required semantics are fully fixed here** and Implementation
Start remains blocked until the concrete binding is independently scope-reviewed.
No UNKNOWN item may silently become implementation authority.

---

## 13. Correction-1 Closure Map

| Review-1 Finding | Correction-1 closure |
| --- | --- |
| P1-1 Initial WRITE authority absent | Added `DRAFT_PR_WRITE_AUTHORITY`; first mutation requires explicit Human GO; RETRY cannot bootstrap initial WRITE |
| P1-2 Repository safety precondition waivable | Changed to MUST/PASS eligibility; UNKNOWN/failed/stale = NOT ELIGIBLE; HOLD is not residual-risk acceptance |
| P2-1 Draft-PR GitHub operation surface ambiguous | Added explicit default-deny allowlist/denylist in §8.2 |
| P2-2 Unexpected diff policy incomplete | Added mandatory per-attempt `diff_policy` schema and fail-closed readback behavior in §8.3 |

---

## 14. Next Gate

```text
Next Gate: exact diff inspection
Then: Independent Definition Re-Review-1
Then if PASS: Human Definition Lock GO / HOLD
Definition Lock
  != Implementation Start
Implementation Start
  != Cross-Repo WRITE execution
```