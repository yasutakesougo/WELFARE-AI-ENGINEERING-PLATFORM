# DARK-IMPL-SLICE-C — Post-Merge Independent Finding Validation-1

## Target

```text
Current Main:
eeb126644df5238d61990f5767ec47880810f663

Merged PR:
#50

Merged Head:
bf1432921a92172ab62eddcd19a8f9acc57cdf30

Post-Merge Automated Review Findings:
P0 / P1 / P2 = 0 / 5 / 2
```

## Verdict

```text
Independent Finding Validation-1:
CONFIRMED / 7 of 7

P0 / P1 / P2:
0 / 5 / 2

Current Main Disposition:
POST-MERGE CORRECTION REQUIRED
```

This validation performs source-level independent confirmation only. It does not apply code corrections and does not grant Ready, Merge, Deploy, Runtime, or LIVE WRITE authority.

## P1-1 — Retry Safety Ordering

CONFIRMED.

`retry_decision()` returns `HOLD_REQUIRED` immediately when `technically_retryable` is false, before `_safety_precondition()` is evaluated.

Therefore effect states such as `EFFECT_UNKNOWN` or `EFFECT_APPLIED` can lose the stronger reconciliation / duplicate-mutation decision when technical retryability is false.

Required property:

```text
Effect safety / authority safety precedence
> technical retryability classification
```

## P1-2 — EFFECT_APPLIED Blocks Normal Completion

CONFIRMED.

`transition_decision()` calls `_safety_precondition()` for all transitions before evaluating the state transition table.

`_safety_precondition()` maps `EFFECT_APPLIED` to `DUPLICATE_MUTATION_PROHIBITED` unconditionally.

Therefore a normal `RUNNING -> SUCCEEDED` bookkeeping/state transition can be blocked even when it does not attempt a duplicate external effect.

The duplicate-effect prohibition must be scoped to transitions/actions that would repeat or reissue the protected mutation, not every post-effect run-state transition.

## P1-3 — REVALIDATION_REQUIRED Falls Through to Recovery

CONFIRMED.

`ResumeDecision.REVALIDATION_REQUIRED` exists in the enum, but `recovery_decision()` has no explicit branch for it.

After the known decision branches, a `SUSPENDED`, `UNKNOWN`, or `WAITING_CALLBACK` run returns `RECOVERY_ELIGIBLE`.

Therefore `REVALIDATION_REQUIRED` can be weakened into recovery eligibility.

Required property:

```text
REVALIDATION_REQUIRED != RECOVERY_ELIGIBLE
```

## P1-4 — REVOKED Authority Loses Policy Denial Semantics

CONFIRMED.

`authority_decision()` correctly maps:

```text
AuthorityFreshness.REVOKED -> DENY_POLICY
```

However `_safety_precondition()` in transition handling maps every freshness other than `CURRENT` to:

```text
REAUTHORIZE_REQUIRED
```

This collapses an explicit revocation/policy denial into a reauthorization state.

Required property:

```text
REVOKED -> policy denial semantics preserved
STALE / UNKNOWN may require hold or reauthorization according to contract
```

## P1-5 — Terminal Parent Protection Missing

CONFIRMED.

`parent_propagation_decision()` does not inspect `parent_state` at all.

For child states outside `FAILED`, `DENIED`, and `CANCELLED`, it returns `ALLOW_TRANSITION` even when the parent is already terminal.

Required property:

```text
terminal parent state must be protected independently of child outcome class
```

## P2-1 — EFFECT_NOT_STARTED Retry Eligibility Missing

CONFIRMED.

`EffectState` defines both:

```text
EFFECT_NOT_STARTED
EFFECT_NOT_APPLIED
```

but `retry_decision()` grants `RETRY_ELIGIBLE` only for `EFFECT_NOT_APPLIED` or `None`.

An explicit `EFFECT_NOT_STARTED` therefore falls to `HOLD_REQUIRED`.

The semantics should explicitly decide whether `EFFECT_NOT_STARTED` is retry-eligible; the current implementation does not preserve the natural no-effect-started case as retry eligible.

## P2-2 — Definition Mismatch Collapsed During Recovery

CONFIRMED.

`ResumeDecision.DEFINITION_MISMATCH` is explicitly represented.

`recovery_decision()` groups it with `HOLD_REQUIRED` and returns generic `TransitionDecision.HOLD_REQUIRED`.

This loses the explicit Definition mismatch reason at the transition layer.

Required property:

```text
DEFINITION_MISMATCH must remain distinguishable from generic HOLD
```

## Required Correction Boundary

A correction should remain confined to Slice C transition/recovery semantics and associated deterministic tests unless independent review shows a broader contract change is required.

Minimum correction targets:

```text
src/durable_run_kernel/transition.py
associated Slice C tests
```

Potential source-contract dependencies to preserve:

```text
AuthorityFreshness.REVOKED semantics
EffectState vocabulary
ResumeDecision vocabulary
terminal state protection
no automatic effect replay
no automatic authority escalation
```

## Gate

```text
Current Main Slice C:
CORRECTION REQUIRED

Next:
DARK-IMPL-SLICE-C Post-Merge Correction-1
→ Independent Post-Merge Re-Review-1
```

## Authority Boundary

```text
Finding Validation PASS != Correction Authority
Correction Review PASS != Deploy Authority
Merge State != Runtime Activation
No code mutation performed by this validation
```
