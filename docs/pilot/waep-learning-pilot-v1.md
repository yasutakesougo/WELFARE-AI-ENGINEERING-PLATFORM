# WAEP Learning Pilot V1

```text
Pilot type: MINIMAL END-TO-END LEARNING PILOT
Status: DEFINITION / NOT STARTED
Pilot count: one Failure case
Record revision: DEFINITION / DOCUMENT CORRECTION-1
Definition / Document status: PASS / LOCKED
Independent Definition / Document Re-Review-2: PASS / LOCKABLE
Human Definition / Document Lock GO: RECEIVED
User gate label: AEP-4-DOCUMENT-EVIDENCE-PACK-V1 Definition / Document Lock GO
Canonical pack: WAEP-4-DOCUMENT-EVIDENCE-PACK-V1
Lock recorded at: 2026-08-28 11:37:24 +0900
Lock basis SHA-256: 875584cf6d3ee8d82a558f7c8717159de899f3652847f5714c95b8f851a5ca75
Automatic Knowledge Promotion: PROHIBITED
Automatic Runtime Distribution: NOT AUTHORIZED
Runtime Binding: NOT AUTHORIZED
External system mutation: NOT PERFORMED
Downstream authority: NOT GRANTED
```

## 1. Objective

Demonstrate that one sanitized development Failure can move through the WAEP
learning path and produce independently verified reuse evidence. The pilot
tests the learning and authority boundaries; it does not activate runtime
learning or automate promotion.

## 2. Fixed pilot input

Use the generalized Failure from
`audit-management-system-mvp@e6dabf377961bcd7f8b61561dcbd86e5a57f7da4`,
documented in ADR-025:

```text
Rule candidate:
  Version number is not a save-attempt identity.

Failure pattern:
  A failed or concurrent save can reuse a logical Version and contaminate
  current-state reads unless CommitId and a snapshot-bound parent commit are
  used.

Generalized correction:
  Use ParentID + Version + CommitId for child identity; commit the parent
  pointer with snapshot-bound ETag CAS; keep failed/losing rows non-current.
```

