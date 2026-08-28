# KnowledgeLifecycleDecision@v1

## Status

```text
Contract: KnowledgeLifecycleDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-2
Supersedes contract semantics in: Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Externalize lifecycle transitions. Lifecycle labels on Knowledge Records are
derived via Canonical Decision Resolver, never self-declared as authority
(INV-LRN-011, INV-LRN-022).

`ACTIVE` is **not** a Knowledge Lifecycle state after Correction-2.

## Schema

```yaml
decisionId: "KLD-..."
contractVersion: "KnowledgeLifecycleDecision@v1"
decisionVersion: "1"
subject:
  knowledgeRef: "K-..."                 # or candidateRef for pre-promotion
  knowledgeVersion: "1.0.0"
fromState: CANDIDATE|VALIDATING|VALIDATED|HOLD|REJECTED|PROMOTION_PENDING|APPROVED|SUPERSEDED|RETIRED
toState: CANDIDATE|VALIDATING|VALIDATED|HOLD|REJECTED|PROMOTION_PENDING|APPROVED|SUPERSEDED|RETIRED
decision: TRANSITION|HOLD|RESTORE_PATH
authorityRef: ""
supportingDecisionRefs: []              # validation / promotion / verification
evidenceRefs: []
decidedAt: ""
conditions: []
contentDigest: ""
supersedesDecisionRef: null
```

## Transition authority notes

- `toState: ACTIVE` is **forbidden**. Runtime Effective ACTIVE is derived only
  (parent §5.4).
- Lifecycle expresses availability / historical state, not Runtime Target
  application state (INV-LRN-022, AC-25).
- Matrix of allowed transitions is defined in the parent definition §5.2.

## Resolution

```yaml
resolutionKey:
  contractType: KnowledgeLifecycleDecision@v1
  subjectRef: ""
  subjectVersion: ""
```

Ambiguous heads fail closed (INV-LRN-021).

## Rules

1. Implicit transitions are forbidden.
2. Lifecycle Decision does not embed confidence or validation results.
3. Append-only; restoring a path creates a new decision.
4. Knowledge Record must not mutate to store this Decision ref (INV-LRN-023).
