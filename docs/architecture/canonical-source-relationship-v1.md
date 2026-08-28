# WAEP Canonical Source Relationship V1

## Purpose

Portfolio FoundationとWAEP-LEARNING-SYSTEM-V1の正本関係を明示する。

両者のDefinition StateとAuthorityを混同しない。

## Repository Anchors

```text
Repository: yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM
Branch: main
Reconciliation Source Baseline: 820104bf5fc520561a70e11467f9043b958dc247
PR #19 Merge Commit / Current Main: 7998a83c22bf8e61d725da61cca0f797690ad561
```

`Reconciliation Source Baseline`は、WAEP-CURRENT-REPOSITORY-RECONCILIATION-V2の
historical anchorである。

`PR #19 Merge Commit / Current Main`は、現在のRepository Stateの観測基準である。

これらのSHA自体はDefinition Lock、Implementation Start、Ready、Merge、Deploy、
Runtime Authorityを付与しない。

## Portfolio Foundation

PR #9由来のPortfolio FoundationはDefinition Candidateである。

Current Reconciliationでは、Current Main基準へCandidate資産を再配置する。

LOCKED Learning Systemと衝突しない資産はsource blobを保持する。

LOCKED Learning Systemと衝突または曖昧性がある資産はCompatibility Correctionを行う。

Historical PR #9 contentはPR #9 branchにEvidenceとして残す。

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

Learning SystemのLOCKED semanticsはLearning scopeにおけるCanonical Definitionである。

## Compatibility Rule

Portfolio Foundation CandidateはLOCKED Learning Systemを上書きしない。

LOCKED Learning SystemはPortfolio Foundation Candidateを自動的にLOCKしない。

Portfolio Candidateの旧schemaがLOCKED Learning semanticsと衝突する場合は、旧Candidateを優先しない。

```text
LOCKED Canonical Definition
  > incompatible Definition Candidate
```

具体的には、Immutable Knowledge Record自身に`maturity`、`ACTIVE`、`CURRENT`、Lifecycle authorityを保存しない。

Portfolio-level L0-L5 maturityはDerived Projectionとして扱う。

Authoritative Promotionは`KnowledgePromotionDecision@v1`とCanonical Decision Resolverに従う。

```text
Portfolio Definition State
  != Learning Definition State

Portfolio Maturity Projection
  != Knowledge Record Authority

Knowledge Promotion Candidate
  != Runtime Binding
  != Execution Authority
```

## Precedence

WAEP内で状態が競合する場合は次の順序を使用する。

1. Current Authority / Current Decision
2. LOCKED Canonical Definition
3. Current Repository State at exact SHA
4. Verified Evidence
5. Definition Candidate
6. Historical Review / PR body / stale snapshot

候補文書や旧PR bodyは、LOCKED Definitionまたは現在のGitHub metadataを上書きしない。

## Conflict Handling

CandidateとLOCKED Definitionの不一致を推論で解消しない。

不一致を検出した場合はHOLDまたはCompatibility Correctionとする。

Compatibility CorrectionはCandidateのLockを意味しない。

LOCKED Definition semanticsを変更する必要がある場合は、新しいDefinition Correction cycleへ戻す。

## Execution Boundary

このRelationship定義は次を認可しない。

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