The pilot source is [ADR-025](https://github.com/yasutakesougo/audit-management-system-mvp/blob/e6dabf377961bcd7f8b61561dcbd86e5a57f7da4/docs/adr/ADR-025-daily-record-persistence-v1.md).

## 3. Evidence and data boundary

Allowed in the pilot:

- Repository name, exact commit SHA, ADR or test references.
- Generalized symptom, expected behavior, actual behavior, impact, correction,
  and verification result.
- Content digest and immutable evidence references.

Forbidden in reusable Knowledge content:

- Welfare user or family identifiers.
- Support records, medical/disability details, or customer production rows.
- Cookies, access tokens, credentials, secrets, or raw request payloads.
- Unredacted screenshots or logs containing personal or tenant data.

If production-sensitive material is ever needed, stop at `HOLD` until a
separate, explicit Learning Payload Release Decision exists. The pilot must
not infer permission from the existence of a source repository or a successful
local test.

For `SYNTHETIC` or `REDACTED` data, record
`payloadReleaseEvidenceRef: NOT_APPLICABLE`. For `APPROVED_REAL` data, a
non-identifying release reference, approved system reference, scope, and
expiry are mandatory. Missing or expired release evidence means `HOLD`.

## 4. State transitions

| Stage | Required evidence | Authority | Automatic transition |
| --- | --- | --- | --- |
| `OBSERVED` | Original Failure reference and exact source SHA | Source repository evidence | No |
| `CANDIDATE` | Sanitized generalized rule, scope, non-goals, evidence refs | DKC candidate author only | No |
| `VALIDATED` | Independent verification against the immutable candidate version | Validation Decision | No |
| `PROMOTED` | Validated candidate plus immutable subject version | Human Promotion Decision | No |
| `PROJECTED` | Derived Registry projection resolved from Decisions | Resolver / projection | No |
| `APPLIED` | Explicit use in the selected validation target | Human/application record | No |
| `VERIFIED_EFFECTIVE` | Independent effectiveness result for the declared scope | Effectiveness Decision | No |

`PROMOTED` does not mean Runtime Effective `ACTIVE`. `APPLIED` does not mean
the target repository's implementation, PR, or production behavior is
authorized.

## 5. Pilot record

Use one immutable record per stage. The worksheet below is only an index; each
`stageRecords.<stage>` entry must be materialized as a separate immutable
record with its own `recordId`, subject version, actor, verification time,
authority reference, and evidence references.

```yaml
pilotId: LP-ADR025-001
dataBoundary:
  dataMode: SYNTHETIC
  payloadReleaseEvidenceRef: NOT_APPLICABLE
  approvedSystemRef: NOT_APPLICABLE
  approvedScope: NOT_APPLICABLE
  approvalExpiresAt: NOT_APPLICABLE
source:
  repository: audit-management-system-mvp
  sourceRevision: e6dabf377961bcd7f8b61561dcbd86e5a57f7da4
  evidenceRef: docs/adr/ADR-025-daily-record-persistence-v1.md
candidate:
  candidateRef: KC-ADR025-COMMIT-IDENTITY-001
  candidateVersion: 1.0.0
  candidateAuthorRef: ""
  contentDigest: ""
  observedIn: audit-management-system-mvp
  proposedAppliesTo:
    - audit-management-system-mvp
    - severe-behavior-support-spfx
  explicitlyNotValidatedFor:
    - customer production data
    - automatic runtime policy
reuse:
  targetRepository: severe-behavior-support-spfx
  targetRevision: 66219ae16c3f2ca1ebee7bbe5b479c8286ac79e8
  targetEvidenceStatus: UNVERIFIED
  stage: DISCOVERED
  applicationRef: ""
stageRecords:
  OBSERVED:
    recordId: ""
    immutableSubjectVersion: ""
    actorRef: ""
    independentVerifierRef: ""
    verifiedAt: ""
    authorityRef: ""
    evidenceRefs: []
    result: NOT_STARTED
  CANDIDATE:
    recordId: ""
    immutableSubjectVersion: ""
    actorRef: ""
    independentVerifierRef: ""
    verifiedAt: ""
    authorityRef: ""
    evidenceRefs: []
    result: NOT_STARTED
  VALIDATED:
    recordId: ""
    immutableSubjectVersion: ""
    actorRef: ""
    independentVerifierRef: ""
    verifiedAt: ""
    authorityRef: ""
    evidenceRefs: []
    evaluationScopeRef: ""
    result: NOT_STARTED
  PROMOTED:
    recordId: ""
    immutableSubjectVersion: ""
    actorRef: ""
    independentVerifierRef: ""
    verifiedAt: ""
    authorityRef: ""
    evidenceRefs: []
    result: NOT_STARTED
  PROJECTED:
    recordId: ""
    immutableSubjectVersion: ""
    actorRef: ""
    independentVerifierRef: ""
    verifiedAt: ""
    authorityRef: ""
    evidenceRefs: []
    result: NOT_STARTED
  APPLIED:
    recordId: ""
    immutableSubjectVersion: ""
    actorRef: ""
    independentVerifierRef: ""
    verifiedAt: ""
    authorityRef: ""
    evidenceRefs: []
    evaluationScopeRef: ""
    result: NOT_STARTED
  VERIFIED_EFFECTIVE:
    recordId: ""
    immutableSubjectVersion: ""
    actorRef: ""
    independentVerifierRef: ""
    verifiedAt: ""
    authorityRef: ""
    evidenceRefs: []
    evaluationScopeRef: ""
    result: NOT_STARTED
humanGo:
  action: ""
  scope: ""
  targetRepository: ""
  targetRevision: ""
  decisionRef: ""
  actorRef: ""
  decidedAt: ""
  result: NOT_STARTED
```

The YAML is a pilot worksheet, not a replacement for the canonical WAEP
Decision Contracts. The stage entries and `humanGo` block are evidence indexes,
not authority themselves. Empty, missing, conflicting, expired, or
unverifiable authority fields cause `HOLD`.

For stages requiring independent verification,
`independentVerifierRef` must identify a distinct actor from the candidate
author (`candidate.candidateAuthorRef`) and the verification evidence must
cover the declared scope.

## 6. Fail-closed scenarios

The pilot must return `HOLD` and preserve the prior immutable evidence when:

- the source SHA or evidence reference cannot be resolved;
- the candidate contains raw personal, production, or secret data;
- the same event is replayed with a conflicting digest;
- multiple unresolved Decision heads exist for one resolution key;
- validation depends only on knowledge derived from the same candidate;
- required `verifiedAt`, `evaluationScopeRef`, `authorityRef`, or payload release
  evidence is absent;
- a stage record lacks its own immutable `recordId`, subject version, actor, or
  evidence references;
- a Registry projection disagrees with the Decision Registry;
- the Human GO does not bind a concrete action, target, revision, and scope;
- a target asks the pilot to alter runtime policy, bind ACTIVE, or mutate
  SharePoint/M365.

## 7. Acceptance criteria

- [ ] The one Failure is traceable from source SHA to sanitized candidate.
- [ ] Candidate, validation, promotion, reuse, and effectiveness are separate
  records with separate actors and decisions.
- [ ] Every stage is represented by a separate immutable record with a unique
  record ID, subject version, verification time, authority reference, and
  evidence references.
- [ ] Any `APPROVED_REAL` payload has a non-identifying release reference,
  approved system reference, scope, and expiry; otherwise it remains `HOLD`.
- [ ] Any Human GO binds a concrete action, target repository/revision, and
  scope; no stage record grants authority by itself.
- [ ] Replay is idempotent and does not increase evidence strength.
- [ ] Registry output is explicitly marked derived and non-authoritative.
- [ ] Reuse in `severe-behavior-support-spfx` is validation evidence only; no
  production or runtime binding is performed.
- [ ] All unresolved conditions remain `HOLD`, `UNKNOWN`, or `NOT STARTED`.
- [ ] No automatic Promotion, Distribution, Ready, Merge, Deploy, or external
  data mutation occurs.

## 8. Start gate

```text
WAEP Learning Definition: LOCKED
DKC Definition: Re-Review-2 pending
Learning Event Slice A: Correction required
Implementation Start: separate Human GO required
Pilot Start: separate Human GO required after implementation evidence
```
