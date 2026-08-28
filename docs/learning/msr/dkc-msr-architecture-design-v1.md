# DKC-MSR-ARCHITECTURE-DESIGN-V1

## 0. Status and Authority

```text
Definition: DKC-MSR-ARCHITECTURE-DESIGN-V1
Revision: Definition Start
Definition State: DRAFT / NOT LOCKED
Definition Start: GO
Parent Definition: DEVELOPMENT-KNOWLEDGE-COMPOUND-V1 Definition Correction-2
Parent Definition State: LOCKED
Parent Locked Definition Blob: a17ede815d9c9f3efc4292e9db8d24edca19b9d3
Parent Submission Contract Blob: 26c9764abf41106b9faba5bd5f5bb25323961b7f
Parent Lock Decision Record: docs/learning/reviews/development-knowledge-compound-definition-lock-go.md
Parent Lock Record Blob: 15c9d391f6efdd2efddad7dab8db84abfe9cad39
Parent Branch Commit at Definition Start: 978e60850274c743b12111ef29346a074b1108fa
MSR Research Evidence: ACCEPTED
Accepted Research Content Blob: b6adb8b9d814d0ae9301c7f54e40af16ed87c83d
Gap Analysis: Issue #25 COMPLETED
Architecture Definition Issue: #31
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Repository Source Adapter Execution: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Knowledge Promotion: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: Independent Definition Review-1
```

This Definition owns MSR-specific acquisition, evidence identity, provenance,
linking, inference, and rebuildable projection semantics beneath the locked DKC
boundary.

It does not reopen the locked DKC responsibility model.

```text
MSR Architecture Definition
  != DKC Base Definition Correction
  != Technology Adoption
  != Implementation Start
  != Runtime Authority
  != Repository Mutation Authority
```

---

## 1. Purpose

Define a deterministic architecture for converting repository and development
system observations into evidence-linked `DevelopmentEvent@v1` projections that
can be consumed by DKC Candidate Extraction without confusing:

```text
Source-native Evidence
Derived Evidence
Inference
Knowledge Candidate
Authoritative Knowledge
Execution Authority
```

The architecture centerline is:

```text
Source Systems
    ↓
READ-ONLY Source Adapters
    ↓
Sensitive Data Gate
    ↓
Canonical Evidence Snapshot
    ↓
Event Normalizer
    ↓
Evidence-aware Entity Linker
    ↓
Optional Specialized Analyzers
    ↓
DevelopmentEvent@v1 projection
    ↓
DKC Candidate Extraction
    ↓
KnowledgeCandidateSubmission@v1
```

---

## 2. Non-goals

This Definition does not authorize or define:

```text
Repository writes
Issue / PR mutation
Branch mutation
Workflow mutation
Dependency installation in production
Automatic Root Cause confirmation
Automatic Knowledge Promotion
Validated Scope decisions
Runtime Knowledge Binding
Execution Authority
Agent direct ACTIVE / CURRENT declaration
Personal productivity ranking
Customer production data ingestion
Credential persistence
```

External tools named in research remain `RESEARCH_CANDIDATE` only.

---

## 3. Canonical / Derived Boundary

### 3.1 Canonical source rule

Canonical MSR Evidence is a sanitized, identity-fixed observation of a
source-native development object or source-native relation.

```text
Source-native / Canonical Evidence
  != Derived Graph
  != Link Inference
  != Analyzer Inference
  != Knowledge Candidate
  != Authoritative Knowledge
```

A projection may be useful without being canonical.

### 3.2 Rebuild rule

All Derived MSR projections must be rebuildable from Canonical Evidence plus a
versioned derivation manifest.

Loss of a Derived Projection must not change:

```text
Canonical Evidence identity
Knowledge Candidate authority
Authoritative Knowledge lifecycle
Runtime Authority
```

---

## 4. Source Repository Identity

### 4.1 Stable repository identity

A repository must not be identified only by mutable owner/name, branch, URL, or
timestamp.

Minimum repository identity:

