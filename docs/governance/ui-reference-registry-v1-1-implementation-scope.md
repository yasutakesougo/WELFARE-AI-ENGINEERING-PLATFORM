# UI-REFERENCE-REGISTRY-V1.1 Implementation Scope Definition

## 0. Status and Authority

```text
Scope ID: UI-REFERENCE-REGISTRY-V1.1-IMPLEMENTATION-SCOPE
Parent Definition: UI-REFERENCE-REGISTRY-V1.1
Parent Definition State: LOCKED
Parent Locked HEAD: e484eaf89d81f7ce0d6c94dedef1ef7e47ac3961
Scope State: DRAFT / NOT REVIEW-CLEARED
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
External MCP/Skill Installation: NOT AUTHORIZED
Cross-Repository Mutation: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
Next Gate: Independent Scope Review-1
```

This scope defines the smallest executable layer beneath the locked UI Reference Registry Definition.

Scope Definition does not grant implementation authority.

## 1. Mission

Implement only the repository-local guidance and validation needed for WAEP agents to apply the locked UI Reference Registry consistently.

The first implementation slice must prove this path:

```text
UI improvement task
  -> user-friction statement
  -> reference research record
  -> access-method/freshness classification
  -> candidate-pattern adoption record
  -> deterministic validation
  -> reviewable evidence artifact
```

This slice does not perform UI redesign, external service installation, browser automation, dependency installation, or product-repository mutation.

## 2. Included Responsibilities

### A1. Machine-readable registry contract

A repository-local machine-readable representation may be added for the locked registry fields required by validation.

Minimum resource fields:

```text
id
name
tier
role
preferredAccess
fallbackAccess
observationDate
freshnessRequired
```

Allowed tier values:

```text
CORE
EXTENDED
EXPERIMENTAL
```

Allowed access values:

```text
MCP
SKILL
REGISTRY
WEB
MANUAL
```

The machine-readable representation must remain subordinate to the locked Definition and must not invent capabilities absent from it.

### A2. Adoption Record contract

Implement a structured contract representing the locked Mandatory Adoption Record.

Required fields:

```text
problem
researchQuery
source
observationDate
accessMethod
accessAvailability
referenceEvidence
observedPattern
candidate
existingComponentFit
adaptation
rejectedAlternatives
accessibilityImpact
dependencyImpact
motionJustification
expectedFrictionReduction
renderedAcceptance
humanEvidenceType
humanAcceptance
```

Allowed values must include:

```text
AccessAvailability: CONFIRMED | UNCONFIRMED
ExistingComponentFit: REUSE | ADAPT | NEW
DependencyImpact: NONE | EXISTING | NEW
HumanEvidenceType: HUMAN | SIMULATION | NONE
```

### A3. Deterministic validator

Implement a pure repository-local validator that can reject at minimum:

```text
missing user problem
missing observation date
unsupported access method
unsupported tier
unsupported enum value
MCP/Skill/Registry use marked CONFIRMED without evidence text
SIMULATION represented as final human acceptance
NEW dependency impact without explicit dependency justification
motion adoption without motion justification
```

The validator must not call external services.

### A4. Agent-facing usage template

Provide one concise repository-local template or instruction artifact showing the standard sequence:

```text
User Friction
-> Real Product Research
-> Pattern Synthesis
-> Existing Component Check
-> Implementation Reference
-> Optional Visual/Motion Research
-> Accessibility Check
-> Definition
-> Rendered Browser Acceptance
-> Human Friction Re-evaluation
```

The template must state that external references are advisory and that unavailable MCP/Skill endpoints must not be inferred.

### A5. Synthetic examples

Provide synthetic PASS and FAIL fixtures sufficient to test the validator.

Fixtures must not contain real user data, production credentials, or external account identifiers.

## 3. Explicitly Excluded Responsibilities

The first implementation slice must not implement or simulate:

```text
Mobbin MCP installation or invocation
Refero MCP installation or invocation
60fps MCP installation or invocation
Transitions.dev Skill installation or invocation
beUI MCP/Skill installation or invocation
browser scraping
external-site crawling
Figma integration
shadcn component installation
Magic UI / Aceternity package installation
Canvas/WebGL runtime work
product UI changes
SPFx changes
SharePoint / M365 mutation
cross-repository writes
LLM-driven autonomous design selection
automatic Ready / Merge decisions
production deployment
```

## 4. Allowed Repository Paths for Future Implementation

After a separate Human Implementation Start GO, implementation mutation is limited to:

```text
packages/ui-reference-registry/**
docs/governance/ui-reference-registry-v1-1-usage.md
docs/audit/ui-reference-registry-v1-1-impl-*.md
```

The locked parent Definition and its review/lock artifacts are read-only inputs.

No other repository path is authorized by this scope.

## 5. I/O Boundary

Runtime validation must be PURE_LOCAL.

