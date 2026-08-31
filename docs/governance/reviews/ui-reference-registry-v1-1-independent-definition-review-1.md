# UI Reference Registry V1.1 — Independent Definition Review-1

Review target: PR #109

Initial target HEAD: `24cb70a452d6d7aefc972eb400abe167b628fbc3`

Verdict: CORRECTION REQUIRED

## P1 — Access-path inference is not closed

The definition listed `MCP`, `Skill`, `Registry`, `Web`, and `Manual` as access methods, but it did not bind resources to preferred or fallback access paths.

An agent could therefore infer an MCP or Skill endpoint from the registry entry without confirming that the endpoint exists in the current execution environment.

Required correction:

- define preferred and fallback access paths
- require current-environment availability confirmation
- prohibit inference of unsupported MCP, Skill, or Registry endpoints

## P2 — External-reference freshness is not explicit

The definition has an observation date, but it did not require revalidation before a later Definition relies on a volatile external capability.

Required correction:

- record observation date in adoption evidence
- revalidate external capability before fresh use
- classify unconfirmed capabilities explicitly

## P2 — Human and simulation evidence can be conflated

The definition required human friction re-evaluation but did not distinguish direct human acceptance from simulation evidence.

Required correction:

- classify human evidence as `HUMAN`, `SIMULATION`, or `NONE`
- prohibit simulation evidence from being represented as direct human acceptance
- keep rendered browser acceptance separate from human acceptance

## Gate

```text
Independent Definition Review-1: CORRECTION REQUIRED
Human Definition Lock: BLOCKED
Implementation Start: NOT AUTHORIZED
Ready: NOT AUTHORIZED
Merge: NOT AUTHORIZED
```
