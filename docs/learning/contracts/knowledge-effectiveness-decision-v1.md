# KnowledgeEffectivenessDecision@v1

## Status

```text
Contract: KnowledgeEffectivenessDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-2
Implementation: NOT AUTHORIZED
```

## Purpose

Separate Effectiveness Observation from authoritative Effectiveness Decision
(AC-30).

Effectiveness Decision is an observation evaluation only.

## Schema

```yaml
decisionId: "KED-..."
contractVersion: "KnowledgeEffectivenessDecision@v1"
decisionVersion: "1"
subject:
  knowledgeRef: "K-..."
  knowledgeVersion: "1.0.0"
  runtimeTargetRef: ""
measurement:
  baselineRef: ""
  measurementWindow: ""
  sampleSize: ""
  comparisonTarget: ""
evidenceRefs: []
decision: EFFECTIVE|EFFECTIVE_WITH_CONDITIONS|INCONCLUSIVE|INEFFECTIVE|HARMFUL|HOLD
evaluationAuthorityRef: ""
decidedAt: ""
conditions: []
supersedesDecisionRef: null
contentDigest: ""
```

## Decision meanings

| Decision | Meaning |
| --- | --- |
| EFFECTIVE / EFFECTIVE_WITH_CONDITIONS | Observed outcomes meet evaluation criteria |
| INCONCLUSIVE | Insufficient basis |
| INEFFECTIVE | Observed outcomes fail criteria |
| HARMFUL | Observed outcomes indicate harm |
| HOLD | Awaiting evaluation authority |

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
  scopeRef: ""                 # e.g. measurementWindow identity when required
```

Ambiguous heads fail closed (INV-LRN-021).

## Rules

1. Requires baseline, measurementWindow, sampleSize, comparisonTarget,
   evaluationAuthority, and evidenceRefs.
2. Confidence / score thresholds on the Decision must not auto-promote,
   bind, or renew CURRENT (INV-LRN-028).
3. Append-only; corrections create a new superseding decision.