Allowed:

```text
function arguments
returned values
in-memory structures
synthetic test fixtures
repository-local static registry data
```

Denied runtime I/O:

```text
HTTP
MCP invocation
Skill invocation
GitHub API
filesystem mutation
network
SharePoint
M365
external browser automation
secret access
```

Build/test tooling may read source and fixture files normally.

## 6. Dependency Boundary

```text
New runtime dependencies: NOT AUTHORIZED
New dev dependencies: NOT AUTHORIZED unless separately approved
External MCP server install: NOT AUTHORIZED
External Skill install: NOT AUTHORIZED
Design-system dependency: NOT AUTHORIZED
```

Prefer existing repository tooling and standard library capabilities.

## 7. Determinism and Fail-Closed Requirements

Equal input must produce equal validation output.

Unknown or unsupported values must fail closed.

An unavailable or unconfirmed external access path must remain `UNCONFIRMED`; validation must not promote it to `CONFIRMED`.

`SIMULATION` must never validate as final Human Acceptance evidence.

## 8. Minimum Acceptance Tests

```text
UIR-A01 valid CORE resource + WEB access -> PASS
UIR-A02 unsupported tier -> FAIL
UIR-A03 unsupported access method -> FAIL
UIR-A04 MCP marked CONFIRMED without evidence -> FAIL
UIR-A05 MCP marked UNCONFIRMED with fallback WEB -> PASS
UIR-A06 missing problem -> FAIL
UIR-A07 SIMULATION with final Human Acceptance claim -> FAIL
UIR-A08 HUMAN with explicit acceptance evidence -> PASS
UIR-A09 DependencyImpact=NEW without justification -> FAIL
UIR-A10 motion pattern with empty justification -> FAIL
UIR-A11 REUSE candidate with no new dependency -> PASS
UIR-A12 equal input -> equal output
UIR-A13 synthetic fixtures contain no production identifiers/secrets -> PASS
UIR-A14 no network/MCP/Skill call is required for validator tests -> PASS
```

Test PASS does not authorize external integrations or product UI mutation.

## 9. Verification Requirements

Independent Implementation Review must bind evidence to:

```text
exact implementation HEAD
exact parent locked HEAD
exact scope revision
exact test command
exact typecheck/lint command if applicable
exit codes
test count
changed-file list
new dependency count
network/external invocation count
```

Required expected values for this slice:

```text
new runtime dependency count = 0
external MCP/Skill invocation count = 0
product repository mutation count = 0
```

## 10. Scope Invariants

```text
INV-UIR-001 Parent locked Definition is not modified.
INV-UIR-002 External references remain advisory, never authoritative.
INV-UIR-003 MCP/Skill/Registry availability is never inferred.
INV-UIR-004 Validation is deterministic and local.
INV-UIR-005 Existing components remain preferred over new dependencies.
INV-UIR-006 SIMULATION cannot become HUMAN evidence.
INV-UIR-007 Motion requires an explicit state/causality justification.
INV-UIR-008 Product UI changes are outside this slice.
INV-UIR-009 Cross-repository writes are prohibited.
INV-UIR-010 Unknown state fails closed.
```

## 11. Independent Scope Review Checklist

Independent Scope Review-1 must verify:

```text
[ ] Parent locked HEAD is exact.
[ ] Scope is narrower than the locked Definition.
[ ] Allowed repository paths are closed-world.
[ ] Parent Definition remains read-only.
[ ] External MCP/Skill installation and invocation are excluded.
[ ] Product UI mutation is excluded.
[ ] New dependencies are not silently authorized.
[ ] Validator can enforce freshness/access/human-evidence invariants.
[ ] Synthetic acceptance covers PASS and FAIL paths.
[ ] Implementation evidence is exact-HEAD bound.
```

## 12. Gate Chain

```text
Implementation Scope Definition
-> Independent Scope Review-1
-> Scope Correction-N if required
-> Independent Scope Re-Review-N
-> Human Implementation Start GO / HOLD
-> Implementation
-> Focused Verification
-> Exact Diff / HEAD Fixation
-> Independent Implementation Review
-> Human Ready GO / HOLD
-> Ready transition
-> separate Human Merge GO / HOLD
```

Every downstream authority remains separate.

## 13. Exit State

```text
UI-REFERENCE-REGISTRY-V1.1 Implementation Scope: DEFINED
Parent Definition: LOCKED / UNCHANGED
Independent Scope Review-1: REQUIRED
Implementation Start: NOT AUTHORIZED
Dependency Addition: NOT AUTHORIZED
External MCP/Skill Installation: NOT AUTHORIZED
Product UI Mutation: NOT AUTHORIZED
Cross-Repository Mutation: NOT AUTHORIZED
Ready / Merge / Deploy / LIVE WRITE: NOT AUTHORIZED
```
