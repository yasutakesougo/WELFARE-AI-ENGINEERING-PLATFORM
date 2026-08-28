# WAEP-AUTHORITY-CLAIM-RESOLUTION-CONTRACT-V1

## 0. Definition status

```text
Definition: WAEP-AUTHORITY-CLAIM-RESOLUTION-CONTRACT-V1
Revision: Definition Correction-3
Supersedes: Definition Correction-2
Source Review: Independent Definition Re-Review-2
Review Result: CORRECTION REQUIRED (P0: 0, P1: 1, P2: 4)
Historical Findings: 18/18 remain CLOSED
Definition State: DRAFT / CORRECTED / NOT LOCKED
Independent Definition Re-Review-3: NOT STARTED
Human Definition Lock: NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
Runtime Enforcement: NOT AUTHORIZED
Automatic Authority Decision: PROHIBITED
Authority Creation: OUT OF SCOPE
Ready / Merge / Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Repository Mutation: NOT AUTHORIZED
Next Gate: Independent Definition Re-Review-3
```

This document is the Definition Correction-3 for an Authority Claim
Resolution Contract. It defines a verification mechanism, not an
authority issuance mechanism. It does not grant Definition Lock,
Implementation Start, Ready, Merge, Deploy, Runtime Activation, or any
mutation authority.

```text
Authority Claim Resolution Contract
  = "verify that claimed authority is backed by exact evidence"
  != "issue authority"
  != "grant GO"
  != "authorize execution"
```

### Correction scope

Correction-1 addressed all 11 findings from Independent Definition
Review-1. Correction-2 addressed all 7 new findings from Independent
Definition Re-Review-1. Correction-3 addresses all 5 new findings
from Independent Definition Re-Review-2. Correction mapping is
recorded in Section 15.

### Motivation

This Definition was motivated by observed failure patterns identified
in `WAEP-CSOC-AUTHORITY-PROVENANCE-AUDIT-1` (2026-08-28 JST, READ-ONLY
audit). The audit found that a PR body claimed parent authority
(Correction-6 / LOCKED / Human GO) that was not resolvable from
repository evidence and directly conflicted with the observable
artifact at the exact referenced commit.

The four failure pattern candidates identified are:

```text
FP-1  AUTHORITY_CLAIM_MUST_NOT_BE_CARRIED_FORWARD_WITHOUT_RE_RESOLUTION
FP-2  NAMED_REVISION_IS_NOT_ARTIFACT_IDENTITY
FP-3  AUTHORITY_METADATA_MUST_BE_BOUND_TO_EXACT_EVIDENCE
FP-4  AGENT_CONTEXT_AUTHORITY_MUST_BE_RE_VERIFIED_ON_ENVIRONMENT_CHANGE
```

This Definition converts these observations into contract-level
invariants. The failure patterns themselves remain Knowledge Candidates
and are NOT promoted by this definition.

---

## 1. Purpose

Define a deterministic, fail-closed contract for resolving Authority
Claims against exact, independently verifiable Authority Evidence whose
provenance is itself independently verifiable.

The contract ensures that:

```text
Authority Claim
  -> Evidence Reference Resolution
  -> Evidence Provenance Resolution
  -> Canonical Decision Source Resolution
  -> Artifact Identity Verification
  -> Authority Decision Verification
  -> Scope Binding Verification
  -> Freshness / Environment Verification
  -> Authority Resolution Result
```

If any step fails, the result is HOLD. No downstream gate may proceed
on an unresolved, conflicting, or stale Authority Claim.

```text
RESOLVED
  = the authority exists, is verified, and its evidence is
    independently provenanced
  != execution authorized
  != new authority issued
  != sufficient condition for downstream gate approval

RESOLVED is a PREREQUISITE for downstream gate consideration.
RESOLVED is NOT a SUFFICIENT condition for downstream gate approval.
A downstream gate may still return HOLD or DENY after RESOLVED.
```

---

## 2. Scope

### 2.1 In scope

```text
Authority claim extraction
Authority evidence resolution
Evidence provenance chain verification
Canonical decision source resolution
Exact artifact identity verification
Definition revision verification
Authority decision verification
Authority condition verification
Scope binding verification
Freshness verification
Conflict detection
Unresolved-state detection
Deterministic resolution result
Fail-closed result semantics
Simultaneous failure precedence
Audit evidence requirements
```

### 2.2 Out of scope

```text
Authority issuance
Human GO issuance
Definition Lock
Implementation Start authorization
Ready authorization
Merge authorization
Deploy authorization
LIVE WRITE authorization
Repository mutation
PR mutation
Automatic remediation
Automatic Knowledge Promotion
```

This contract does not create, grant, or issue any authority. It only
verifies whether a claimed authority is backed by resolvable evidence
with independently verifiable provenance.

---

## 3. Retained principles

```text
Claim != Evidence
Named Revision != Artifact Identity
Conversation Context != Authority
Self-Declaration != Authority
Branch Name != Authority
PR Body Text != Authority
Agent Memory != Authority
Carried-Forward Metadata != Verified Authority
Discovery Source != Evidence Source

Evidence != Proven
Same Content != Independent Provenance
RESOLVED != EXECUTION AUTHORIZED
RESOLVED != Sufficient for Gate Approval

CONFLICT -> HOLD
UNRESOLVED -> HOLD
STALE -> HOLD
UNKNOWN -> HOLD
PARTIALLY_RESOLVED -> HOLD
PROVENANCE_UNRESOLVED -> HOLD
PROVENANCE_CONFLICT -> HOLD
```

---

## 4. Canonical resolution model

### 4.1 Authority Claim structure

An Authority Claim is a self-declared statement about authority state.
It is never treated as authoritative by itself.

```yaml
authorityClaim:
  claimId: ""
  authorityType: ""          # verification target, NOT issuance capability
  subject: ""                # who or what the authority is about
  object: ""                 # what the authority acts upon
  definitionId: ""           # claimed definition identity
  revision: ""               # claimed revision name
  targetSlice: ""            # claimed target slice (NOT_APPLICABLE when authorityType has no slice)
  claimedDecision: ""        # claimed decision result (GO / HOLD / etc.)
  claimedArtifactIdentity:   # claimed identity of the evidence artifact
    sha256: ""
    bytes: 0
  claimedEvidenceReference: ""  # claimed location or pointer to evidence
```

