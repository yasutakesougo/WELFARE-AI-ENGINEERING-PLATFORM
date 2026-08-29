# DKC-IMPLEMENTATION-SCOPE-V1 — Scope Correction-1

## 0. Correction Status

```text
Scope ID: DKC-IMPLEMENTATION-SCOPE-V1
Target Slice: Slice A — Pure Domain Contracts / Candidate Resolution Kernel
Revision: Scope Correction-1
Applies To: Definition Start
Definition Start Commit: 0fa88bfa63ec7dbab87d08a339ff622e63cde144
Definition Start Blob: daa96266c09b043cd27f7060b30b9f5fdd8bf7e3
Source Review: Independent Scope Review-1
Source Review Blob: c890bd35cc47129415fbb96ccd7dd56bf403aaf2
Prior Findings: P0=0 / P1=3 / P2=2
Scope Boundary: RETAINED
Parent DKC Locked Definition Blob: a17ede815d9c9f3efc4292e9db8d24edca19b9d3
Parent Submission Contract Blob: 26c9764abf41106b9faba5bd5f5bb25323961b7f
Implementation Start: NOT AUTHORIZED
Repository Implementation Mutation: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime External I/O: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: DKC-IMPLEMENTATION-SCOPE-V1 Independent Scope Re-Review-1
```

This Correction is a normative delta over the exact Definition Start artifact.

```text
Effective Scope
  = Definition Start blob daa96266c09b043cd27f7060b30b9f5fdd8bf7e3
  + this Scope Correction-1 artifact
```

No correction below widens Slice A beyond PURE_DOMAIN.

---

## 1. P1-1 Closure — CandidateResolutionContext@v1

Finding:

```text
DKC-SCOPE-PRIOR-STATE-CONTRACT-001
```

Slice A must receive prior-domain state as an explicit pure input. It must not query persistence, network, filesystem, GitHub, cache, or any external service to resolve prior state.

### 1.1 Versioned context contract

```yaml
CandidateResolutionContext:
  contractType: CandidateResolutionContext@v1
  completeness: COMPLETE | UNKNOWN
  priorCandidates:
    - candidateRef: ""
      resolutionKey:
        contractType: KnowledgeCandidate@v1
        sourceRepository: ""
        sourceEventId: ""
        contentDigest: ""
```

Closed-world rules:

```text
contractType must equal CandidateResolutionContext@v1.
completeness must be exactly COMPLETE or UNKNOWN.
priorCandidates must be an array.
Each candidateRef must be a non-empty string.
Each resolutionKey must contain exactly the four fields shown above.
resolutionKey.contractType must equal KnowledgeCandidate@v1.
sourceRepository, sourceEventId, and contentDigest must be non-empty strings.
Unknown context fields are invalid.
```

### 1.2 Canonical lookup semantics

For target resolution key `K`:

```text
exactMatch
  = priorCandidates whose full resolutionKey equals K

sameSourceEvent
  = priorCandidates whose
      sourceRepository = K.sourceRepository
      AND sourceEventId = K.sourceEventId
```

Full resolution-key equality is field-for-field equality over:

```text
contractType
sourceRepository
sourceEventId
contentDigest
```

String equality is exact UTF-8 code-point sequence equality. No case folding, Unicode normalization, path normalization, repository-name rewriting, or whitespace trimming occurs inside Slice A.

### 1.3 Duplicate and conflicting prior-state rules

```text
No exactMatch + no sameSourceEvent + completeness=COMPLETE
  → VALID_NEW

Exactly one logical exactMatch + completeness=COMPLETE
  → VALID_EXISTING_IDEMPOTENT

No exactMatch + one or more sameSourceEvent entries with different contentDigest
+ completeness=COMPLETE
  → VALID_NEW_VERSION

completeness=UNKNOWN
  → HOLD_UNKNOWN / PRIOR_CONTEXT_INCOMPLETE
```

Duplicate context entries are handled as follows:

```text
Same full resolutionKey + same candidateRef repeated
  → collapse to one logical prior entry.

Same full resolutionKey + different candidateRef
  → HOLD_UNKNOWN / PRIOR_CONTEXT_CONFLICT.

Same candidateRef attached to different full resolutionKeys
  → HOLD_UNKNOWN / PRIOR_CONTEXT_CONFLICT.

Malformed prior entry
  → INVALID_SCHEMA / INVALID_PRIOR_CONTEXT.
```

The kernel must not infer missing prior state.

### 1.4 Prior reference output order

When priorCandidateRefs are returned, they must be unique and sorted ascending by exact UTF-8 code-point sequence of candidateRef. This removes caller/input-array order as a behavioral variable.

---

## 2. P1-2 Closure — Closed-World KnowledgeCandidateDraft@v1

Finding:

```text
DKC-SCOPE-CANDIDATE-SCHEMA-CLOSED-WORLD-001
```

### 2.1 Candidate contract

Slice A validates the following closed-world input contract:

```yaml
KnowledgeCandidateDraft:
  candidateId: ""
  contractVersion: DEVELOPMENT-KNOWLEDGE-COMPOUND-V1
  candidateVersion: ""
  observation: ""
  problem: ""
  suspectedRootCause: ""
  proposedRule: ""
  sourceRefs: []
  evidenceRefs:
    - evidenceRef: ""
      relation: SUPPORTING | CONTRADICTING | INCONCLUSIVE
      lineage:
        derivedFromKnowledgeRefs: []
        derivedFromDecisionRefs: []
  scope:
    observedIn: []
    proposedAppliesTo: []
    explicitlyNotValidatedFor: []
  createdBy:
    actorType: HUMAN | AGENT | SERVICE | AUTOMATION
    actorId: ""
  creationMode: HUMAN | AGENT_ASSISTED | AUTOMATED
  createdAt: ""
  contentDigest: ""
  nonAuthoritative: true
```

`lineage` is optional. If present, its two arrays are mandatory and no other lineage fields are allowed.

`nonAuthoritative` is optional. If present, its only valid value is literal `true`.

### 2.2 Required fields

All top-level fields above are required except:

```text
nonAuthoritative
```

Within each evidence reference, `lineage` is optional.

Within `lineage`, both arrays are required when lineage is present.

### 2.3 Type and empty-value rules

Non-empty strings are required for:

```text
candidateId
candidateVersion
contentDigest
createdAt
createdBy.actorId
all sourceRefs entries
evidenceRef
all lineage reference entries
all scope-array entries when an entry exists
```

`contractVersion` must exactly equal `DEVELOPMENT-KNOWLEDGE-COMPOUND-V1`.

The following must be strings but MAY be empty because the locked parent Definition does not establish semantic non-empty completeness rules for them:

```text
observation
problem
suspectedRootCause
proposedRule
```

Slice A validates schema/shape, not epistemic completeness.

All arrays may be empty unless another invariant in this Scope requires an entry.

### 2.4 Unknown-field policy

KnowledgeCandidateDraft is closed-world.

Any unknown top-level or nested object member is rejected.

```text
unknown non-authority field
  → INVALID_SCHEMA / UNKNOWN_FIELD

known authority-bearing field
  → INVALID_AUTHORITY_FIELD / AUTHORITY_FIELD_PROHIBITED
```

### 2.5 Forbidden authority-bearing fields

The following field names are explicitly prohibited at any Candidate top-level input position:

```text
active
current
status
lifecycleStatus
confidence
confidenceScore
validated
validationResult
validatedScope
productionSafe
runtimeEligible
runtimeBinding
maturity
supersessionState
authoritativeLifecycle
selfApprovalEligible
verified
verificationResult
authorityDecision
promotionDecision
runtimeBindingDecision
```

Comparison of these forbidden field names is ASCII case-insensitive so that case variation cannot bypass rejection.

Any other unknown field remains rejected by the closed-world schema even if it is not recognized as authority-bearing.

Slice A does not attempt semantic synonym inference beyond the explicit forbidden set.

### 2.6 Non-authoritative annotation rule

`nonAuthoritative: true` is only a marker that the candidate remains non-authoritative.

It does not authorize arbitrary annotation members and does not relax the closed-world field policy.

---

## 3. P1-3 Closure — Reproducible Toolchain Boundary

Finding:

```text
DKC-SCOPE-TOOLCHAIN-REPRODUCIBILITY-001
```

### 3.1 Implementation language and runtime family

The intended Slice A implementation toolchain is fixed to:

```text
Language: TypeScript
Module model: ESM
Node.js major: 22
Package manager: npm 10
Compiler/typecheck: TypeScript 5.9.2
Unit test runner: Vitest 3.2.4
```

The exact Node.js and npm patch versions used by an implementation and by an independent verifier must be captured in implementation evidence.

### 3.2 Package-local configuration policy

Future implementation mutation, only after separate Human Implementation Start GO, may use these package-local paths under the already closed-world package path:

```text
packages/development-knowledge-compound-kernel/package.json
packages/development-knowledge-compound-kernel/package-lock.json
packages/development-knowledge-compound-kernel/tsconfig.json
packages/development-knowledge-compound-kernel/vitest.config.ts
packages/development-knowledge-compound-kernel/src/**
packages/development-knowledge-compound-kernel/test/**
```

Root package manifests and root workflows remain outside this Scope.

### 3.3 Dependency authority

Candidate development-only dependency set:

```text
typescript = 5.9.2
vitest = 3.2.4
```

