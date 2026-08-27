# RuntimeKnowledgeBindingDecision@v1

## Status

```text
Contract: RuntimeKnowledgeBindingDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-2
Supersedes contract semantics in: Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Authorize, deny, unbind, or restore runtime use of a specific Knowledge
version for a specific runtime target.

Runtime Effective ACTIVE is derived (parent §5.4), never stored on Knowledge
Lifecycle or Registry as authority (INV-LRN-015, INV-LRN-022).

## Schema

```yaml
decisionId: "RKBD-..."
contractVersion: "RuntimeKnowledgeBindingDecision@v1"
decisionVersion: "1"
subject:
  knowledgeRef: "K-..."
  knowledgeVersion: "1.0.0"
runtimeTargetRef: ""                     # control-plane / gate / env identity
decision: BIND|BIND_WITH_CONDITIONS|DENY|UNBIND|HOLD|RESTORE
authorityRef: ""
policyVersion: ""
promotionDecisionRef: "KPD-..."          # required for BIND* / RESTORE eligibility
verificationDecisionRef: "KVER-..."      # required for BIND* / RESTORE; CURRENT* + fresh
lifecycleDecisionRef: "KLD-..."          # optional supporting
lastKnownGoodBindingRef: null            # required for RESTORE (historical reference only)
evidenceRefs: []
decidedAt: ""
conditions: []
contentDigest: ""
supersedesDecisionRef: null
```

## Decision meanings

| Decision | Effect |
| --- | --- |
| BIND / BIND_WITH_CONDITIONS | Authorizes use for `runtimeTargetRef` |
| DENY | Explicitly refuses binding |
| UNBIND | Removes current binding |
| HOLD | No change; awaiting authority |
| RESTORE | New Decision after re-evaluating current eligibility of referenced LKG |

Derived Runtime Binding State (minimum):

```text
BOUND | UNBOUND | DENIED | HELD | NOT_ELIGIBLE
```

## RESTORE (Correction-2)

```text
Historical Last Known Good
  != Currently Eligible LKG
```

RESTORE must re-evaluate all of:

```text
1. Knowledge version exists
2. valid Promotion Decision exists
3. Lifecycle is runtime-eligible
4. CURRENT Verification is valid now
5. Verification Policy has not expired it
6. Runtime Target policy is compatible
7. no exclusive supersession conflict exists
8. Human / local Authority requirement is satisfied
```

Prior Binding Decisions must not be re-enabled as-is. RESTORE always creates
a new Decision Record (INV-LRN-024, AC-27).

On failure: DENY or HOLD. Do not automatically continue on a newer version
solely because restore failed.

## Exclusive supersession ordering

For exclusive replacement of same scope / applicability:

```text
V2 eligibility confirmed
  → V1 UNBIND authorized
  → V1 UNBIND verified
  → V2 BIND authorized
  → V2 BIND verified
```

If V1 UNBIND is not verified, V2 Binding = HOLD (INV-LRN-027, AC-33).

Atomic UNBIND+BIND is allowed only as a single Authority Transaction; partial
success must not be treated as ACTIVE.

## Resolution

```yaml
resolutionKey:
  contractType: RuntimeKnowledgeBindingDecision@v1
  subjectRef: ""
  subjectVersion: ""
  runtimeTargetRef: ""
```

Ambiguous heads fail closed (INV-LRN-021).

## Rules

1. Knowledge Registry / Distribution / Agent Control Plane must not mint
   Binding Decisions implicitly.
2. BIND* requires Promotion Decision for the same knowledge version and a
   CURRENT* Verification Decision that passes freshness policy.
3. Confidence thresholds must not grant binding (INV-LRN-028).
4. Append-only; LKG history must remain auditable per runtime target.
5. Knowledge Record must not mutate to store this Decision ref (INV-LRN-023).