```yaml
sourceRepository:
  provider: GITHUB|GIT|OTHER
  repositoryId: "provider-stable-id"
  repositoryNameSnapshot: "owner/name-at-retrieval"
  canonicalUrlSnapshot: ""
  defaultBranchNameSnapshot: ""
```

Rules:

```text
provider + repositoryId = stable repository identity within provider scope
repositoryNameSnapshot = mutable display evidence, not stable identity
canonicalUrlSnapshot = retrieval-time evidence, not stable identity
branch name = never sufficient stable identity
```

If a provider cannot supply a stable repository ID, the adapter must emit
`identityState: UNVERIFIABLE` unless another immutable identity contract is
explicitly defined for that provider.

### 4.2 Repository family metadata

Cross-repository analysis may carry:

```yaml
repositoryFamily:
  familyId: ""
  relationship: INDEPENDENT|FORK|MIRROR|DUPLICATE|UNKNOWN
  relatedRepositoryRefs: []
  evidenceRefs: []
```

`UNKNOWN` must not be silently treated as `INDEPENDENT`.

---

## 5. Source Object Identity

### 5.1 Common identity envelope

```yaml
sourceObject:
  provider: ""
  repositoryId: ""
  objectType: ISSUE|PULL_REQUEST|REVIEW|COMMIT|CHANGED_FILE|CHECK_RUN|CHECK_SUITE|WORKFLOW_RUN|JOB|TEST_EVIDENCE|ADR|DEFINITION|REVIEW_RECORD|OTHER
  providerObjectId: ""
  providerNodeId: null
  exactCommitSha: null
  pathSnapshot: null
  urlSnapshot: ""
  objectVersionToken: null
```

At least one source-type-specific immutable identity member is required.

### 5.2 Identity rules by source type

```text
Commit:
  exactCommitSha REQUIRED

Changed File:
  exactCommitSha + pathSnapshot REQUIRED
  content blob / digest SHOULD be retained when available

Issue / Pull Request / Review:
  providerObjectId REQUIRED
  providerNodeId SHOULD be retained when provider exposes it

Check Run / Check Suite / Workflow Run / Job:
  provider execution object ID REQUIRED
  associated commit SHA SHOULD be retained when available

ADR / Definition / Review Record:
  canonical repository path + exact commit/blob identity REQUIRED when Git-backed
```

Mutable title, state, branch, URL, timestamp, or filename alone is not an
identity.

---

## 6. Acquisition and Provenance

Every Canonical Evidence Snapshot must preserve acquisition provenance.

```yaml
provenance:
  retrievalMethod: REST|GRAPHQL|GIT|FILE|OTHER
  retrievedAt: "ISO-8601 UTC"
  adapterName: ""
  adapterVersion: ""
  sourceEndpointClass: ""
  requestSchemaVersion: null
  responseSchemaVersion: null
  sourceVersionToken: null
```

Rules:

```text
Adapter name without version = insufficient for reproducible derivation
retrievedAt = observation time, not stable source identity
sourceVersionToken = evidence of observed source version, not authority
```

---

## 7. Sensitive Data Gate

### 7.1 Placement

The Sensitive Data Gate runs before Canonical Evidence persistence.

```text
Acquired Source Payload
        ↓
Sensitive Data Gate
        ├─ REJECT
        ├─ SANITIZE
        └─ ALLOW
        ↓
Canonical Evidence Persistence
```

### 7.2 Prohibited raw material

The following must not be persisted into the Knowledge Plane or MSR Canonical
Evidence store as raw payload:

```text
passwords
access tokens
refresh tokens
cookies
session identifiers
API keys
private keys
raw authentication headers
customer production payload containing prohibited personal data
other policy-prohibited secrets or sensitive values
```

### 7.3 Sanitization record

```yaml
sensitiveDataGate:
  decision: ALLOW|SANITIZE|REJECT
  policyVersion: ""
  redactionClasses: []
  sanitizerVersion: null
  sanitizedDerivedEvidence: false
  prohibitedRawPersisted: false
```

For `REJECT`, no Canonical Evidence payload is persisted.

