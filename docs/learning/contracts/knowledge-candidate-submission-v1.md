# KnowledgeCandidateSubmission@v1

## Status

```text
Contract: KnowledgeCandidateSubmission@v1
Parent: DEVELOPMENT-KNOWLEDGE-COMPOUND-V1 Definition Correction-1
Consumer: WAEP-LEARNING-SYSTEM-V1 (Knowledge Assetization plane)
Implementation: NOT AUTHORIZED
```

## Purpose

Define the canonical handoff contract from Development Knowledge Compound to
Knowledge Assetization. This contract carries **proposed** candidate content and
provenance only. It does not carry Authoritative Knowledge state.

## Schema

```yaml
submissionId: "KCS-..."
contractVersion: "KnowledgeCandidateSubmission@v1"
submissionVersion: "1"
candidate:
  candidateId: ""
  candidateVersion: "1.0.0"
  observation: ""
  problem: ""
  suspectedRootCause: ""
  proposedRule: ""
  sourceRefs: []
  scope:
    observedIn: []
    proposedAppliesTo: []
    explicitlyNotValidatedFor: []
  evidenceRefs:
    - evidenceRef: ""
      relation: SUPPORTING|CONTRADICTING|INCONCLUSIVE
  createdBy:
    actorType: HUMAN|AGENT|SERVICE|AUTOMATION
    actorId: ""
  creationMode: HUMAN|AGENT_ASSISTED|AUTOMATED
  contentDigest: ""
submittedAt: ""
submittedBy:
  actorType: HUMAN|AGENT|SERVICE|AUTOMATION
  actorId: ""
sourceRepository: ""
crossRepositoryPromotionRequest: null   # optional; see DKC §10
contentDigest: ""
```

Optional cross-repository request shape:

```yaml
crossRepositoryPromotionRequest:
  localCandidateRef: ""
  sourceRepositoryEvidence: []
  applicabilityEvidence: []
  counterexampleAssessment: []
  targetDomainDefinition: ""
  promotionDecisionRef: ""              # required before Platform Candidate acceptance
```

## Forbidden fields

The following **must not** appear on submission payloads:

```text
ACTIVE
CURRENT
confidence / confidenceScore
validated / validationResult
productionSafe
runtimeEligible
maturity
supersessionState
lifecycleStatus
```

## Rules

1. Canonical contract identity is version-fixed: `KnowledgeCandidateSubmission@v1`.
2. Submission binds to an immutable candidate version.
3. `creationMode` and `createdBy` are mandatory.
4. Contradicting evidence refs must be preserved when present.
5. Submission ≠ Validation Decision ≠ Promotion Decision ≠ Lifecycle Decision.
6. Validated Scope is determined only by downstream Authority Decision in
   Knowledge Assetization.
7. Cross-Repository Promotion requires external Promotion Decision reference
   before Platform Candidate acceptance.
8. Append-only submission history; resubmission creates a new submission
   identity rather than mutating prior submission authority.

## Consumer boundary

Knowledge Assetization consumes this contract and may produce:

```text
KnowledgeValidationDecision@v1
KnowledgePromotionDecision@v1
KnowledgeVerificationDecision@v1
KnowledgeLifecycleDecision@v1
```

DKC must treat those outputs as external authority only.
