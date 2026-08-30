# Exact-Head Verification — PASS

Closes evidence gap from Independent Implementation Re-Review-1
(`CONTENT PASS / VERIFICATION HOLD` — exact-head `npm run verify` REQUIRED).

## Acceptance checklist

| # | Requirement | Result |
|---|---|---|
| 1 | `git rev-parse HEAD` = `8bded4750841c803315e37d7ef49d99e12c75b63` | **PASS** |
| 2 | `npm run verify` on that exact checkout | **EXECUTED** |
| 3 | typecheck PASS | **PASS** |
| 4 | tests PASS | **PASS** (43 files / 937 tests) |
| 5 | build PASS | **PASS** |
| 6 | overall exit code 0 | **PASS** |
| 7 | raw/auditable output retained | **YES** (below + sha256) |

## Identity / environment

```text
Repository: yasutakesougo/ai-development-control-center
PR: #122
Mission: CONTROL-CENTER-CROSS-REPO-WRITE-PILOT-V1
Exact HEAD: 8bded4750841c803315e37d7ef49d99e12c75b63
Base: 7985df87e09075e36af2b3af5f3446e742044004
Branch: feat/control-center-cross-repo-write-pilot-v1
Runner: cursor-cloud bc-01a05277-e68b-7867-b0e2-cbcdccf783f3
Node: v22.14.0
npm: 10.9.7
Executed (UTC): 2026-08-30T11:40:56Z .. 2026-08-30T11:41:10Z
Command chain:
  git clone https://github.com/yasutakesougo/ai-development-control-center.git
  git fetch origin 8bded4750841c803315e37d7ef49d99e12c75b63
  git checkout 8bded4750841c803315e37d7ef49d99e12c75b63
  git rev-parse HEAD
  npm ci
  npm run verify
```

## run-meta

```text
start_utc=2026-08-30T11:40:56Z
node=v22.14.0
npm=10.9.7
runner=cursor-cloud bc-01a05277-e68b-7867-b0e2-cbcdccf783f3
target_head=8bded4750841c803315e37d7ef49d99e12c75b63
revparse=8bded4750841c803315e37d7ef49d99e12c75b63
npm_ci_exit=0
verify_exit=0
post_revparse=8bded4750841c803315e37d7ef49d99e12c75b63
end_utc=2026-08-30T11:41:10Z
tests=43 files / 937 tests
typecheck=PASS
build=PASS
```

## `git rev-parse HEAD`

```text
8bded4750841c803315e37d7ef49d99e12c75b63
```

Post-verify HEAD unchanged:

```text
8bded4750841c803315e37d7ef49d99e12c75b63
```

PR HEAD re-read after verify (still DRAFT / OPEN):

