# WAEP-LEARNING-SYSTEM-V1 Slice A — Current Main V3 Independent Execution Evidence

## Exact Target

```text
Reconciled Target Commit:
9b28b95639e2b2faa5f55d45008f433f2c74f71c

Current Main Parent:
eeb126644df5238d61990f5767ec47880810f663

Source Blob:
4ea31a5d05bcb5d6c784f5aabfd47bedb5b5e186

Test Blob:
0b647c0e1281c80fed49563ecf0d85c3dda335e0

package.json Blob:
4e8166d6f9537af2142e7f6f9992c46116970e5c

tsconfig.json Blob:
0d18d1c0c5cbcbc1ad6556e1fba1f0a3bfc1c67b
```

## Independent Verifier

```text
Verifier PR: #58
Verifier Commit: 42c69f156ac7d8ed5755186466d840f58e652c3c
Workflow: Learning Slice A Current Main V3 Exact Artifact Verification
Workflow Run: 33247200613
Job: 99086621534
Runner: ubuntu-latest
Conclusion: SUCCESS
```

## Step Results

```text
Checkout exact target: PASS
Exact source/test/package/tsconfig identity assertions: PASS
Node 22 setup: PASS
Authorized pinned top-level toolchain install: PASS
Resolved top-level toolchain recording: PASS
npm run typecheck: PASS
npm test: PASS
Post-verification durable repository mutation check: PASS / NONE
```

## Reproducibility Qualification

The target artifact has exact pinned top-level devDependency versions:

```text
@types/node: 22.18.0
TypeScript: 5.9.2
Vitest: 3.2.4
```

It has no `package-lock.json`.

The verifier intentionally used:

```text
npm install --ignore-scripts --package-lock=false
```

Therefore:

```text
Exact top-level tool versions: FIXED
Transitive dependency resolution: NOT LOCKFILE-FIXED
Executable result for this run: PASS
Full dependency-graph reproducibility claim: NOT ESTABLISHED
```

This qualification does not invalidate the observed execution PASS, but it prevents promotion to a stronger lockfile-reproducible claim.

## Result

```text
Independent Exact-Artifact Execution: PASS
Typecheck: PASS
Tests: PASS
Durable Repository Mutation During Verification: NONE
Static Prior Findings: CLOSED / 4 of 4
New Executable P0 / P1 / P2: 0 / 0 / 0
```

The connector-visible job metadata does not expose test stdout counts, so no fresh numeric test-count total is invented here.

## Authority Boundary

```text
Verification PASS != Human Ready GO
Human Ready: NOT AUTHORIZED BY THIS EVIDENCE
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
LIVE WRITE: NOT AUTHORIZED
```

The evidence-record commit is docs-only. Any Human Ready decision must bind to the resulting exact candidate head and confirm the post-test delta contains no semantic implementation change.
