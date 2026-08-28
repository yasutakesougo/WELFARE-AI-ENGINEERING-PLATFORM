# LearningPayloadReleaseDecision@v1

## Status

```text
Contract: LearningPayloadReleaseDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-3
Supersedes contract semantics in: Definition Correction-2
Implementation: NOT AUTHORIZED
```

## Purpose

Decide whether a payload generated from Production or Sensitive Source may be
ingested into the Learning Plane (INV-LRN-025 / INV-LRN-031, AC-28 / AC-37).

```text
Redaction success ≠ ALLOW
Missing Release Decision (production-sensitive) = Ingestion Prohibited
```

## Schema

```yaml
decisionId: "LPRD-..."
contractVersion: "LearningPayloadReleaseDecision@v1"
decisionVersion: "1"
subject:
  payloadRef: ""
  payloadDigest: ""
source:
  sourceRef: ""
  sourceRevision: ""
  sourceClassification: ""
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

## Canonical Resolution Identity

Authority Subject is the Release target Payload (not Source).

```yaml
resolutionKey:
  contractType: LearningPayloadReleaseDecision@v1
  payloadRef: ""
  payloadDigest: ""
  destinationLearningPlane: ""
```

These three values form one Release Authority Domain.

- Source fields are Provenance only.
- Same Source with different Payload or Destination ⇒ different Authority.
- `ALLOW` for Destination A does **not** imply `ALLOW` for Destination B.

## Resolution Failure

```text
payloadRef missing
payloadDigest missing
destinationLearningPlane missing
conflicting effective heads
invalid supersession chain
  → HOLD
  → INGESTION PROHIBITED
```

Ambiguous heads and missing production-sensitive Decisions fail closed
(INV-LRN-021 / INV-LRN-031).

## Rules

1. Production-sensitive sources require an explicit Release Decision before
   Learning Event creation.
2. Classification / Redaction Evidence alone never imply ALLOW.
3. Decision does not grant Promotion, Runtime Binding, or Execution Authority.
4. Append-only; corrections create a new superseding decision.
5. Credentials / secrets / personal / child / family / customer production data
   remain prohibited as reusable Knowledge content (INV-LRN-010 / 017).
6. Authority identity uses common `authorityRef` (INV-LRN-035).
