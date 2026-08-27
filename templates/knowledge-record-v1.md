# Knowledge Record V1

```yaml
knowledgeId: AK-XXX
title: RULE_NAME

source:
  repository: owner/repo
  evidence:
    - type: issue|pr|adr|test|incident|review|reconciliation
      reference: ""

observedFailure: ""
rootCause: ""
generalizedRule: ""

classification:
  scopeClass: PROJECT|DOMAIN|ENGINEERING
  applicability: SOURCE_ONLY|CANDIDATE|ADOPTED_EQUIVALENT|ADOPTED_EXACT|SUPERSEDED|NOT_APPLICABLE

boundaries:
  appliesTo: []
  doesNotApplyTo: []
  sensitiveDataIncluded: false

enforcement:
  types: [] # DOC|POLICY|TEST|LINT|CI|HUMAN_GATE|RUNTIME_GATE
  references: []

maturity:
  level: L0_OBSERVED|L1_DOCUMENTED|L2_GENERALIZED|L3_ADOPTED|L4_ENFORCED|L5_PROVEN_CROSS_REPO
  status: ACTIVE|HOLD|SUPERSEDED|DEPRECATED

verification:
  firstSeen: YYYY-MM-DD
  lastVerified: YYYY-MM-DD
  reviewer: ""
  notes: ""
```

## Required Rules

- Evidence must be attributable.
- Unknown root cause must remain unknown rather than guessed.
- Personal/sensitive material must not be copied into the record.
- Structural equivalence is not proof of causal transfer.
- Maturity does not grant implementation or execution authority.