```text
8bded4750841c803315e37d7ef49d99e12c75b63
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


 RUN  v3.2.7 /tmp/pr122-verify-surface/repo

 ✓ test/independentVerify.test.ts (59 tests) 25ms
 ✓ test/draftPublish.test.ts (74 tests) 31ms
 ✓ test/publicationHandoff.test.ts (25 tests) 32ms
 ✓ test/multiAgentCoordination.test.ts (67 tests) 19ms
 ✓ test/agentTaskContract.test.ts (62 tests) 15ms
 ✓ test/actionGatewayCommentContract.test.ts (28 tests) 26ms
 ✓ test/agentRunner.test.ts (43 tests) 15ms
 ✓ test/roadmapContract.test.ts (37 tests) 28ms
 ✓ test/issueProposalContract.test.ts (36 tests) 25ms
 ✓ test/projectContract.test.ts (38 tests) 20ms
 ✓ test/minOrchestrator.test.ts (26 tests) 13ms
 ✓ test/noPromptPilot.test.ts (35 tests) 21ms
 ✓ test/agentTaskBuilder.test.ts (30 tests) 10ms
(node:3002) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 ✓ test/statusOverlayGithubObserver.test.ts (15 tests) 13ms
 ✓ test/aiWorkerRegistry.test.ts (18 tests) 17ms
 ✓ test/handoffEvaluator.test.ts (14 tests) 7ms
 ✓ test/statusOverlayGenerator.test.ts (18 tests) 9ms
 ✓ test/noPromptPilotV2.test.ts (20 tests) 22ms
 ✓ test/statusOverlayContract.test.ts (18 tests) 5ms
 ✓ test/workerRouting.test.ts (13 tests) 23ms
 ✓ test/portfolioMaintenanceManager.test.ts (13 tests) 6ms
 ✓ test/persistentAutoRefreshDisabledMode.test.ts (16 tests) 14ms
 ✓ test/pilot/cross-repo-control-center-v1/kernel.test.ts (17 tests) 5ms
 ✓ test/statusOverlayViewModel.test.ts (15 tests) 12ms
 ✓ test/statusOverlayRuntime.test.ts (13 tests) 10ms
 ✓ test/autoRefreshContract.test.ts (15 tests) 5ms
 ✓ test/historyContract.test.ts (11 tests) 5ms
 ✓ test/ledgerRecordsApi.test.ts (14 tests) 1853ms
(node:3416) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 ✓ test/ledgerStore.test.ts (9 tests) 14ms
 ✓ test/persistentAutoRefreshContract.test.ts (14 tests) 4ms
 ✓ test/statusOverlayApiAuth.test.ts (6 tests) 17ms
 ✓ test/decisionFingerprint.test.ts (14 tests) 20ms
 ✓ test/autoRefreshPilot.test.ts (10 tests) 6ms
 ✓ test/ledgerSubmission.test.ts (14 tests) 5ms
 ✓ test/pilot/cross-repo-control-center-v1/writePilotStore.test.ts (5 tests) 4ms
 ✓ test/ledgerAuthorizer.test.ts (12 tests) 1357ms
   ✓ requireLedgerCapability (authenticate → authorize) > denial response exposes only the coarse code, never identity or granular reason  340ms
 ✓ test/architectureSnapshot.test.ts (7 tests) 8ms
 ✓ test/humanActionResolver.test.ts (11 tests) 5ms
 ✓ test/approvalIntent.test.ts (11 tests) 3ms
 ✓ test/selectAuthoritativePullBody.test.ts (4 tests) 3ms
 ✓ test/normalizeCi.test.ts (8 tests) 2ms
 ✓ test/accessJwtVerifier.test.ts (17 tests) 2506ms
   ✓ verifyAccessHumanJwt > denies an invalid signature  326ms
   ✓ verifyAccessHumanJwt > denies an unexpected issuer  311ms
 ✓ test/humanDecisionEvidence.test.ts (5 tests) 3ms

 Test Files  43 passed (43)
      Tests  937 passed (937)
   Start at  11:41:04
   Duration  4.49s (transform 708ms, setup 0ms, collect 1.64s, tests 6.24s, environment 5ms, prepare 2.11s)


> ai-development-control-center@0.1.0 build
> vite build

vite v7.3.6 building ai_development_control_center environment for production...
transforming...
✓ 79 modules transformed.
rendering chunks...
dist/ai_development_control_center/.vite/manifest.json   0.16 kB
dist/ai_development_control_center/wrangler.json         1.34 kB
dist/ai_development_control_center/index.js             97.27 kB
✓ built in 214ms
vite v7.3.6 building client environment for production...
transforming...
✓ 38 modules transformed.
rendering chunks...
computing gzip size...
dist/client/.assetsignore                0.02 kB
dist/client/index.html                   0.46 kB │ gzip:  0.30 kB
dist/client/assets/index-B_OiJpPm.css    6.86 kB │ gzip:  1.73 kB
dist/client/assets/index-BpbrbWum.js   218.37 kB │ gzip: 67.58 kB
✓ built in 466ms

```

## Integrity

```text
c316474f9f18f78a8c32815742b08c1a90cf5979b027d80a3e34665a50c625a4  npm-ci.log
860c4b14abecc1f2bcd9d48c01aed6d605272074c1f0cdccfb96fefc214c4229  npm-verify.log
2c9f40a0faedb9cbda2481678e10a1ffb2be399413cbc9873a960bfd2ac25042  clone.log
d03624b87e89a71c25227db001623dfade862d29178173fac8408de6694d5e70  checkout.log
29973e48a9fe99e6ca8b048b533322e808c86205715bdd1bed6e7ed6d0c1a507  run-meta.txt
```

## Gate implication

```text
Executable verification evidence: PASS / AVAILABLE
HEAD unchanged: PASS
Independent Implementation Re-Review content: already CONTENT PASS
Verification Re-Read: ELIGIBLE (evidence now observed)
Human Ready GO: NOT GRANTED by this evidence alone
Ready transition: NOT AUTHORIZED / NOT EXECUTED
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
LIVE WRITE / Cross-Repo WRITE: NOT AUTHORIZED
```