The `authorityType` enum defines **what the contract can verify**, not
what the contract can grant:

```text
DEFINITION_LOCK | IMPLEMENTATION_START | SCOPE_GO | READY_GO | MERGE_GO | DEPLOY_GO | OTHER

authorityType
  = verification target
  != issuance capability
  != authority the contract holds
```

`targetSlice` applicability per authorityType:

```text
SCOPE_GO:                targetSlice = slice identifier
IMPLEMENTATION_START:    targetSlice = slice identifier or NOT_APPLICABLE
DEFINITION_LOCK:         targetSlice = NOT_APPLICABLE
READY_GO:                targetSlice = NOT_APPLICABLE or PR identifier
MERGE_GO:                targetSlice = NOT_APPLICABLE or PR identifier
DEPLOY_GO:               targetSlice = NOT_APPLICABLE or target identifier
OTHER:                   targetSlice = as defined by the specific authority
```

When `targetSlice` is `NOT_APPLICABLE`, the scope verification step
(Step 7) compares `authorityType` against the scope permitted by
evidence without requiring a slice match.

### 4.2 Authority Evidence structure

Authority Evidence is the independently resolvable artifact that backs
(or refutes) an Authority Claim. It must carry its own provenance.

```yaml
authorityEvidence:
  evidenceId: ""
  evidenceType: ""            # DECISION_RECORD | CANONICAL_ARTIFACT | EXTERNAL_AUTHORITATIVE
  supportedAuthorityType: ""  # the authority type this evidence supports
                              # MUST match an authorityType value from the Claim enum

  # Raw provenance facts (Correction-2: derived judgments removed from evidence)
  sourceAuthority: ""         # what authority produced this evidence
  sourceLocation: ""          # canonical location (commit SHA + path, or URL)
  sourceArtifactIdentity:
    sha256: ""
    bytes: 0

  createdBy: ""               # actor that created this evidence record
  creationMode: ""            # HUMAN_DECISION | INDEPENDENT_REVIEW | CANONICAL_PROCESS | AGENT_GENERATED
  createdAt: ""               # when this evidence record was created (ISO 8601 UTC)

  derivedFrom: []             # prior evidence or decision references
  canonicalDecisionReference: ""  # reference to the canonical decision source

  # NOTE: independentOfClaim and provenanceVerificationResult are NOT
  # stored on the evidence record. They are DERIVED by the Provenance
  # Resolver from the raw provenance facts above.
  # See Section 4.4 for the resolver model.

  # Decision identity fields
  decisionId: ""              # unique decision identifier
  definitionId: ""            # actual definition identity
  revision: ""                # actual revision name
  artifactSha256: ""          # actual artifact hash
  artifactBytes: 0            # actual artifact size
  repository: ""              # evidence repository
  commitSha: ""               # evidence commit
  branch: ""                  # evidence branch (when applicable)
  filePath: ""                # evidence file path (when applicable)

  # Decision content fields
  decisionActor: ""           # who made the authority decision
  decisionTimestamp: ""       # when the authority decision was made (ISO 8601 UTC)
  decisionResult: ""          # actual decision result
  authorizedScope: ""         # what the decision authorizes (see Section 6.2)
  conditions: []              # conditions on the authority (see Section 4.5)
```

### 4.3 Resolution inputs

The resolver consumes:

```text
AuthorityClaim (self-declared)
+
AuthorityEvidence (independently resolvable, with provenance)
```

The resolver does NOT consume as evidence:

```text
Conversation context
Agent memory
PR body assertions
Document self-declarations
Branch names
Revision names alone
```

### 4.4 Evidence provenance chain

Authority Evidence must have independently resolvable provenance. The
provenance chain is:

```text
Authority Claim
  -> Authority Evidence (raw provenance facts)
  -> Provenance Resolver (computes derived judgments)
  -> Canonical Decision Source
```

Where Canonical Decision Source is a decision artifact that:

```text
predates or is independent of the Claim
is stored at a canonical location (repository commit, file path,
  decision record, or external authoritative record)
has its own resolvable identity (SHA-256, bytes, commit SHA)
```

### Provenance Resolver separation (Correction-2)

The AuthorityEvidence record carries **raw provenance facts** only.
Derived provenance judgments are computed by a separate Provenance
Resolver, not self-declared by the evidence.

```text
AuthorityEvidence stores:
  createdBy
  creationMode
  createdAt
  sourceLocation
  sourceArtifactIdentity
  derivedFrom
  canonicalDecisionReference

Provenance Resolver computes:
  independenceResult          # INDEPENDENT | DEPENDENT | UNVERIFIED
  provenanceVerificationResult  # PROVENANCE_VERIFIED | PROVENANCE_PARTIAL | PROVENANCE_CONFLICT | PROVENANCE_UNRESOLVED
  provenanceConflictReasons []
```

This separation prevents circular self-declaration. The evidence
record cannot assert its own independence; the resolver must compute
it from independently resolved facts.

### Resolver input verification (Correction-3)

The Provenance Resolver MUST independently verify the raw provenance
facts before computing derived judgments. Raw facts that cannot be
independently verified are treated as UNVERIFIED.

```text
Resolver MUST verify:
  evidence.createdBy        -> check against commit author or decision record
  evidence.creationMode     -> check against artifact metadata
  evidence.createdAt        -> check against commit timestamp
  evidence.sourceLocation   -> check that location exists and is reachable
  evidence.canonicalDecisionReference -> resolve to a canonical artifact

Resolver MUST NOT:
  trust raw facts as self-declared without independent verification
  accept raw facts from the same unverified source as the Claim
  skip verification for any raw fact required for independence determination
```

```text
If any required raw fact cannot be independently verified:
  independenceResult = UNVERIFIED
  provenanceVerificationResult = PROVENANCE_UNRESOLVED
  -> HOLD
```

### Independence determination

Independence is not determined by a single condition. The following
single conditions are NOT sufficient to establish independence:

