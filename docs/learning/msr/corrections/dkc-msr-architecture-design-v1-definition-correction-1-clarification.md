# DKC-MSR-ARCHITECTURE-DESIGN-V1 — Definition Correction-1 Clarification

## Status

```text
Definition: DKC-MSR-ARCHITECTURE-DESIGN-V1
Revision: Definition Correction-1
Record Type: PRE-RE-REVIEW NORMATIVE CLARIFICATION
Parent Correction Blob: d59f3862993806f41408498dc3264b80dff559e9
Scope: MSR-IDENTITY-CANONICAL-KEY-001 only
Architecture Change: NONE
Authority Change: NONE
Implementation Start: NOT AUTHORIZED
Next Gate: Independent Definition Re-Review-1
```

This clarification is part of Definition Correction-1 and resolves two deterministic identity details found during pre-Re-Review self-check.

It does not create a new Correction revision.

## 1. TEST_EVIDENCE identity

Correction-1 §2.2 `sourceObjectKey.identity` is extended with:

```yaml
executionSourceObjectKey: null
```

The corrected identity member order is:

```text
providerObjectId
exactCommitSha
pathSnapshot
contentBlobId
testIdentity
executionSourceObjectKey
identityScheme
identityValue
```

For `objectType = TEST_EVIDENCE`, canonical identity requires:

```text
testIdentity
+
executionSourceObjectKey
```

`executionSourceObjectKey` MUST itself be a valid `SOURCE_OBJECT_KEY_V1` whose `objectType` is one of:

```text
CHECK_RUN
WORKFLOW_RUN
JOB
OTHER
```

For `OTHER`, its `identityScheme + identityValue` must identify an immutable execution record.

Nested `TEST_EVIDENCE` is prohibited as an `executionSourceObjectKey` to prevent recursive identity cycles.

Therefore:

```text
same testIdentity + different executionSourceObjectKey
  → different source object identity

same testIdentity + same executionSourceObjectKey
  → same source object identity, subject to payload snapshot versioning
```

A TEST_EVIDENCE record without a valid executionSourceObjectKey is `UNVERIFIABLE` and Canonical Snapshot persistence is `HOLD`.

## 2. Deterministic JSON string escaping

Correction-1 §2.5 serialization is further constrained.

After UTF-8 encoding and NFC normalization, JSON strings MUST use exactly these escaping rules:

```text
quotation mark U+0022  → \"
reverse solidus U+005C → \\
backspace U+0008       → \b
form feed U+000C       → \f
line feed U+000A       → \n
carriage return U+000D → \r
tab U+0009             → \t
other U+0000..U+001F   → \u00xx using lowercase hexadecimal digits
solidus U+002F          → MUST NOT be escaped
all other Unicode scalar values → emitted directly as UTF-8, not optional \u escaping
```

Unpaired surrogate code points are invalid input and produce `INVALID / HOLD` before serialization.

No adapter-specific alternate escaping is permitted.

This rule makes materialized `CANONICAL_SNAPSHOT_KEY_V1` serialization byte-deterministic for equal typed keys.

## 3. Added validation scenarios

```text
MSR-C1-V28 Same test identity in two different workflow/job executions
          → different TEST_EVIDENCE sourceObjectKeys.

MSR-C1-V29 TEST_EVIDENCE without executionSourceObjectKey
          → UNVERIFIABLE / Canonical Snapshot HOLD.

MSR-C1-V30 Equal typed keys containing slash, quote, reverse-solidus, control characters, and non-ASCII NFC strings
          → adapters emit byte-identical CANONICAL_SNAPSHOT_KEY_V1 serialization.
```

## 4. Added invariant

```text
INV-MSR-023  TEST_EVIDENCE identity binds both test identity and immutable execution source identity; canonical key serialization uses one deterministic escape form.
```

## 5. Re-Review Target

Independent Definition Re-Review-1 must evaluate the effective Definition as:

```text
Definition Start blob:
86eabbb9b5328177e3197ae3d2168815219f6e0b
+
Definition Correction-1 blob:
d59f3862993806f41408498dc3264b80dff559e9
+
this exact Clarification artifact
```

Definition Lock, Implementation Start, dependency addition, Ready, Merge, Deploy, Runtime Activation, and LIVE WRITE remain NOT AUTHORIZED by this clarification.
