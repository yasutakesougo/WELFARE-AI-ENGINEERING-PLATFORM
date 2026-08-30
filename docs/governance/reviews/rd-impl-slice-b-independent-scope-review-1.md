# RD-IMPL-SLICE-B — Independent Scope Review-1

```text
Review Date: 2026-08-30 JST
Target: docs/governance/risk-detector-slice-b-and-ci-fast-lane-scope-v1.md
Target Blob: 9560569bd3763780362acb32df8f1f1065e1b545
Baseline Main: 2ba7471e2f2a65982ded25fd7c559d59c27cc327
Verdict: CORRECTION REQUIRED
P0 / P1 / P2: 0 / 4 / 0
Implementation Start: NOT AUTHORIZED
Repository Implementation Mutation: NOT AUTHORIZED BY THIS REVIEW
```

## Findings

### P1-1 — Actual-Diff source identity is not deterministic

The scope permits classification from `git diff / changed-files input`, but does not fix which repository state is authoritative (working tree, index, commit range, or externally supplied artifact), nor how a commit range is bound to exact SHAs. Two agents can therefore classify different material while both claiming `ACTUAL_DIFF`.

Required correction: define closed input modes and exact identity rules. Repository-backed Actual-Diff must use an explicit base SHA + head SHA (or an exact immutable supplied diff artifact). Dirty/unresolved working-tree state must not be silently promoted to authoritative Actual-Diff evidence.

### P1-2 — Incomplete, binary, oversized, or truncated diff semantics are undefined

The scope does not define behavior when the materialized diff is incomplete, binary, unavailable, truncated, or exceeds an input limit. Because missing dangerous evidence can incorrectly produce FAST, this must fail closed at the classification boundary.

Required correction: define completeness metadata and deterministic size limits. Incomplete/unknown materialization must set `evidenceComplete=false`; dangerous-boundary uncertainty must preserve Slice A escalation semantics rather than silently classify FAST.

### P1-3 — Evidence payload boundary does not prohibit source/diff retention

`evidence.ts` is described as a minimal record, but the scope only requires synthetic fixtures to contain no secret material. It does not explicitly prohibit raw unified diff, intent text, source snippets, credentials, or secret-like values from being copied into persisted/logged evidence output.

Required correction: evidence output must be summary-only and must not contain raw diff/intent/source payload. RiskSignal evidence must remain bounded classifier evidence, and the implementation must not introduce a persistent evidence store.

### P1-4 — `sourceHeadSha` is optional without authority semantics

An optional `sourceHeadSha` can create misleading provenance: evidence may appear repository-bound while not proving which base/head produced the diff. `checkedAt` similarly risks being treated as freshness authority.

Required correction: for repository-backed Actual-Diff, require exact `baseSha` + `headSha` identity in the materialization/evidence contract; for externally supplied/preliminary input, identity must be explicitly absent/non-authoritative. `checkedAt` is observational metadata only and grants no freshness or execution authority.

## Retained boundaries

```text
Auto Merge: OUT OF SCOPE
Authority Transition: OUT OF SCOPE
Execution Authority resolution: OUT OF SCOPE
Network calls: OUT OF SCOPE
Production remote git operations: OUT OF SCOPE
Deploy / LIVE WRITE: OUT OF SCOPE
R1..R5 semantic changes: OUT OF SCOPE absent separate correction
```

## Next Gate

```text
RD-IMPL-SLICE-B Scope Correction-1
-> Independent Scope Re-Review-1
-> only if PASS, separate Human Implementation Start GO / HOLD
```