For `SANITIZE`, only the sanitized representation may become Canonical Evidence,
and it must be labeled as sanitized / redacted derived evidence where applicable.

### 7.4 Digest safety

A raw pre-sanitization digest is not universally safe because low-entropy secret
material may be guessable.

Therefore:

```yaml
rawPayloadDigest:
  status: RECORDED|SUPPRESSED
  algorithm: null
  value: null
  suppressionReason: null
```

`RECORDED` is permitted only when policy explicitly permits retaining the digest
for the source class.

`SUPPRESSED` is required for prohibited raw secret/auth material unless a
separate policy authorizes a safe keyed or non-reversible evidence mechanism.

The sanitized Canonical Evidence digest remains mandatory.

---

## 8. Canonical Evidence Snapshot Contract

```yaml
canonicalEvidenceSnapshot:
  contractType: CanonicalEvidenceSnapshot@v1
  snapshotId: ""
  sourceRepository: {}
  sourceObject: {}
  provenance: {}
  sensitiveDataGate: {}
  canonicalizationVersion: ""
  sanitizedPayloadDigest:
    algorithm: SHA-256
    value: ""
  rawPayloadDigest:
    status: RECORDED|SUPPRESSED
    algorithm: null
    value: null
    suppressionReason: null
  evidencePayloadRef: ""
  observedAt: "ISO-8601 UTC"
```

### 8.1 Snapshot resolution identity

A snapshot resolution identity must include:

```text
provider
repositoryId
source object immutable identity
canonicalizationVersion
sanitizedPayloadDigest
```

Re-ingesting the same resolution identity is idempotent.

A changed sanitized payload digest creates a new snapshot version; it does not
mutate the prior snapshot in place.

### 8.2 Canonical snapshot key

```yaml
canonicalSnapshotKey:
  provider: ""
  repositoryId: ""
  sourceObjectType: ""
  sourceObjectIdentity: ""
  canonicalizationVersion: ""
  sanitizedPayloadDigest: ""
```

`retrievedAt` is not part of the stable snapshot identity.

---

## 9. Event Normalization

The Event Normalizer may derive a DKC-compatible projection from one or more
Canonical Evidence Snapshots.

```yaml
developmentEventProjection:
  contractType: DevelopmentEvent@v1
  developmentEventId: ""
  sourceRepository: ""
  sourceEventType: ""
  sourceEventId: ""
  sourceArtifactRef: ""
  sourceRevision: ""
  observedAt: ""
  contentDigest: ""
  canonicalEvidenceRefs: []
  derivationManifestRef: ""
```

Rules:

```text
DevelopmentEvent@v1 projection != Canonical Evidence Snapshot
Normalization != Knowledge Candidate generation
Normalization must preserve source evidence refs
```

---

## 10. Evidence-aware Entity Link Taxonomy

Every relation is classified into exactly one method class:

```text
PLATFORM_RELATION
EXPLICIT_DECLARATION
DETERMINISTIC_DERIVATION
HEURISTIC_INFERENCE
MODEL_INFERENCE
```

Definitions:

| Link Method | Meaning |
| --- | --- |
| `PLATFORM_RELATION` | Provider exposes the relation natively by stable object/reference identity |
| `EXPLICIT_DECLARATION` | Human-authored source text explicitly declares a relation and the declaration is retained as evidence |
| `DETERMINISTIC_DERIVATION` | Reproducible rule derives the relation with no heuristic/model judgment |
| `HEURISTIC_INFERENCE` | Versioned heuristic proposes the relation |
| `MODEL_INFERENCE` | Model-based inference proposes the relation |

`PLATFORM_RELATION` must not be fabricated from text similarity or naming
conventions.

---

## 11. Link Provenance Contract

