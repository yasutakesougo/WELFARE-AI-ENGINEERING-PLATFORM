# DKC Post-Merge P2 — Correction-1

## Finding

The post-merge P2 finding is VALID.

`actorType` and `creationMode` were validated through `String(...)` coercion, allowing non-string coercible values such as `["AGENT"]` and `["AUTOMATED"]` to satisfy closed-world enum checks.

## Correction

- Remove coercive enum validation.
- Require the original `actorType` value to be a string and an exact member of `HUMAN | AGENT | SERVICE | AUTOMATION`.
- Require the original `creationMode` value to be a string and an exact member of `HUMAN | AGENT_ASSISTED | AUTOMATED`.
- Reject arrays, objects, and other coercible non-string values as `INVALID_SCHEMA / INVALID_FIELD_TYPE`.
- Preserve acceptance of exact allowed string values.
- Add regression tests for coercible non-string values.

## Authority Boundary

This correction is limited to the validated P2 post-merge defect.

It does not authorize:

- Definition changes
- DKC authority changes
- Deploy / Runtime Activation / LIVE WRITE
- unrelated implementation mutation
- merge

## Next Gate

Independent Post-Merge Re-Review-1.
