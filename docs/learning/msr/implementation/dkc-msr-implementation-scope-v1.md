# DKC-MSR-IMPLEMENTATION-SCOPE-V1

## 0. Status

```text
Scope ID: DKC-MSR-IMPLEMENTATION-SCOPE-V1
Target: DKC-MSR-ARCHITECTURE-DESIGN-V1
Target Slice: Slice A — Pure Canonical Identity / Contract Kernel
Parent Architecture State: LOCKED
Parent Implementation Start: GO
Parent Implementation WRITE: GO
Scope Revision: Definition Start
Implementation Code under this Scope: NOT YET AUTHORIZED UNTIL SCOPE REVIEW PASS
Dependency Addition: NOT AUTHORIZED
Technology Adoption: NOT AUTHORIZED
Source Adapter Execution: NOT AUTHORIZED
Persistence: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
```

## 1. Mission

Implement only deterministic, pure-domain validation and canonical identity construction for already-provided sanitized MSR metadata. Slice A does not acquire repository data, persist evidence, invoke adapters, or perform inference.

```text
Already-provided sanitized metadata
  -> closed-world validation
  -> stable source identity
  -> canonical snapshot key
  -> evidence/link contract validation
  -> non-authoritative pure result
```

## 2. Included

Slice A may implement only:

1. `SourceRepositoryIdentity@v1` validation:
   - provider
   - repositoryId
   - repositoryNameSnapshot
   - canonicalUrlSnapshot
   - defaultBranchNameSnapshot
   - stable identity = provider + repositoryId.

2. `SourceObjectIdentity@v1` validation for:
   - COMMIT
   - CHANGED_FILE
   - ISSUE
   - PULL_REQUEST
   - REVIEW
   - CHECK_RUN
   - CHECK_SUITE
   - WORKFLOW_RUN
   - JOB
   - ADR
   - DEFINITION
   - REVIEW_RECORD
   - OTHER
   using the source-type-specific immutable members required by the locked architecture.

3. `SensitiveDataGateRecord@v1` validation:
   - ALLOW | SANITIZE | REJECT
   - prohibitedRawPersisted must always be false
   - SANITIZE requires sanitizerVersion and sanitized/redacted evidence marker
   - REJECT cannot emit a persistable canonical snapshot result
   - rawPayloadDigest SUPPRESSED semantics are retained.

4. `CanonicalSnapshotKey@v1` construction from:
   - provider
   - repositoryId
   - sourceObjectType
   - sourceObjectIdentity
   - canonicalizationVersion
   - sanitizedPayloadDigest
   `retrievedAt` is excluded from stable identity.

5. `EvidenceEntityLink@v1` closed-world validation for linkMethod/evidenceClass compatibility and conflict state preservation.

6. `DerivedProjectionManifest@v1` validation requiring rebuildable=true and canonicalAuthority=false.

7. Pure deterministic result classes:
   - VALID
   - INVALID_SCHEMA
   - INVALID_IDENTITY
   - PERSISTENCE_PROHIBITED
   - HOLD_UNKNOWN

All outputs are non-authoritative.

## 3. Explicitly Excluded

```text
GitHub REST / GraphQL calls
Git CLI / repository reads
network I/O
filesystem runtime I/O
credential access
source adapter execution
raw payload acquisition
secret detection engine implementation
canonical evidence persistence
DB / queue / cache / vector index / graph store
SZZ / heuristic / model inference
LLM invocation
candidate extraction
root-cause verification
cross-repository replication analysis
process mining
knowledge promotion
runtime knowledge binding
repository mutation executor
production/customer/welfare data
```

## 4. Closed Repository Paths

After Scope Review PASS, implementation WRITE may occur only under:

```text
src/dkc_msr_kernel/**
tests/dkc_msr_kernel/**
docs/audit/dkc-msr-impl-slice-a-*.md
```

The following remain outside scope:

```text
.github/**
root package manifests
root build configuration
other src/** packages
locked Definition/Architecture artifacts
production/deployment configuration
```

Temporary independent-verifier infrastructure may exist only on an unmerged verifier branch and is not product implementation.

## 5. Toolchain / Dependency Boundary

Use the repository's already-present Python runtime family and Python standard library only.

```text
New runtime dependency: NONE
New dev dependency: NONE
Technology adoption: NONE
```

Required verification command:

```text
python -m unittest discover -s tests/dkc_msr_kernel -p 'test_*.py'
```

Exact Python version must be recorded by the verifier.

## 6. Determinism

Equal input must produce equal output. No wall clock, random, environment variable, filesystem state, network state, hidden global state, or model inference may affect a decision.

String identities are exact; mutable display snapshots never replace stable provider/object identities.

## 7. Acceptance Scenarios

```text
MSR-A-V01 rename snapshot changes while provider+repositoryId is unchanged
          -> stable repository identity unchanged.
MSR-A-V02 same mutable repo name but different repositoryId
          -> different stable identity.
MSR-A-V03 COMMIT without exactCommitSha
          -> INVALID_IDENTITY.
MSR-A-V04 CHANGED_FILE without exactCommitSha or pathSnapshot
          -> INVALID_IDENTITY.
MSR-A-V05 ISSUE/PR/REVIEW without providerObjectId
          -> INVALID_IDENTITY.
MSR-A-V06 SANITIZE without sanitizerVersion or sanitized marker
          -> INVALID_SCHEMA.
MSR-A-V07 REJECT followed by canonical snapshot construction request
          -> PERSISTENCE_PROHIBITED.
MSR-A-V08 canonical snapshot key excludes retrievedAt
          -> equal key for equal stable members despite retrieval-time change.
MSR-A-V09 PLATFORM_RELATION + non-SOURCE_NATIVE class
          -> INVALID_SCHEMA.
MSR-A-V10 HEURISTIC_INFERENCE / MODEL_INFERENCE retains non-authoritative classification.
MSR-A-V11 conflictState=UNKNOWN is retained and never coerced to NONE.
MSR-A-V12 derivedProjection rebuildable=false
          -> INVALID_SCHEMA.
MSR-A-V13 derivedProjection canonicalAuthority=true
          -> INVALID_SCHEMA.
MSR-A-V14 malformed/unknown fields
          -> INVALID_SCHEMA / fail closed.
MSR-A-V15 pure kernel runs with network/filesystem unavailable
          -> behavior unchanged.
```

## 8. Evidence Requirements

Independent implementation evidence must bind:

```text
exact implementation commit SHA
exact changed paths
parent locked architecture identity
exact scope identity
Python version
exact unittest command
test count / failures / errors
post-test repository mutation state when observable
```

## 9. Authority Boundary

```text
Scope Review PASS != Technology Adoption
Scope Review PASS != Source Adapter Execution
Implementation PASS != Persistence
Implementation PASS != Ready GO
Ready GO != Merge GO
```

## 10. Next Gate

```text
DKC-MSR-IMPLEMENTATION-SCOPE-V1
Independent Scope Review-1
```