```yaml
entityLink:
  contractType: EvidenceEntityLink@v1
  linkId: ""
  sourceObjectRef: ""
  targetObjectRef: ""
  linkMethod: PLATFORM_RELATION|EXPLICIT_DECLARATION|DETERMINISTIC_DERIVATION|HEURISTIC_INFERENCE|MODEL_INFERENCE
  evidenceClass: SOURCE_NATIVE|DECLARED|DETERMINISTIC|HEURISTIC|MODEL
  confidence: null
  evidenceRefs: []
  conflictState: NONE|CONFLICT|UNKNOWN
  inferenceEnvelopeRef: null
  derivationManifestRef: null
```

### 11.1 Confidence semantics

```text
PLATFORM_RELATION / DETERMINISTIC_DERIVATION:
  confidence numeric score is not required and must not be used as authority.

HEURISTIC_INFERENCE / MODEL_INFERENCE:
  confidence MAY be present as non-authoritative model/heuristic metadata.

Any confidence value:
  != Verification
  != Root Cause confirmation
  != Knowledge Promotion
  != Runtime Authority
```

### 11.2 Conflict preservation

Conflicting relation evidence must be retained.

```text
CONFLICT != select highest confidence and discard others
UNKNOWN != false
UNKNOWN != PLATFORM_RELATION
```

A consumer requiring a single relation must fail closed or request an external
resolution decision.

---

## 12. CI / Test Evidence Separation

### 12.1 CI execution evidence

```yaml
ciExecutionEvidence:
  workflowRunRef: ""
  jobRef: null
  checkRunRefs: []
  associatedCommitSha: ""
  executionResult: ""
  evidenceRefs: []
```

This supports claims such as:

```text
A CI execution exists for commit X.
The workflow/job/check reported result Y.
```

### 12.2 Specific test evidence

```yaml
specificTestEvidence:
  testEvidenceId: ""
  testIdentity: ""
  executionRef: ""
  targetRevisionRef: ""
  result: PASS|FAIL|SKIP|UNKNOWN
  testArtifactRefs: []
  evidenceRefs: []
```

Rules:

```text
Commit has CI result
  != specific test verified this change

Workflow success
  != proof that every relevant test executed

Specific test evidence requires an explicit test identity + execution relation.
```

---

## 13. Failure / Root Cause Analyzer Boundary

MSR analyzers must preserve these distinct concepts:

```text
ObservedSymptom
SuspectedCauseCandidate
SuspectedIntroducingCommit
VerifiedRootCause Reference
Correction Reference
RegressionVerification Reference
```

Minimum analyzer output:

```yaml
failureAnalysisCandidate:
  observedSymptomRefs: []
  suspectedCauseCandidates: []
  suspectedIntroducingCommitRefs: []
  inferenceEnvelopeRefs: []
  verifiedRootCauseDecisionRef: null
  correctionRefs: []
  regressionVerificationRefs: []
```

Rules:

```text
SZZ result = SuspectedIntroducingCommit candidate
Similarity result = inference candidate
LLM explanation = inference candidate

SZZ / similarity / LLM inference
  != VerifiedRootCause
```

`verifiedRootCauseDecisionRef` may reference an external authoritative decision;
an analyzer must not mint that authority itself.

---

## 14. Rationale Evidence

Rationale Evidence and Rationale Candidate are different records.

### 14.1 Typed rationale evidence sources

```text
Issue description
PR description
Review comment
Commit message
Code diff
Test addition / modification
ADR
Definition Correction
Independent Review / Re-Review record
```

```yaml
rationaleEvidence:
  evidenceRef: ""
  sourceObjectRef: ""
  evidenceType: ""
  canonicalSnapshotRef: ""
```

### 14.2 Rationale candidate

```yaml
rationaleCandidate:
  candidateId: ""
  statement: ""
  evidenceRefs: []
  inferenceEnvelopeRef: null
  verificationState: UNVERIFIED|EVIDENCE_LINKED|EXTERNALLY_VERIFIED
```

`EXTERNALLY_VERIFIED` requires a referenced external verification record.

A rationale candidate does not become authoritative because it summarizes
multiple evidence sources.

---

## 15. LLM / Heuristic Inference Envelope

All non-deterministic inference must carry a versioned envelope.

