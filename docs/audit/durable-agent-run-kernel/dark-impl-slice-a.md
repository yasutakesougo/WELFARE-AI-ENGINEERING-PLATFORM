# DARK-IMPL-SLICE-A — Implementation Evidence

## Authority

```text
Definition: WAEP-DURABLE-AGENT-RUN-KERNEL-V1
Definition State: LOCKED
Slice: DARK-IMPL-SLICE-A
Independent Scope Re-Review-1: PASS
Human Implementation Start: GO
Independent Implementation Review-1: CORRECTION REQUIRED (P0/P1/P2 = 0/3/3)
Implementation Correction-1: APPLIED
Dependency Addition: NOT AUTHORIZED
Runtime / Framework Adoption: NOT AUTHORIZED
PR Publication / Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
```

## Baseline / Branch

```text
baseline main: 7616e42f6bc012adf2485bf5ecc6a8f41ee7f07e
branch: feat/dark-impl-slice-a
pre-correction reviewed head: 0332bcc9e174f9c8403847d247d7270ce9ae676e
correction source/test head: bead31a8e37a99e24abb1cca777790dd3cf36196
```

## Implemented Paths

```text
src/durable_run_kernel/__init__.py
src/durable_run_kernel/models.py
src/durable_run_kernel/rules.py
tests/durable_run_kernel/test_kernel.py
docs/audit/durable-agent-run-kernel/dark-impl-slice-a.md
```

All implementation paths are within the approved Scope Correction-1 envelope.

## Implementation Correction-1 Closure

Independent Implementation Review-1 found:

```text
P1-1 AuthorityBinding@v1 semantically incomplete
P1-2 effect reconciliation not identity/evidence-bound
P1-3 child authority UNKNOWN proof unavailable not representable
P2-1 optional model/MCP capability identities omitted
P2-2 exact lease-expiry boundary permissive
P2-3 ledger ordering/history validation insufficient
```

Correction-1 applies:

- distinct repository/system target identity plus target resource identity
- ToolIdentity / ToolClass alternatives
- DecisionExpiresAt / FreshnessPolicy handling
- RevocationSourceRef / SupersessionRef evidence binding
- identity-bound `ReconciliationObservation` with required evidence references
- `EFFECT_UNKNOWN` remains reconciliation-gated and cannot auto-retry
- unknown child authority dimensions produce `HOLD_REQUIRED`
- known authority widening produces `REAUTHORIZE_REQUIRED`
- optional model-provider and MCP-configuration capability identities participate in drift checks
- `now >= lease_expires_at` rejects canonical writes
- ledger history validation requires unique IDs, strictly increasing sequence, and backward-only correction/supersession/reconciliation links

## Validation

Exact Correction-1 source/test contents were executed using the repository's existing Python standard-library test harness:

```text
python tests/durable_run_kernel/test_kernel.py
```

Result:

```text
Ran 25 tests
OK
```

The 25 tests cover DK-R1 through DK-R14 and additional negative cases for:

```text
revocation without evidence -> UNKNOWN
resource identity mismatch -> STALE
freshness policy not observed -> UNKNOWN
mismatched reconciliation -> RECONCILIATION_REQUIRED
missing reconciliation evidence -> RECONCILIATION_REQUIRED
exact lease expiry -> STALE_LEASE_REJECTED
child subset proof unavailable -> HOLD_REQUIRED
model provider drift -> REAUTHORIZE_REQUIRED
MCP configuration drift -> REAUTHORIZE_REQUIRED
non-monotonic ledger sequence -> HOLD_REQUIRED
forward correction link -> HOLD_REQUIRED
unknown tool binding -> UNKNOWN / HOLD_REQUIRED
```

No dependency addition, repository-wide config mutation, workflow-engine/runtime adoption, network/GitHub/M365 mutation, persistent backend, credential provider, or external effect executor is introduced.

## Gate Boundary

```text
Implementation Correction complete != Independent Implementation Re-Review PASS
Independent Implementation Re-Review PASS != PR Publication GO
PR Published != Ready GO
Ready != Merge GO
Merge != Deploy GO
```

Next Gate: `DARK-IMPL-SLICE-A Independent Implementation Re-Review-1`.
