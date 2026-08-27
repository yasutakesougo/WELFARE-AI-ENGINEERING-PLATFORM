# KnowledgeVerificationDecision@v1

## Status

```text
Contract: KnowledgeVerificationDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-2
Supersedes contract semantics in: Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Establish whether runtime-eligible Knowledge is **CURRENT**, and supply inputs
for Verification Policy freshness evaluation (INV-LRN-020, INV-LRN-029).

CURRENT is never a Knowledge Record self-declaration.

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
verificationPolicy:
  policyVersion: ""
  knowledgeClass: ""
  expiryRequired: true|false
  maximumAge: ""
  reverificationTriggers: []
validFrom: ""
validUntil: ""                           # explicit expiry when required
reviewDueAt: ""                          # advisory; not authority by itself
decidedAt: ""
conditions: []
contentDigest: ""
supersedesDecisionRef: null
```

## Freshness evaluation

Even when decision is CURRENT or CURRENT_WITH_CONDITIONS, Canonical Decision
Resolver marks Runtime Eligibility failed when:

```text
validUntil expired
OR maximumAge exceeded
OR mandatory reverification trigger unresolved
OR verification Decision conflict exists
```

Derived states may include `CURRENT_EXPIRED` or `NOT_CURRENT`.

## Resolution

```yaml
resolutionKey:
  contractType: KnowledgeVerificationDecision@v1
  subjectRef: ""
  subjectVersion: ""
```

Ambiguous heads fail closed (INV-LRN-021).

## Rules

1. Missing CURRENT decision ⇒ knowledge is not runtime-eligible.
2. `reviewDueAt` / drift signals are observations; they do not themselves
   grant or revoke CURRENT without a Verification Decision.
3. STALE or INVALIDATED removes runtime eligibility until a new CURRENT*
   decision is recorded.
4. Expired CURRENT is not runtime eligible (INV-LRN-029, AC-31).
5. Confidence thresholds must not grant CURRENT (INV-LRN-028).
6. Append-only.
7. Knowledge Record must not mutate to store this Decision ref (INV-LRN-023).
