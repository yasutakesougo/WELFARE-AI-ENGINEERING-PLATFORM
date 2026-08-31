# WAEP-MINIMUM-VIABLE-OPERATING-MODEL-V1

## 0. Status and Authority

```text
Definition: WAEP-MINIMUM-VIABLE-OPERATING-MODEL-V1
Revision: Definition Draft-1
Definition State: DRAFT / NOT LOCKED
Parent Inputs (accepted review evidence; not reopened):
  - docs/reviews/waep-personal-development-rightsizing-review-v1.md
  - docs/reviews/waep-personal-development-rightsizing-review-v1-correction-1.md
  - docs/reviews/waep-personal-development-rightsizing-review-v1-independent-re-review-1.md
Related Locked Controls (not superseded by this Draft):
  - docs/governance/waep-risk-based-execution-governance-v1.md (LOCKED)
Parent Operating Assumption:
  Solo Human Authority / Personal Development
  GitHub Pro: NOT PLANNED
  Cross-Repository WRITE: FROZEN / INTENTIONAL HOLD
  Public Repositoryization: NOT AUTHORIZED
Independent Definition Review: REQUIRED
Human Definition Lock: NOT AUTHORIZED
Authority Transition: NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
Complexity Freeze Activation: NOT AUTHORIZED BY THIS DRAFT ALONE
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Cross-Repo WRITE un-HOLD: NOT AUTHORIZED
Knowledge Registry Full Materialization: DEFER
Control Plane WRITE Expansion: DEFER / NO NEW SLICES
Repository Mass Merge: NOT AUTHORIZED
Safety Boundary Reduction: NOT AUTHORIZED
Next Gate: Independent Definition Review-1
```

```text
Definition Draft
  != Definition Lock
Definition Lock
  != Authority Transition
Authority Transition
  != Auto Merge
Knowledge
  != Execution Authority
Operating Tier LOW / MEDIUM / HIGH
  != Risk Decision FAST / GOVERNED / BLOCKED
Risk Decision FAST
  != Execution Authority
Filename / path hint
  != Operating Tier
```

This Definition converts the reconciled right-sizing review into a deterministic
solo operating model. It does **not** abolish existing Human Gates by itself.
Existing Current Authority remains in force until a separate, explicit
Authority Transition binds this model to named operations and evidence.

---

## 1. Purpose

Define the Minimum Viable WAEP operating model for one Human Authority such
that:

1. ceremony for low- and medium-consequence work is reduced;
2. consequence-bearing safety boundaries remain separate and fail-closed;
3. Operating Tier classification is determined from actual change content and
   impact, not from file path or repository name alone;
4. Complexity Freeze has an exact boundary and explicit exceptions;
5. deferred capabilities remain deferred until activation triggers are met.

Success is measured by reduced governance effort without safety regression,
not by architectural completeness.

---

## 2. Non-Goals

This Definition does not:

- weaken Production, LIVE WRITE, Sensitive, Destructive, Credential,
  Permission/Identity, M365/SharePoint/Entra, or Customer Production gates;
- authorize Cross-Repo WRITE un-HOLD;
- authorize Knowledge Registry full materialization or population;
- authorize Control Plane WRITE / lease / fence / routing expansion;
- authorize repository merge, archive, or deletion;
- authorize Auto Merge;
- replace `WAEP-RISK-BASED-EXECUTION-GOVERNANCE-V1` Risk Decisions;
- create a new Agent, Registry, Gate family, or Repository;
- treat PR #104 right-sizing review merge as Authority Transition.

---

## 3. Relationship to Risk-Based Execution Governance

`WAEP-RISK-BASED-EXECUTION-GOVERNANCE-V1` remains LOCKED and owns Risk Decision:

```text
FAST | GOVERNED | BLOCKED
```

This Operating Model owns Human ceremony depth:

```text
LOW | MEDIUM | HIGH
```

Mapping rule:

| Risk Decision | Operating Tier effect |
| --- | --- |
| `BLOCKED` | No Human GO may proceed. Fix cause and reclassify. Tier is irrelevant until unblocked. |
| `GOVERNED` | Operating Tier is at least `HIGH` for the governed action. |
| `FAST` | Operating Tier may be `LOW` or `MEDIUM` per §5–§6. Never auto-demotes a §5 HIGH signal. |