```text
same actor
  != automatically dependent

different actor
  != automatically independent

commit predates claim
  != automatically authoritative
```

Independence requires that the Claim generation path and the Evidence
canonical provenance do not share an unverified common source:

```text
independenceResult = INDEPENDENT
  when:
    evidence canonical provenance traces to a source independent of
    the Claim generation path
    AND
    no unverified shared dependency exists between Claim and Evidence

independenceResult = DEPENDENT
  when:
    Claim and Evidence share an unverified common source
    OR
    Evidence was derived from Claim without canonical backing
    OR
    Evidence provenance cannot be traced independent of Claim context

independenceResult = UNVERIFIED
  when:
    insufficient facts to determine independence
```

### Provenance result propagation

```text
independenceResult = INDEPENDENT
  + canonical decision source resolved
  -> provenanceVerificationResult = PROVENANCE_VERIFIED
  -> proceed to identity verification

independenceResult = DEPENDENT
  -> provenanceVerificationResult = PROVENANCE_CONFLICT
  -> HOLD

independenceResult = UNVERIFIED
  -> provenanceVerificationResult = PROVENANCE_UNRESOLVED
  -> HOLD

independenceResult = INDEPENDENT
  + canonical decision source NOT RESOLVABLE
  -> provenanceVerificationResult = PROVENANCE_UNRESOLVED
  -> HOLD

independenceResult = INDEPENDENT
  + canonical decision source partially resolved
  -> provenanceVerificationResult = PROVENANCE_PARTIAL
  -> PARTIALLY_RESOLVED -> HOLD
```

#### Circular evidence detection

```text
If both Claim and Evidence originate from the same:
  - unverified source
  - carried-forward context
  - agent-generated assertion
  - self-declaration without canonical backing

Then:
  independenceResult = DEPENDENT
  provenanceVerificationResult = PROVENANCE_CONFLICT
  -> Authority Resolution = UNRESOLVED
  -> HOLD
```

The prohibition is not based solely on actor identity. The same human
may legitimately issue a Decision and later create a canonical Decision
Artifact recording it. What is prohibited is:

```text
Claim from source S
+ Evidence from source S
+ S is unverified (no canonical backing)
+ no independent provenance chain
-> PROVENANCE_CONFLICT
```

### 4.5 Condition semantics

Authority Evidence may carry `conditions` that constrain how the
authority may be used.

```text
Condition types:
  SCOPE_LIMITATION    - authority applies only to a specific scope
  TIME_LIMITATION     - authority expires at a stated time
  PRECONDITION        - a named precondition must be satisfied
  SUPERSESSION        - authority is superseded by a later decision
  OTHER               - condition type defined by the specific authority
```

Condition evaluation rules:

```text
Each condition MUST be evaluated before RESOLVED.

Condition satisfied   -> does not block resolution
Condition unsatisfied -> CONFLICT -> HOLD
Condition unevaluable -> UNRESOLVED -> HOLD
Condition missing     -> see per-authorityType rules (Section 6.2)
```

A GO decision with an unsatisfied condition is not RESOLVED. A GO
decision with a satisfied condition is RESOLVED but the condition
remains binding on downstream gates.

```text
Conditional GO (conditions satisfied)
  = RESOLVED
  != unconditional GO
  Conditions remain binding on downstream gates
```

---

## 5. Resolution steps

Resolution steps are sequential. The first failing step determines the
resolution result. If parallel evaluation is used, the highest-priority
failure applies.

### 5.1 Simultaneous failure precedence

```text
Priority order (highest to lowest):
  PROVENANCE_CONFLICT
  CONFLICT
  PROVENANCE_UNRESOLVED
  UNRESOLVED
  STALE
  UNKNOWN

The first failing step in sequential evaluation determines the result.
If multiple failures are detected simultaneously, the highest-priority
failure is the primary result.

A resolver MAY also return:
  primaryResult = CONFLICT
  secondaryReasons = [STALE, UNRESOLVED]

But the primaryResult alone determines gate propagation.
```

### 5.2 Step 1: Extract Authority Claim

```text
Step 1: Extract the Authority Claim from the source artifact.

  Claim present and well-formed  -> proceed to Step 2
  Claim absent or malformed       -> UNRESOLVED -> HOLD
```

### 5.3 Step 2: Resolve Evidence Reference

```text
Step 2: Can the claimed evidence reference be independently resolved?

  The claim may point to a reference (commit SHA, file path, decision ID).
  The resolver attempts to retrieve the Authority Evidence from the
  canonical location indicated by the reference.

  A PR body, Issue body, conversation context, or agent memory MAY be
  used to DISCOVER an evidence reference (e.g., a decision ID or commit
  SHA mentioned in PR body text).

  However, the PR body, Issue body, conversation context, or agent memory
  MUST NOT be treated as the evidence itself.

  RESOLVED to canonical location  -> proceed to Step 3
  NOT RESOLVABLE                  -> UNRESOLVED -> HOLD
```

Canonical evidence locations are:

```text
Repository commit + file path
Decision record at a canonical location
External authoritative record at a verifiable URL
```

PR metadata (state, merge status, head SHA, base SHA) is canonical for
PR state observation but is NOT canonical for authority decisions.

PR body text, Issue body text, conversation context, agent memory,
branch names, and commit messages are NOT canonical evidence locations.
They are discovery sources only.

### 5.4 Step 3: Resolve Evidence Provenance

```text
Step 3: Does the resolved evidence have independently verifiable provenance?

  The Provenance Resolver is invoked with the Evidence raw provenance
  facts and the Claim identity. The resolver independently verifies
  the raw facts and computes derived judgments.

  Check resolver outputs:
    provenanceResolver.provenanceVerificationResult
    provenanceResolver.independenceResult
    evidence.canonicalDecisionReference

  PROVENANCE_VERIFIED   -> proceed to Step 4
  PROVENANCE_PARTIAL    -> PARTIALLY_RESOLVED -> HOLD
  PROVENANCE_CONFLICT   -> PROVENANCE_CONFLICT -> HOLD
  PROVENANCE_UNRESOLVED -> PROVENANCE_UNRESOLVED -> HOLD
```

### 5.5 Step 4: Resolve Canonical Decision Source

