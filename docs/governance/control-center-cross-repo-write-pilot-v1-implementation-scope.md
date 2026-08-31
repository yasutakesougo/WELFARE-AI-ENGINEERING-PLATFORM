# CONTROL-CENTER-CROSS-REPO-WRITE-PILOT-V1 — Implementation Scope Definition

## Status

```text
Artifact: CONTROL-CENTER-CROSS-REPO-WRITE-PILOT-V1 Implementation Scope Definition
Definition baseline commit: 3b29a50c61398cbf9016b4205cd4af63a26f592a
Definition baseline blob: 8b9516899c6d2126a04e07be4d1d91bd6b06b802
Human Definition Lock: GO
Target implementation repository: yasutakesougo/ai-development-control-center
Target implementation baseline: 7985df87e09075e36af2b3af5f3446e742044004
Implementation Start: NOT AUTHORIZED
Cross-Repository WRITE execution: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: Independent Scope Review-1
```

## 1. Objective

Implement the locked V1 pilot contract inside the existing ADCC Cross-Repo Control Center pilot surface without creating a new runtime subsystem.

The implementation must make the future Draft-PR-only WRITE path mechanically fail-closed, while keeping runtime invocation disabled until a separate Human WRITE authority exists.

## 2. Existing implementation surface to extend

Existing ADCC baseline already contains:

```text
src/pilot/cross-repo-control-center-v1/types.ts
src/pilot/cross-repo-control-center-v1/kernel.ts
test/pilot/cross-repo-control-center-v1/kernel.test.ts
docs/pilot/cross-repo-control-center-v1/README.md
```

Current Slice A remains planning/evidence only and emits `authorizesMutation=false`.

This scope extends that surface rather than replacing it.

## 3. Concrete PEP placement

The Control Center policy-enforcement point for this pilot SHALL live under:

```text
src/pilot/cross-repo-control-center-v1/
```

Authorized implementation files:

```text
src/pilot/cross-repo-control-center-v1/types.ts
src/pilot/cross-repo-control-center-v1/kernel.ts
src/pilot/cross-repo-control-center-v1/executionPolicy.ts        (new)
src/pilot/cross-repo-control-center-v1/githubWritePort.ts        (new)
src/pilot/cross-repo-control-center-v1/leaseStore.ts             (new)
test/pilot/cross-repo-control-center-v1/kernel.test.ts
test/pilot/cross-repo-control-center-v1/executionPolicy.test.ts  (new)
test/pilot/cross-repo-control-center-v1/leaseStore.test.ts       (new)
docs/pilot/cross-repo-control-center-v1/README.md
migrations/0002_cross_repo_write_pilot_state.sql                    (new)
```

No other source/config/workflow/package/deploy file is in scope.

## 4. Scope A — deterministic execution-policy contract

Implement pure deterministic validation/evaluation for:

- `DRAFT_PR_WRITE_AUTHORITY`
- `RETRY_AUTHORITY`
- `ROLLBACK_AUTHORITY`
- `RECONCILE_AUTHORITY`
- exact `repository + ref + expected_sha` binding
- Human-GO identity / operation-class binding
- repository-safety PASS evidence binding
- capability snapshot identity
- required `diff_policy`
- default-deny operation allowlist / denylist
- decision classes required by the locked Definition

Required invariant:

```text
policy evaluation PASS
  != GitHub mutation execution
```

The evaluator returns an immutable decision/evidence envelope only.

## 5. Scope B — GitHub WRITE port boundary

`githubWritePort.ts` SHALL define a narrow adapter interface only for the V1 Draft-PR mutation surface:

Allowable adapter operations:

```text
read ref / commit / compare / PR state
create uniquely named non-default working branch from expected SHA
apply allowlisted file mutations to that working branch using expected-OID semantics
create one Draft PR
```

The port MUST NOT expose:

```text
mark ready
merge / auto-merge
force push
protected/default-branch direct mutation
branch-protection / ruleset mutation
repository settings / permissions / collaborators / secrets mutation
workflow permission mutation
deploy / environment approval / LIVE WRITE
```

Implementation may provide contract/types and a test fake. A live GitHub credential-backed invocation path MUST remain disabled by default and MUST NOT be called by production/staging routes under this Implementation Start gate.

