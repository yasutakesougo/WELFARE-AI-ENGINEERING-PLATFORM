# UI Reference Registry V1.1

Status: DEFINITION IN REVIEW

Observation date: 2026-08-31

Authority: advisory reference policy only

## 1. Purpose

This registry defines how UI-improvement agents research external UI references before proposing implementation changes.

The registry is not a product requirement, design-system authority, implementation authorization, or permission to modify business logic.

The goal is to reduce human UI friction by grounding candidate patterns in real product evidence, checking implementation fit, and verifying the result in a rendered browser.

## 2. Scope

This registry applies when an agent proposes changes to user-facing layout, interaction, component structure, visual hierarchy, state feedback, or motion.

It does not authorize package installation, framework migration, design-system replacement, production deployment, or cross-repository mutation.

## 3. Core Registry

### 3.1 Real product pattern research

Primary resources:

- Mobbin — https://mobbin.com
- Refero — https://refero.design

Use these resources first when the problem concerns navigation, forms, list/detail structure, empty states, confirmation flows, onboarding, or other established product interactions.

The agent should search for multiple examples and extract the common interaction pattern instead of copying one screen.

### 3.2 Implementable component reference

Primary resource:

- shadcn/ui — https://ui.shadcn.com

Use shadcn/ui to evaluate whether an approved interaction pattern can be represented with accessible, composable primitives.

Existing project components take precedence over new dependencies.

### 3.3 Agent and AI-native UI reference

Primary resources:

- beUI — https://beui.dev
- Beautiful UI — https://beautifului.dev

Use these resources when the interface contains agent status, streaming output, approval controls, tool activity, loading states, diffs, or other AI-native interaction patterns.

Do not introduce agent-specific presentation into ordinary business workflows without a user problem that requires it.

### 3.4 Motion and state communication

Primary resources:

- Transitions.dev — https://transitions.dev
- 60fps.design — https://60fps.design

Use motion only after information architecture and interaction structure are stable.

Motion must communicate state, hierarchy, causality, progress, or continuity.

Decorative animation alone is not an adoption reason.

## 4. Extended Registry

Use these resources only when the Core Registry does not provide a suitable pattern or when additional visual exploration is justified.

- CollectUI — https://collectui.com
- Page Flows — https://pageflows.com
- recent.design — https://recent.design
- RareUI — https://rareui.com
- Magic UI — https://magicui.design
- Aceternity UI — https://ui.aceternity.com
- Godly — https://godly.website
- Lapa Ninja — https://www.lapa.ninja
- Muzli — https://muz.li

Extended resources do not override the existing component library or accessibility constraints.

## 5. Experimental Registry

- Canvas UI — https://canvasui.dev

Canvas UI is classified as experimental for ordinary application work.

An agent may propose it only when a validated user requirement depends on canvas- or WebGL-style presentation and the same result cannot be achieved reasonably with the existing stack.

## 6. Access Method Classification

Record how each reference was obtained.

Allowed values:

- MCP
- Skill
- Registry
- Web
- Manual

The following table records the preferred access path known at the observation date.

| Resource | Preferred access | Fallback |
| --- | --- | --- |
| Mobbin | MCP when confirmed available | Web / Manual |
| Refero | MCP when confirmed available | Web / Manual |
| shadcn/ui | Registry / Web | Manual |
| beUI | MCP, Skill, or Registry when confirmed available | Web / Manual |
| Beautiful UI | Registry or Web when confirmed available | Manual |
| Transitions.dev | Skill when confirmed available | Web / Manual |
| 60fps.design | MCP when confirmed available | Web / Manual |
| Extended Registry resources | Web unless another path is confirmed | Manual |
| Canvas UI | Web | Manual |

An agent must not infer that an MCP, Skill, or Registry endpoint exists merely because the resource appears in this registry.

Before using an agent-oriented access path, the agent must confirm that the path is available in the current execution environment.

If the preferred access path is unavailable, the agent may use the documented fallback without changing the authority of the evidence.

Availability of MCP, Skill, or Registry access does not increase the authority of a reference.

## 7. External Reference Freshness

External resources are volatile and may change independently of this repository.

Before relying on an external resource for a new UI Definition, record the observation date and confirm that the referenced resource or access path still exists.

Do not treat a previously recorded capability as current merely because it appears in this registry.

If the current capability cannot be confirmed, record it as `UNCONFIRMED` and use another available source or stop the affected research step.

A stale or unavailable reference does not invalidate historical adoption evidence, but it cannot be used as fresh evidence without revalidation.

## 8. Standard Research Sequence

Use this sequence for UI-improvement work.