```text
Step 4: Can the canonical decision source be resolved?

  The canonical decision source is the independently resolvable
  artifact that records the authority decision.

  RESOLVED  -> proceed to Step 5
  NOT FOUND -> UNRESOLVED -> HOLD
  AMBIGUOUS -> UNRESOLVED -> HOLD
```

### 5.6 Step 5: Verify Artifact Identity

```text
Step 5: Does the evidence artifact identity match the claim?

  Compare:
    claimedArtifactIdentity.sha256  vs  authorityEvidence.artifactSha256
    claimedArtifactIdentity.bytes   vs  authorityEvidence.artifactBytes

  ALL MATCH  -> proceed to Step 6
  ANY MISMATCH -> CONFLICT -> HOLD
```

A named revision (e.g., "Correction-6") is not artifact identity. The
artifact must be resolved to its exact content hash and byte size.

### 5.7 Step 6: Verify Authority Decision

```text
Step 6: Does the actual decision match the claimed decision?

  Compare:
    authorityClaim.revision              vs  authorityEvidence.revision
    authorityClaim.definitionId          vs  authorityEvidence.definitionId
    authorityClaim.claimedDecision       vs  authorityEvidence.decisionResult
    authorityClaim.authorityType         vs  authorityEvidence.supportedAuthorityType

  ALL MATCH  -> proceed to Step 7
  ANY MISMATCH -> CONFLICT -> HOLD
```

`authorityType` and `evidenceType` are different categorization axes.
`authorityType` identifies what kind of authority is claimed.
`evidenceType` identifies what kind of artifact the evidence is.
Step 6 compares `authorityType` against `supportedAuthorityType`
(both on the same axis), not against `evidenceType`.

### 5.8 Step 7: Verify Scope Binding

```text
Step 7: Does the authorized scope match the claimed target?

  Compare:
    authorityClaim.targetSlice  vs  authorityEvidence.authorizedScope

  When targetSlice = NOT_APPLICABLE:
    verify authorityType scope permits the claimed operation
    without requiring a slice match
    (see Section 6.2 for per-authorityType scope identity)

  When targetSlice = specific slice:
    require exact scope match

  MATCH  -> proceed to Step 8
  MISMATCH -> CONFLICT -> HOLD
```

`authorizedScope` is not a free-form string. It MUST conform to the
per-authorityType scope identity defined in Section 6.2.

### 5.9 Step 8: Verify Freshness / Environment Binding

```text
Step 8: Is the evidence fresh relative to the current environment?

  Check:
    Has the environment changed since evidence was resolved?
    Has the repository HEAD moved?
    Has the branch HEAD moved?
    Has the target PR HEAD moved?
    Has the artifact been replaced?
    Has the canonical evidence location changed?

  FRESH     -> proceed to Step 9
  NOT FRESH -> STALE -> HOLD
```

### 5.10 Step 9: Produce Deterministic Resolution Result

```text
Step 9: All prior steps passed.

  Evaluate conditions (Section 4.5):
    All conditions satisfied    -> RESOLVED
    Any condition unsatisfied   -> CONFLICT -> HOLD
    Any condition unevaluable   -> UNRESOLVED -> HOLD

  Result: RESOLVED
```

### 5.11 Resolution result definitions

```text
RESOLVED
  = authority exists, is verified, evidence provenance is verified,
    and all conditions are satisfied
  = PREREQUISITE for downstream gate consideration
  != SUFFICIENT condition for downstream gate approval
  != execution authorized
  != new authority issued

PARTIALLY_RESOLVED
  = provenance chain is partially verifiable at Step 3
    (independence established but canonical decision source
    only partially resolved)
  -> HOLD
  -> propagates HOLD to all downstream gates (ACR-INV-008)
  -> MUST NOT be promoted to RESOLVED by inference (ACR-INV-009)

UNRESOLVED
  = required evidence cannot be independently resolved
  -> HOLD

CONFLICT
  = claim and evidence disagree
  -> HOLD

STALE
  = evidence was valid but environment has changed
  -> HOLD

UNKNOWN
  = a required value or state cannot be determined
  = sub-class of UNRESOLVED for resolution result purposes
  -> HOLD

PROVENANCE_CONFLICT
  = evidence provenance conflicts with claim provenance
  -> HOLD

PROVENANCE_UNRESOLVED
  = evidence provenance cannot be resolved
  -> HOLD
```

---

## 6. Evidence identity comparison fields

### 6.1 Required fields

All fields in this section are REQUIRED. A missing required field
produces UNRESOLVED, not PARTIALLY_RESOLVED. There are no non-critical
fields in the identity comparison.

```text
Definition ID
Revision
Artifact SHA-256
Artifact Bytes
Repository Identity
Commit SHA
Authority Decision ID
Authority Type
Target Slice (NOT_APPLICABLE is a valid value when authorityType has no slice)
Decision Result
Authorized Scope
Decision Timestamp
```

### 6.2 Per-authorityType field requirements

| authorityType | Target Slice | Conditions | Required scope identity |
| --- | --- | --- | --- |
| DEFINITION_LOCK | NOT_APPLICABLE | REQUIRED (may be empty list) | definitionId + revision + artifact identity |
| IMPLEMENTATION_START | slice or NOT_APPLICABLE | REQUIRED | definitionId + revision + applicable targetSlice |
| SCOPE_GO | slice identifier | REQUIRED | definitionId + targetSlice |
| READY_GO | NOT_APPLICABLE or PR identifier | REQUIRED | repository + target PR + exact HEAD |
| MERGE_GO | NOT_APPLICABLE or PR identifier | REQUIRED | repository + target PR + exact HEAD + base condition |
| DEPLOY_GO | NOT_APPLICABLE or target identifier | REQUIRED | deploymentTarget + authorized artifact |
| OTHER | as defined by the specific authority | REQUIRED | explicit schema required; UNRESOLVABLE → HOLD |

`authorizedScope` MUST conform to the required scope identity for the
applicable `authorityType`. A free-form string that does not match the
required scope identity produces UNRESOLVED → HOLD.

For `DEFINITION_LOCK`, `targetSlice` is `NOT_APPLICABLE` but the scope
is not empty. The scope is:

