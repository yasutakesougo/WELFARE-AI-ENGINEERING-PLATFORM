# AGENT-ROUTING-RULES-V1

Status: Documentation-only operating rule.

Purpose: Keep per-task agent routing identity clear while allowing necessary task-specific instructions, preserving existing Human Gate, locked scope, and review boundaries.

Human-readable canonical:
https://app.notion.com/p/3e1128e1229d819eaa37d89fe88f946b

## 1. Three-layer model

```text
Notion
= human-readable routing canonical

GitHub
= agent-readable fixed operating rule

Per-task prompt
= routing identity + necessary task-specific instructions
```

A task prompt MUST identify:

```text
TO
= destination

ROLE
= role

TARGET
= workstream / issue / PR / exact artifact
```

TO / ROLE / TARGET are mandatory routing identity.

Task-specific instructions MAY also be included when required, including:

```text
MODE
scope
constraints
evidence basis
acceptance criteria
STOP conditions
verification requirements
task-specific authority boundaries
```

Such task-specific instructions:

- do NOT create Human authority;
- do NOT expand existing authority;
- do NOT consume a Human Gate.

This document does not create a new agent authority.

This document does not create a new Human Gate.

This document does not replace a locked Definition, locked Scope, exact implementation HEAD, repository evidence, or an explicit current Human instruction.

## 2. Default routing

```text
ChatGPT
= architecture / reasoning / gate design
↓
Bonsai / Gemini when useful
= specialist READ / SUGGEST / REVIEW
↓
Human GO
= authority
↓
Grok Bot
= persistent coordination
↓
Cursor
= implementation
↓
Verify / CI
= verification
↓
Cursor Cloud Agent
= READ / REVIEW / DIAGNOSTIC support
↓
Fresh Independent Review when required
= independent review
↓
Human Ready / Merge / Deploy
= decisions as separately applicable
```

Grok Bot is a Persistent Development Coordinator. It is coordination evidence and recommendation only. It MUST NOT become an additional approval stage.

## 3. Per-task prompt contract

A task prompt MUST identify TO / ROLE / TARGET as mandatory routing identity:

```text
TO
= <destination>

ROLE
= <role>

TARGET
= <workstream / issue / PR / exact artifact>
```

Task-specific instructions MAY also be included when required, including MODE, scope, constraints, evidence basis, acceptance criteria, STOP conditions, verification requirements, and task-specific authority boundaries.

Those task-specific instructions do not create Human authority, do not expand existing authority, and do not consume a Human Gate.

Do not repeat standing authority text in every prompt when this document already resolves it.

Resolve standing behavior from this document and resolve task-specific authority from the TARGET evidence and any explicit Human authorization already established for the TARGET.

If the TARGET does not identify enough review basis, locked scope, exact HEAD, or required evidence for the requested ROLE, return:

```text
STATUS
= HOLD

REASON
= MISSING BASIS
```

Do not guess the missing basis.

## 4. Destination contract

| TO | Allowed ROLE | Default use | Standing authority |
| --- | --- | --- | --- |
| ChatGPT | DESIGN / ROUTE / REVIEW | Architecture, reasoning, Definition, scope organization, next-gate routing, instruction generation | Suggest / organize only. No Human Gate authority |
| Bonsai | REVIEW | Focused repository reading, preflight, diff impact, second opinion | READ / SUGGEST ONLY |
| Gemini | REVIEW | Focused analysis, second opinion, external or repository-assisted review | READ / SUGGEST ONLY unless a separate explicit authority exists |
| Grok Bot | COORDINATE | Persistent Development Coordinator: READ / CHECK / DIAGNOSE / SUMMARIZE / HANDOFF / SUGGEST, evidence collection, repository / PR / CI state coordination | Authority NONE. Coordination evidence and recommendation only. No Human / Definition Lock / Scope Lock / Ready / Merge / Deploy / Human Gate / implementation authority unless separately and explicitly authorized. MUST NOT become an additional approval stage |
| Cursor | IMPLEMENT / VERIFY | Human-GO-authorized implementation and local verification | WRITE only inside the authorized scope for IMPLEMENT; verification must not expand scope |
| Cursor Cloud Agent | REVIEW / DIAGNOSTIC | Post-implementation reading, review support, diagnosis | READ / REVIEW / DIAGNOSTIC only |
| Fresh Independent Review | REVIEW | Independent formal review from a separate context | REVIEW ONLY; no self-fix |
| Human | AUTHORITY | GO / Ready / Merge / Deploy decisions as separately applicable | Final authority |

