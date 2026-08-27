# LearningPayloadReleaseDecision@v1

## Status

```text
Contract: LearningPayloadReleaseDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-2
Implementation: NOT AUTHORIZED
```

## Purpose

Decide whether a payload generated from Production or Sensitive Source may be
ingested into the Learning Plane (INV-LRN-025, AC-28).

```text
Redaction success ≠ ALLOW
Missing Release Decision (production-sensitive) = Ingestion Prohibited
```

## Schema

```yaml
decisionId: "LPRD-..."
contractVersion: "LearningPayloadReleaseDecision@v1"
decisionVersion: "1"
source:
  sourceRef: ""
  sourceRevision: ""
  sourceClassification: ""
payloadRef: ""
payloadDigest: ""
destination:
  learningPlane: ""
  permittedUses: []
decision: ALLOW|ALLOW_WITH_CONDITIONS|DENY|HOLD
authorityRef: ""
classificationEvidenceRefs: []
redactionEvidenceRefs: []
decidedAt: ""
conditions: []
supersedesDecisionRef: null
contentDigest: ""
```

## Decision meanings

| Decision | Effect |
| --- | --- |
| ALLOW / ALLOW_WITH_CONDITIONS | Payload may enter Learning Plane under conditions |
| DENY | Ingestion prohibited |
| HOLD | No ingestion until authority resolves |

## Resolution

```yaml
resolutionKey:
  contractType: LearningPayloadReleaseDecision@v1
  subjectRef: ""           # typically sourceRef or payloadRef per policy
  subjectVersion: ""       # sourceRevision or payloadDigest binding
```

Ambiguous heads fail closed (INV-LRN-021).

## Rules

1. Production-sensitive sources require an explicit Release Decision before
   Learning Event creation.
2. Classification / Redaction Evidence alone never imply ALLOW.
3. Decision does not grant Promotion, Runtime Binding, or Execution Authority.
4. Append-only; corrections create a new superseding decision.
5. Credentials / secrets / personal / child / family / customer production data
   remain prohibited as reusable Knowledge content (INV-LRN-010 / 017).
