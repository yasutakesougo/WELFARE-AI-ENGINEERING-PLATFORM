# Knowledge Promotion Gate V1

## Objective

Prevent one-off observations, unverified assumptions, private context or repository-specific semantics from being promoted into portable engineering authority.

## Maturity States

```text
L0 OBSERVED
L1 DOCUMENTED
L2 GENERALIZED
L3 ADOPTED
L4 ENFORCED
L5 PROVEN_CROSS_REPO
```

## Transition Requirements

### L0 -> L1
- identifiable source evidence;
- observation recorded without over-generalization.

### L1 -> L2
- root cause or bounded causal hypothesis documented;
- PROJECT / DOMAIN / ENGINEERING classification completed;
- generalized rule has explicit applicability and non-applicability boundaries.

### L2 -> L3
- target repository explicitly adopts the rule;
- target authority remains local to that repository;
- adoption evidence recorded.

### L3 -> L4
At least one deterministic enforcement mechanism exists, such as:

- test;
- lint/static check;
- CI policy;
- human-gate checklist;
- runtime authorization gate.

Documentation alone is not `ENFORCED`.

### L4 -> L5
- evidence from at least two materially distinct repository contexts;
- no unresolved P0/P1 challenge to the generalized rule;
- measured outcome or regression evidence supports reuse;
- latest review confirms the rule has not been superseded.

## Result States

Promotion review returns exactly one of:

- `PROMOTE`
- `HOLD_EVIDENCE`
- `HOLD_APPLICABILITY`
- `REJECT_SENSITIVE`
- `REJECT_NOT_PORTABLE`
- `SUPERSEDED`
- `UNKNOWN`

`UNKNOWN` and either HOLD state are not PASS-equivalent.

## Authority Boundary

Promotion changes knowledge maturity only. It never grants implementation, worker execution, GitHub mutation, Ready, Merge, Deploy, production, M365/SharePoint/Entra, billing or customer-delivery authority.
