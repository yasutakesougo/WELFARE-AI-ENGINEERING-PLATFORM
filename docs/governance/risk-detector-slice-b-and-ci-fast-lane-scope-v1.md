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
  permissions:
    contents: read
  steps:
    checkout
    Node 22 setup
    dependency install
    npm run typecheck
    npm run build:risk-detector
    npm test -- tests/risk_detector/classifier.test.ts
    post-step repository mutation check

Required-check naming contract for repository settings documentation
Prospective post-merge verification workflow or main-branch job for future risk-detector path pushes
Docs-only evidence record for exact-artifact CI PASS
Affected-path filtering limited to:
  src/risk_detector/**
  tests/risk_detector/**
  tsconfig.risk-detector.json
  package.json scripts/devDependencies directly used by risk detector
```

Workflow authority boundary:

```text
The workflow token is read-only by explicit permissions.
No contents write, pull-request write, issue write, deployment write, package write,
or administration write permission is in scope.
Repository clean-state verification is defense-in-depth evidence and is not the sole mutation control.
```

Dependency reproducibility boundary:

```text
Current baseline has no package-lock.json.
Pinned direct devDependencies do not fully pin transitive dependency resolution.
RD-CI-SLICE-A must choose one of two implementation paths before completion:
  A. introduce a reviewed package-lock.json and use npm ci; or
  B. retain npm install and explicitly record transitive dependency reproducibility as LIMITED.
Introduction of package-lock.json is dependency metadata only and does not authorize package version changes beyond the existing package.json ranges/versions.
No dependency version upgrade is authorized by this scope.
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
dependency version upgrades
new runtime or dev dependency addition
```

### 3.4 Acceptance Criteria

```text
AC-CI-1: A future PR touching risk-detector paths receives a GitHub check run with deterministic PASS/FAIL.
AC-CI-2: A future push to main touching configured risk-detector paths receives prospective post-merge PASS/FAIL evidence.
AC-CI-3: workflow declares read-only GitHub permissions, including contents: read, with no write permission.
AC-CI-4: dependency installation is reproducible via npm ci + reviewed lockfile, or the residual transitive-resolution limitation is explicitly recorded if npm install is retained.
AC-CI-5: failing classifier test fails the workflow.
AC-CI-6: workflow does not perform repository, PR, issue, deployment, package, or administration mutation.
AC-CI-7: post-step working-tree clean verification passes and serves as defense-in-depth evidence.
AC-CI-8: no Auto Merge or Authority Transition behavior is introduced.
```

Historical boundary:

```text
RD-CI-SLICE-A does not retroactively create GitHub Actions evidence for PR #74 or merge commit abc379e5018bcdf483158eb6f9ddf3750d924157.
The recorded ABSENT CI evidence for Slice A remains historically valid.
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
   reason: closes the prospective GitHub CI evidence gap for future Risk Detector changes
5. Implement RD-IMPL-SLICE-B second
   reason: consumes CI-protected kernel while adding repository-context behavior
6. Independent Implementation Review / Re-Review per slice
7. Ready / Merge per slice
```

Rationale for CI first:

```text
Slice A merge left historical GitHub CI evidence ABSENT.
RD-CI-SLICE-A does not rewrite that history.
It establishes GitHub Actions evidence prospectively for future Risk Detector changes.
Fast Lane flow requires Required CI PASS before future Ready / Auto Merge eligibility where that policy is activated.
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
Historical GitHub Actions evidence for Slice A merge: ABSENT
Human Merge Authority: GO / APPLIED on PR #74
RD-CI-SLICE-A Implementation Start: NOT AUTHORIZED
RD-IMPL-SLICE-B Implementation Start: NOT AUTHORIZED
```

Next Gate for RD-CI-SLICE-A: Independent Scope Re-Review-1.

RD-IMPL-SLICE-B remains a separate proposed scope and is not adjudicated by the RD-CI-SLICE-A re-review.
