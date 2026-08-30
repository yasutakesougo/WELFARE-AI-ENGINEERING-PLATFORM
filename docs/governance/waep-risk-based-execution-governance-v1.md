# WAEP-RISK-BASED-EXECUTION-GOVERNANCE-V1

Status: PASS / LOCKABLE

Scope: 個人開発特化

Primary Constraint: 個人開発速度

Default Mode: Fast / Autonomous / Reversible

## 1. 目的

本Definitionは、個人開発における実行速度を最大化しつつ、危険な境界のみを厳格に制御する。

ガバナンスは、すべての変更を審査するためではなく、審査を省略できる操作と、停止または承認が必要な操作を機械判定できるようにするために存在する。

通常変更はFast Laneを既定とする。

Production、Authority、Sensitive Data、Destructive / Irreversible Action、Significant External Costに関する危険境界だけFail-Closedとする。

本Definitionは既存のCurrent AuthorityをDefinition単体で変更しない。

Fast LaneへのAuthority移行は、別途明示されたAuthority Transitionによってのみ有効化する。

## 2. 基本原則

- Default risk classificationは`FAST`とする。
- `FAST`はRisk Decisionであり、未取得のExecution Authorityを自動生成しない。
- 通常領域の曖昧さだけを理由にRisk Decisionを停止しない。
- 危険境界に該当する可能性があり、必要なEvidenceを取得できない場合は`GOVERNED`へ昇格する。
- Risk Detector自体の一般的な失敗だけで全変更をHOLDにしない。
- Human GOで許可できない禁止状態は`BLOCKED`として`GOVERNED`と分離する。
- Authority Transition完了後のFast Laneに新しいHuman Gateを追加しない。
- 可逆な操作を優先する。

## 3. Risk Decision

Risk Detectorは、各変更を次の3状態のいずれかへ分類する。

Risk DecisionとExecution Authorityは別の判定とする。

### 3.1 FAST

危険境界による追加Human Gateを必要としないRisk Decisionである。

Authority Transitionによって対象操作がFast Laneへ委任済みの場合、Agentは追加Human GOなしで継続できる。

標準CIと自動検証を通過し、かつ対象Repositoryの有効なMerge Authority条件を満たす場合はReady化およびAuto Mergeの対象にできる。

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

R1からR5に該当しない変更はRisk Decisionとして`FAST`とする。

Authority Transition完了後、Agentへ委任できる操作には次を含む。

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

未移行の既存Authorityが対象操作に明示的なGateを要求する場合、そのGateはAuthority Transition完了まで有効とする。

## 6. UNKNOWNの扱い

通常領域でRisk分類に迷った場合は`FAST`とする。

R1からR5の危険境界に該当する可能性があり、必要なEvidenceを取得できない場合は`GOVERNED`とする。

危険境界が存在するEvidenceがなく、Risk Detectorが単に追加情報を得られないという理由だけでは`GOVERNED`にしない。

ただし、Execution AuthorityがUNKNOWNまたはSTALEである場合は、Risk Decisionが`FAST`でも実行可能状態へ昇格させない。

## 7. Risk Classification Timing

Risk Detectorは少なくとも2回実行する。

### 7.1 Preliminary Classification

Issueまたは変更意図から早期分類する。

Preliminary `FAST`は最終的なFast判定を保証しない。

### 7.2 Actual-Diff Classification

実際のdiffを正本として最終分類する。

Auto Merge eligibilityはActual-Diff Classificationを使用する。

## 8. Fast Lane Execution Flow

Authority Transition完了後の標準経路は次のとおりとする。

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

このフローは、Authority Transition未完了の既存Repository GateをDefinition単体で無効化しない。

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

Human GOは対象として明示された高リスク操作のAuthorityだけを付与する。

Human GOはテスト失敗、secret混入、禁止状態を上書きしない。

## 10. Auto Merge Eligibility

Fast LaneのAuto Merge候補条件は次とする。

```text
lane == FAST
AND requiredChecks == PASS
AND blockingFinding == NONE
AND mergeConflict == NONE
AND repositoryMergeRequirementsSatisfied == TRUE
AND mergeAuthority == VALID
```

Agent Self Reviewは補助Evidenceとする。

Agent Self ReviewだけをMerge Authorityとしてはならない。

本DefinitionのLockまたはRisk Detectorの`FAST`判定だけでAuto Merge Authorityは成立しない。

## 11. Evidence

Fast Laneでは変更概要、Risk Decision、required check結果を最小Evidenceとして保持する。

Governed LaneではRisk Signal、Human GO、追加検証結果、実行結果をEvidenceとして保持する。

BLOCKEDでは原因と修正後の再判定結果を保持する。

## 12. 既存GateとAuthority Transition

`Definition → Review → Correction → Re-Review → Lock`を、Authority Transition完了後の日常Fast Laneから除外することを目標とする。

完全なDefinition Gateは、Authority Contract、Security Boundary、Production Write Contractなどの基盤レベル変更に限定する。

ただし、本Definition自身は既存のCurrent Authority、Repository-local Authority、Ready Authority、Merge Authority、Deploy Authority、LIVE WRITE Authorityを上書きしない。

既存GateをFast Laneから除外するには、対象Gateと対象操作を明示した別のAuthority Transitionを必要とする。

Authority Transitionが存在しない、UNKNOWN、STALE、または対象範囲外の場合、既存Authorityを維持する。

Authority Transition完了後は、R1からR5に直接対応しない旧Human Gateを標準Fast Laneへ再導入してはならない。

この移行規則により、現行Authorityを守りながら、段階的に個人開発向けFast Laneへ移行する。

## 13. 運用目標

Authority Transition完了後のV1運用目標を次とする。

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

本Definition単体で既存Execution Authorityを変更しない。

## 15. Correction Closure

### Correction-1

- P1-1: dangerous-boundary UNKNOWNを`GOVERNED`へ昇格するルールを追加した。
- P1-2: `FAST` / `GOVERNED` / `BLOCKED`を分離した。
- P2-1: Preliminary ClassificationとActual-Diff Classificationを分離した。
- P2-2: Fast Auto Merge eligibilityを明文化した。
- P2-3: 既存GateのFast Laneへの自動再流入を禁止した。

### Correction-2

- P1-3: Risk DecisionとExecution Authorityを分離した。
- P1-4: 本Definition単体による既存Authority上書きを禁止した。
- P1-5: Fast Lane導入を明示的なAuthority Transitionに分離した。
- P1-6: UNKNOWN / STALE Execution Authorityは`FAST`でも実行可能へ昇格させない。
- P1-7: Auto Mergeに有効なMerge Authorityを必須化した。

## 16. Independent Definition Re-Review-2

Verdict: PASS / LOCKABLE

P0: 0

P1: 0

P2: 0

Correction-2は、Risk DecisionとExecution Authorityを分離し、Current Authorityの独立GateをDefinition単体で上書きしない。

UNKNOWN / STALE Execution Authorityは実行可能へ昇格しない。

Auto Mergeは有効なMerge Authorityを別途要求する。

個人開発向けFast Laneは、明示的なAuthority Transition後にのみ既存Gateを置換する。

本Re-ReviewはDefinition Lock、Implementation Start、Authority Transition、Ready、Merge、Deploy、LIVE WRITEを認可しない。

## 17. Current Gate

Definition State: PASS / LOCKABLE

Definition Lock: NOT AUTHORIZED

Implementation Start: NOT AUTHORIZED

Authority Transition: NOT AUTHORIZED

Auto Merge Activation: NOT AUTHORIZED

Next Gate: Human Definition Lock GO / HOLD
