# WAEP Local MCP Execution Bridge — Slice A

Status: Implementation candidate under `WAEP-LOCAL-MCP-EXECUTION-BRIDGE-V1`.

Scope:

- Contracts
- Synthetic fixtures only
- Shadow evaluator
- `OBSERVE_ONLY / SHADOW_EVALUATION`

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

Invariant: `executionPerformed` is always `false` in Slice A.
