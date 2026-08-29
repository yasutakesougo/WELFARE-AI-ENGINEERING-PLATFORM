# DARK-IMPL-SLICE-B — Implementation Evidence

## Identity

```text
Definition: WAEP-DURABLE-AGENT-RUN-KERNEL-V1 / LOCKED
Slice: DARK-IMPL-SLICE-B
Title: Checkpoint / Replay / Resume Pure Domain Core
Baseline: 081071fbd47dae770ab7b731def2be3658d4963e
Branch: feat/dark-impl-slice-b
Human Implementation Start: GO
Independent Scope Review-1: PASS / 0-0-0
```

## Implemented

- checkpoint/result identity contract
- resume evidence contract
- explicit ResumeDecision vocabulary
- exact Definition Identity/Digest binding
- result reference/digest compatibility checks
- explicit current authority snapshot identity + AuthorityFreshness requirement
- exact checkpoint-to-bound CapabilitySnapshot identity check
- capability drift handling through Slice A semantics
- replay-class-specific reuse/revalidation behavior
- non-replayable effect handling through Slice A effect semantics
- effect safety precedence: APPLIED/UNKNOWN/CONFLICT cannot be weakened by missing current authority
- checkpoint lineage validation

## Acceptance Traceability

```text
DK-B-R1  immutable exact identity reuse -> ALLOW_REUSE
DK-B-R2  immutable digest mismatch -> HOLD_REQUIRED
DK-B-R3  snapshot current -> ALLOW_REUSE
DK-B-R4  snapshot stale -> REVALIDATION_REQUIRED
DK-B-R5  snapshot freshness unknown -> REVALIDATION_REQUIRED
DK-B-R6  revalidate-before-use -> REVALIDATION_REQUIRED
DK-B-R7  non-replayable applied effect -> DUPLICATE_MUTATION_PROHIBITED
DK-B-R8  non-replayable unknown effect -> RECONCILIATION_REQUIRED
DK-B-R9  definition digest mismatch -> DEFINITION_MISMATCH
DK-B-R10 prior authority reference without current evidence -> REAUTHORIZE_REQUIRED
DK-B-R11 capability drift on resume -> REAUTHORIZE_REQUIRED
DK-B-R12 invalid checkpoint lineage -> HOLD_REQUIRED
```

Additional deterministic cases verify:
- valid linear checkpoint lineage -> ALLOW_REUSE
- checkpoint CapabilitySnapshot identity mismatch -> HOLD_REQUIRED
- EFFECT_APPLIED without current authority -> DUPLICATE_MUTATION_PROHIBITED
- EFFECT_UNKNOWN without current authority -> RECONCILIATION_REQUIRED before reauthorization

## Implementation Corrections

### Correction-1

- replaced boolean `current_authority_evidence_present` with explicit `current_authority_snapshot_id` + `AuthorityFreshness`
- bound checkpoint `capability_snapshot_id` to the supplied bound CapabilitySnapshot identity

### Correction-2

Independent post-Correction-1 inspection found that current-authority evaluation occurred before non-replayable effect safety. That ordering could return `REAUTHORIZE_REQUIRED` for an already-applied or unknown effect when current authority evidence was absent.

Corrected ordering:

```text
EFFECT_APPLIED -> DUPLICATE_MUTATION_PROHIBITED
EFFECT_UNKNOWN -> RECONCILIATION_REQUIRED
EFFECT_CONFLICT / EFFECT_IN_FLIGHT -> HOLD_REQUIRED
EFFECT_NOT_APPLIED -> current authority/capability evaluation -> REAUTHORIZE_REQUIRED as required
```

This preserves:

```text
EFFECT_UNKNOWN != Safe To Retry
Prior Authority Decision != Current Authority Decision
Reauthorization != Proof That Prior Effect Did Not Occur
```

## Exact Post-Correction Validation

```text
python tests/durable_run_kernel/test_resume.py
Ran 16 tests in 0.001s
OK
```

Validation used the exact final Slice B checkpoint/resume/test contents with the unchanged final Slice A models/rules contracts. This is local deterministic validation, not GitHub CI.

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
Checkpoint Reuse Eligible != Run Resume Authority
Implementation Success != PR Publication GO
Implementation Success != Ready GO
Implementation Success != Merge GO
Implementation Success != Deploy GO
Implementation Success != LIVE WRITE
```
