# KnowledgePromotionDecision@v1

## Status

```text
Contract: KnowledgePromotionDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-2
Supersedes contract semantics in: Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Authorize admission of an immutable Knowledge Candidate version into the
Knowledge Plane. Promotion does not activate runtime use or grant Execution
Authority.

## Schema

```yaml
decisionId: "KPD-..."
contractVersion: "KnowledgePromotionDecision@v1"
decisionVersion: "1"
subject:
  knowledgeCandidateRef: "KC-..."
  knowledgeCandidateVersion: "1.0.0"   # immutable bind — required
decision: PROMOTE|PROMOTE_WITH_CONDITIONS|HOLD|REJECT|SUPERSEDE_PRIOR_PROMOTION
authorityRef: ""
evidenceRefs: []
validationDecisionRef: "KVD-..."       # required for PROMOTE*
decidedAt: ""
conditions: []
supersedes: []                         # prior promotion decision refs / knowledge versions
contentDigest: ""
supersedesDecisionRef: null
```

## Resolution

```yaml
resolutionKey:
  contractType: KnowledgePromotionDecision@v1
  subjectRef: ""
  subjectVersion: ""
```

Ambiguous heads fail closed (INV-LRN-021).

## Rules

1. Canonical contract identity is version-fixed: `KnowledgePromotionDecision@v1`.
2. Decision **must** bind to an immutable candidate version (INV-LRN-014).
3. A Promotion Decision for version N does not apply to version N+1.
4. `PROMOTE*` requires a referenced Validation Decision of `VALID` or
   `VALID_WITH_CONDITIONS` for the same candidate version.
5. Promotion ≠ Runtime Effective ACTIVE, ≠ Runtime Binding, ≠ CURRENT,
   ≠ Execution authority.
6. Confidence thresholds must not auto-promote (INV-LRN-028).
7. Append-only.
