# KnowledgeVerificationDecision@v1

## Status

```text
Contract: KnowledgeVerificationDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Establish whether runtime-eligible Knowledge is **CURRENT**. CURRENT is never
a Knowledge Record self-declaration (INV-LRN-020).

## Schema

```yaml
decisionId: "KVER-..."
contractVersion: "KnowledgeVerificationDecision@v1"
decisionVersion: "1"
subject:
  knowledgeRef: "K-..."
  knowledgeVersion: "1.0.0"
decision: CURRENT|CURRENT_WITH_CONDITIONS|STALE|INVALIDATED|HOLD
authorityRef: ""
evidenceRefs: []
policyVersion: ""
validFrom: ""
validUntil: ""                           # optional explicit expiry
reviewDueAt: ""                          # advisory; not authority by itself
decidedAt: ""
conditions: []
contentDigest: ""
supersedesDecisionRef: null
```

## Rules

1. Missing CURRENT decision ⇒ knowledge is not runtime-eligible.
2. `reviewDueAt` / drift signals are observations; they do not themselves
   grant or revoke CURRENT without a Verification Decision.
3. STALE or INVALIDATED removes runtime eligibility until a new CURRENT*
   decision is recorded.
4. Append-only.
