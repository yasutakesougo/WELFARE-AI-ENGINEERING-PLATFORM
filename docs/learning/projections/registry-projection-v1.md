# Registry Projection V1 (Derived)

Aligned to `WAEP-LEARNING-SYSTEM-V1` Definition Correction-2 §20.

```text
Derived Projection only.
Not an Authority Source (INV-LRN-030, AC-34, AC-35).
```

## Purpose

Provide Compatibility with existing WAEP Knowledge Registry fields
(Maturity, Validation Result, Verification State, Supersession State,
Last Verified, Enforcement Candidate) **without** treating them as
Authoritative Stored Fields on Knowledge Records.

## Projection Schema

```yaml
knowledgeId: ""
knowledgeVersion: ""
contentRef: ""
derived:
  maturity: ""                 # Classification Projection only (AC-36)
  validationState: ""
  verificationState: ""        # may include CURRENT_EXPIRED / NOT_CURRENT
  supersessionState: ""        # may include derived supersededBy
  enforcementCandidate: ""
  lifecycleState: ""           # never ACTIVE as lifecycle
  runtimeBindingByTarget: []   # BOUND|UNBOUND|DENIED|HELD|NOT_ELIGIBLE
resolution:
  resolvedAt: ""
  resolverVersion: ""
  decisionRefs: []
  resolutionState: OK|STALE|UNKNOWN|AMBIGUOUS|INVALID_CHAIN|MISSING_DEPENDENCY|EXPIRED
```

## Precedence

```text
Decision Registry
  >
Derived Registry Projection
```

If Projection is STALE or Resolution fails closed, do **not** use it for
Runtime Authority.

## Forbidden uses

```text
Projection maturity → Execution Authority
Projection verificationState alone → Runtime Binding
Stale projection → CURRENT or ACTIVE claim
Mutating Knowledge Record to mirror projection fields
```