```text
Risk Decision
  = whether a dangerous boundary is present
Operating Tier
  = how much Human Gate depth is required for this change class
```

Authority Transition of Fast Lane execution remains a separate act under the
LOCKED Risk governance Definition. This Operating Model may be Locked as text
without activating Fast Lane Auto Merge.

---

## 4. Preserved Safety Principles

The following remain mandatory under all Operating Tiers:

```text
Knowledge != Execution Authority
Implementation GO != Ready GO
Ready GO != Merge GO
Merge GO != Deploy GO
Deploy GO != LIVE WRITE
UNKNOWN must not become PASS automatically
Sensitive Data must not be exported into shared knowledge
Production Mutation requires explicit Authority
Evidence gaps must not be filled by speculation
DENY / HOLD must not be auto-converted to success
```

For HIGH-consequence operations, Ready and Merge remain independently
recordable decisions even when the same Human performs both.

`Human Land` (Ready+Merge combined record) is permitted only for solo
non-production LOW/MEDIUM work after Authority Transition, and never implies
Deploy or LIVE WRITE.

---

## 5. Operating Tier Definitions

### 5.1 LOW

Low-consequence, reversible work that does not change runtime product
behavior, execution authority, secrets handling, production posture, or
external mutation capability.

Illustrative candidates (not sufficient alone):

- documentation that does not alter authority claims or executable policy;
- synthetic tests and fixtures without secrets or real personal data;
- local developer tooling with no repository-mutation or production effect;
- pure evaluators / classifiers used only in offline or CI read paths.

### 5.2 MEDIUM

Reversible non-production application or automation change that can affect
product behavior, CI behavior, or internal workflows, but does not cross a
HIGH boundary in §6.2.

Illustrative candidates (not sufficient alone):

- application code in non-production scope;
- internal automation / scripts without production write capability;
- reversible schema or data-model changes confined to non-production;
- non-destructive dependency updates that do not expand trust boundaries.

### 5.3 HIGH

Any change whose actual effect touches a consequence-bearing boundary in
§6.2, regardless of file path, repository label, or “docs-only” claim.

---

## 6. Deterministic Classification Rules

### 6.1 Classification inputs

Classification MUST use all available of:

```text
1. declared intent / issue summary
2. changed paths
3. actual diff / action description
4. runtime / deploy / permission / data impact
5. Risk Decision (FAST / GOVERNED / BLOCKED), when available
```

Classification basis:

```text
PRELIMINARY  = intent + paths only; advisory; not final for landing
ACTUAL       = actual diff/action impact; required before Human Land / Ready
```

```text
PRELIMINARY LOW
  != final LOW
Path under docs/ or tests/
  != LOW
```

### 6.2 Mandatory HIGH signals (content / impact)

Classify `HIGH` if **any** of the following is true in the actual change or
intended action:

| ID | Signal | Examples of actual effect |
| --- | --- | --- |
| H1 | Production mutation | deploy to production; change production config; write production DB/service |
| H2 | LIVE WRITE | any live external write authorized as LIVE WRITE |
| H3 | Credential / secret handling | add, store, log, transmit, or rotate secrets/tokens/keys in a way that expands exposure |
| H4 | Effective authority change | change real Permission / Role / Identity / AuthN / AuthZ boundaries |
| H5 | Sensitive data handling | personal / welfare / customer / child-family sensitive data intake, retention, transfer, or export |
| H6 | Destructive / irreversible | delete/purge/irreversible migration/unrecoverable overwrite |
| H7 | Customer production mutation | any write into customer production systems |
| H8 | M365 / SharePoint / Entra mutation | tenant or production Microsoft-cloud mutation |
| H9 | Cross-Repo WRITE execution | Control Center or Agent mutates another repository |
| H10 | Safety/Authority expansion | change that expands Execution Authority, weakens fail-closed behavior, or alters gate inequalities in a permissive direction |
| H11 | Significant external cost | clearly above normal solo-dev paid API / billable resource creation |

`GOVERNED` Risk Decision implies at least one H-signal or equivalent and
forces Operating Tier `HIGH` for the governed action.

Plaintext secret introduction remains `BLOCKED` under Risk governance and is
not cleared by any Operating Tier.

### 6.3 MEDIUM signals

If no H-signal applies, classify `MEDIUM` if **any** of the following is true:

| ID | Signal |
| --- | --- |
| M1 | Changes application/runtime source that can affect user-visible or API behavior |
| M2 | Changes CI/CD workflow behavior (including required checks, deploy hooks, secrets references) in a non-H way |
| M3 | Adds or changes automation that can mutate repository or environment state |
| M4 | Changes data models, migrations, or persistence logic outside H6 |
| M5 | Updates dependencies with behavioral or supply-chain impact outside H3/H4 |
| M6 | Changes executable policy, risk rules, or operating-model code paths without permissive Authority expansion (H10) |

### 6.4 LOW eligibility

Classify `LOW` only if **all** of the following hold:

```text
1. No H-signal from §6.2
2. No M-signal from §6.3
3. Actual diff/action is limited to one or more of:
   - non-authoritative documentation / review narrative
   - synthetic tests/fixtures without sensitive or secret material
   - local-only tooling with no mutation side effects
   - pure offline/CI evaluators that cannot grant Execution Authority
4. The change does not claim or record a new Execution Authority GO
5. ACTUAL classification basis is available before Human Land
```

### 6.5 Ambiguity and anti-patterns

```text
Dangerous-boundary possibility + incomplete evidence
  → escalate to HIGH (or HOLD until evidence exists)
  → never demote to LOW

Docs path + authority/safety content change
  → MEDIUM or HIGH by §6.2/§6.3
  → never LOW by path

Tests path + embedded secret or real personal data
  → HIGH or BLOCKED
  → never LOW

"Local tooling" that can push, deploy, or write credentials
  → MEDIUM or HIGH
  → never LOW

Agent-proposed tier
  ≠ final tier
Human may escalate; Human may not demote below ACTUAL signals
```

### 6.6 Classification algorithm

```text
IF RiskDecision == BLOCKED
  → stop; no tier landing
ELSE IF any §6.2 H-signal OR RiskDecision == GOVERNED
  → HIGH
ELSE IF any §6.3 M-signal
  → MEDIUM
ELSE IF §6.4 LOW eligibility satisfied on ACTUAL basis
  → LOW
ELSE
  → MEDIUM (fail upward; do not invent LOW)
```

Record for every landed change:

```yaml
operatingTier: LOW|MEDIUM|HIGH
classificationBasis: PRELIMINARY|ACTUAL
riskDecision: FAST|GOVERNED|BLOCKED|UNKNOWN|NOT_RUN
signals: []      # H* / M* ids observed
evidenceRefs: [] # PR URL, SHA, CI, GO refs as applicable
```

---

## 7. Human Gate Matrix

This matrix is the **target operating model**. It becomes binding for named
operations only after a separate Authority Transition. Until then, existing
Current Authority gates remain in force (§11).

### 7.1 LOW (target)

```text
Implement / correct
→ required automated verification (CI or equivalent)
→ Human Land
```

Not required as standing separate documents:

- Definition Lock
- Implementation Start GO
- WRITE GO
- Independent Definition Review
- Ready GO separate from Merge

### 7.2 MEDIUM (target)

```text
Intent note (issue / PR body scope)
→ Implement
→ required automated verification + targeted tests
→ Human Land
```

Optional lightweight self-check may be attached as PR evidence.
Separate Definition Lock genealogy is not the default for ordinary MEDIUM
product work.

### 7.3 HIGH (target)

```text
Intent / explicit scope
→ Implement
→ Independent verification evidence
→ Human Ready GO (SHA-bound)
→ Human Merge GO (SHA-bound; may be same Human, separate decision record)
→ if applicable, separate Human Deploy / LIVE WRITE / Production Mutation GO
```

HIGH never uses Human Land as Deploy/LIVE WRITE substitute.

### 7.4 Human Land semantics

```text
Human Land
  = solo non-production combined Ready+Merge decision record
  != Deploy
  != LIVE WRITE
  != Production Mutation
  != Cross-Repo WRITE
  != Authority Transition
```

---

## 8. Complexity Freeze

### 8.1 Freeze activation

Complexity Freeze becomes operative only when both are true:

```text
1. This Definition is LOCKED (Human Definition Lock GO on exact artifact)
2. A Complexity Freeze Activation record binds the lock SHA and start time
```

Until both exist, Freeze is defined but not activated.

### 8.2 Frozen classes (NO NEW by default)

While Freeze is active, do **not** start new work whose primary purpose is:

```text
F1  New platform Definition family unrelated to this Operating Model cycle
F2  New Registry, Registry population program, or Registry platform layer
F3  New Agent manager / Multi-Agent coordination / Worker routing slice
F4  New Gate family or additional standing Human GO type
F5  Cross-Repo WRITE pilot/implementation expansion
F6  Control Plane WRITE / lease / fence / Approval Ledger activation slices
F7  Repository mass merge / mass archive program
F8  Commercial-layer embedding into WAEP engineering control architecture
F9  Learning System runtime expansion beyond one manual knowledge-note pilot
F10 New Current-State reconciliation document genre / parallel authority tables
```

`NO NEW SLICES` for Control Plane WRITE remains in effect under Freeze.

### 8.3 Explicit exceptions (allowed during Freeze)

Work is allowed during Freeze only if it matches at least one exception and
the exception is stated in the PR/intent:

| ID | Exception |
| --- | --- |
| E1 | Product bug fix in a product repository |
| E2 | Security vulnerability fix |
| E3 | Production safety / incident response |
| E4 | Blocker fix for broken `main`, required CI, or repository integrity |
| E5 | Thin CURRENT / current-state hygiene that reduces duplication (no new genre) |
| E6 | Risk Detector correctness fix that does not expand Authority |
| E7 | This Operating Model’s Independent Review / Correction / Lock cycle |
| E8 | One manual Knowledge Note pilot (single failure → rule → evidence → status) |
| E9 | Explicit Human-recorded Freeze Exception GO for a named scope/SHA |

```text
Exception claim without matching ID and evidence
  → treat as Freeze violation / HOLD
```

### 8.4 Freeze does not delete

Freeze stops addition and expansion. It does not authorize deletion of dormant
Control Plane code, Registries, or repositories. Deletion/archival requires
later evidence under the right-sizing migration order.

---

## 9. Deferred Capabilities

| Capability | Disposition | Activation trigger |
| --- | --- | --- |
| Knowledge Registry full materialization | DEFER | Concrete consumer cannot use notes/minimal index, or multi-repo reuse becomes a measured bottleneck |
| Minimal single-file knowledge index | BUILD MINIMAL only when triggered | Same as above, smaller scope |
| Control Plane WRITE / routing / lease / fence | DEFER / NO NEW SLICES | Cross-Repo WRITE un-HOLD + demonstrated multi-writer or cross-repo mutation need |
| Cross-Repo WRITE un-HOLD | FROZEN | Separate Human GO after Main Protection Stage 1 COMPLETE and pilot constraints |
| Approval Ledger / ADCC authn write path | DEFER | Real approval execution authorized |
| Decision Store / Canonical Resolver runtime | DEFER | Concurrent knowledge promotion without Human edit, or second Human reviewer need |
| Repository mass merge | NOT AUTHORIZED | Evidence that deploy/product boundary cost exceeds separation value |
| Auto Merge | DEFER | Authority Transition + stable required checks + valid Merge Authority |

ADCC active value under this model:

```text
ACTIVE: read-only observation / Human attention / HOLD-DENY visibility
DORMANT: autonomous WRITE-era capabilities
```

---

## 10. Minimal Evidence Model

Retain only evidence needed to reproduce later decisions.

### 10.1 LOW / MEDIUM (target after Transition)

```text
operatingTier + classificationBasis + signals
PR / exact SHA
required verification result
Human Land record
```

### 10.2 HIGH

```text
operatingTier + classificationBasis + signals + Risk Decision
intent/scope
exact SHA
independent verification evidence
Human Ready GO
Human Merge GO
Deploy / LIVE WRITE / Production Mutation GO when applicable
```

### 10.3 Canonical surfaces

```text
Preferred:
  Git history
  PR discussion / review threads
  one living CURRENT surface
  knowledge notes (when used)

Avoid creating:
  parallel authority tables
  repeated reconciliation narratives of the same live state
  duplicate GO archives when the PR already holds the decision
```

Historical review artifacts already merged remain immutable evidence and are
not rewritten.

---

## 11. Authority Transition Boundary

### 11.1 What Definition Lock of this document authorizes

If later Locked, Definition Lock authorizes only:

```text
This Operating Model text is CANONICAL DEFINITION
Complexity Freeze MAY be activated by a separate Activation record
Independent Review / Correction cycle for this Definition is closed at that SHA
```