These versions are fixed for reproducibility and may not use semver ranges in the package-local manifest.

```text
Scope Correction-1
  != Dependency Addition GO
```

Adding these devDependencies still requires a separate explicit Dependency Addition decision before repository implementation mutation if they are not already authorized at the exact implementation baseline.

No runtime dependency is authorized.

No other devDependency is in scope.

### 3.4 Reproducible commands

Once both Implementation Start and any required Dependency Addition Gate are separately GO, the required package-local verifier sequence is:

```bash
npm --prefix packages/development-knowledge-compound-kernel ci
npm --prefix packages/development-knowledge-compound-kernel test
npm --prefix packages/development-knowledge-compound-kernel run typecheck
```

Required scripts:

```json
{
  "test": "vitest run",
  "typecheck": "tsc --noEmit"
}
```

Fresh verification must succeed using only the package-local lockfile and declared dependencies. Undeclared global TypeScript/Vitest installations must not be used as evidence.

### 3.5 Lockfile requirement

`package-lock.json` is mandatory when dependencies are authorized and present.

Independent verification must use `npm ci`, not an unconstrained install, so the tested dependency graph is bound to the committed lockfile.

---

## 4. P2-1 Closure — Evidence Deduplication and Conflict Semantics

Finding:

```text
DKC-SCOPE-EVIDENCE-DEDUP-SEMANTICS-001
```

### 4.1 Evidence identity key

For Slice A normalization, exact duplicate equality is based on the versioned structured tuple:

```text
EvidenceIdentity@v1
  = evidenceRef
  + relation
  + canonicalLineage
```

where `canonicalLineage` is:

```text
NONE
```

when lineage is absent, otherwise:

```text
derivedFromKnowledgeRefs = unique values sorted ascending by exact UTF-8 code-point sequence
derivedFromDecisionRefs  = unique values sorted ascending by exact UTF-8 code-point sequence
```

### 4.2 Duplicate behavior

```text
Same EvidenceIdentity@v1 repeated
  → normalize to one entry.
```

This normalization does not increase evidence count or evidence strength.

### 4.3 Same evidenceRef with different relation

If the same `evidenceRef` occurs with different relations:

```text
retain every distinct relation entry
set evidenceConflict = true
never rewrite CONTRADICTING or INCONCLUSIVE to SUPPORTING
never drop the weaker/contradictory entry
```

This condition does not itself create Authoritative Knowledge or a validation decision.

The normalized evidence list is ordered by:

```text
evidenceRef ascending
then relation in fixed order SUPPORTING < CONTRADICTING < INCONCLUSIVE
then canonicalLineage lexical representation ascending
```

Input order therefore does not affect output order.

---

## 5. P2-2 Closure — CandidateResolutionResult@v1

Finding:

```text
DKC-SCOPE-RESULT-PAYLOAD-CONTRACT-001
```

### 5.1 Common result envelope

Every Slice A result must use:

```yaml
CandidateResolutionResult:
  contractType: CandidateResolutionResult@v1
  resultClass: ""
  authority: NON_AUTHORITATIVE
  errorIds: []
  holdReasonIds: []
  evidenceConflict: false
```

`authority` must always equal `NON_AUTHORITATIVE`.

### 5.2 Valid result payload

For:

```text
VALID_NEW
VALID_EXISTING_IDEMPOTENT
VALID_NEW_VERSION
```

result additionally contains:

```yaml
resolutionKey:
  contractType: KnowledgeCandidate@v1
  sourceRepository: ""
  sourceEventId: ""
  contentDigest: ""
candidateRef: ""
priorCandidateRefs: []
normalizedEvidenceRefs: []
```

Rules:

```text
VALID_NEW:
  candidateRef = current candidateId
  priorCandidateRefs = []

VALID_EXISTING_IDEMPOTENT:
  candidateRef = canonical prior candidateRef for exact match
  priorCandidateRefs = [that same canonical prior candidateRef]

VALID_NEW_VERSION:
  candidateRef = current candidateId
  priorCandidateRefs = all logical same-source-event prior candidateRefs,
                       unique and canonically sorted
```

Valid results have:

```text
errorIds = []
holdReasonIds = []
```

### 5.3 Invalid result payload

For:

```text
INVALID_SCHEMA
INVALID_EVIDENCE_REFERENCE
INVALID_AUTHORITY_FIELD
INVALID_IDENTITY
```

result contains no valid `resolutionKey` and no authoritative/candidate resolution conclusion.

At least one stable `errorIds` value is required.

Minimum stable IDs used by this Correction are:

```text
UNKNOWN_FIELD
AUTHORITY_FIELD_PROHIBITED
INVALID_PRIOR_CONTEXT
MISSING_REQUIRED_FIELD
INVALID_FIELD_TYPE
EMPTY_REQUIRED_VALUE
INVALID_CONTRACT_VERSION
INVALID_EVIDENCE_RELATION
INVALID_RESOLUTION_IDENTITY
```

