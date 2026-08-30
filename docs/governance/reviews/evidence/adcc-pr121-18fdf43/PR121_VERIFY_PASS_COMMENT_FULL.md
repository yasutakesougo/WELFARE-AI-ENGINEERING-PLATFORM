# Exact-Head Verification — PASS

Closes evidence gap from Independent Implementation Review-1 `5060484310`
(`HOLD — EXACT-HEAD EXECUTABLE VERIFICATION EVIDENCE REQUIRED`).

## Acceptance checklist

| # | Requirement | Result |
|---|---|---|
| 1 | `git rev-parse HEAD` = `18fdf436c21377cac25969bd0134ebc1b5845965` | **PASS** |
| 2 | `npm run verify` on that exact checkout | **EXECUTED** |
| 3 | typecheck PASS | **PASS** |
| 4 | tests PASS | **PASS** (42 files / 921 tests) |
| 5 | build PASS | **PASS** |
| 6 | overall exit code 0 | **PASS** |
| 7 | raw/auditable output retained | **YES** (below + sha256) |

## Identity / environment

```text
Repository: yasutakesougo/ai-development-control-center
PR: #121
Exact HEAD: 18fdf436c21377cac25969bd0134ebc1b5845965
Base: 3b54fcdf65c6e4d2278906505fc53d3f9e871213
Runner: cursor-cloud bc-01a051c9-7f95-77f8-bbf3-b22607b7bedd
Node: v22.14.0
npm: 10.9.7
Executed (UTC): 2026-08-30T09:54:38Z .. 2026-08-30T09:54:53Z
Command chain:
  git clone https://github.com/yasutakesougo/ai-development-control-center.git
  git checkout 18fdf436c21377cac25969bd0134ebc1b5845965
  git rev-parse HEAD
  npm ci
  npm run verify
```

## run-meta

```text
start_utc=2026-08-30T09:54:38Z
node=v22.14.0
npm=10.9.7
runner=cursor-cloud bc-01a051c9-7f95-77f8-bbf3-b22607b7bedd
target_head=18fdf436c21377cac25969bd0134ebc1b5845965
revparse=18fdf436c21377cac25969bd0134ebc1b5845965
verify_exit=0
post_revparse=18fdf436c21377cac25969bd0134ebc1b5845965
end_utc=2026-08-30T09:54:53Z

```

## `git rev-parse HEAD`

```text
18fdf436c21377cac25969bd0134ebc1b5845965
```

Post-verify HEAD unchanged:

```text
18fdf436c21377cac25969bd0134ebc1b5845965
```

## `npm ci` (raw)

