# Exact-Head Verification — PASS

Closes evidence gap in comment `5467832220` (`VERIFICATION EXECUTION SURFACE UNAVAILABLE`).

## Acceptance contract checklist

| # | Requirement | Result |
|---|---|---|
| 1 | `git rev-parse HEAD` = `d9cfacfedff02200d528f7c7fc14ed43cae9a499` | **PASS** |
| 2 | `npm run verify` on that exact checkout | **EXECUTED** |
| 3 | typecheck PASS | **PASS** |
| 4 | tests PASS | **PASS** (42 files / 917 tests) |
| 5 | build PASS | **PASS** |
| 6 | overall exit code 0 | **PASS** |
| 7 | raw/auditable output retained | **YES** (below + sha256) |

## Identity / environment

```text
Repository: yasutakesougo/ai-development-control-center
PR: #120
Exact HEAD: d9cfacfedff02200d528f7c7fc14ed43cae9a499
Runner: cursor-cloud bc-01a051c9-7f95-77f8-bbf3-b22607b7bedd
Node: v22.14.0
npm: 10.9.7
Executed (UTC): 2026-08-30T09:16:17Z .. 2026-08-30T09:16:33Z
Command chain:
  git clone https://github.com/yasutakesougo/ai-development-control-center.git
  git checkout d9cfacfedff02200d528f7c7fc14ed43cae9a499
  git rev-parse HEAD
  npm ci
  npm run verify
```

## `git rev-parse HEAD`

```text
d9cfacfedff02200d528f7c7fc14ed43cae9a499
```

Post-verify HEAD unchanged:

```text
d9cfacfedff02200d528f7c7fc14ed43cae9a499
```

## `npm ci` (raw)

```text

added 144 packages, and audited 145 packages in 2s

29 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

```

## `npm run verify` (raw)