```yaml
inferenceEnvelope:
  inferenceId: ""
  isInferred: true
  inferenceMethod: HEURISTIC|MODEL
  modelId: null
  modelVersion: null
  heuristicId: null
  heuristicVersion: null
  sourceRefs: []
  schemaId: ""
  schemaValidation: PASS|FAIL|NOT_RUN
  referenceValidation: PASS|FAIL|PARTIAL|NOT_RUN
  producedAt: ""
  verificationState: UNVERIFIED|EVIDENCE_LINKED|EXTERNALLY_VERIFIED
  outputDigest: ""
```

Rules:

```text
LLM output != Evidence
LLM output != Authoritative Knowledge
Schema validation != factual verification
Reference validation != Authority Decision
Model confidence != Verification Authority
```

Model-generated claims without evidence refs remain `UNVERIFIED` and must not be
represented as source-native facts.

---

## 16. Derived Projection Manifest

AST, CPG, Knowledge Graph, repository memory, search index, vector index, and
process-mining logs are Derived Projections.

```yaml
derivedProjectionManifest:
  projectionId: ""
  projectionType: AST|CPG|KNOWLEDGE_GRAPH|REPOSITORY_MEMORY|SEARCH_INDEX|VECTOR_INDEX|PROCESS_EVENT_LOG|OTHER
  canonicalEvidenceRefs: []
  derivationTool: ""
  derivationToolVersion: ""
  derivationConfigDigest: ""
  projectionSchemaVersion: ""
  projectionContentDigest: ""
  rebuildable: true
  canonicalAuthority: false
```

A projection with `rebuildable != true` cannot be relied upon as the only copy
of evidence required for DKC traceability.

---

## 17. Process Mining Projection

Process mining uses a Derived event-log projection.

Minimum projection:

```yaml
processEvent:
  case_id: ""
  activity: ""
  timestamp: ""
  evidence_ref: ""
  developmentEventRef: ""
```

Expected and observed process may be compared, but:

```text
Process deviation
  = Evidence-linked Observation / Candidate input
  != Authority Violation
  != Policy Breach confirmation
  != Individual performance judgment
```

Process-mining outputs remain Derived Projections.

---

## 18. Cross-Repository Validation Boundary

A single repository observation must not automatically become a cross-repository
rule.

Cross-repository validation records must retain context:

```yaml
crossRepositoryValidationContext:
  sourceRepositoryRefs: []
  repositoryFamilyRefs: []
  independentRepositoryRefs: []
  forkMirrorDuplicateRefs: []
  languageContext: []
  frameworkContext: []
  domainContext: []
  repositorySizeContext: []
  activityContext: []
  replicationEvidenceRefs: []
  counterexampleEvidenceRefs: []
```

Rules:

```text
fork / mirror / duplicate != independent replication
UNKNOWN family relation != independent replication
counterexamples must be retained
language/framework/domain differences must not be erased from applicability
replication count must not double-count known duplicate families
```

Cross-repository evidence may support a DKC Candidate; it does not self-promote
that Candidate.

---

## 19. Adapter Authority Boundary

### 19.1 Allowed Definition-level responsibilities

```text
READ
EXTRACT
NORMALIZE
LINK
DIGEST
PROVENANCE
SANITIZE under policy
DERIVED ANALYSIS
```

### 19.2 Explicitly denied authority

```text
Repository Mutation
Issue / PR Mutation
Branch Mutation
Workflow Mutation
Knowledge Promotion
Validated Scope Decision
Authoritative Root Cause Decision
Runtime Binding
Execution Authority
Ready
Merge
Deploy
LIVE WRITE
```

An adapter returning a successful result does not grant any denied authority.

---

## 20. Candidate Component Mapping

All mappings below are research candidates, not adoption decisions.

