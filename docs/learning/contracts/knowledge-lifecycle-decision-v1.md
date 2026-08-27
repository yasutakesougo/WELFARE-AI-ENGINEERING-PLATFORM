# KnowledgeLifecycleDecision@v1

## Status

```text
Contract: KnowledgeLifecycleDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Externalize lifecycle transitions. Lifecycle labels on Knowledge Records are
derived, never self-declared as authority (INV-LRN-011).

## Schema

```yaml
decisionId: "KLD-..."
contractVersion: "KnowledgeLifecycleDecision@v1"
decisionVersion: "1"
subject:
  knowledgeRef: "K-..."                 # or candidateRef for pre-promotion
  knowledgeVersion: "1.0.0"
fromState: CANDIDATE|VALIDATING|VALIDATED|HOLD|REJECTED|PROMOTION_PENDING|APPROVED|ACTIVE|SUPERSEDED|RETIRED
toState: CANDIDATE|VALIDATING|VALIDATED|HOLD|REJECTED|PROMOTION_PENDING|APPROVED|ACTIVE|SUPERSEDED|RETIRED
decision: TRANSITION|HOLD|RESTORE_PATH
authorityRef: ""
supportingDecisionRefs: []              # validation / promotion / binding / verification
evidenceRefs: []
decidedAt: ""
conditions: []
contentDigest: ""
supersedesDecisionRef: null
```

## Transition authority notes

- `toState: ACTIVE` is only valid when supporting refs include a valid
  `RuntimeKnowledgeBindingDecision` and CURRENT `KnowledgeVerificationDecision`
  for the same subject version and intended runtime target.
- `APPROVED → ACTIVE` without Binding + CURRENT is forbidden.
- Matrix of allowed transitions is defined in the parent definition §9.2.

## Rules

1. Implicit transitions are forbidden.
2. Lifecycle Decision does not embed confidence or validation results.
3. Append-only; restoring a path creates a new decision.