```text
Definition Lock Scope
  = exact definition
  + exact revision
  + exact artifact identity
```

An empty `conditions` list is valid and means "no conditions apply."
A missing `conditions` field is UNRESOLVED.

### 6.3 Insufficient single-field authority

The following, used alone, MUST NOT establish authority:

```text
Revision name only
Commit SHA only
PR body text only
Conversation context only
Branch name only
Agent memory only
Document self-declaration only
PR metadata only (for authority decisions)
```

A commit SHA may identify a repository state, but it does not verify
artifact content. A revision name may identify a correction cycle, but
it does not verify artifact identity. Both must be paired with exact
content verification.

---

## 7. Environment change rule

### 7.1 Environment change events

The following events constitute an environment change:

```text
New conversation
New agent session
New worktree
New repository checkout
Branch change
Main HEAD change
Target PR HEAD change
Authority artifact replacement
Canonical evidence location change
```

### 7.2 Detection mechanisms

| Event | Detection method | Deterministic? |
| --- | --- | --- |
| Main HEAD change | `git rev-parse HEAD` comparison | YES |
| Target PR HEAD change | GitHub API head SHA comparison | YES |
| Branch change | `git branch --show-current` | YES |
| Authority artifact replacement | SHA-256 comparison | YES |
| Canonical evidence location change | path/URL comparison | YES |
| New conversation | no automated detection | NO |
| New agent session | no automated detection | NO |
| New worktree | partial (worktree path check) | PARTIAL |
| New repository checkout | partial (checkout metadata) | PARTIAL |

### 7.3 Fail-closed default for non-deterministic events

For environment change events that cannot be deterministically detected:

```text
If environment change cannot be deterministically detected:
  re-resolution MUST be performed on EVERY use of authority metadata.

There is no "assume unchanged" default.
The fail-closed position is: always re-resolve unless freshness is
deterministically confirmed.
```

### 7.4 Re-resolution requirement

```text
Environment Change
  -> Authority Evidence Re-resolution Required

Unverified carried-forward Authority metadata
  -> UNRESOLVED
  -> HOLD
```

Authority metadata carried forward from a prior environment MUST be
re-resolved against current repository evidence before use in any new
artifact, claim, or gate decision.

### 7.5 Carry-forward prohibition

```text
Environment A
  + Authority Metadata (verified in Environment A)
  -> Environment B
  -> Authority Metadata MUST NOT be used without re-resolution

Exception: NONE
```

There is no exception. Even if the authority was valid in Environment A,
it must be re-resolved in Environment B. The cost of re-resolution is
always less than the cost of acting on stale or conflicting authority.

---

## 8. Safety invariants

### 8.1 Core invariants

```text
ACR-INV-001
An Authority Claim MUST NOT be treated as valid
unless its required Authority Evidence is independently resolvable.

ACR-INV-002
Conversation context, agent memory, PR body text,
document self-declaration, branch name, or revision name
MUST NOT independently establish Authority.

ACR-INV-003
A named revision MUST NOT be treated as artifact identity.

ACR-INV-004
Authority metadata MUST be bound to exact evidence identity.

ACR-INV-005
Environment, repository, branch, target HEAD,
or authoritative artifact change MUST invalidate
unverified carried-forward Authority metadata.
```

### 8.2 Resolution invariants

```text
ACR-INV-006
RESOLVED does not equal EXECUTION AUTHORIZED.
RESOLVED is a prerequisite for downstream gate consideration,
not a sufficient condition for downstream gate approval.

ACR-INV-007
CONFLICT, UNRESOLVED, STALE, UNKNOWN, PARTIALLY_RESOLVED,
PROVENANCE_CONFLICT, and PROVENANCE_UNRESOLVED
are not PASS-equivalent.

ACR-INV-008
A resolution failure at any step — including PARTIALLY_RESOLVED,
PROVENANCE_CONFLICT, and PROVENANCE_UNRESOLVED —
must propagate HOLD to all downstream gates.

ACR-INV-009
A partial resolution
must not be promoted to RESOLVED by inference.

ACR-INV-010
Evidence that cannot be retrieved
is UNRESOLVED, not absent and not invalid.
```

### 8.3 Prohibited behaviors

```text
ACR-INV-011
Do not infer authority from the existence of a commit SHA
without verifying artifact content at that commit.

ACR-INV-012
Do not infer authority from a revision name
without verifying the exact artifact identity.

ACR-INV-013
Do not carry forward authority metadata across environment changes
without re-resolution.

ACR-INV-014
Do not treat a PR body's self-declared authority state
as evidence of that authority.

ACR-INV-015
Do not treat agent context or conversation history
as canonical evidence location.
```

### 8.4 Evidence provenance invariants (Correction-1 and Correction-2 additions)

```text
ACR-INV-016
A PR, Issue, conversation, agent context, branch name,
commit message, or document self-declaration MAY be used
to discover an Authority Evidence reference.
It MUST NOT independently establish Authority Evidence.

ACR-INV-017
Authority Evidence MUST have independently resolvable provenance.
Evidence whose provenance cannot be resolved
MUST NOT produce RESOLVED.

ACR-INV-018
An Authority Claim and its supporting Authority Evidence
MUST NOT be treated as independent merely because they are
represented as separate records.
If both originate from the same unverified source,
carry-forward context, agent-generated assertion,
or self-declaration without canonical backing,
the resolution MUST fail closed.

ACR-INV-019
Authority Resolution requires:
  Identity Match
  + Scope Match
  + Freshness Match
  + Provenance Verified
  + Conditions Satisfied
  -> RESOLVED

Any single failure among these
-> HOLD

ACR-INV-020
For environment change events that cannot be deterministically detected,
re-resolution MUST be performed on EVERY use of authority metadata.
There is no "assume unchanged" default.

ACR-INV-023
Derived provenance judgments MUST NOT be accepted
as authoritative values from the AuthorityEvidence
being verified.
independenceResult and provenanceVerificationResult
MUST be computed by the Provenance Resolver from
independently resolved provenance facts.
The AuthorityEvidence record MUST NOT store these
derived values as authoritative self-declarations.

ACR-INV-025
The Provenance Resolver MUST independently verify
raw provenance facts before computing derived judgments.
Raw facts that cannot be independently verified
MUST be treated as UNVERIFIED.
The Resolver MUST NOT trust raw facts as self-declared
by the Evidence record without independent verification.
```

