# Knowledge Record V1 — Compatibility Notice

## Status

```text
Path retained from: PR #9 Portfolio Foundation candidate
Canonical Knowledge Content Template: templates/knowledge-record-content-v1.md
This file: COMPATIBILITY / MIGRATION NOTICE
Authoritative record schema: NOT DEFINED HERE
```

PR #9の旧templateは、Knowledge Record自身に`maturity`と`ACTIVE`等の状態を保存する構造を含んでいた。

その構造は、LOCKED `WAEP-LEARNING-SYSTEM-V1`の次の境界と両立しない。

```text
Knowledge Record does not own Authority.
Knowledge Lifecycle != Runtime Target State.
Maturity / Runtime Effective ACTIVE / CURRENT are derived projections.
```

したがって、旧schemaをCurrent Canonical Templateとして使用しない。

## Canonical Template

新しいKnowledge contentを作成する場合は、次を使用する。

```text
templates/knowledge-record-content-v1.md
```

Canonical contentはimmutableであり、authoritative lifecycle、validation、promotion、verification、runtime binding、CURRENT、maturityをRecord自身に保存しない。

## Legacy Field Mapping

旧PR #9 templateの概念は、必要な場合のみ次のように分離する。

| Legacy concept | Current handling |
| --- | --- |
| source evidence | immutable contentの`evidenceRefs` / provenance |
| classification.scopeClass | immutable contentの`scopeClass` |
| appliesTo / doesNotApplyTo | immutable contentの`applicability` |
| maturity.level | Derived Registry / Portfolio projection |
| status: ACTIVE / HOLD / SUPERSEDED / DEPRECATED | Decision RecordsとCanonical Decision Resolverから導出 |
| verification.lastVerified | KnowledgeVerificationDecision / derived CURRENT state |
| enforcement references | Policy / test / gate evidenceとして別管理 |

## Forbidden Use

このCompatibility Noticeから旧schemaを復元して、新規Knowledge Recordのauthoritative stateとして使用しない。

次の値をImmutable Knowledge Recordの自己申告authorityとして追加しない。

```text
maturity
ACTIVE
CURRENT
lifecycleStatus
validationResult
promotionResult
runtimeBindingStatus
currentState
supersededBy
```

## Authority Boundary

Template compatibilityはKnowledge Promotion、Implementation Start、Runtime Binding、Execution Authorityを付与しない。
