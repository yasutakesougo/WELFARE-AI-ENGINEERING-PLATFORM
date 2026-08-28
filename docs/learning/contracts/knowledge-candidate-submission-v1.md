# KnowledgeCandidateSubmission@v1

## Status

```text
Contract: KnowledgeCandidateSubmission@v1
Parent: DEVELOPMENT-KNOWLEDGE-COMPOUND-V1 Definition Correction-2
Supersedes contract semantics in: Definition Correction-1
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
resolutionKey:
  contractType: KnowledgeCandidateSubmission@v1
  candidateId: ""
  candidateVersion: "1.0.0"
  contentDigest: ""
selfApprovalEligibility: PROHIBITED|CONDITIONAL|INDEPENDENT_VERIFICATION_REQUIRED
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
      lineage:
        derivedFromKnowledgeRefs: []
        derivedFromDecisionRefs: []
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
selfApprovalEligible
verified
approved
```

## Resolution

```yaml
resolutionKey:
  contractType: KnowledgeCandidateSubmission@v1
  candidateId: ""
  candidateVersion: ""
  contentDigest: ""
```

Duplicate detection is required at ingestion. Re-ingest of the same
`resolutionKey` is idempotent and must not create new candidate visibility or
increase evidence strength.

## Rules

1. Canonical contract identity is version-fixed: `KnowledgeCandidateSubmission@v1`.
2. Submission binds to an immutable candidate version.
3. `creationMode`, `createdBy`, and `selfApprovalEligibility` are mandatory.
4. `evidenceRefs` must use structured `relation`; bare string arrays are forbidden.
5. Contradicting evidence refs must be preserved when present.
6. Evidence `lineage` must be present to support downstream circular-support
   detection (`INV-LRN-016`).
7. Submission ≠ Validation Decision ≠ Promotion Decision ≠ Lifecycle Decision.
8. Validated Scope is determined only by downstream Authority Decision in
   Knowledge Assetization.
9. Cross-Repository Promotion requires external Promotion Decision reference
   before Platform Candidate acceptance.
10. Append-only submission history; resubmission creates a new submission
    identity only when `candidateVersion` or `contentDigest` changes.
11. `selfApprovalEligibility` is a submission classification, not an approval
    outcome. Downstream gates must still evaluate external Decision Records.

### Self-Approval Eligibility defaults

```text
Production Runtime impact          → INDEPENDENT_VERIFICATION_REQUIRED
Safety-impacting Knowledge         → INDEPENDENT_VERIFICATION_REQUIRED
Cross-Repository Promotion         → INDEPENDENT_VERIFICATION_REQUIRED
creationMode = AUTOMATED           → PROHIBITED for same-actor Verification /
                                      Authority Decision
Local / non-production draft       → CONDITIONAL
```

## Consumer boundary

Knowledge Assetization consumes this contract and may produce:

```text
KnowledgeValidationDecision@v1
KnowledgePromotionDecision@v1
KnowledgeVerificationDecision@v1
KnowledgeLifecycleDecision@v1
```

DKC must treat those outputs as external authority only.