## 6. Scope C — shared lease/effect store binding

The concrete V1 shared store is the existing **staging-only Cloudflare D1 binding `LEDGER_DB`** already present in ADCC staging configuration.

`migrations/0002_cross_repo_write_pilot_state.sql` may add isolated tables for this pilot only, e.g.:

```text
cross_repo_write_lease
cross_repo_write_effect
```

Required semantics:

- `logical_mutation_id` unique identity
- owner identity
- monotonically increasing fence token
- lease expiry
- attempt generation
- exact target binding digest
- effect state: APPLIED / NOT_APPLIED / UNKNOWN / CONFLICT
- reconciliation evidence reference
- compare-and-set / transaction semantics sufficient to reject stale owner/fence writes

The migration MUST NOT alter `0001_approval_ledger.sql` tables or production configuration.

Production has no D1 binding in the observed baseline and remains out of scope.

## 7. No new dependency / deployment scope

Implementation SHALL use existing repository dependencies only.

Not authorized:

```text
package.json dependency addition
package-lock mutation for dependency changes
wrangler production binding changes
new production database
staging deployment
production deployment
secret issuance
GitHub App installation/token provisioning
```

The migration file is code/configuration evidence only until a separate migration/deploy authority exists.

## 8. Credential boundary

Implementation may define credential-capability input contracts, but MUST NOT mint or store real GitHub App tokens.

Required inputs must model:

```text
installation identity
repository allowlist identity
permission set
expiry
non-admin / non-bypass evidence reference
```

Raw credentials are prohibited from logs/tests/evidence fixtures.

## 9. Runtime invocation boundary

All external mutation invocation remains disabled.

Implementation MUST preserve a mechanically testable capability flag or equivalent invariant demonstrating:

```text
liveGitHubWriteInvocationEnabled = false
markReadyEnabled = false
mergeEnabled = false
deployEnabled = false
liveWriteEnabled = false
```

No Worker route may newly invoke the WRITE port in this scope.

## 10. Required tests

At minimum, tests must prove:

1. no initial mutation without `DRAFT_PR_WRITE_AUTHORITY`
2. RETRY cannot authorize the first mutation
3. repository safety UNKNOWN/failed/stale => NOT ELIGIBLE
4. repo/ref/SHA mismatch => fail-closed
5. operation outside allowlist => DENY
6. mark-ready/merge/default-branch/force/protection/settings/deploy operations => DENY
7. missing/invalid `diff_policy` => HOLD/DENY
8. stale/missing lease or fence => reject
9. duplicate after APPLIED => `DUPLICATE_MUTATION_PROHIBITED`
10. UNKNOWN effect => reconciliation required before retry
11. target repo/path widening => DENY
12. fake GitHub port cannot invoke forbidden methods because they are absent from the interface
13. migration/store rejects stale fence update
14. live invocation capability remains false
15. existing CRCCP Slice A planning behavior remains compatible

Repository-wide `npm run verify` is required on the exact implementation HEAD before Independent Implementation Review can PASS.

## 11. Exact implementation baseline and drift rule

Implementation must start from a freshly re-read ADCC `main` immediately before source mutation.

Current observed design baseline for scope analysis:

```text
7985df87e09075e36af2b3af5f3446e742044004
```

If `main` changes before Human Implementation Start, the scope requires a fresh baseline reconciliation. Do not silently reuse the old SHA.

## 12. Explicit out of scope

- actual Cross-Repo WRITE execution
- real GitHub App token minting
- target `severe-behavior-support-spfx` mutation
- Draft PR publication by runtime
- Ready / Merge automation
- branch protection mutation
- Stage 2 required checks
- production D1 binding or migration
- deployment
- LIVE WRITE
- multi-repository simultaneous writes
- automatic retry/fallback
- new distributed lock subsystem outside existing D1-backed lease/effect semantics

## 13. Exit

Implementation Scope is complete only if Independent Scope Review confirms:

- concrete PEP placement fixed
- shared lease/effect store fixed to staging-only D1 for V1
- exact authorized file surface fixed
- live invocation remains disabled
- no authority expansion
- negative tests are sufficient

```text
Implementation Scope Review PASS
  != Human Implementation Start GO
Human Implementation Start GO
  != Cross-Repo WRITE execution
```
