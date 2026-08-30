# CONTROL-CENTER-CROSS-REPO-WRITE-PILOT-V1

## 0. Status and Authority

```text
Definition: CONTROL-CENTER-CROSS-REPO-WRITE-PILOT-V1
Revision: Definition Start
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
Next Gate: Independent Definition Review-1
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
  RETRY | ROLLBACK | RECONCILE | (no MERGE/READY)
        ↓
Per-task narrowed GitHub App installation token
  (exact repository + minimal permissions + ~1h)
        ↓
Preflight: bind repository + ref + expected SHA
        ↓
Optional DARK lease + fence (single-writer section)
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
EFFECT_APPLIED
  != retry WRITE
expected OID mismatch
  != force update
Knowledge / Research / Definition
  != Execution Authority
```

---

## 4. Scope

### 4.1 In scope (Definition)

| Area | Requirement |
| --- | --- |
| Pilot target | `severe-behavior-support-spfx` only for first WRITE pilot |
| Mutation class | **Draft PR only** (create draft PR / push to non-protected working branch as required for Draft PR) |
| Target binding | `owner/repo` + fully-qualified ref + **exact expected SHA/OID** |
| TOCTOU | Re-read tip before mutate; mutate with expected-OID CAS; reject on drift |
| Idempotency | `logical_mutation_id` + `attempt_generation`; at-least-once assumption |
| Concurrency | DARK lease + fence for single-writer critical sections |
| Readback | Compare API / equivalent; unexpected paths/churn → HOLD/DENY |
| Credentials | Per-task installation token; repo-scoped; permission-narrowed; no admin; no bypass_actor |
| Authority classes | Separate `RETRY_AUTHORITY`, `ROLLBACK_AUTHORITY`, `RECONCILE_AUTHORITY` |
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

| Class | Permitted effects | Not permitted |
| --- | --- | --- |
| `RETRY_AUTHORITY` | Re-attempt same `logical_mutation_id` only after reconcile shows `EFFECT_NOT_APPLIED` and authority is CURRENT | Force push; change target SHA binding silently; mark ready/merge |
| `ROLLBACK_AUTHORITY` | Compensating Draft PR / reverse patch under separate Human GO | Reuse routine WRITE token; silent overwrite |
| `RECONCILE_AUTHORITY` | Readback, compare, ledger update, Evidence emission | Any mutating GitHub write |
| `READY_AUTHORITY` / `MERGE_AUTHORITY` | **Out of pilot agent scope** | Agents must not hold these for V1 |

Human GO is **operation-scoped** and cannot clear BLOCKED.

---

## 7. WRITE Attempt Protocol (normative for Definition)

1. **Authorize** — verify Human GO identity, risk lane, authority class, capability snapshot.
2. **Mint credential** — installation token narrowed to pilot repo + minimal permissions; record token scope Evidence (not secret material).
3. **Bind target** — persist `repo`, `ref`, `expected_sha`, `logical_mutation_id`, `attempt_generation`.
4. **Acquire lease** (if single-writer section) — owner + fence; reject stale fence.
5. **Preflight re-read** — current tip OID must equal `expected_sha` else HOLD/DENY (stale preflight).
6. **Mutate** — expected-OID compare-and-swap only; `force=false` / no force.
7. **Readback** — compare against allowlisted path/churn policy; unexpected diff → HOLD + no auto-accept.
8. **Ledger** — record EFFECT_APPLIED / NOT_APPLIED / UNKNOWN / CONFLICT with Evidence refs.
9. **Release lease** — only after ledger durable.
10. **Stop** — do not mark ready, merge, deploy, or LIVE WRITE.

Failure modes map to existing decisions: `DENY` / `HOLD` / `ASK_HUMAN` / `REAUTHORIZE_REQUIRED` / `RECONCILIATION_REQUIRED` / `DUPLICATE_MUTATION_PROHIBITED` / `STALE_LEASE_REJECTED`.

---

## 8. Repository Safety Preconditions (pilot)

Pilot WRITE to a target repository SHOULD NOT begin until:

1. Target default branch has mechanical protection at least equivalent to WAEP
   Stage 1 intent (PR required; conversation resolution; no force-push/delete),
   or an explicit Human HOLD records accepted residual risk.
2. Agent credentials are non-admin and not listed as bypass actors.
3. Draft-PR-only tool policy is enforced at the Control Center PEP
   (token coarseness may require policy deny even when permission bits are coarse).

WAEP `main` Stage 1 mechanical apply remains a **separate** governance/ops gate
(Research recorded Stage 1 as INCOMPLETE on coarse `protected=false`).

---

## 9. Negative Testing Matrix (Definition requirement)

| Case | Expected |
| --- | --- |
| Token for repo A used on repo B | Platform DENY |
| Missing contents/PR write permission | Platform DENY |
| Expired token | Platform DENY |
| Direct update to protected default branch | Platform DENY |
| `expected_sha` ≠ current tip | Fail-closed HOLD/DENY |
| Retry after EFFECT_APPLIED without new authority | DUPLICATE_MUTATION_PROHIBITED |
| Mark ready / merge tool invocation | PEP DENY |
| Unexpected readback paths | HOLD |

---

## 10. Evidence Minimum for a WRITE Attempt

Each attempt Evidence package MUST include:

- Human GO reference (identity + operation class)
- `logical_mutation_id`, `attempt_generation`
- `repo`, `ref`, `expected_sha`, observed tip before/after
- authority class
- capability snapshot id / digest
- lease/fence ids when used
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

## 12. Open Items (KNOWN GAP / UNKNOWN at Definition Start)

| ID | Item | Label |
| --- | --- | --- |
| OPEN-CWR-P-001 | Exact Control Center PEP implementation location/API | UNKNOWN (other repo) |
| OPEN-CWR-P-002 | Fine-grained denial of mark-ready vs PR write permission coarseness | KNOWN GAP (policy PEP required) |
| OPEN-CWR-P-003 | Unexpected-diff numeric thresholds (max files/churn) | KNOWN GAP (set at Correction/Review) |
| OPEN-CWR-P-004 | Shared lease store across Control Center workers | UNKNOWN |
| OPEN-CWR-P-005 | Themes 3–5 deferred research | DEFERRED |

Open items do not authorize Implementation. They must be closed or explicitly
HOLD’d before Definition Lock.

---

## 13. Next Gate

```text
Next Gate: Independent Definition Review-1
Then: Correction (if required) → Re-Review → Definition Lock GO / HOLD
Definition Lock
  != Implementation Start
Implementation Start
  != Cross-Repo WRITE execution
```