### 8.5 Condition invariants (Correction-1 and Correction-2 additions)

```text
ACR-INV-021
Authority Evidence conditions MUST be evaluated before RESOLVED.
An unsatisfied condition produces CONFLICT -> HOLD.
An unevaluable condition produces UNRESOLVED -> HOLD.

ACR-INV-022
A conditional GO with satisfied conditions is RESOLVED
but conditions remain binding on downstream gates.
A conditional GO is not an unconditional GO.

ACR-INV-024
Authority conditions MUST NOT expand the scope
established by the resolved Authority Decision.
A condition MAY narrow, constrain, expire,
supersede, or add prerequisites.
A condition MUST NOT widen authorized operations,
targets, repositories, slices, environments,
or authority types.
If an OTHER condition cannot be proven non-expansive
-> UNRESOLVED -> HOLD.
```

---

## 9. Failure pattern mapping

The observed failure patterns from
`WAEP-CSOC-AUTHORITY-PROVENANCE-AUDIT-1` map to invariants as follows:

```text
FP-1  AUTHORITY_CLAIM_MUST_NOT_BE_CARRIED_FORWARD_WITHOUT_RE_RESOLUTION
  -> ACR-INV-001
  -> ACR-INV-005
  -> ACR-INV-020

FP-2  NAMED_REVISION_IS_NOT_ARTIFACT_IDENTITY
  -> ACR-INV-003

FP-3  AUTHORITY_METADATA_MUST_BE_BOUND_TO_EXACT_EVIDENCE
  -> ACR-INV-004

FP-4  AGENT_CONTEXT_AUTHORITY_MUST_BE_RE_VERIFIED_ON_ENVIRONMENT_CHANGE
  -> ACR-INV-005
  -> ACR-INV-020
```

The failure patterns remain Knowledge Candidates. This mapping records
provenance only. It does NOT promote the failure patterns to Knowledge
Records or Adopted Knowledge.

---

## 10. Acceptance scenarios

### 10.1 Resolution scenarios

```text
ACR-V01
  Claim: Parent Revision = Correction-6
  Evidence: Correction-6 artifact with exact identity match
  Provenance: independently verified
  Expected: RESOLVED

ACR-V02
  Claim: Parent Revision = Correction-6
  Evidence: Correction-1 artifact at referenced commit
  Expected: CONFLICT

ACR-V03
  Claim: Definition State = LOCKED
  Evidence: No Human Definition Lock decision artifact found
  Expected: UNRESOLVED

ACR-V04
  Claim: Implementation Start = GO (from conversation context)
  Evidence: Repository says NOT AUTHORIZED
  Expected: CONFLICT

ACR-V05
  Claim: Implementation Start = GO (from conversation context)
  Evidence: No independent evidence found
  Expected: UNRESOLVED

ACR-V06
  Claim: Revision = Correction-6
  Evidence: Revision name matches but SHA-256 differs
  Expected: CONFLICT

ACR-V07
  Claim: Authority for Slice A
  Evidence: Artifact SHA matches but authorized scope is Slice B
  Expected: CONFLICT

ACR-V08
  Claim: All fields
  Evidence: All fields match exactly
  Provenance: independently verified
  Conditions: none or all satisfied
  Expected: RESOLVED
  Note: RESOLVED does NOT create new execution authority.
        RESOLVED is a prerequisite, not a sufficient condition.

ACR-V09
  Claim: Resolved against PR HEAD A
  Event: PR HEAD moves to B
  Expected: previous resolution = STALE

ACR-V10
  Claim: Agent carries prior GO to new environment
  Evidence: No re-resolution performed
  Expected: UNRESOLVED / HOLD
```

### 10.2 Environment change scenarios

```text
ACR-V11
  Environment: New agent session
  Claim: Carries LOCKED from prior session
  Evidence: No re-resolution in new session
  Expected: UNRESOLVED / HOLD

ACR-V12
  Environment: Main HEAD changed
  Claim: Index references prior HEAD as Current Main
  Evidence: Live HEAD differs
  Expected: STALE

ACR-V13
  Environment: Authority artifact replaced on branch
  Claim: References prior artifact hash
  Evidence: New artifact hash differs
  Expected: CONFLICT
```

### 10.3 Prohibited source scenarios

```text
ACR-V14
  Source: PR body text claims LOCKED
  Evidence: No other source available
  Expected: UNRESOLVED (PR body is not canonical evidence)

ACR-V15
  Source: Branch name implies authority
  Evidence: No decision artifact found
  Expected: UNRESOLVED (branch name is not canonical evidence)

ACR-V16
  Source: Document self-declares state
  Evidence: No external decision artifact found
  Expected: UNRESOLVED (self-declaration is not canonical evidence)
```

### 10.4 Evidence provenance scenarios (Correction-1 addition)

```text
ACR-V17
  Claim: Correction-6 / LOCKED
  Evidence: Correction-6 / LOCKED
  Claim provenance: agent conversation context
  Evidence provenance: same agent conversation context
  Canonical decision artifact: NOT RESOLVABLE
  Expected: PROVENANCE_UNRESOLVED
           AUTHORITY_UNRESOLVED
           HOLD

ACR-V18
  Claim: Implementation Start GO
  PR body: contains GO claim and Decision ID
  Canonical Decision Artifact: independently resolved
  Exact Definition / Revision / Scope match
  Provenance: independently verified
  Expected: PROVENANCE_VERIFIED
           RESOLVED
  Note: RESOLVED does not create new authority.

ACR-V19
  Claim and Evidence contain identical metadata.
  Evidence was generated by copying Claim metadata
  without canonical-source verification.
  Expected: PROVENANCE_CONFLICT or PROVENANCE_UNRESOLVED
           HOLD

ACR-V20
  PR body points to an Authority Decision.
  The canonical artifact contradicts the PR metadata.
  Expected: CONFLICT
           HOLD
```