### 11.2 What remains unauthorized until separate Transition

```text
Replacement of existing deep Human Gate chains for named operations
Human Land as binding Ready+Merge substitute
Fast Lane Auto Merge
Any Deploy / LIVE WRITE / Production Mutation change
Cross-Repo WRITE un-HOLD
Registry population
Control Plane WRITE expansion
Safety boundary reduction
```

### 11.3 Transition prerequisites

A future Authority Transition for this model MUST include:

```text
1. Exact LOCKED artifact SHA of this Definition
2. Named operation classes moved to LOW / MEDIUM / HIGH matrix
3. Explicit statement that HIGH boundaries in §6.2 remain separately gated
4. Classification rule §6 as the sole Operating Tier classifier
5. Rollback condition (restore prior Current Authority on named classes)
6. Pilot evidence window binding (§12) or explicit deferral of pilot with HOLD
```

Without those elements, Transition claims are invalid.

---

## 12. Right-Sizing Pilot Success Criteria

Pilot evidence collection ≠ Authority Transition.

### 12.1 Minimum sample

```text
Window: 30 days OR at least 5 comparable non-production work units
Tier mix: include at least 1 LOW and 1 MEDIUM candidate under ACTUAL classification
HIGH production mutations: not required for ceremony pilot; if present, must use HIGH matrix
```

### 12.2 Pass conditions

All must hold:

```text
Governance effort: DOWN versus prior comparable units
Product delivery friction: DOWN or UNCHANGED
Production / sensitive incidents attributable to simplification: 0
Authority violations attributable to simplification: 0
UNKNOWN / HOLD / DENY fail-closed semantics: preserved
Knowledge != Execution Authority: preserved
No LOW classification later proven to have contained an undetected H-signal
```

### 12.3 Fail / HOLD conditions

```text
Any simplification-attributable safety or authority incident
Repeated misclassification of H-signals as LOW
Freeze violations without E1–E9 exception
Attempt to treat pilot success as automatic Transition
```

---

## 13. Migration Alignment

Aligned to Correction-1 / Re-Review-1 order:

```text
A. Complexity Freeze                 ← defined here; activate after Lock
B. Duplication Inventory             ← allowed under E5 / inventory-only
C. Governance Pilot                  ← §12; after Transition of named classes
D. Evidence Consolidation            ← §10
E. Control Plane Scope Reduction     ← §9 ADCC ACTIVE/DORMANT
F. Knowledge Minimalization          ← notes; Registry DEFER
G. Validation                        ← §12
H. Final adoption / partial rollback ← separate decision
```

No destructive code deletion is required to begin.

---

## 14. Repository Attention Posture

No repository merge is authorized.

```text
KEEP product repos with distinct deploy/dependency/data boundaries
KEEP WAEP as thin operating/knowledge home
KEEP ADCC while deploy boundary remains useful; active scope = read-only
LAB ONLY for lab repos; exclude from normal CORE ceremony unless promotion requested
Commercial product may consume sanitized engineering notes without joining the control plane
```

---

## 15. Correction Closure (Draft-1)

Draft-1 addresses Independent Re-Review-1 follow-on definition requirements:

| Follow-on requirement | Section |
| --- | --- |
| Deterministic LOW/MEDIUM/HIGH using actual change/impact | §5, §6 |
| Exact Complexity Freeze boundary and exceptions | §8 |
| Evidence for successful right-sizing pilot | §12 |
| Existing HIGH/production gates remain until Transition | §4, §7, §11 |

Draft-1 does not claim Independent Definition Review PASS or Human Definition
Lock.

---

## 16. Final Draft Disposition

```text
Definition State: DRAFT / NOT LOCKED
Independent Definition Review-1: REQUIRED
Human Definition Lock: NOT AUTHORIZED
Complexity Freeze: DEFINED / NOT ACTIVATED
Authority Transition: NOT AUTHORIZED
Safety Boundary Reduction: NOT AUTHORIZED
Cross-Repo WRITE: FROZEN / INTENTIONAL HOLD
Knowledge Registry Full Materialization: DEFER
Control Plane WRITE Expansion: DEFER / NO NEW SLICES
Repository Mass Merge: NOT AUTHORIZED
Next Gate: Independent Definition Review-1 on exact Draft-1 artifact SHA
```
