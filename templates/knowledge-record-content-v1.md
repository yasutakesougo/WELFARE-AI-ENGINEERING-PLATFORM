# Knowledge Record Content Template V1

Aligned to `WAEP-LEARNING-SYSTEM-V1` Definition Correction-2.

```text
Immutable content only.
No authoritative lifecycle / confidence / validation / promotion /
runtime binding / CURRENT / maturity fields.
No mutable Decision refs / supersededBy / currentState.
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

promotionProvenanceRef: "KPD-..."   # immutable provenance fixed at creation

supersedes: []                      # prior knowledgeRef + knowledgeVersion only
# supersededBy: FORBIDDEN as stored field — derive via Registry Query

createdAt: YYYY-MM-DDThh:mm:ssZ
contentDigest: ""

# Optional on Candidate only (never authoritative):
# nonAuthoritativeAssessment:
#   confidenceNote: ""

# FORBIDDEN as authoritative / mutable fields on this record:
# status, ACTIVE, confidence, approvedBy, approvedAt, validationResult,
# promotionResult, runtimeBindingStatus, active, CURRENT, maturity,
# lifecycleDecisionRef, verificationDecisionRef, runtimeBindingDecisionRefs,
# latestDecisionRef, currentState, supersededBy
```

## Rules

- Evidence must be attributable via Evidence Records, not inlined secrets.
- Unknown root cause must remain unknown rather than guessed.
- Personal / sensitive / production raw material must not be copied into content.
- Decision outcomes are resolved from Decision Registry via
  `subjectRef + subjectVersion` (INV-LRN-023).
- Maturity / Runtime Effective ACTIVE / CURRENT are derived projections,
  never self-declared here (AC-34, AC-36).
- Content remains immutable when later Lifecycle / Verification / Binding /
  Supersession Decisions change (AC-26).