CI is a verification stage, not a Human authority and not an agent authority.

Review PASS does not equal Human Ready GO.

Human Ready GO does not equal Merge GO.

Merge GO does not equal Deploy GO.

CI / verification PASS does not equal Human authorization.

Recommendation does not equal authorization.

Agent-generated text does not equal Human Gate consumption.

## 5. ROLE contract

### DESIGN / ROUTE

Identify the current state, next gate, and correct destination.

Do not consume Human GO.

Do not treat a recommendation as authorization.

### REVIEW

Read the TARGET and its evidence independently enough for the requested review.

Return findings and PASS / HOLD when the TARGET's review contract defines that verdict.

Do not modify the reviewed implementation.

Do not self-fix a defect found during Fresh Independent Review.

### COORDINATE

Grok Bot default role.

Collect and summarize repository, PR, CI, and handoff state.

Emit coordination evidence, CHECK / DIAGNOSE results, HANDOFF packets, and suggestions only.

Do not create Human authority.

Do not consume a Human Gate.

Do not act as an approval stage.

Do not implement unless a separate explicit Human implementation authorization applies to the TARGET and destination.

### IMPLEMENT

Implementation requires an already-established Human implementation authorization applicable to the TARGET.

Modify only the authorized scope.

Stop on a scope conflict.

Do not reinterpret a missing scope as implicit permission.

### VERIFY

Run or inspect the verification required by the TARGET.

Record the exact subject being verified when applicable.

Verification success does not equal Human Ready, Merge, or Deploy approval.

### DIAGNOSTIC

Investigate causes and evidence.

Do not convert diagnosis into implementation authority.

### AUTHORITY

Human-only role.

Agent output cannot consume or synthesize this role.

## 6. Precedence

When instructions conflict, use this order:

1. Explicit current Human instruction and applicable Human Gate record.
2. Locked Definition / locked Scope / exact repository evidence for the TARGET.
3. Repository-specific governance rules.
4. This routing document.
5. The per-task prompt's TO / ROLE / TARGET routing identity and any attached task-specific instructions.

A lower layer cannot expand authority granted by a higher layer.

When authority records for the same subject conflict, a newer explicit Human decision supersedes an older conflicting operational state unless the newer decision explicitly preserves it.

Supersession:

- does NOT rewrite historical facts;
- does NOT create retroactive authority;
- does NOT imply that an earlier unauthorized action became authorized.

Preserve existing repository authority-resolution semantics.

## 7. Global stop conditions

Return HOLD instead of proceeding when:

- the requested ROLE requires authority that is not established;
- TARGET identity is ambiguous;
- required review basis cannot be resolved;
- IMPLEMENT would require out-of-scope files or behavior;
- Fresh Independent Review independence cannot be preserved;
- a repository-specific rule conflicts with this document;
- Grok Bot or any other non-Human destination would be treated as an approval stage.

## 8. Human-facing operating rule

The human operator must still fix routing identity for a normal task:

```text
TO
= where to send it

ROLE
= what that destination should do

TARGET
= what exact thing it should act on
```

When the task requires it, also attach MODE, scope, constraints, evidence basis, acceptance criteria, STOP conditions, verification requirements, or task-specific authority boundaries.

Those attachments remain task-specific instructions only. They do not create Human authority, expand existing authority, or consume a Human Gate.

Long authority blocks are reserved for changes to the authority model itself, not ordinary task routing.
