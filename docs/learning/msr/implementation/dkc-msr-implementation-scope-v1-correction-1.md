# DKC-MSR-IMPLEMENTATION-SCOPE-V1 — Scope Correction-1

## Status

```text
Source Review: Independent Scope Review-1
Prior P0 / P1 / P2: 0 / 3 / 0
Scope Boundary: RETAINED / PURE_DOMAIN
Correction State: APPLIED
```

## C1 — Typed SOURCE_OBJECT_KEY_V1 / CANONICAL_SNAPSHOT_KEY_V1

The opaque `sourceObjectIdentity` wording in Scope Definition Start is superseded.

Slice A must validate and construct:

```text
sourceObjectKey:
  keyVersion = SOURCE_OBJECT_KEY_V1
  provider
  repositoryId
  objectType
  identity:
    providerObjectId
    exactCommitSha
    pathSnapshot
    contentBlobId
    testIdentity
    identityScheme
    identityValue
```

Unused identity members are `null`.

Required members are exactly:

```text
ISSUE / PULL_REQUEST / REVIEW / CHECK_RUN / CHECK_SUITE / WORKFLOW_RUN / JOB
  -> providerObjectId
COMMIT
  -> exactCommitSha
CHANGED_FILE
  -> exactCommitSha + normalized pathSnapshot
TEST_EVIDENCE
  -> testIdentity
ADR / DEFINITION / REVIEW_RECORD
  -> exactCommitSha + normalized pathSnapshot
OTHER
  -> identityScheme + identityValue
```

Missing required members produce `INVALID_IDENTITY` / `HOLD_UNKNOWN`; mutable title, URL, branch, timestamp, or display name must never be synthesized into identity.

When pathSnapshot participates, implement the effective Definition Correction-1 normalization exactly:

```text
Unicode NFC
separator '/'
remove leading './'
collapse repeated '/'
remove '.' segment
reject '..' segment
remove leading '/'
preserve case
no percent/URL decoding
remove trailing '/' unless result becomes empty
```

Canonical snapshot construction is exactly:

```text
canonicalSnapshotKey:
  keyVersion = CANONICAL_SNAPSHOT_KEY_V1
  sourceObjectKey
  canonicalizationVersion
  sanitizedPayloadDigest:
    algorithm = SHA-256
    value = lowercase hexadecimal
```

`retrievedAt`, mutable repository snapshots, URL snapshots, and branch names are excluded from stable key equality.

## C2 — Canonical Evidence Form

The ambiguous sanitized/redacted marker is superseded by:

```text
canonicalEvidenceForm:
  SOURCE_NATIVE_CANONICAL
  SANITIZED_CANONICAL
  REDACTED_CANONICAL
  NONE
```

Required mapping:

```text
ALLOW    -> SOURCE_NATIVE_CANONICAL
SANITIZE -> SANITIZED_CANONICAL | REDACTED_CANONICAL
REJECT   -> NONE
```

`prohibitedRawPersisted` must always be false.

`SANITIZE` requires non-empty sanitizerVersion.

`REJECT` or `canonicalEvidenceForm=NONE` must cause canonical snapshot construction to return `PERSISTENCE_PROHIBITED` and no canonical snapshot key.

SANITIZED_CANONICAL / REDACTED_CANONICAL remain Canonical Evidence forms and are not DerivedProjection records.

## C3 — Closed Source Object Coverage

Scope Definition Start object coverage is expanded only to match the already locked effective architecture contract:

```text
ISSUE
PULL_REQUEST
REVIEW
COMMIT
CHANGED_FILE
CHECK_RUN
CHECK_SUITE
WORKFLOW_RUN
JOB
TEST_EVIDENCE
ADR
DEFINITION
REVIEW_RECORD
OTHER
```

No acquisition or adapter logic is authorized.

## Added Acceptance Scenarios

```text
MSR-SC1-V16 equivalent path forms './src//a.ts' and 'src/a.ts'
            -> same normalized path / sourceObjectKey.
MSR-SC1-V17 path containing '..'
            -> INVALID_IDENTITY / HOLD.
MSR-SC1-V18 unused source identity members are non-null
            -> INVALID_SCHEMA.
MSR-SC1-V19 TEST_EVIDENCE missing testIdentity
            -> INVALID_IDENTITY.
MSR-SC1-V20 OTHER missing identityScheme or identityValue
            -> INVALID_IDENTITY.
MSR-SC1-V21 SANITIZE + SANITIZED_CANONICAL + sanitizerVersion
            -> valid gate record.
MSR-SC1-V22 REJECT + canonicalEvidenceForm=NONE followed by key construction
            -> PERSISTENCE_PROHIBITED.
MSR-SC1-V23 sanitized payload digest not lowercase SHA-256 hex
            -> INVALID_SCHEMA.
```

## Authority

```text
Scope Correction-1 != Implementation Review PASS
Scope Correction-1 != Ready GO
Technology Adoption: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
Source Adapter Execution: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
```
