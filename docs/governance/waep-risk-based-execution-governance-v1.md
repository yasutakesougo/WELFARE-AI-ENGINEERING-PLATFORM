# WAEP-RISK-BASED-EXECUTION-GOVERNANCE-V1

Status: Draft / Correction-1

Scope: 個人開発特化

Primary Constraint: 個人開発速度

Default Mode: Fast / Autonomous / Reversible

## 1. 目的

本Definitionは、個人開発における実行速度を最大化しつつ、危険な境界のみを厳格に制御する。

ガバナンスは、すべての変更を審査するためではなく、審査を省略できる操作と、停止または承認が必要な操作を機械判定できるようにするために存在する。

通常変更はFast Laneを既定とする。

Production、Authority、Sensitive Data、Destructive / Irreversible Action、Significant External Costに関する危険境界だけFail-Closedとする。

## 2. 基本原則

- Defaultは`FAST`とする。
- 通常領域の曖昧さだけを理由に実行を停止しない。
- 危険境界に該当する可能性があり、必要なEvidenceを取得できない場合は`GOVERNED`へ昇格する。
- Risk Detector自体の一般的な失敗だけで全変更をHOLDにしない。
- Human GOで許可できない禁止状態は`BLOCKED`として`GOVERNED`と分離する。
- Fast Laneに新しいHuman Gateを追加しない。
- 可逆な操作を優先する。

## 3. Risk Decision

Risk Detectorは、各変更を次の3状態のいずれかへ分類する。

### 3.1 FAST

AgentはHuman GOなしで継続できる。

標準CIと自動検証を通過した場合はReady化およびAuto Mergeの対象にできる。

### 3.2 GOVERNED

Human GOを取得するまで高リスク操作を実行してはならない。

Human GO後も、必要な追加検証を省略してはならない。

### 3.3 BLOCKED

Human GOでは解除できない禁止状態とする。

原因を修正し、Risk Detectorを再実行して状態を再評価しなければならない。

代表例は次のとおりとする。

- credentialまたはsecretの平文混入
- policyで禁止された実データの持ち出し
- 明示的に禁止されたproduction destructive action
- integrity check failureにより安全な実行条件を確立できない操作

## 4. Governed Boundary

次の境界に明確に該当する変更は`GOVERNED`とする。

### R1 Production

本番環境へのデプロイ、本番設定変更、本番DBまたは本番サービスへの書き込みを対象とする。

### R2 Authority

Permission、Role、Identity、Authentication、Authorizationの実効権限を変更する操作を対象とする。

単にauth関連ファイルを変更したという理由だけでは`GOVERNED`にしない。

実効権限または認可境界の変更がある場合だけ昇格する。

### R3 Sensitive

個人情報、機密情報、credential、secretの新規取り扱い、保持、転送、ログ出力を対象とする。

### R4 Destructive / Irreversible

データ削除、purge、不可逆migration、復元不能なoverwrite、外部システムへの不可逆書き込みを対象とする。

### R5 Significant External Cost

通常開発コストを明確に超える有料API呼び出し、課金リソース作成、大量実行を対象とする。

## 5. Fast Lane

R1からR5に該当しない変更は`FAST`とする。

Agentが原則自律で実行できる操作には次を含む。

- 調査、設計、ドキュメント修正
- synthetic fixtureの作成と修正
- branch作成
- ローカルコード実装と修正
- テスト追加と修正
- lintおよびtypecheck対応
- 軽微なrefactor
- レビュー指摘へのCorrection
- Draft PR作成
- 最小Evidenceの自動生成
- 破壊的でない軽微な依存関係更新
- コメント、命名、内部構造の整理

## 6. UNKNOWNの扱い

通常領域で判定に迷った場合は`FAST`とする。

R1からR5の危険境界に該当する可能性があり、必要なEvidenceを取得できない場合は`GOVERNED`とする。

危険境界が存在するEvidenceがなく、Risk Detectorが単に追加情報を得られないという理由だけでは`GOVERNED`にしない。

## 7. Risk Classification Timing

Risk Detectorは少なくとも2回実行する。