| Component | Candidate Role | Classification |
| --- | --- | --- |
| GitHub REST / GraphQL / Checks / Actions | GitHub Source Adapter | RESEARCH_CANDIDATE |
| PyDriller | Git History Adapter | RESEARCH_CANDIDATE |
| GrimoireLab Perceval | Multi-source Extraction Reference | RESEARCH_CANDIDATE |
| Coming | AST / Diff Analyzer Reference | RESEARCH_CANDIDATE |
| Joern | CPG / Structural Analyzer Reference | RESEARCH_CANDIDATE |
| SZZ family | Suspected Introducing Commit Inference | RESEARCH_CANDIDATE |
| RegMiner | Regression Miner Reference | RESEARCH_CANDIDATE |
| ADRMiner | Rationale Extraction Reference | RESEARCH_CANDIDATE |
| PM4Py | Process Mining Reference | RESEARCH_CANDIDATE |
| Software Heritage / World of Code | Cross-Repository Validation Reference | RESEARCH_CANDIDATE |
| codebase-memory-mcp | Derived Graph / Retrieval Reference | RESEARCH_CANDIDATE |

```text
RESEARCH_CANDIDATE != ADOPTED
Available OSS != Dependency Addition Authority
Useful Technique != Runtime Authority
```

---

## 21. Parent DKC Compatibility

This Definition preserves locked DKC invariants including:

```text
Development Event != Knowledge Candidate
Knowledge Candidate != Authoritative Knowledge
Candidate existence != Knowledge existence
DKC does not own Authoritative Lifecycle
DKC does not own Runtime Binding / Eligibility
Candidate Generation Authority != Promotion Authority
Contradicting evidence is retained
Cross-Repository Promotion requires external decision authority
Automatic Knowledge Promotion = PROHIBITED
Derived retrieval state is not Canonical Authority
```

This Definition adds MSR acquisition/projection semantics without granting new
DKC authority.

If the Parent locked Definition blob changes, this Definition requires Parent
Compatibility Re-Review before lock.

---

## 22. Invariants

```text
INV-MSR-001  Mutable repository name / branch alone is not stable identity.
INV-MSR-002  Every Canonical Evidence Snapshot binds stable repository + source object identity.
INV-MSR-003  Sensitive Data Gate occurs before Canonical Evidence persistence.
INV-MSR-004  Prohibited raw secrets/auth material must not be persisted.
INV-MSR-005  Canonical Snapshot resolution is idempotent.
INV-MSR-006  PLATFORM_RELATION is distinct from heuristic/model inference.
INV-MSR-007  Conflicting link evidence is retained as CONFLICT / UNKNOWN.
INV-MSR-008  CI execution evidence != specific test evidence.
INV-MSR-009  SZZ / similarity / LLM inference != Verified Root Cause.
INV-MSR-010  Rationale Evidence != Rationale Candidate.
INV-MSR-011  LLM output != Evidence and != Authoritative Knowledge.
INV-MSR-012  Derived Projections are rebuildable and non-canonical.
INV-MSR-013  Process deviation != Authority Violation.
INV-MSR-014  fork / mirror / duplicate != independent replication.
INV-MSR-015  Adapter capability grants no mutation, promotion, or execution authority.
INV-MSR-016  Cross-repository counterexamples are retained.
INV-MSR-017  Confidence metadata grants no authority.
```

---

## 23. Validation Scenarios

```text
MSR-V01 Repository renamed but repositoryId unchanged
        → same stable repository identity; new name snapshot retained.

MSR-V02 Branch name matches but repositoryId differs
        → different repository identity.

MSR-V03 Secret appears in acquired payload
        → Sensitive Data Gate REJECT or SANITIZE before persistence.

MSR-V04 Prohibited secret raw digest is not policy-approved
        → rawPayloadDigest.status = SUPPRESSED.

MSR-V05 Same source object + same sanitized digest re-ingested
        → idempotent Canonical Snapshot resolution.

MSR-V06 GitHub native PR→commit relation exists
        → PLATFORM_RELATION with source-native evidence.

MSR-V07 Commit message text mentions issue
        → EXPLICIT_DECLARATION, not PLATFORM_RELATION.

MSR-V08 Model proposes Issue↔Commit relation
        → MODEL_INFERENCE with inference envelope; not source-native evidence.

MSR-V09 Two relation sources conflict
        → conflictState=CONFLICT; both evidence sets retained.

MSR-V10 Workflow run succeeds but no named test evidence exists
        → CI success recorded; specific test verification remains UNKNOWN.

MSR-V11 SZZ identifies introducing commit candidate
        → SuspectedIntroducingCommit only.

MSR-V12 LLM explains root cause with citations
        → evidence-linked candidate only; VerifiedRootCause not emitted.

MSR-V13 Derived Knowledge Graph deleted
        → rebuild from Canonical Evidence + derivation manifest.

MSR-V14 Process miner detects review-step deviation
        → Evidence-linked Observation; no Authority Violation declaration.

MSR-V15 Fork and upstream both reproduce behavior
        → not counted as two independent replications unless independence evidence exists.

MSR-V16 Cross-repository candidate has counterexample
        → counterexample retained; no automatic generalization.

MSR-V17 Adapter library supports write API
        → write capability remains outside allowed adapter authority.
```

