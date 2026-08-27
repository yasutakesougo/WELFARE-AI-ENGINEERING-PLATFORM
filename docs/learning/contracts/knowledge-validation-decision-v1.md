# KnowledgeValidationDecision@v1

## Status

```text
Contract: KnowledgeValidationDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Separate Validation **Evidence** from authoritative Validation **Decision**.

```text
Test PASS / Review result / Fixture output  = Evidence
KnowledgeValidationDecision@v1              = Authority
```

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
independentEvidenceRefs: []          # subset that is independent of subject knowledge
decidedAt: ""                        # audit only
conditions: []
contentDigest: ""
supersedesDecisionRef: null
```

## Rules

1. Decision binds only to the stated `knowledgeCandidateVersion`.
2. Evidence refs alone never imply `VALID*`.
3. At least one `independentEvidenceRefs` entry is required for `VALID` or
   `VALID_WITH_CONDITIONS`.
4. AI-generated evidence alone cannot satisfy independence.
5. Knowledge-derived outputs of the same candidate/knowledge cannot be the
   sole independent evidence (INV-LRN-016).
6. Append-only: corrections create a new decision that supersedes the prior.