```text

> ai-development-control-center@0.1.0 verify
> npm run typecheck && npm test && npm run build


> ai-development-control-center@0.1.0 typecheck
> tsc --noEmit


> ai-development-control-center@0.1.0 test
> vitest run


 RUN  v3.2.7 /tmp/pr120-verify-surface/repo

 ✓ test/independentVerify.test.ts (59 tests) 26ms
 ✓ test/draftPublish.test.ts (74 tests) 29ms
 ✓ test/publicationHandoff.test.ts (25 tests) 28ms
 ✓ test/agentTaskContract.test.ts (62 tests) 17ms
 ✓ test/multiAgentCoordination.test.ts (67 tests) 25ms
 ✓ test/actionGatewayCommentContract.test.ts (28 tests) 31ms
 ✓ test/agentRunner.test.ts (43 tests) 29ms
 ✓ test/roadmapContract.test.ts (37 tests) 30ms
 ✓ test/issueProposalContract.test.ts (36 tests) 26ms
 ✓ test/noPromptPilot.test.ts (35 tests) 21ms
 ✓ test/projectContract.test.ts (38 tests) 22ms
 ✓ test/minOrchestrator.test.ts (26 tests) 12ms
 ✓ test/agentTaskBuilder.test.ts (30 tests) 10ms
(node:11864) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 ✓ test/statusOverlayGithubObserver.test.ts (15 tests) 12ms
 ✓ test/aiWorkerRegistry.test.ts (18 tests) 21ms
 ✓ test/handoffEvaluator.test.ts (14 tests) 7ms
 ✓ test/noPromptPilotV2.test.ts (20 tests) 21ms
 ✓ test/statusOverlayGenerator.test.ts (18 tests) 7ms
 ✓ test/workerRouting.test.ts (13 tests) 27ms
 ✓ test/statusOverlayContract.test.ts (18 tests) 6ms
 ✓ test/persistentAutoRefreshDisabledMode.test.ts (16 tests) 14ms
 ✓ test/statusOverlayViewModel.test.ts (15 tests) 8ms
 ✓ test/statusOverlayRuntime.test.ts (13 tests) 10ms
 ✓ test/autoRefreshContract.test.ts (15 tests) 7ms
 ✓ test/historyContract.test.ts (11 tests) 5ms
 ✓ test/ledgerRecordsApi.test.ts (14 tests) 2048ms
   ✓ POST /api/ledger/records > identical retry with the same idempotency key returns the existing record, no duplicate  400ms
(node:12232) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 ✓ test/ledgerStore.test.ts (9 tests) 16ms
 ✓ test/portfolioMaintenanceManager.test.ts (9 tests) 5ms
 ✓ test/persistentAutoRefreshContract.test.ts (14 tests) 6ms
 ✓ test/accessJwtVerifier.test.ts (17 tests) 1968ms
 ✓ test/statusOverlayApiAuth.test.ts (6 tests) 19ms
 ✓ test/decisionFingerprint.test.ts (14 tests) 16ms
 ✓ test/ledgerAuthorizer.test.ts (12 tests) 1402ms
   ✓ requireLedgerCapability (authenticate → authorize) > DENY: unauthenticated request (no token)  313ms
 ✓ test/autoRefreshPilot.test.ts (10 tests) 10ms
 ✓ test/ledgerSubmission.test.ts (14 tests) 8ms
 ✓ test/architectureSnapshot.test.ts (7 tests) 9ms
 ✓ test/humanActionResolver.test.ts (11 tests) 3ms
 ✓ test/approvalIntent.test.ts (11 tests) 4ms
 ✓ test/selectAuthoritativePullBody.test.ts (4 tests) 3ms
 ✓ test/pilot/cross-repo-control-center-v1/kernel.test.ts (6 tests) 3ms
 ✓ test/normalizeCi.test.ts (8 tests) 3ms
 ✓ test/humanDecisionEvidence.test.ts (5 tests) 3ms

 Test Files  42 passed (42)
      Tests  917 passed (917)
   Start at  09:16:26
   Duration  4.60s (transform 857ms, setup 0ms, collect 1.81s, tests 5.98s, environment 5ms, prepare 2.14s)


> ai-development-control-center@0.1.0 build
> vite build

vite v7.3.6 building ai_development_control_center environment for production...
transforming...
✓ 79 modules transformed.
rendering chunks...
dist/ai_development_control_center/.vite/manifest.json   0.16 kB
dist/ai_development_control_center/wrangler.json         1.34 kB
dist/ai_development_control_center/index.js             97.27 kB
✓ built in 231ms
vite v7.3.6 building client environment for production...
transforming...
✓ 38 modules transformed.
rendering chunks...
computing gzip size...
dist/client/.assetsignore                0.02 kB
dist/client/index.html                   0.46 kB │ gzip:  0.30 kB
dist/client/assets/index-B_OiJpPm.css    6.86 kB │ gzip:  1.73 kB
dist/client/assets/index-BpbrbWum.js   218.37 kB │ gzip: 67.58 kB
✓ built in 561ms

```

## Integrity

```text
db0f32e14f02f97280f6a8934a89fc3ead4057380e5ed0a49e1310352ef317d5  npm-ci.log
234804d6efff6272f48ad8df67b90ea8e01404dea7dcc6833214a8d3ebcaa97d  npm-verify.log
598abda78f8ad0ca1a6f1b475ed817f49c7bff3d76f8054064b2b8f2fb9d39b6  clone.log
9c0bc03ec1fb7ebd6db269acd3c80cbce9168dd057052d2023b5bc0584abedcd  checkout.log
4c73fdc4af5ae55ff5d8f80aeb030ba0b90621d366aa0258fea280bbc48cf73a  run-meta.txt

```

## Gate implication

```text
Executable verification evidence: PASS / AVAILABLE
Independent Implementation Re-Review: ELIGIBLE TO RE-RUN
Human Ready: pending reassessment (NOT GRANTED by this comment alone)
Ready transition: NOT AUTHORIZED / NOT EXECUTED
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
LIVE WRITE: NOT AUTHORIZED
```
