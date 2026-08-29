# DARK-IMPL-SLICE-C — Implementation Evidence

## Identity

```text
Definition: WAEP-DURABLE-AGENT-RUN-KERNEL-V1 / LOCKED
Slice: DARK-IMPL-SLICE-C
Title: Run Transition / Recovery Decision Pure Domain Core
Baseline: 8f18ed5760605ea16229feea81c840d27c0cd63d
Branch: feat/dark-impl-slice-c
Human Implementation Start: GO
Independent Scope Review-1: PASS / 0-0-0
```

## Implemented

- pure Run transition decision vocabulary
- terminal-state protection
- authority freshness gate on transition/retry/recovery
- definition drift fail-closed handling
- capability drift reauthorization requirement
- lease/fence loss rejection
- effect ambiguity precedence over retry
- technically-retryable vs retry-eligible separation
- recovery eligibility separate from resume authority
- parent/child failure propagation requiring explicit parent rule

## Core Invariants

```text
Retryable != Authorized To Retry
Resume Eligible != Resume Authorized
Recovery Candidate != Recovery Authorized
Lease Lost != Safe To Continue
Terminal State != Reopenable By Default
Reauthorization != Effect Reconciliation
Definition Drift != Automatic Migration
Child Failure != Parent Failure Automatically
```

## Acceptance Traceability

```text
DK-C-R1   normal AUTHORIZED -> RUNNING transition
DK-C-R2   terminal SUCCEEDED cannot reopen
DK-C-R3   stale authority -> REAUTHORIZE_REQUIRED
DK-C-R4   definition drift -> DEFINITION_MISMATCH
DK-C-R5   capability drift -> REAUTHORIZE_REQUIRED
DK-C-R6   stale lease -> STALE_LEASE_REJECTED
DK-C-R7   stale fence -> STALE_LEASE_REJECTED
DK-C-R8   technically retryable + unknown authority -> REAUTHORIZE_REQUIRED
DK-C-R9   EFFECT_UNKNOWN retry -> RECONCILIATION_REQUIRED
DK-C-R10  EFFECT_NOT_APPLIED + current authority -> RETRY_ELIGIBLE
DK-C-R11  resume decision REAUTHORIZE_REQUIRED -> no recovery authority synthesis
DK-C-R12  resume reconciliation requirement preserved
DK-C-R13  safe suspended checkpoint -> RECOVERY_ELIGIBLE only
DK-C-R14  child FAILED does not auto-fail parent
DK-C-R15  explicit parent failure rule permits propagation decision
DK-C-R16  DENIED is terminal and not retryable runtime failure
```

## Scope Boundary

```text
Dependency Addition: NONE
Repository-wide Config Mutation: NONE
Runtime / Framework Adoption: NONE
Persistent Backend: NONE
Network / Credential Use: NONE
External Mutation Executor: NONE
Production / Customer / Welfare Data: NONE
```

```text
Implementation Success != PR Publication GO
Implementation Success != Ready GO
Implementation Success != Merge GO
Implementation Success != Deploy GO
Implementation Success != LIVE WRITE
```
