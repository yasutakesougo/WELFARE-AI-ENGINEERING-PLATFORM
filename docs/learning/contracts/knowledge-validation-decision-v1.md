# KnowledgeValidationDecision@v1

## Status

```text
Contract: KnowledgeValidationDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-2
Supersedes contract semantics in: Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Separate Validation **Evidence** from authoritative Validation **Decision**.

```text
Test PASS / Review result / Fixture output  = Evidence
KnowledgeValidationDecision@v1              = Authority
```

Evidence independence is evaluated by Validation Authority from Provenance +
Lineage + Validation Context. Evidence must not self-declare independence
(INV-LRN-026).

## Schema

```yaml
decisionId: "KVD-..."
contractVersion: "KnowledgeValidationDecision@v1"
decisionVersion: "1"
knowledgeCandidateRef: "KC-..."
knowledgeCandidateVersion: "1.0.0"   # immutable bind
decision: VALID|VALID_WITH_CONDITIONS|INVALID|HOLD
authorityRef: ""
evidenceRefs: []
independentEvidenceRefs: []          # authority-assessed independent subset
decidedAt: ""                        # audit only; not sole head selector
conditions: []
contentDigest: ""
supersedesDecisionRef: null
```

## Resolution

```yaml
resolutionKey:
  contractType: KnowledgeValidationDecision@v1
  subjectRef: ""                     # knowledgeCandidateRef
  subjectVersion: ""
```

Ambiguous heads fail closed (INV-LRN-021).

## Rules

1. Decision binds only to the stated `knowledgeCandidateVersion`.
2. Evidence refs alone never imply `VALID*`.
3. At least one `independentEvidenceRefs` entry is required for `VALID` or
   `VALID_WITH_CONDITIONS`, and independence must be authority-assessed
   (not Evidence self-declaration).
4. AI-generated evidence alone cannot satisfy independence.
5. Knowledge-derived outputs of the same candidate/knowledge cannot be the
   sole independent evidence (INV-LRN-016).
6. Confidence thresholds must not grant VALID* (INV-LRN-028).
7. Append-only: corrections create a new decision that supersedes the prior.
