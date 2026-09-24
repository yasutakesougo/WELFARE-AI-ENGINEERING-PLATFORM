# AGENT-ROUTING-RULES-V1

Status: Documentation-only operating rule.

Purpose: Keep per-task agent instructions minimal while preserving existing Human Gate, locked scope, and review boundaries.

Human-readable canonical:
https://app.notion.com/p/3e1128e1229d819eaa37d89fe88f946b

## 1. Three-layer model

```text
Notion
= human-readable routing canonical

GitHub
= agent-readable fixed operating rule

Per-task prompt
= TO / ROLE / TARGET only
```

This document does not create a new agent authority.

This document does not create a new Human Gate.

This document does not replace a locked Definition, locked Scope, exact implementation HEAD, repository evidence, or an explicit current Human instruction.

## 2. Default routing

```text
ChatGPT
↓
Bonsai / Gemini when useful
↓
Human GO
↓
Cursor
↓
Verify / CI
↓
Cursor Cloud Agent
= READ / REVIEW / DIAGNOSTIC support
↓
Fresh Independent Review when required
↓
Human Ready / Merge
```

## 3. Per-task prompt contract

A normal task prompt contains only:

```text
TO
= <destination>

ROLE
= <role>

TARGET
= <workstream / issue / PR / exact artifact>
```

Do not repeat standing authority text in every prompt.

Resolve standing behavior from this document and resolve task-specific authority from the TARGET evidence.

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
| ChatGPT | DESIGN / ROUTE / REVIEW | Definition, scope organization, next-gate routing, instruction generation | Suggest / organize only. No Human Gate authority |
| Bonsai | REVIEW | Focused repository reading, preflight, diff impact, second opinion | READ / SUGGEST ONLY |
| Gemini | REVIEW | Focused analysis, second opinion, external or repository-assisted review | READ / SUGGEST ONLY unless a separate explicit authority exists |
| Cursor | IMPLEMENT / VERIFY | Human-GO-authorized implementation and local verification | WRITE only inside the authorized scope for IMPLEMENT; verification must not expand scope |
| Cursor Cloud Agent | REVIEW / DIAGNOSTIC | Post-implementation reading, review support, diagnosis | READ / REVIEW / DIAGNOSTIC only |
| Fresh Independent Review | REVIEW | Independent formal review from a separate context | REVIEW ONLY; no self-fix |
| Human | AUTHORITY | GO / Ready / Merge / Deploy decisions as applicable | Final authority |

CI is a verification stage, not a Human authority and not an agent authority.

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
5. The minimal TO / ROLE / TARGET prompt.

A lower layer cannot expand authority granted by a higher layer.

## 7. Global stop conditions

Return HOLD instead of proceeding when:

- the requested ROLE requires authority that is not established;
- TARGET identity is ambiguous;
- required review basis cannot be resolved;
- IMPLEMENT would require out-of-scope files or behavior;
- Fresh Independent Review independence cannot be preserved;
- a repository-specific rule conflicts with this document.

## 8. Human-facing operating rule

The human operator should only need to answer three questions for a normal task:

```text
TO
= where to send it

ROLE
= what that destination should do

TARGET
= what exact thing it should act on
```

Long authority blocks are reserved for changes to the authority model itself, not ordinary task routing.
