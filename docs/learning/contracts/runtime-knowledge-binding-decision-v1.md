# RuntimeKnowledgeBindingDecision@v1

## Status

```text
Contract: RuntimeKnowledgeBindingDecision@v1
Parent: WAEP-LEARNING-SYSTEM-V1 Definition Correction-1
Implementation: NOT AUTHORIZED
```

## Purpose

Authorize, deny, unbind, or restore runtime use of a specific Knowledge
version for a specific runtime target. ACTIVE is derived from a valid Binding
Decision (INV-LRN-015), not from Knowledge Registry or Distribution logic.

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
promotionDecisionRef: "KPD-..."          # required for BIND*
verificationDecisionRef: "KVER-..."      # required for BIND*; must be CURRENT*
lifecycleDecisionRef: "KLD-..."          # optional supporting
lastKnownGoodBindingRef: null            # required for RESTORE
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
| RESTORE | Rollback to referenced Last Known Good Binding |

## Rollback

```text
Binding V1 (LKG)
  → Binding V2
  → failure
  → UNBIND V2
  → RESTORE V1   (this contract; INV-LRN-019)
```

Supersession of Knowledge content is not rollback (INV-LRN-018).

## Rules

1. Knowledge Registry / Distribution / Agent Control Plane must not mint
   Binding Decisions implicitly.
2. BIND* requires Promotion Decision for the same knowledge version and a
   CURRENT* Verification Decision.
3. Exclusive supersession for same scope/applicability requires UNBIND of the
   replaced version's ACTIVE bindings (parent §14.2).
4. Append-only; LKG history must remain auditable per runtime target.