---

## 24. Acceptance Criteria

```text
AC-MSR-01  Repository stable identity and mutable name snapshot are separated.
AC-MSR-02  exact Commit SHA / provider object identity are retained by source type.
AC-MSR-03  retrieval method, time, adapter name, and adapter version are retained.
AC-MSR-04  Canonical Evidence Snapshot identity and idempotent resolution are defined.
AC-MSR-05  PLATFORM_RELATION / EXPLICIT / DETERMINISTIC / HEURISTIC / MODEL links are separated.
AC-MSR-06  Link provenance includes source, target, method, class, evidence refs, and conflict state.
AC-MSR-07  CI execution evidence and specific test evidence are separate contracts.
AC-MSR-08  Suspected Cause / Introducing Commit and Verified Root Cause authority are separate.
AC-MSR-09  Rationale Evidence and Rationale Candidate are separate.
AC-MSR-10  LLM / heuristic inference carries versioned metadata and validation state.
AC-MSR-11  Derived Projection is non-canonical and rebuildable from Canonical Evidence.
AC-MSR-12  Process Mining is a Derived Projection and deviation is not authority.
AC-MSR-13  Cross-repository family independence, replication, context, and counterexamples are retained.
AC-MSR-14  Sensitive Data Gate occurs before Canonical Evidence persistence.
AC-MSR-15  Adapter authority explicitly denies Repository Mutation and downstream authority.
```

---

## 25. Definition Review Checklist

Independent Definition Review-1 must verify at minimum:

```text
[ ] Parent DKC locked identity is exact and reachable.
[ ] Accepted MSR Research identity is fixed.
[ ] No Base DKC semantic authority is reopened.
[ ] All 15 Acceptance Criteria are deterministic enough to test.
[ ] Identity rules do not rely on mutable labels alone.
[ ] Secret/sensitive payload cannot persist before gate decision.
[ ] Canonical / Derived distinction is explicit.
[ ] GitHub-native relation cannot be replaced by heuristic/model inference.
[ ] CI success cannot masquerade as specific test evidence.
[ ] Analyzer inference cannot become Verified Root Cause automatically.
[ ] LLM output cannot become Evidence or Authoritative Knowledge automatically.
[ ] CONFLICT / UNKNOWN fail closed rather than silently collapse.
[ ] Fork/mirror/duplicate do not inflate independent replication.
[ ] OSS component mapping is not an adoption decision.
[ ] Adapter has no write/promotion/execution authority.
```

---

## 26. Gate Chain

```text
Definition Start GO
↓
Independent Definition Review-1
↓
Definition Correction-N if required
↓
Independent Definition Re-Review-N
↓
Human Definition Lock GO / HOLD
↓
Definition LOCKED
↓
Implementation Start separate GO / HOLD
```

Definition Review PASS does not itself authorize Definition Lock.

Definition Lock does not itself authorize Implementation Start.

---

## 27. Exit Gate

```text
Current State: DRAFT / NOT LOCKED
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Ready / Merge / Deploy: NOT AUTHORIZED
Next Gate: DKC-MSR-ARCHITECTURE-DESIGN-V1 Independent Definition Review-1
```
