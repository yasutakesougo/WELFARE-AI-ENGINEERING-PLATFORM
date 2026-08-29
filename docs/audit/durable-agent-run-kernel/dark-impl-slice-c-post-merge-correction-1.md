# DARK-IMPL-SLICE-C — Post-Merge Correction-1

## Status

```text
Source PR: #50
Merged Main Baseline: eeb126644df5238d61990f5767ec47880810f663
Source Post-Merge Review: P0 / P1 / P2 = 0 / 5 / 2
Independent Finding Validation: CONFIRMED 7 / 7
Correction Revision: Post-Merge Correction-1
```

## Corrected Findings

```text
P1-1 Preserve effect safety before checking retryability
P1-2 Allow successful completion after an applied effect
P1-3 Block recovery until required revalidation completes
P1-4 Preserve policy denial for revoked authority
P1-5 Protect terminal parents during child propagation
P2-1 Permit retries when the effect never started
P2-2 Preserve definition mismatch from checkpoint evaluation
```

### Correction semantics

1. `retry_decision` evaluates definition/lease/effect/authority/capability safety before `technically_retryable` so `EFFECT_UNKNOWN` and `EFFECT_APPLIED` retain their stronger safety results.
2. `RUNNING -> SUCCEEDED` is permitted when the already-performed effect is truthfully `EFFECT_APPLIED`; this state completion is not effect re-execution.
3. `ResumeDecision.REVALIDATION_REQUIRED` maps to `HOLD_REQUIRED` and cannot fall through to `RECOVERY_ELIGIBLE`.
4. `AuthorityFreshness.REVOKED` maps to `TransitionDecision.DENY_POLICY`; stale/unknown remain reauthorization paths.
5. Child propagation cannot reopen a terminal parent even when an explicit parent-failure rule exists.
6. `EFFECT_NOT_STARTED` is retry-eligible when the technical failure itself is retryable and all safety checks pass.
7. `ResumeDecision.DEFINITION_MISMATCH` is preserved as `TransitionDecision.DEFINITION_MISMATCH`.

## Scope Boundary

Changed implementation paths remain within the approved Slice C envelope:

```text
src/durable_run_kernel/**
tests/durable_run_kernel/**
docs/audit/durable-agent-run-kernel/**
```

No dependency addition, persistent backend, runtime adoption, external mutation executor, credential access, production/customer/welfare data, Deploy, or LIVE WRITE is introduced.

## Verification Boundary

Correction-1 requires independent execution of the durable run kernel test suite against the exact corrected commit. Verification PASS does not grant Ready or Merge authority for this correction PR.
