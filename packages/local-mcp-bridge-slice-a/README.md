# WAEP Local MCP Execution Bridge — Slice A

Status: Implementation Correction-2 candidate under `WAEP-LOCAL-MCP-EXECUTION-BRIDGE-V1`.

Scope:

- Contracts
- Synthetic fixtures only
- Shadow evaluator
- `OBSERVE_ONLY / SHADOW_EVALUATION`
- Trusted synthetic decision / containment registries
- Verified dependency and data-zone policy evaluation
- AC-01 through AC-55 evidence-level traceability

Explicitly excluded:

- Runtime MCP connection
- Real local filesystem access
- Real repository observation
- Process or shell spawning by the bridge
- Evidence persistence
- File mutation
- Git mutation
- Desktop control
- Production or personal data access

Core invariants:

- `executionPerformed` is always `false` in Slice A.
- `observationPerformed` is always `false` in the Shadow Evaluator.
- Shadow policy results never synthesize `ObservationResult` values.
- Caller-supplied `verificationState=VERIFIED` cannot create authority; Shadow requests carry registry references, not caller-constructed verified decisions.
- Containment `PASS` is accepted only from the internal synthetic containment registry.
- Trusted configuration requires an immutable `sha256:<64-hex>` or `commit:<40-hex>` pin and a permitted external authority root.
- Process observation exposes a fixed numeric resource allowlist; arbitrary string-keyed resource output is not permitted.
- Local observation contracts never resolve remote current state by themselves.

## Pinned verification toolchain

- Node.js: `22.23.1` (`.nvmrc` and `package.json#engines`)
- TypeScript: `5.9.2` exact (`package.json` and `package-lock.json`)

## Verification

No runtime MCP connection or local observation is performed by these commands.

```text
cd packages/local-mcp-bridge-slice-a
npm ci
npm run typecheck
npm run verify
```

`npm run verify` compiles the synthetic-only verification target and runs the Slice A self-check. The generated `.slice-a-verify/` directory is temporary verification output and is not part of the bridge runtime.

The acceptance registry is evidence-bound: every `IMPLEMENTED` AC must resolve to concrete Contract / Policy / Fixture / Self-check evidence IDs, while runtime filesystem criteria remain explicitly `DEFERRED_BY_DEFINITION` rather than being counted as PASS.
