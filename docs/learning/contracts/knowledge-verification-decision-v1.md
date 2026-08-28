# KnowledgeVerificationDecision@v1

## Status

```text
Contract: KnowledgeVerificationDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-3
Supersedes contract semantics in: Definition Correction-2
Implementation: NOT AUTHORIZED
```

## Purpose

Establish whether runtime-eligible Knowledge is **CURRENT**, and supply
canonical freshness inputs (INV-LRN-020, INV-LRN-029, INV-LRN-032/033/036).

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
verificationPolicy:
  policyRef: ""
  policyVersion: ""
  knowledgeClass: ""
  expiryRequired: true|false
  maximumAge: ""
  reverificationTriggers: []
verifiedAt: ""                           # required freshness anchor
validFrom: ""
validUntil: ""                           # explicit expiry when required
reviewDueAt: ""                          # advisory; not authority by itself
decidedAt: ""                            # audit only; not freshness anchor
conditions: []
contentDigest: ""
supersedesDecisionRef: null
```

Top-level `policyVersion` is **not** used. Policy identity lives only under
`verificationPolicy` (AC-40).

## Time Semantics

```text
verifiedAt  = verification freshness anchor
decidedAt   = authority decision audit timestamp
```

`verifiedAt`, `validFrom`, `validUntil`, and `decidedAt` are absolute instants
(UTC ISO 8601 recommended). Runtime Resolver must not vary expiry by local
timezone.

```text
age = evaluationInstant - verifiedAt

age > maximumAge
  → CURRENT_EXPIRED
  → NOT RUNTIME ELIGIBLE
```

If `maximumAge` is required and `verifiedAt` is missing:

```text
MISSING_DEPENDENCY → NOT_CURRENT → NOT RUNTIME ELIGIBLE
```

Do not substitute `decidedAt` for missing `verifiedAt` (INV-LRN-036, AC-39).

## CURRENT Resolution Order

```text
1. Resolve one effective Verification Decision head.
2. Require CURRENT or CURRENT_WITH_CONDITIONS.
3. Resolve Verification Policy.
4. Evaluate validFrom.
5. Evaluate validUntil.
6. Evaluate: evaluationInstant - verifiedAt <= maximumAge
7. Evaluate mandatory reverification triggers.
8. Evaluate conditions.
9. Only then derive CURRENT eligibility.
```

Fail closed on UNKNOWN / AMBIGUOUS / MISSING_DEPENDENCY / INVALID_CHAIN /
EXPIRED, including:

```text
policyRef missing when policy required
policyVersion missing
policy cannot be resolved
policy version conflict
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
4. Expired CURRENT is not runtime eligible (INV-LRN-029, AC-31 / AC-38).
5. Confidence thresholds must not grant CURRENT (INV-LRN-028).
6. Append-only.
7. Knowledge Record must not mutate to store this Decision ref (INV-LRN-023).
8. Authority identity uses common `authorityRef` (INV-LRN-035).