### 10.5 Condition scenarios (Correction-1 addition)

```text
ACR-V21
  Claim: Implementation Start GO
  Evidence: GO with condition "scope-definition only, not implementation code"
  Condition: satisfied (scope definition is the claimed operation)
  Expected: RESOLVED (condition binding: not implementation code)

ACR-V22
  Claim: Implementation Start GO for implementation code
  Evidence: GO with condition "scope-definition only, not implementation code"
  Condition: unsatisfied (claimed operation exceeds authorized scope)
  Expected: CONFLICT
           HOLD

ACR-V23
  Claim: GO
  Evidence: GO with condition that cannot be evaluated
  Expected: UNRESOLVED
           HOLD
```

### 10.6 Simultaneous failure scenarios (Correction-1 addition)

```text
ACR-V24
  Claim: Revision = Correction-6 (mismatch at Step 6)
  Evidence: environment changed (would fail at Step 8)
  Expected: CONFLICT (higher priority than STALE)

ACR-V25A
  Claim: no evidence found (Step 2)
  Evaluation mode: sequential
  Evidence: also environment changed (would fail at Step 8)
  Expected: UNRESOLVED
  Reason: Step 2 terminates evaluation before Step 8 is reached.

ACR-V25B
  Claim: no evidence found (Step 2)
  Evaluation mode: parallel
  Evidence: also environment changed (Step 8)
  Expected Primary Result: UNRESOLVED
  Secondary Results: [STALE]
  Reason: UNRESOLVED has higher priority than STALE in the precedence
          order. Primary result determines gate propagation.

ACR-V26
  Claim and Evidence from same unverified source (Step 3)
  Evidence: also identity mismatch (would fail at Step 5)
  Expected: PROVENANCE_CONFLICT (higher priority than CONFLICT)
```

### 10.7 Invariant coverage scenarios (Correction-2 addition)

```text
ACR-V27
  Provenance Result: PARTIALLY_RESOLVED
  All other checks: MATCH
  Expected: PARTIALLY_RESOLVED
           HOLD
  Must NOT: infer RESOLVED
  Covers: ACR-INV-009

ACR-V28
  Claim provides: repository + commit SHA only
  Content identity: not verified
  Expected: UNRESOLVED
           HOLD
  Reason: commit identity alone does not prove
          the claimed authority artifact content.
  Covers: ACR-INV-011

ACR-V29
  Evidence record contains fields:
    independentOfClaim = YES
    provenanceVerificationResult = PROVENANCE_VERIFIED
  These fields are self-declared on the Evidence record.
  Provenance Resolver has not independently computed them.
  Expected: UNRESOLVED
           HOLD
  Reason: derived provenance judgments must not be accepted
          as authoritative values from the Evidence record.
  Covers: ACR-INV-023

ACR-V30
  Evidence contains an OTHER condition:
    "authority type expanded to include MERGE_GO"
  The original authorized scope was DEFINITION_LOCK only.
  Expected: UNRESOLVED
           HOLD
  Reason: conditions MUST NOT expand authorized scope.
          OTHER condition cannot be proven non-expansive.
  Covers: ACR-INV-024

---

## 11. Authority boundary

```text
This contract does NOT authorize:
  Authority issuance
  Human GO issuance
  Definition Lock
  Implementation Start
  Ready / Merge / Deploy
  Runtime Activation
  LIVE WRITE
  Repository mutation
  PR mutation
  Automatic remediation
  Automatic Knowledge Promotion
```

```text
Authority Claim Resolution
  = verification mechanism
  != authority creation mechanism
  != execution authorization mechanism
```

---

## 12. Gate chain

```text
WAEP-AUTHORITY-CLAIM-RESOLUTION-CONTRACT-V1
Definition Start
  -> Independent Definition Review-1 (CORRECTION REQUIRED)
  -> Definition Correction-1
  -> Independent Definition Re-Review-1 (CORRECTION REQUIRED)
  -> Definition Correction-2
  -> Independent Definition Re-Review-2 (CORRECTION REQUIRED)
  -> Definition Correction-3 (this document)
  -> Independent Definition Re-Review-3
  -> [if required] Definition Correction-4
  -> ... until PASS / LOCKABLE
  -> Human Definition Lock GO
  -> Definition LOCKED
  -> [separate] Implementation Start GO
```

```text
Definition Correction-3
  != Definition Lock
  != Implementation Start
  != Runtime Enforcement
