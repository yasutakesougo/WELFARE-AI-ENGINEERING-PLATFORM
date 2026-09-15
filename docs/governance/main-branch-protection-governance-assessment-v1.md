# WAEP-MAIN-BRANCH-PROTECTION-GOVERNANCE-V1

## Assessment Status

```text
Mode: GOVERNANCE ASSESSMENT ONLY
Observed Main: eeb126644df5238d61990f5767ec47880810f663
Main Protected: false
Required Status Checks Enforcement: off
Required Status Checks: none
Main .github/workflows: none observed
Repository Rulesets API: 403 / unavailable under current repository-plan conditions
Branch Protection Mutation: NOT AUTHORIZED BY THIS ASSESSMENT
```

## Risk Statement

Current `main` accepts merges without repository-enforced required checks or branch protection.

This creates a governance gap between WAEP's Human Gate model and GitHub's technical enforcement layer.

The observed PR #50 sequence demonstrates why the gap matters: the PR merged and a later automated review raised additional findings. This assessment does not claim branch protection alone would have prevented those findings, but the repository currently has no enforced mechanism that requires a stable verification check before merge.

```text
Human Gate Policy without repository enforcement
!= repository-enforced merge safety
```

## Constraints

1. The repository currently has no persistent workflow on `main` under `.github/workflows/`.
2. Therefore enabling required status checks now would require inventing a check name that does not yet exist or could block all merges.
3. The repository appears to use a single primary human maintainer plus automated agents/connectors. Requiring one independent approving GitHub review immediately may be operationally impossible or may create a self-review loophole.
4. Repository rulesets are not currently available through the observed API/plan path. Classic branch protection is therefore the practical enforcement candidate if/when separately authorized.
5. Branch protection configuration is governance mutation and requires an explicit Human Governance GO / HOLD decision.

## Recommended Two-Stage Policy

### Stage 1 — Immediate Protection Baseline

Apply only after explicit Human Governance GO.

Recommended classic branch-protection intent:

```text
Require pull request before merging: YES
Required approving reviews: 0 initially
Require conversation resolution before merge: YES
Allow force pushes: NO
Allow deletions: NO
Require linear history: OPTIONAL / HOLD until merge-method policy is fixed
Require signed commits: OPTIONAL / HOLD
Require status checks: NO at Stage 1
Enforce administrators: YES unless an explicit emergency-bypass policy is separately defined
```

Rationale:

- blocks accidental direct-main mutation while preserving a workable single-maintainer flow;
- does not create a deadlock by requiring a nonexistent CI check;
- does not pretend that GitHub approval count is equivalent to WAEP Human Gate evidence;
- leaves merge authorization in the WAEP governance layer while adding repository-level friction against bypass.

### Stage 2 — CI-Enforced Protection

Stage 2 must not be enabled until stable persistent CI exists on `main` and its check names are proven across multiple PRs.

Minimum persistent CI candidate:

```text
WAEP Core Verification
- Python durable_run_kernel tests
- Python security_boundary tests
- repository integrity / syntax checks
```

Additional checks should be added only when their relevant implementation is canonical on `main`:

```text
CSOC package test + typecheck
Learning Slice A test + typecheck
other package-specific deterministic checks
```

After the stable workflow is established and observed:

```text
Require status checks: YES
Require branch to be up to date before merging: YES / evaluate merge queue compatibility
Required check names: exact observed stable names only
```

Do not require ephemeral verifier-workflow names from temporary closed PRs.

## Human Review Policy

A future move from `required approving reviews = 0` to `1` should occur only after one of the following is operationally true:

```text
A. a second authorized human reviewer exists
or
B. a defined independent review role is mapped to a GitHub reviewer workflow that cannot self-authorize Human gates
```

Automated review PASS can be supporting Evidence but is not a Human Merge GO.

```text
Automated Review PASS != Human Merge GO
GitHub Approval != WAEP Authority unless explicitly mapped by contract
```

## Emergency / Break-Glass Boundary

No emergency bypass is created by this assessment.

If a future bypass is needed, it must be separately defined with:

```text
explicit actor eligibility
reason code
incident/reference ID
post-action audit requirement
time-bounded use
no silent bypass
```

## Decision Matrix

| Control | Current | Stage 1 Recommendation | Stage 2 Recommendation |
| --- | --- | --- | --- |
| Protected main | OFF | ON | ON |
| PR required | NO enforcement | YES | YES |
| Required approvals | 0 | 0 | 0 or 1 after reviewer model exists |
| Conversation resolution | NO enforcement | YES | YES |
| Force push | not protection-blocked | DENY | DENY |
| Branch deletion | not protection-blocked | DENY | DENY |
| Required checks | NONE | NONE | stable exact checks only |
| Up-to-date branch | NO enforcement | not required initially | YES if compatible |
| Ruleset | unavailable observed | not relied upon | re-evaluate plan/API |

## Recommended Current Verdict

```text
Governance Assessment: COMPLETE
Risk: CONFIRMED
Immediate Branch Protection Mutation: HOLD / REQUIRES HUMAN GOVERNANCE GO
Recommended Stage 1: GO-ELIGIBLE
Recommended Stage 2: NOT YET ELIGIBLE
Reason: persistent main CI does not yet exist
```

## Next Gates

```text
Gate A:
WAEP-MAIN-BRANCH-PROTECTION-GOVERNANCE-V1
Human Governance GO / HOLD for Stage 1

Gate B, later:
Persistent Main CI Definition / Implementation / Verification

Gate C, later:
Stage 2 Required-Checks Governance GO / HOLD
```

## Authority Boundary

```text
Assessment COMPLETE != Branch Protection GO
Stage 1 GO != Stage 2 GO
CI PASS != Human Merge GO
Branch Protection != Deploy Authority
```
