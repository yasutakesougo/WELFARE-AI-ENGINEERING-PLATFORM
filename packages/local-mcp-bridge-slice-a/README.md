# WAEP Local MCP Execution Bridge — Slice A

Status: Implementation Correction-1 candidate under `WAEP-LOCAL-MCP-EXECUTION-BRIDGE-V1`.

Scope:

- Contracts
- Synthetic fixtures only
- Shadow evaluator
- `OBSERVE_ONLY / SHADOW_EVALUATION`
- Verified decision / dependency / containment evidence evaluation
- AC-01 through AC-55 applicability mapping

Explicitly excluded:

- Runtime MCP connection
- Real local filesystem access
- Real repository observation
- Process or shell spawning
- Evidence persistence
- File mutation
- Git mutation
- Desktop control
- Production or personal data access

Core invariants:

- `executionPerformed` is always `false` in Slice A.
- `observationPerformed` is always `false` in the Shadow Evaluator.
- Shadow policy results never synthesize `ObservationResult` values.
- Caller-supplied bare `ALLOW` / `PASS` values are not accepted as authority evidence.
- Local observation contracts never resolve remote current state by themselves.

## Verification

Requires an available TypeScript compiler (`tsc`) and Node.js. No runtime MCP connection or local observation is performed by these commands.

```text
cd packages/local-mcp-bridge-slice-a
npm run typecheck
npm run verify
```

`npm run verify` compiles the synthetic-only verification target and runs the Slice A self-check. The generated `.slice-a-verify/` directory is temporary verification output and is not part of the bridge runtime.
