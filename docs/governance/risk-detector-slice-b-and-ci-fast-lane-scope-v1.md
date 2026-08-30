# WAEP-RISK-BASED-EXECUTION-GOVERNANCE-V1 — Risk Detector Slice B and CI Fast Lane Scope V1

Status: PROPOSED / NOT LOCKED

Scope type: Implementation Scope Definition — candidate only

Primary constraint: connect merged Slice A kernel to repository execution evidence without activating unauthorized authority

## 1. Baseline

```text
Definition: WAEP-RISK-BASED-EXECUTION-GOVERNANCE-V1 (LOCKED)
Merged Slice A: PR #74 @ merge commit abc379e5018bcdf483158eb6f9ddf3750d924157
Slice A delivered:
  deterministic classifier
  FAST / GOVERNED / BLOCKED decision shape
  R1..R5 signals
  dangerous-boundary incomplete-evidence escalation
  Preliminary / Actual-Diff basis field
  compile-then-run CLI
  synthetic Vitest coverage
Slice A did not deliver:
  GitHub Actions required checks
  repository-context diff ingestion
  Fast Lane evidence persistence
  Auto Merge wiring
  Authority Transition
```

## 2. Scope Split Recommendation

Two adjacent slices are recommended instead of one mixed slice:

```text
RD-CI-SLICE-A   CI Fast Lane Connection
RD-IMPL-SLICE-B Risk Detector Repository Integration
```

Reason:

```text
CI Fast Lane Connection is repository infrastructure and check binding.
Slice B is product behavior built on the merged classifier kernel.
Mixing them increases review ambiguity and makes failure attribution harder.
```

## 3. RD-CI-SLICE-A — CI Fast Lane Connection

### 3.1 Purpose

Bind the merged Risk Detector Slice A toolchain to GitHub execution evidence so future PRs can satisfy:

```text
Required CI PASS
```

for Fast Lane candidate changes, without activating Auto Merge or Authority Transition.

### 3.2 In Scope

```text
.github/workflows/risk-detector-ci.yml
  trigger: pull_request + push to main for risk-detector paths
  steps:
    checkout
    Node 22 setup
    npm install (pinned top-level devDependencies only)
    npm run typecheck
    npm run build:risk-detector
    npm test -- tests/risk_detector/classifier.test.ts
    post-step repository mutation check

Required-check naming contract for repository settings documentation
Post-merge verification workflow or main-branch job for non-blocking full regression on main
Docs-only evidence record for exact-artifact CI PASS
Affected-path filtering limited to:
  src/risk_detector/**
  tests/risk_detector/**
  tsconfig.risk-detector.json
  package.json scripts/devDependencies directly used by risk detector
```

### 3.3 Out of Scope

```text
Auto Merge Activation
Authority Transition
branch protection mutation beyond documented required-check recommendation
full-repository regression as PR blocking gate
Deploy / LIVE WRITE
secret scanning replacement
production environment access
package-lock introduction unless separately authorized by Dependency Addition GO
```

### 3.4 Acceptance Criteria

```text
AC-CI-1: PR touching risk-detector paths receives a GitHub check run with deterministic PASS/FAIL.
AC-CI-2: main merge of Slice A paths receives post-merge PASS evidence.
AC-CI-3: workflow uses pinned top-level toolchain from package.json.
AC-CI-4: failing classifier test fails the workflow.
AC-CI-5: workflow does not mutate repository contents.
AC-CI-6: no Auto Merge or Authority Transition behavior is introduced.
```

## 4. RD-IMPL-SLICE-B — Risk Detector Repository Integration

### 4.1 Purpose

Move from synthetic-only classifier invocation to repository-context Actual-Diff classification while preserving Slice A deterministic semantics.

### 4.2 In Scope

```text
src/risk_detector/materialize.ts
  build RiskInput from:
    changed file list
    unified diff text
    optional intent text

src/risk_detector/evidence.ts
  minimal Fast Lane evidence record:
    lane
    classificationBasis
    riskSignals
    checkedAt
    sourceHeadSha (optional input)

CLI extension or sibling command:
  classify from git diff / changed-files input
  emit evidence JSON to stdout

tests/risk_detector/materialize.test.ts
tests/risk_detector/evidence.test.ts
synthetic repository-context fixtures only
documentation of Preliminary vs Actual-Diff orchestration contract
```

### 4.3 Out of Scope

```text
Auto Merge decision engine
GitHub App / webhook receiver
persistent evidence store
Human GO workflow
Execution Authority resolution
Deploy / LIVE WRITE
governed-lane additional validation runner
changes to R1..R5 rule semantics unless a separate correction gate is opened
network calls
production git operations against remote systems
```

### 4.4 Acceptance Criteria

```text
AC-B-1: Actual-Diff classification uses merged diff text as primary input when present.
AC-B-2: Preliminary classification remains available when diff is absent.
AC-B-3: repository-context fixtures produce the same lane decisions as equivalent synthetic Slice A cases.
AC-B-4: evidence output is stable, JSON-serializable, and contains no secret material from fixtures.
AC-B-5: Slice A classifier semantics remain unchanged except through explicitly authorized correction.
AC-B-6: no Auto Merge or Authority Transition behavior is introduced.
```

## 5. Recommended Gate Order

```text
1. Independent Scope Review-1 for RD-CI-SLICE-A
2. Independent Scope Review-1 for RD-IMPL-SLICE-B
3. Human Implementation Start GO per slice
4. Implement RD-CI-SLICE-A first
   reason: closes the known GitHub CI evidence gap from Slice A merge
5. Implement RD-IMPL-SLICE-B second
   reason: consumes CI-protected kernel while adding repository-context behavior
6. Independent Implementation Review / Re-Review per slice
7. Ready / Merge per slice
```

Rationale for CI first:

```text
Slice A merge left GitHub CI evidence ABSENT.
Fast Lane flow requires Required CI PASS before Ready / Auto Merge eligibility.
RD-CI-SLICE-A therefore unblocks future slices without changing classifier semantics.
```

## 6. Explicit Non-Goals

```text
This scope proposal does not authorize:
  Auto Merge Activation
  Authority Transition
  Deploy
  LIVE WRITE
  weakening governed or blocked boundaries
  replacing existing repository gates without explicit transition
```

## 7. Current Authority Boundary

```text
Slice A: MERGED
Post-Merge Verification: PASS (local)
Human Merge Authority: GO / APPLIED on PR #74
Next required human gates before implementation:
  Scope Review / Re-Review for RD-CI-SLICE-A and RD-IMPL-SLICE-B
  Implementation Start GO per approved scope
```

Next Gate: Independent Scope Review-1 for RD-CI-SLICE-A and RD-IMPL-SLICE-B.
