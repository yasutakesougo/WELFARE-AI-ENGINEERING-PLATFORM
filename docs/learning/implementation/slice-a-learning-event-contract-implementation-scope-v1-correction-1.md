# WAEP-LEARNING-SYSTEM-V1

## Slice A — Learning Event Contract

## Implementation Scope Correction-1

### 1. Status

```text
Target: Implementation Scope Definition V1
Source Review: Independent Scope Review-1
Source Verdict: CORRECTION REQUIRED
Prior P0 / P1 / P2: 0 / 2 / 1
Findings:
  LE-A-SCOPE-ID-001
  LE-A-SCOPE-AUDIT-001
  LE-A-SCOPE-RELEASE-001
Revision: Implementation Scope Correction-1
Correction State: APPLIED / PENDING INDEPENDENT SCOPE RE-REVIEW-1
Human Implementation Start: GO / UNCHANGED
Dependency Addition: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
```

Correction-1 overlays the source Scope Definition. Unchanged scope remains in force.

### 2. LE-A-SCOPE-ID-001 — Exact Identity Algorithm

The pure-domain identity evaluator is implementation-fixed as follows.

Input fields:

```text
sourceEventId
source.contentDigest
```

Both MUST be non-empty Unicode scalar-value strings. Invalid Unicode or missing values produce `INVALID` and no identity.

Canonicalization:

```text
identityContract = "WAEP-LEARNING-EVENT-IDENTITY@v1"
field1 = Unicode NFC(sourceEventId)
field2 = Unicode NFC(source.contentDigest)
material =
  UTF8(identityContract) + 0x00 +
  uint64be(byteLength(UTF8(field1))) + UTF8(field1) +
  uint64be(byteLength(UTF8(field2))) + UTF8(field2)
```

Digest:

```text
identityDigest = SHA-256(material)
identityDigestText = lowercase hexadecimal, exactly 64 ASCII characters
canonicalEventIdentity = "LEID1:" + identityDigestText
learningEventId = "LE-" + identityDigestText
```

No locale-sensitive case folding, whitespace trimming, path normalization, repository-name injection, or sourceRevision injection is permitted.

Collision handling:

```text
same canonicalEventIdentity + different canonical identity material
→ HELD / IDENTITY_DIGEST_COLLISION
→ no automatic admission
```

Changing canonicalization, hash function, prefixes, encoding, or field set requires a new versioned identity contract.

### 3. LE-A-SCOPE-AUDIT-001 — Governed Attempt / Acknowledgement Boundary

A governed ingestion attempt begins only after a durable-capable caller or coordinator has established a unique `attemptId` and supplied it to the pure-domain kernel.

Pre-accept transport failures occurring before `attemptId` establishment are transport telemetry and are not `LearningEventIngestionAttempt@v1` attempts.

Pure-domain request minimum:

```text
attemptId: non-empty opaque identifier
attemptedAt: timestamp value already supplied by caller
source / classification / payload / release inputs
existing canonical-event observation when applicable
```

The kernel MUST NOT generate wall-clock time, random IDs, or perform I/O.

The kernel produces a prepared outcome:

```text
PreparedIngestionOutcome@v1
- attemptId
- domainResult: ADMITTED | DUPLICATE_NO_OP | HELD | DENIED | INVALID
- reasonCodes
- learningEventCandidate: present only when ADMITTED
- ingestionAttemptRecord: complete terminal-domain audit payload
- durabilityPlan
- acknowledgementState: DURABILITY_PENDING
```

`domainResult` is the evaluated domain result. It is not yet an externally acknowledged terminal completion.

Durability completion boundary:

```text
DurabilitySucceeded
→ acknowledgementState = ACKNOWLEDGEABLE

DurabilityFailed / Unknown
→ terminal domain result MUST NOT be acknowledged as durably recorded
→ infrastructure recovery / retry path outside pure kernel
```

For ADMITTED, `durabilityPlan` requires one logical unit containing event + attempt audit. For non-ADMITTED, it requires durable attempt audit only.

The pure-domain kernel never claims persistence success.

### 4. LE-A-SCOPE-RELEASE-001 — Closed Release-Requirement Inputs

Release-required derivation input is exactly:

```text
sourceClassification
sourcePolicyReleaseRequirement:
  REQUIRED | NOT_REQUIRED | UNRESOLVED
productionSensitiveBoundary:
  SENSITIVE | NOT_SENSITIVE | UNRESOLVED
callerStricterRequirement: boolean
```

Derivation:

```text
if sourcePolicyReleaseRequirement = UNRESOLVED
  → HELD / RELEASE_REQUIREMENT_UNRESOLVED

if productionSensitiveBoundary = UNRESOLVED
  → HELD / RELEASE_REQUIREMENT_UNRESOLVED

release.required =
  callerStricterRequirement
  OR sourcePolicyReleaseRequirement = REQUIRED
  OR productionSensitiveBoundary = SENSITIVE
```

Caller input may make the requirement stricter but may never weaken source policy or the production-sensitive boundary.

`sourceClassification` remains mandatory for classification validation and policy interpretation. Unknown/unsupported classification is `HELD` or `INVALID` according to the effective implementation-definition mapping; it may never silently imply `NOT_REQUIRED`.

### 5. Added Acceptance Fixtures

```text
SCOPE-A-021 identity canonicalization golden vectors
SCOPE-A-022 NFC-equivalent identity strings produce same identity
SCOPE-A-023 field-boundary ambiguity is impossible via uint64be length prefixes
SCOPE-A-024 identity collision mismatch → HELD
SCOPE-A-025 kernel requires caller-supplied attemptId
SCOPE-A-026 prepared domain result remains DURABILITY_PENDING
SCOPE-A-027 durability failure cannot become acknowledged ADMITTED
SCOPE-A-028 unresolved source release policy → HELD
SCOPE-A-029 unresolved production-sensitive boundary → HELD
SCOPE-A-030 caller stricter requirement cannot weaken mandatory release
```

### 6. Finding Closure Map

| Finding | Correction | Author status |
| --- | --- | --- |
| LE-A-SCOPE-ID-001 | exact length-prefixed UTF-8/NFC/SHA-256 identity contract | CORRECTED / PENDING RE-REVIEW |
| LE-A-SCOPE-AUDIT-001 | caller-established attemptId + DURABILITY_PENDING acknowledgement boundary | CORRECTED / PENDING RE-REVIEW |
| LE-A-SCOPE-RELEASE-001 | closed release requirement dimensions + fail-closed unresolved mapping | CORRECTED / PENDING RE-REVIEW |

### 7. Authority Boundary

```text
Human Implementation Start: GO / UNCHANGED
Scope Re-Review: PENDING
Dependency Addition: NOT AUTHORIZED
Persistence Implementation: NOT AUTHORIZED
Runtime External I/O: NOT AUTHORIZED
Ready: NOT AUTHORIZED
Merge: NOT AUTHORIZED
Deploy: NOT AUTHORIZED
LIVE WRITE: NOT AUTHORIZED
```

Next Gate: Independent Scope Re-Review-1.