```text
USER FRICTION
    ↓
REAL PRODUCT RESEARCH
Mobbin / Refero
    ↓
PATTERN SYNTHESIS
    ↓
EXISTING PROJECT COMPONENT CHECK
    ↓
IMPLEMENTATION REFERENCE
shadcn/ui
    ↓
OPTIONAL SPECIALIZED COMPONENT RESEARCH
beUI / Beautiful UI / Extended Registry
    ↓
OPTIONAL MOTION RESEARCH
Transitions.dev / 60fps.design
    ↓
ACCESSIBILITY CHECK
    ↓
DEFINITION
    ↓
INDEPENDENT DEFINITION REVIEW
    ↓
AUTHORIZED IMPLEMENTATION
    ↓
RENDERED BROWSER ACCEPTANCE
    ↓
HUMAN FRICTION RE-EVALUATION
```

A later stage must not be used to bypass an unresolved earlier-stage problem.

## 9. Selection Priority

Evaluate candidates in this order.

1. Task clarity
2. Information hierarchy
3. Cognitive load
4. Error prevention
5. Accessibility
6. Implementation simplicity
7. Visual consistency
8. Visual novelty
9. Animation

A candidate should normally be rejected when it improves a lower-priority property by degrading a higher-priority property.

## 10. Mandatory Adoption Record

For every adopted external UI pattern, record:

```text
Problem:
Research Query:
Source:
Observation Date:
Access Method:
Access Availability: CONFIRMED | UNCONFIRMED
Reference Evidence:
Observed Pattern:
Candidate:
Existing Component Fit: REUSE | ADAPT | NEW
Adaptation:
Rejected Alternatives:
Accessibility Impact:
Dependency Impact: NONE | EXISTING | NEW
Motion Justification:
Expected Friction Reduction:
Rendered Acceptance:
Human Evidence Type: HUMAN | SIMULATION | NONE
Human Acceptance:
```

The adoption record must identify the user problem before the reference source.

`SIMULATION` evidence must not be represented as direct human acceptance.

A final Human Acceptance claim requires actual human review evidence.

## 11. Anti-patterns

Reject the following unless a separate explicit justification is approved:

- adopting a pattern because it is trendy
- screenshot copying
- changing business logic to reproduce a reference UI
- design-system migration for a single reference pattern
- unnecessary package additions
- excessive card fragmentation
- duplicate presentation of the same information
- presenting technical identifiers as primary human-facing information
- hover-only interaction
- layouts that lose meaning on small screens
- animation that blocks task completion
- animation that ignores reduced-motion requirements
- visually impressive effects that increase cognitive load
- inferring an unavailable MCP or Skill endpoint
- presenting simulated acceptance as human acceptance

## 12. Verification Requirements

Source inspection alone cannot produce a UI PASS.

The implementation must be checked in a rendered browser at the supported viewport sizes.

Verification must cover, where applicable:

- information hierarchy
- keyboard operation
- focus behavior
- responsive behavior
- reduced-motion behavior
- loading and error states
- duplicate rendering
- preservation of business data
- before/after human friction

CI success is not a substitute for rendered browser acceptance.

Rendered browser acceptance is technical evidence and must not be relabeled as human acceptance.

## 13. Governance Boundaries

This registry provides research guidance only.

It does not authorize:

- implementation start
- dependency installation
- business-logic changes
- repository-wide design-system replacement
- production deployment
- cross-repository writes
- Ready transition
- merge

Each mutation remains subject to the governing workflow and its separate Human authority gates.

## 14. Definition Acceptance Criteria

The definition is review-cleared only when an independent review confirms all of the following:

- Core, Extended, and Experimental resources have distinct roles.
- External references cannot become product authority implicitly.
- Existing components are checked before new dependencies.
- Real-product research precedes visual refinement.
- Motion research occurs after interaction structure is stable.
- Access Method and current availability are recorded for reproducibility.
- Agents do not infer unsupported MCP, Skill, or Registry endpoints.
- External resource freshness is revalidated for new Definitions.
- Adoption records begin with the user problem.
- Rendered browser acceptance remains mandatory.
- Simulation evidence cannot be represented as human acceptance.
- Human friction is re-evaluated after implementation.
- No implementation or merge authority is implied by this document.

## 15. Current Gate

```text
UI-REFERENCE-REGISTRY-V1.1
Definition: CORRECTION-1 APPLIED
Independent Definition Re-Review: REQUIRED
Human Definition Lock: NOT GRANTED
Implementation Start: NOT AUTHORIZED
Ready: NOT AUTHORIZED
Merge: NOT AUTHORIZED
```
