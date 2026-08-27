# Knowledge Record Content Template V1

Aligned to `WAEP-LEARNING-SYSTEM-V1` Definition Correction-1.

```text
Content only.
No authoritative lifecycle / confidence / validation / promotion /
runtime binding / CURRENT fields.
```

```yaml
knowledgeId: K-XXX
contractVersion: "WAEP-LEARNING-SYSTEM-V1"
knowledgeVersion: "1.0.0"
title: RULE_NAME

scopeClass: PROJECT|DOMAIN|ENGINEERING

applicability:
  appliesTo: []
  doesNotApplyTo: []

content:
  generalizedRule: ""
  rationale: ""
  nonGoals: []
  observedFailureSummary: ""     # minimized / generalized; no sensitive payload
  rootCauseSummary: ""           # unknown remains unknown

source:
  candidateRef: "KC-..."
  candidateVersion: "1.0.0"

evidenceRefs:
  - "EV-..."

decisionRefs:
  validationDecisionRef: "KVD-..."
  promotionDecisionRef: "KPD-..."
  lifecycleDecisionRef: "KLD-..."
  verificationDecisionRef: "KVER-..."
  runtimeBindingDecisionRefs: []

supersedes: []
supersededBy: null

createdAt: YYYY-MM-DDThh:mm:ssZ
contentDigest: ""

# FORBIDDEN as authoritative fields on this record:
# status, confidence, approvedBy, approvedAt, validationResult,
# promotionResult, runtimeBindingStatus, active, CURRENT
```

## Rules

- Evidence must be attributable via Evidence Records, not inlined secrets.
- Unknown root cause must remain unknown rather than guessed.
- Personal / sensitive / production raw material must not be copied into content.
- Decision outcomes are resolved from external Decision Records only.
- Maturity / ACTIVE / CURRENT are derived states, never self-declared here.
