# WAEP Roadmap V1

## Status

```text
Artifact: WAEP-ROADMAP-V1
State: PROPOSED / PORTFOLIO ROADMAP CANDIDATE
Source: PR #9
Current-Main Reconciliation: V2 STATUS CLARIFICATION
Roadmap Lock: NOT AUTHORIZED
Implementation Start: NOT AUTHORIZED
```

このRoadmapは順序と目標を示すCandidateである。

Roadmap上のPhase記載は、各GateのGOを意味しない。

## 12-Month Program

### Phase 0 — Portfolio Foundation (0-2 weeks)

- lock repository roles;
- define knowledge classes;
- define promotion gate;
- establish baseline metrics.

`lock repository roles`は将来のRoadmap目標であり、Current StateでLOCKEDであることを意味しない。

### Phase 1 — Knowledge Extraction (Month 1-2)

Primary sources:

- `audit-management-system-mvp`;
- `severe-behavior-support-spfx`.

Targets:

- 20+ evidence-backed candidates;
- 10+ PORTABLE candidates;
- 5+ policy candidates;
- 3+ deterministic enforcement candidates.

### Phase 2 — Control Center Knowledge Integration (Month 2-4)

- `AGENT-KNOWLEDGE-REGISTRY-V1`;
- `CONTROL-CENTER-EXECUTION-POLICY-V1`;
- connect AgentTask, Worker Authority, routing, knowledge policy and Human Gate without widening execution authority.

### Phase 3 — Cross-Repo Control Center Pilot (Month 3-6)

Target: `severe-behavior-support-spfx`.

Stages:

1. READ ONLY observation;
2. PLAN / next-action proposal;
3. worker routing;
4. WRITE gated by explicit Human GO;
5. independent verification;
6. Draft PR only.

Ready, Merge, Deploy and LIVE WRITE remain separate gates.

### Phase 4 — Commercial Validation (Month 3-6)

Target: `yasutakesougo-welfare-m365-dx-diagnostic`.

Complete the path:

`Front Door -> Mapping -> Conflict Detection -> Structured Input -> Diagnostic Engine -> Human Review -> Proposal -> Estimate -> Mini/Standard -> Continuous Support`.

Use synthetic acceptance and human-operated timing evidence before formal price lock or customer production use.

### Phase 5 — Lab Knowledge Intake (Month 5-8)

- `zatsuzen-homepage`: responsive UI, visual review, SEO/publication safety;
- `hinata`: accessibility, reduced motion, low-pressure UX, safe AI output validation.

Lab success alone does not authorize CORE adoption.

### Phase 6 — Promotion Pipeline (Month 6-9)

Operate `KNOWLEDGE-PROMOTION-GATE-V1` and mature selected rules toward `PROVEN_CROSS_REPO`.

Portfolio maturity is a Derived Projection and does not become immutable Knowledge Record authority.

### Phase 7 — Greenfield Transfer Test (Month 9-12)

Start one new repository with the mature portfolio baseline and compare against historical baselines.

## Program Metrics

Track at minimum:

- repeated failure rate;
- P0/P1 finding rate;
- correction-loop count;
- CI regression rate;
- Issue-to-Draft-PR time;
- human prompt/intervention count;
- reusable knowledge adoption count;
- test/policy/gate enforcement rate;
- cross-repository reuse success rate.

## Immediate Priority

```text
1. CROSS-REPO-AGENT-KNOWLEDGE-EXTRACTION-V1
2. CONTROL-CENTER-EXECUTION-POLICY-V1
3. CROSS-REPO-CONTROL-CENTER-PILOT-V1
```

The first 30 days should prioritize definition and lock of the portfolio/knowledge governance layer rather than broad implementation.

## Authority Boundary

Roadmap progression does not authorize Definition Lock, Implementation Start, Ready, Merge, Deploy, Runtime Activation, LIVE WRITE, or external mutation.