```

---

## 13. Relationship to existing WAEP definitions

### 13.1 WAEP-LEARNING-SYSTEM-V1

This contract is complementary to the Learning System. The Learning
System defines how Knowledge is capitalized and authority is decided.
This contract defines how authority claims are verified against
evidence.

```text
Learning System: how authority is decided
Claim Resolution Contract: how authority claims are verified
```

### 13.2 WAEP-CURRENT-STATE-OBSERVATION-CONTRACT-V1

The CSOC contract defines how current state is observed and how
gate-bound observations work. This contract defines how authority
metadata is verified before it is used in gate decisions.

```text
CSOC: how state is observed and gates are bound
Claim Resolution Contract: how authority behind gates is verified
```

### 13.3 Knowledge Promotion Gate V1

The Promotion Gate defines how Knowledge matures. This contract does
not interact with Knowledge maturity directly, but the failure patterns
it encodes may become Knowledge Candidates through the normal Promotion
Gate process.

---

## 14. Next gate

```text
Definition Correction-3: COMPLETE WHEN APPLIED
Independent Definition Re-Review-3: NOT STARTED
Definition Lock: NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
Runtime Enforcement: NOT AUTHORIZED
Ready / Merge / Deploy: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
```

This document is a Definition Correction only. It does not authorize
any gate transition, implementation, merge, deploy, or runtime
activation.

---

## 15. Correction-1 closure mapping

| Finding | Severity | Correction | Invariant / Scenario | Closure |
| --- | --- | --- | --- | --- |
| P0-1 PR listed as canonical evidence location, contradicting ACR-INV-002 | P0 | Section 5.3: separated discovery sources from canonical evidence locations. PR body is discovery source only, not evidence source. PR metadata is canonical for PR state, not for authority decisions. | ACR-INV-016 added | CLOSED |
| P0-2 Evidence provenance chain undefined | P0 | Section 4.4: Evidence Provenance Chain introduced. Provenance independence, circular evidence detection, and canonical decision source requirements defined. | ACR-INV-017, ACR-INV-018, ACR-INV-019 added. ACR-V17..V20 added. | CLOSED |
| P1-1 RESOLVED-as-prerequisite vs sufficient ambiguity | P1 | Section 1: RESOLVED explicitly defined as prerequisite, not sufficient condition. | ACR-INV-006 amended | CLOSED |
| P1-2 Required vs non-critical fields undefined | P1 | Section 6.1: all fields defined as REQUIRED. No non-critical fields in identity comparison. PARTIALLY_RESOLVED is limited to provenance partial (Step 3 only). | Section 6.1 amended | CLOSED |
| P1-3 PARTIALLY_RESOLVED not in HOLD propagation | P1 | Section 5.11 and ACR-INV-008: explicitly include PARTIALLY_RESOLVED, PROVENANCE_CONFLICT, PROVENANCE_UNRESOLVED in HOLD propagation. | ACR-INV-008 amended | CLOSED |
| P1-4 Conditions field undefined | P1 | Section 4.5: condition types, evaluation rules, failure classification, and requiredness defined. | ACR-INV-021, ACR-INV-022 added. ACR-V21..V23 added. | CLOSED |
| P1-5 Non-deterministic environment change detection | P1 | Section 7.3: fail-closed default defined. If environment change cannot be deterministically detected, re-resolution on every use. | ACR-INV-020 added | CLOSED |
| P1-6 Simultaneous failure precedence undefined | P1 | Section 5.1: precedence rule defined. Sequential first-failure or priority-ordered for parallel evaluation. | Section 5.1 added. ACR-V24..V26 added. | CLOSED |
| P2-1 authorityType may be misread as issuance | P2 | Section 4.1: explicit note that authorityType defines verification targets, not issuance capabilities. | Section 4.1 amended | CLOSED |
| P2-2 Target Slice applicability undefined for non-slice types | P2 | Section 4.1 and Section 6.2: per-authorityType applicability rules defined. NOT_APPLICABLE is a valid value. | Section 4.1, Section 6.2 amended | CLOSED |
| P2-3 UNKNOWN mapping to UNRESOLVED not explicit | P2 | Section 5.11: UNKNOWN explicitly defined as sub-class of UNRESOLVED for resolution result purposes. | Section 5.11 amended | CLOSED |

### Correction-2 closure mapping

| Finding | Severity | Correction | Invariant / Scenario | Closure |
| --- | --- | --- | --- | --- |
| P1-7 Evidence lacks authorityType; Step 6 compares incompatible enums | P1 | Section 4.2: `supportedAuthorityType` field added to AuthorityEvidence. Section 5.7 Step 6: comparison changed to `authorityType` vs `supportedAuthorityType`. Note added explaining axis separation. | Section 4.2, Section 5.7 amended | CLOSED |
| P1-8 Provenance fields can be self-declared (circular verification) | P1 | Section 4.4: Provenance Resolver separation introduced. `independenceResult` and `provenanceVerificationResult` removed from Evidence and computed by resolver. Independence determination rules defined. Single-condition insufficiency stated. | ACR-INV-023 added. Section 4.4 rewritten. | CLOSED |
| P2-4 PARTIALLY_RESOLVED definition contradicts §6.1 | P2 | Section 5.11: PARTIALLY_RESOLVED redefined as "provenance partially verifiable at Step 3 only." "Non-critical" wording removed. ACR-INV-009 connection made explicit. | Section 5.11 amended | CLOSED |
| P2-5 ACR-V25 doesn't specify evaluation mode | P2 | Section 10.6: ACR-V25 split into ACR-V25A (sequential) and ACR-V25B (parallel) with distinct expected results. | ACR-V25A, ACR-V25B added | CLOSED |
| P2-6 No invariant prohibiting condition scope expansion | P2 | Section 8.5: ACR-INV-024 added. Conditions MAY narrow/constrain only. OTHER condition must be proven non-expansive or HOLD. | ACR-INV-024 added | CLOSED |
| P2-7 Missing scenarios for ACR-INV-009 and ACR-INV-011 | P2 | Section 10.7: ACR-V27 (partial not promoted to RESOLVED) and ACR-V28 (commit SHA alone insufficient) added. | ACR-V27, ACR-V28 added | CLOSED |
| P2-8 authorizedScope format undefined for non-slice types | P2 | Section 6.2: Required scope identity column added to per-authorityType table. DEFINITION_LOCK scope defined as definitionId + revision + artifact identity. Free-form string non-conformance produces UNRESOLVED. | Section 6.2 amended | CLOSED |

### Correction-3 closure mapping

| Finding | Severity | Correction | Invariant / Scenario | Closure |
| --- | --- | --- | --- | --- |
| P1-9 Step 3 references removed Evidence fields | P1 | Section 5.4: Step 3 updated to reference Provenance Resolver outputs (`provenanceResolver.provenanceVerificationResult`, `provenanceResolver.independenceResult`) instead of removed Evidence fields. | Section 5.4 amended | CLOSED |
| P2-9 Resolver input verification not defined | P2 | Section 4.4: Resolver input verification subsection added. Resolver MUST independently verify raw facts. Unverifiable raw facts → UNVERIFIED → HOLD. | ACR-INV-025 added. Section 4.4 amended. | CLOSED |
| P2-10 Missing scenarios for ACR-INV-023 and ACR-INV-024 | P2 | Section 10.7: ACR-V29 (self-declared provenance rejected) and ACR-V30 (OTHER condition scope expansion rejected) added. | ACR-V29, ACR-V30 added | CLOSED |
| P2-11 §0 line 25 says "Correction-1" | P2 | Section 0: text corrected to "Definition Correction-3". | Section 0 amended | CLOSED |
| P2-12 §8.4/§8.5 headers retain "Correction-1 addition" | P2 | Section 8.4 and 8.5: headers updated to "Correction-1 and Correction-2 additions". | Section 8.4, 8.5 amended | CLOSED |
