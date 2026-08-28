# KnowledgeEffectivenessDecision@v1

## Status

```text
Contract: KnowledgeEffectivenessDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-3
Supersedes contract semantics in: Definition Correction-2
Implementation: NOT AUTHORIZED
```

## Purpose

Separate Effectiveness Observation from authoritative Effectiveness Decision
(AC-30 / AC-41..43).

Effectiveness Decision is an observation evaluation only. Correction-3 does
not strengthen Effectiveness Authority.

## Schema

```yaml
decisionId: "KED-..."
contractVersion: "KnowledgeEffectivenessDecision@v1"
decisionVersion: "1"
subject:
  knowledgeRef: "K-..."
  knowledgeVersion: "1.0.0"
  runtimeTargetRef: ""
evaluationScopeRef: ""                   # required (INV-LRN-034)
measurement:
  baselineRef: ""
  measurementWindow: ""
  sampleSize: ""
  comparisonTarget: ""
evidenceRefs: []
decision: EFFECTIVE|EFFECTIVE_WITH_CONDITIONS|INCONCLUSIVE|INEFFECTIVE|HARMFUL|HOLD
authorityRef: ""                         # common Authority identity (INV-LRN-035)
# optional metadata only:
# authorityRole: EFFECTIVENESS_EVALUATOR
decidedAt: ""
conditions: []
supersedesDecisionRef: null
contentDigest: ""
```

Correction-2 field `evaluationAuthorityRef` is replaced by `authorityRef`.

## Decision meanings

| Decision | Meaning |
| --- | --- |
| EFFECTIVE / EFFECTIVE_WITH_CONDITIONS | Observed outcomes meet evaluation criteria |
| INCONCLUSIVE | Insufficient basis |
| INEFFECTIVE | Observed outcomes fail criteria |
| HARMFUL | Observed outcomes indicate harm |
| HOLD | Awaiting evaluation authority |

## Evaluation Scope

`evaluationScopeRef` identifies the evaluation series for the same Knowledge /
Runtime Target. Examples:

```text
post-deployment-30d
ci-regression-rate
review-finding-rate
pilot-site-a
cross-repository-validation
```

Updating `measurementWindow` within the same scope requires explicit
supersession. Distinct evaluation purposes use distinct scopes.

`measurementWindow` must not be used as an implicit Resolution Identity.

## Authority Boundary

Alone, this Decision **cannot** perform:

```text
Promotion
Lifecycle transition
CURRENT renewal
Runtime Binding
Execution Authorization
```

It may trigger re-Validation.

Effectiveness Observation ≠ Effectiveness Decision.
Metric improvement alone ≠ Knowledge validity or promotion authority.

This Decision cannot be the sole independent validation of the same Knowledge
that produced the measured outputs (INV-LRN-016).

## Resolution

```yaml
resolutionKey:
  contractType: KnowledgeEffectivenessDecision@v1
  subjectRef: ""
  subjectVersion: ""
  runtimeTargetRef: ""
  evaluationScopeRef: ""
```

Ambiguous heads fail closed (INV-LRN-021).

## Rules

1. Requires `evaluationScopeRef`, baseline, measurementWindow, sampleSize,
   comparisonTarget, `authorityRef`, and evidenceRefs.
2. Confidence / score thresholds on the Decision must not auto-promote,
   bind, or renew CURRENT (INV-LRN-028).
3. Append-only; corrections create a new superseding decision.
4. `authorityRole` (if present) ≠ `authorityRef`.