### 5.4 HOLD_UNKNOWN result payload

For `HOLD_UNKNOWN`:

```text
errorIds = []
at least one holdReasonIds value is required
no valid resolutionKey is emitted
```

Minimum hold reason IDs:

```text
PRIOR_CONTEXT_INCOMPLETE
PRIOR_CONTEXT_CONFLICT
```

`HOLD_UNKNOWN` must never be promoted to a VALID_* result by fallback behavior.

---

## 6. Validation Additions

Scope Correction-1 adds the required scenarios from Review-1:

```text
DKC-SC1-V15 Empty COMPLETE prior context + valid Candidate
            → VALID_NEW.

DKC-SC1-V16 Exact resolution key already present in COMPLETE prior context
            → VALID_EXISTING_IDEMPOTENT.

DKC-SC1-V17 Same sourceRepository/sourceEventId but different prior contentDigest
            → VALID_NEW_VERSION.

DKC-SC1-V18 completeness=UNKNOWN or conflicting prior context
            → HOLD_UNKNOWN with deterministic holdReasonIds.

DKC-SC1-V19 Candidate missing a locked required Candidate field
            → INVALID_SCHEMA / MISSING_REQUIRED_FIELD.

DKC-SC1-V20 Candidate self-declares selfApprovalEligible or verified
            → INVALID_AUTHORITY_FIELD / AUTHORITY_FIELD_PROHIBITED.

DKC-SC1-V21 Unknown Candidate field under closed-world schema
            → INVALID_SCHEMA / UNKNOWN_FIELD.

DKC-SC1-V22 Exact duplicate EvidenceIdentity@v1
            → normalized to one entry without evidence-strength increase.

DKC-SC1-V23 Same evidenceRef with conflicting relation
            → all distinct relations retained; evidenceConflict=true;
              no silent strengthening.

DKC-SC1-V24 Fresh verifier uses exact declared package-local toolchain,
            committed lockfile, npm ci, test, and typecheck;
            undeclared global tools are not accepted as evidence.

DKC-SC1-V25 Same logical priorCandidates/evidenceRefs in different input order
            → byte-for-byte equivalent logical result fields after canonical ordering.

DKC-SC1-V26 Same full resolutionKey mapped to different candidateRefs
            → HOLD_UNKNOWN / PRIOR_CONTEXT_CONFLICT.

DKC-SC1-V27 Same candidateRef mapped to different full resolutionKeys
            → HOLD_UNKNOWN / PRIOR_CONTEXT_CONFLICT.

DKC-SC1-V28 Forbidden authority field with case variation
            → INVALID_AUTHORITY_FIELD.
```

---

## 7. Closure Mapping

```text
DKC-SCOPE-PRIOR-STATE-CONTRACT-001
  → CandidateResolutionContext@v1 + canonical lookup/conflict semantics + V15-V18/V25-V27

DKC-SCOPE-CANDIDATE-SCHEMA-CLOSED-WORLD-001
  → KnowledgeCandidateDraft closed-world schema + forbidden field policy + V19-V21/V28

DKC-SCOPE-TOOLCHAIN-REPRODUCIBILITY-001
  → TypeScript/Node/npm/Vitest boundary + lockfile + exact commands + V24

DKC-SCOPE-EVIDENCE-DEDUP-SEMANTICS-001
  → EvidenceIdentity@v1 + canonical lineage/conflict-preserving normalization + V22-V23/V25

DKC-SCOPE-RESULT-PAYLOAD-CONTRACT-001
  → CandidateResolutionResult@v1 discriminated payload + stable error/hold IDs
```

---

## 8. Authority Boundary

This Correction changes executable determinism only. It grants no execution authority.

```text
Scope Correction-1
  != Scope Re-Review PASS
  != Human Implementation Start GO
  != Dependency Addition GO
  != Repository Implementation Mutation
  != Candidate Generation Authority
  != Persistence
  != Runtime External I/O
  != Knowledge Promotion
  != Runtime Binding
  != Ready
  != Merge
  != Deploy
  != LIVE WRITE
```

Parent DKC remains LOCKED and unchanged.

DKC-MSR architecture remains LOCKED and is not implementation-authorized by this correction.

---

## 9. Exit State

```text
Scope Revision: Scope Correction-1
Scope State: DRAFT / NOT LOCKED
Prior Finding Closure Claim: 5 / 5 ADDRESSED / PENDING INDEPENDENT RE-REVIEW
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Repository Implementation Mutation: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime External I/O: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: DKC-IMPLEMENTATION-SCOPE-V1 Independent Scope Re-Review-1
```
