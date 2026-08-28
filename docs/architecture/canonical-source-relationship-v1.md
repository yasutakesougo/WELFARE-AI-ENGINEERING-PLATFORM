# WAEP Canonical Source Relationship V1

## Purpose

Portfolio FoundationとWAEP-LEARNING-SYSTEM-V1の正本関係を明示する。

両者のDefinition StateとAuthorityを混同しない。

## Current Repository Anchor

```text
Repository: yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM
Branch: main
Exact Baseline: 820104bf5fc520561a70e11467f9043b958dc247
```

このSHAはCurrent Repository Stateの観測基準である。

このSHA自体はDefinition Lock、Implementation Start、Ready、Merge、Deploy、Runtime Authorityを付与しない。

## Portfolio Foundation

PR #9由来のPortfolio Foundation資産は、次を定義するCandidateである。

- Portfolio Architecture
- Repository Role Registry
- Knowledge Classification
- Knowledge Promotion Gate
- WAEP Roadmap
- Knowledge Registry entry surface

Current Reconciliationでは、PR #9のREADME以外のCandidate blobをCurrent Main基準へ移植する。

内容の再解釈やDefinition Lockは行わない。

```text
State: DEFINITION CANDIDATE
Independent Portfolio Review: REQUIRED
Definition Lock: NOT AUTHORIZED
```

## Learning System

WAEP-LEARNING-SYSTEM-V1 Definition Correction-3は、独立レビューとHuman Definition Lockを経てPR #13でmainへマージされた。

```text
Definition State: LOCKED / CANONICAL ON MAIN
Lock Baseline: 533376fcd018d4db75cfe0cddab348da60cf0ab6
Definition Merge Commit: bc2d4b02d2b674bdd047086bcfa6a9ce3a0457ca
Implementation Start: NOT AUTHORIZED
Runtime Activation: NOT AUTHORIZED
```

Learning SystemのLOCKED semanticsは、Learning scopeにおけるCanonical Definitionである。

## Relationship Rule

Portfolio Foundation Candidateは、LOCKED Learning Systemを上書きしない。

LOCKED Learning Systemは、Portfolio Foundation Candidateを自動的にLOCKしない。

```text
Portfolio Definition State
  != Learning Definition State

Portfolio Knowledge Governance
  != Learning Runtime Authority

Repository Membership
  != Cross-Repository Mutation Authority
```

Portfolio Foundationを将来LOCKする際にLearning SystemのLOCKED semanticsと不一致が生じる場合は、推論で整合させない。

不一致はHOLDとし、対象DefinitionのCorrection cycleへ戻す。

## Precedence

WAEP内で状態が競合する場合は、次の順序を使用する。

1. Current Authority / Current Decision
2. LOCKED Canonical Definition
3. Current Repository State at exact SHA
4. Verified Evidence
5. Definition Candidate
6. Historical Review / PR body / stale snapshot

候補文書や旧PR bodyは、LOCKED Definitionまたは現在のGitHub metadataを上書きしない。

## Execution Boundary

このRelationship定義は、次を認可しない。

```text
Implementation Start
Ready
Merge
Deploy
Runtime Binding
LIVE WRITE
M365 Mutation
SharePoint Mutation
Entra Mutation
Customer Production Mutation
```