### 7.1 Preliminary Classification

Issueまたは変更意図から早期分類する。

Preliminary `FAST`は最終的なFast判定を保証しない。

### 7.2 Actual-Diff Classification

実際のdiffを正本として最終分類する。

Auto Merge eligibilityはActual-Diff Classificationを使用する。

## 8. Fast Lane Execution Flow

標準経路は次のとおりとする。

```text
Issue
→ Preliminary Risk Classification
→ Agent Implementation
→ Actual-Diff Risk Classification
→ Lightweight Policy Check
→ Lint / Typecheck / Affected Tests
→ Agent Self Review
→ Draft PR
→ Required CI PASS
→ Ready
→ Auto Merge
→ Non-blocking Full Regression on main
```

Lint、Typecheck、Affected Testsは可能な範囲で並列実行する。

PR時のFull Regressionは既定でblockingにしない。

mainへのmerge後と定期実行でFull Regressionを行う。

## 9. Governed Lane Execution Flow

```text
Risk Detected
→ GOVERNED
→ HOLD high-risk action
→ Human GO
→ Required Additional Validation
→ Evidence
→ Execution / Merge
```

Human GOは高リスク操作の実行Authorityだけを付与する。

Human GOはテスト失敗、secret混入、禁止状態を上書きしない。

## 10. Auto Merge Eligibility

Fast LaneのAuto Merge条件は次とする。

```text
lane == FAST
AND requiredChecks == PASS
AND blockingFinding == NONE
AND mergeConflict == NONE
AND repositoryMergeRequirementsSatisfied == TRUE
```

Agent Self Reviewは補助Evidenceとする。

Agent Self ReviewだけをMerge Authorityとしてはならない。

## 11. Evidence

Fast Laneでは変更概要、Risk Decision、required check結果を最小Evidenceとして保持する。

Governed LaneではRisk Signal、Human GO、追加検証結果、実行結果をEvidenceとして保持する。

BLOCKEDでは原因と修正後の再判定結果を保持する。

## 12. 既存Gateとの関係

`Definition → Review → Correction → Re-Review → Lock`は日常のFast Laneから除外する。

この完全なDefinition Gateは、Authority Contract、Security Boundary、Production Write Contractなどの基盤レベル変更に限定する。

Fast Laneに分類された変更について、既存Governance Artifactが追加のHuman Gateを要求している場合でも、そのGateが本DefinitionのR1からR5に直接対応しない限り、標準開発経路へ自動的に持ち込んではならない。

既存Gateの存在だけを理由にFast LaneをGoverned Laneへ変更してはならない。

## 13. 運用目標

次をV1の運用目標とする。

```text
Fast Lane Rate:                 >= 90%
Human Intervention Rate:        <= 10%
Normal Fast-Lane Human Gates:   0
Risk Classification:            deterministic-first
PR Full Regression:             non-blocking by default
Fast Lane Evidence:             minimal
Governed Lane Evidence:         expanded
```

これらは安全境界を弱めるための目標ではない。

Fast Laneで不要なガバナンスオーバーヘッドが増えていないかを検出するための運用指標とする。

## 14. 非目標

本Definitionは、すべての変更に完全なRisk Proofを要求しない。

本Definitionは、すべてのPRにHuman Reviewを要求しない。

本Definitionは、すべてのPRにFull Test Suiteを要求しない。

本Definitionは、新しい細粒度Gateの追加を目的としない。

## 15. Correction-1 Closure

- P1-1: dangerous-boundary UNKNOWNを`GOVERNED`へ昇格するルールを追加した。
- P1-2: `FAST` / `GOVERNED` / `BLOCKED`を分離した。
- P2-1: Preliminary ClassificationとActual-Diff Classificationを分離した。
- P2-2: Fast Auto Merge eligibilityを明文化した。
- P2-3: 既存GateのFast Laneへの自動再流入を禁止した。

## 16. Current Gate

Definition State: DRAFT / CORRECTION-1

Implementation Start: NOT AUTHORIZED BY THIS DOCUMENT ALONE

Next Gate: Independent Definition Re-Review-1
