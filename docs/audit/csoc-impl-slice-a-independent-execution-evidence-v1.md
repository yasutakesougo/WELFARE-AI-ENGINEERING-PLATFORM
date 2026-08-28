# CSOC-IMPL-SLICE-A Independent Exact-Artifact Execution Evidence V1

## Evidence Status

```text
Evidence ID: CSOC-IMPL-INDEPENDENT-EXECUTION-EVIDENCE-V1
Evidence Date: 2026-08-29 JST
Target PR: #32
Target Commit: 56e228ecbb8c3b35ec78effb500f17ad9e096c95
Target Package Tree: 9671c3bce237efa444d1c5e7e462182d2e506583
Verifier PR: #33
Verifier Workflow Run ID: 33219567865
Verifier Job ID: 99010578646
Workflow: CSOC Independent Exact Artifact Verification
Workflow Conclusion: SUCCESS
Independent Execution Evidence: ESTABLISHED
Repository Mutation During Verification: NONE
```

## Verification Environment

```text
Runner: GitHub-hosted
OS: Ubuntu 24.04.4 LTS
Runner Image: ubuntu-24.04
Runner Version: 2.336.0
Git: 2.55.0
Node: v22.23.2
npm: 10.9.8
```

The verifier used a fresh GitHub-hosted runner.

The verifier branch contains only the verification workflow and is not the implementation branch.

## Exact Identity Verification

The workflow explicitly checked out:

```text
56e228ecbb8c3b35ec78effb500f17ad9e096c95
```

and asserted:

```text
git rev-parse HEAD
= 56e228ecbb8c3b35ec78effb500f17ad9e096c95

git rev-parse HEAD:packages/current-state-observation-kernel
= 9671c3bce237efa444d1c5e7e462182d2e506583
```

Both assertions passed.

## Dependency Restore

```text
Command:
npm ci

Working Directory:
packages/current-state-observation-kernel

Result:
PASS

Packages Added:
53

Audit:
54 packages audited
0 vulnerabilities reported by npm in this run
```

Dependency restore success is verification-environment evidence only.

It does not authorize dependency addition to another runtime or production environment.

## Test Verification

```text
Command:
npm test

Runner:
vitest v3.2.7

Test Files:
3 passed / 3

Tests:
69 passed / 69

Breakdown:
test/c2-c5.behavior.test.ts: 51 passed
test/c1-observation.behavior.test.ts: 17 passed
test/c6-governance.traceability.test.ts: 1 passed

Exit Result:
PASS
```

## Typecheck Verification

```text
Command:
npm run typecheck

Resolved Command:
tsc --noEmit

Exit Result:
PASS
```

## Mutation Check

Before executable verification, the workflow asserted a clean repository state.

After dependency restore, tests, and typecheck, the workflow asserted:

```text
git status --porcelain
= empty

repository_mutation=NONE
```

Result:

```text
PASS
```

## Independent Evidence Boundary

This evidence closes only the previously missing independent executable verification requirement for the tested exact artifact.

```text
Independent Execution PASS
  != Ready GO
  != Merge GO
  != Deploy GO
  != Runtime Activation GO
  != External Mutation Authority
```

## Evidence Conclusion

```text
CSOC-IMPL-INDEPENDENT-EXECUTION-EVIDENCE-001:
CLOSABLE

Exact Artifact Identity:
PASS

Fresh Independent Runner:
PASS

npm ci:
PASS

69 / 69 tests:
PASS

tsc --noEmit:
PASS

Repository Mutation:
NONE
```