```text

added 144 packages, and audited 145 packages in 3s

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


 RUN  v3.2.7 /tmp/pr121-verify-surface/repo

 ✓ test/independentVerify.test.ts (59 tests) 28ms
 ✓ test/draftPublish.test.ts (74 tests) 31ms
 ✓ test/publicationHandoff.test.ts (25 tests) 29ms
 ✓ test/actionGatewayCommentContract.test.ts (28 tests) 27ms
 ✓ test/multiAgentCoordination.test.ts (67 tests) 19ms
 ✓ test/agentTaskContract.test.ts (62 tests) 19ms
 ✓ test/agentRunner.test.ts (43 tests) 25ms
 ✓ test/roadmapContract.test.ts (37 tests) 30ms
 ✓ test/issueProposalContract.test.ts (36 tests) 25ms
 ✓ test/projectContract.test.ts (38 tests) 26ms
 ✓ test/minOrchestrator.test.ts (26 tests) 12ms
 ✓ test/noPromptPilot.test.ts (35 tests) 21ms
 ✓ test/agentTaskBuilder.test.ts (30 tests) 12ms
(node:13516) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 ✓ test/statusOverlayGithubObserver.test.ts (15 tests) 12ms
 ✓ test/aiWorkerRegistry.test.ts (18 tests) 29ms
 ✓ test/handoffEvaluator.test.ts (14 tests) 7ms
 ✓ test/statusOverlayGenerator.test.ts (18 tests) 10ms
 ✓ test/noPromptPilotV2.test.ts (20 tests) 21ms
 ✓ test/statusOverlayContract.test.ts (18 tests) 6ms
 ✓ test/workerRouting.test.ts (13 tests) 23ms
 ✓ test/persistentAutoRefreshDisabledMode.test.ts (16 tests) 16ms
 ✓ test/portfolioMaintenanceManager.test.ts (13 tests) 16ms
 ✓ test/statusOverlayViewModel.test.ts (15 tests) 8ms
 ✓ test/statusOverlayRuntime.test.ts (13 tests) 10ms
 ✓ test/autoRefreshContract.test.ts (15 tests) 5ms
 ✓ test/historyContract.test.ts (11 tests) 5ms
 ✓ test/ledgerRecordsApi.test.ts (14 tests) 2002ms
   ✓ POST /api/ledger/records > 409 STALE_DECISION when the expected fingerprint no longer matches; nothing recorded  313ms
(node:13907) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 ✓ test/ledgerStore.test.ts (9 tests) 17ms
 ✓ test/persistentAutoRefreshContract.test.ts (14 tests) 6ms
 ✓ test/statusOverlayApiAuth.test.ts (6 tests) 17ms
 ✓ test/decisionFingerprint.test.ts (14 tests) 16ms
 ✓ test/ledgerAuthorizer.test.ts (12 tests) 1257ms
 ✓ test/autoRefreshPilot.test.ts (10 tests) 9ms
 ✓ test/ledgerSubmission.test.ts (14 tests) 6ms
 ✓ test/architectureSnapshot.test.ts (7 tests) 8ms
 ✓ test/humanActionResolver.test.ts (11 tests) 3ms
 ✓ test/approvalIntent.test.ts (11 tests) 4ms
 ✓ test/accessJwtVerifier.test.ts (17 tests) 2287ms
   ✓ verifyAccessHumanJwt > denies an invalid signature  551ms
 ✓ test/selectAuthoritativePullBody.test.ts (4 tests) 3ms
 ✓ test/pilot/cross-repo-control-center-v1/kernel.test.ts (6 tests) 3ms
 ✓ test/normalizeCi.test.ts (8 tests) 5ms
 ✓ test/humanDecisionEvidence.test.ts (5 tests) 3ms

 Test Files  42 passed (42)
      Tests  921 passed (921)
   Start at  09:54:46
   Duration  4.73s (transform 880ms, setup 0ms, collect 1.90s, tests 6.12s, environment 5ms, prepare 2.24s)


> ai-development-control-center@0.1.0 build
> vite build

vite v7.3.6 building ai_development_control_center environment for production...
transforming...
✓ 79 modules transformed.
rendering chunks...
dist/ai_development_control_center/.vite/manifest.json   0.16 kB
dist/ai_development_control_center/wrangler.json         1.34 kB
dist/ai_development_control_center/index.js             97.27 kB
✓ built in 234ms
vite v7.3.6 building client environment for production...
transforming...
✓ 38 modules transformed.
rendering chunks...
computing gzip size...
dist/client/.assetsignore                0.02 kB
dist/client/index.html                   0.46 kB │ gzip:  0.30 kB
dist/client/assets/index-B_OiJpPm.css    6.86 kB │ gzip:  1.73 kB
dist/client/assets/index-BpbrbWum.js   218.37 kB │ gzip: 67.58 kB
✓ built in 531ms

```

## Integrity

```text
7241550da8956f0e4e98de7c99b0166d94d83599510ac297243b9131fc8dbe85  npm-ci.log
c2f3f781ee708596ed59567d1e5b5f5ba0b62beab7b2c16a955c4747b3e9bb9e  npm-verify.log
598abda78f8ad0ca1a6f1b475ed817f49c7bff3d76f8054064b2b8f2fb9d39b6  clone.log
627766b1df12c53dde46d9a29472805bbc080a2228cc20699659404ce8ac994f  checkout.log
57fa3ba63ca8fd97fb3fe2033fcd646a318a1e0b094af792d57c5ea2d4912688  run-meta.txt

```

## Gate implication

```text
Executable verification evidence: PASS / AVAILABLE
Independent Implementation Re-Review: ELIGIBLE TO RE-RUN
Human Ready: NOT GRANTED by this evidence alone
Ready transition: NOT AUTHORIZED / NOT EXECUTED
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
LIVE WRITE: NOT AUTHORIZED
```
