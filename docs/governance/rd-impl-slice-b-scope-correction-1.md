# RD-IMPL-SLICE-B — Implementation Scope Correction-1

Status: CORRECTION-1 / NORMATIVE AMENDMENT

Parent scope:
`docs/governance/risk-detector-slice-b-and-ci-fast-lane-scope-v1.md`

Review basis:
`docs/governance/reviews/rd-impl-slice-b-independent-scope-review-1.md`

This correction narrows and fixes RD-IMPL-SLICE-B only. It does not alter the locked Risk Detector R1..R5 semantics and grants no implementation, Ready, Merge, Deploy, or LIVE WRITE authority.

## C1-1 — Deterministic Actual-Diff input modes

The implementation MUST accept only these classification materialization modes:

```text
REPOSITORY_COMMIT_RANGE
  exact baseSha: required, full Git commit SHA
  exact headSha: required, full Git commit SHA
  changedFiles: derived from that exact immutable range
  diff: derived from that exact immutable range
  classificationBasis: ACTUAL_DIFF

SUPPLIED_IMMUTABLE_DIFF
  changedFiles: supplied as part of the same immutable input artifact
  diff: supplied as part of the same immutable input artifact
  repository base/head identity: absent unless independently fixed by the caller
  classificationBasis: ACTUAL_DIFF

PRELIMINARY_INPUT
  changedFiles and/or intent may be supplied
  diff: absent
  classificationBasis: PRELIMINARY
```

A dirty working tree, staged index, unstaged changes, merge-conflict state, or implicit `HEAD` range MUST NOT be silently represented as authoritative `ACTUAL_DIFF` repository evidence.

No arbitrary shell command string is accepted. Git invocation, if used, is implementation-owned with fixed argument construction and no shell interpolation.

## C1-2 — Completeness, binary, truncation, and size semantics

Materialization MUST expose an explicit completeness result to the existing Slice A input contract.

```text
evidenceComplete=true
  only when all requested changed-file identity and diff material was obtained without truncation or unresolved binary/unsupported content.

evidenceComplete=false
  when any requested material is missing, ambiguous, truncated, unsupported, exceeds deterministic limits, or cannot be proven complete.
```

Deterministic limits MUST be constants covered by tests. At minimum the implementation must bound:

```text
changed file count
aggregate diff byte/character size
per-file material considered for classification
```

Binary or oversized changes may be represented by bounded metadata for classification, but MUST NOT be silently treated as complete textual diff evidence.

When `evidenceComplete=false`, Slice A dangerous-boundary incomplete-evidence escalation semantics MUST be preserved. Materialization MUST NOT manufacture FAST eligibility by dropping unavailable evidence.

## C1-3 — Evidence output data boundary

`src/risk_detector/evidence.ts` produces summary evidence only.

Allowed evidence fields are limited to deterministic decision/provenance metadata such as:

```text
schemaVersion
lane
classificationBasis
riskSignals
humanGateRequired
blocked
evidenceComplete
checkedAt
sourceIdentity (when applicable)
```

Evidence output MUST NOT include:

```text
raw unified diff
raw source-file contents
raw intent text
credentials, tokens, secrets, or environment values
unbounded command output
```

`RiskSignal.evidence` remains bounded classifier-generated explanatory evidence and MUST NOT be populated by copying arbitrary raw diff/source payload.

This slice does not create a persistent evidence store. JSON stdout is an ephemeral output interface only; downstream persistence requires separate scope/authority.

## C1-4 — Source identity and timestamp authority

For `REPOSITORY_COMMIT_RANGE` Actual-Diff evidence, repository provenance MUST contain both exact immutable identities:

```text
baseSha
headSha
```

A lone optional `sourceHeadSha` is insufficient for repository-backed Actual-Diff evidence and MUST NOT be used as the sole provenance identity.

For `SUPPLIED_IMMUTABLE_DIFF` or `PRELIMINARY_INPUT`, repository source identity is absent unless independently supplied and validated by the caller; absence MUST NOT be represented as verified repository provenance.

`checkedAt` is observational metadata only:

```text
checkedAt != source freshness proof
checkedAt != Execution Authority
checkedAt != Ready authority
checkedAt != Merge authority
```

Risk classification evidence is not an authority grant.

## Corrected Acceptance Criteria

The parent AC-B-1..AC-B-6 remain and the following are added:

```text
AC-B-7: repository-backed ACTUAL_DIFF is bound to exact baseSha + headSha.
AC-B-8: dirty/index/implicit repository state is never silently promoted to authoritative ACTUAL_DIFF.
AC-B-9: incomplete, binary, unsupported, oversized, or truncated material sets evidenceComplete=false unless completeness is otherwise deterministically proven.
AC-B-10: deterministic materialization limits are constants and test-covered.
AC-B-11: summary evidence contains no raw diff, raw source content, raw intent, credential, token, secret, or environment payload.
AC-B-12: checkedAt and risk evidence are explicitly non-authoritative for execution/Ready/Merge decisions.
AC-B-13: no arbitrary shell command input or shell interpolation is introduced.
```

## Authority Boundary

```text
Scope Correction-1: DOCUMENTED
Implementation Start: NOT AUTHORIZED BY THIS CORRECTION
Repository Implementation Mutation: NOT AUTHORIZED
Auto Merge Activation: NOT AUTHORIZED
Authority Transition: NOT AUTHORIZED
Deploy / LIVE WRITE: NOT AUTHORIZED
```

Next Gate: Independent Scope Re-Review-1.
