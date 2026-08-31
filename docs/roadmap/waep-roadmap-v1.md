# WAEP Roadmap V1

## Status

```text
Artifact: WAEP-ROADMAP-V1
Revision: Minimal Operating Rebaseline / 2026-08-31
State: CURRENT ROADMAP
Operating Model: WAEP-MINIMUM-VIABLE-OPERATING-MODEL-V1 / LOCKED
Complexity Freeze: ACTIVE
Authority Effect: NONE
```

このRoadmapは、WAEPを新しいガバナンス機能の拡張から、簡素化した運用モデルの実案件検証へ切り替える。

Roadmap上のPhase進行は、Execution Authority、Merge、Deploy、LIVE WRITE、Production Mutationを自動的に許可しない。

## PHASE 1 — LOW Pilot Collection

通常開発で自然に発生した変更だけを対象とする。

```text
Normal work
→ ACTUAL diff inspection
→ Risk Decision
→ LOW classification
→ required verification
→ Human Land
→ pilot evidence
```

Target:

```text
3-5 genuine LOW work units
No synthetic/no-op pilot work created only to satisfy count
```

LOW-1..LOW-4 Human Land pathは、別途Human Authority Transition GOが記録された後にのみ有効になる。

MEDIUM/HIGHをLOWへ落としてpilot数を作らない。

## PHASE 2 — Current-State / Evidence Consolidation

新しいEvidence genreを作らない。

Current-Stateの読解面を次まで縮小する。

```text
CURRENT AUTHORITY
+
CURRENT STATE
+
CURRENT ROADMAP
+
必要なDecision / Review evidenceへのreference
```

Historical evidenceは削除しない。

```text
CURRENT
HISTORICAL
SUPERSEDED
```

を明確にし、古いReview、Reconciliation、Checkpoint、GO RecordをCurrent-Stateとして継続参照しない。

同じ状態を複数Current文書へ複製しない。

## PHASE 3 — ADCC Scope Reduction

`ai-development-control-center`のACTIVE scopeは当面次に限定する。

```text
Repository Observation
PR / Issue Observation
Authority / HOLD / DENY visibility
Human Attention Surface
READ ONLY
```

新規開発停止:

```text
Cross-Repo WRITE
Worker autonomous dispatch
Multi-Agent WRITE orchestration
Lease / Fence expansion
Approval Ledger expansion
Control Plane WRITE expansion
```

既存資産は削除不要であり、INACTIVE / HOLDとして保持できる。

## PHASE 4 — Knowledge Minimalization

Full Knowledge Registry expansionはDEFERする。

FailureやObservationを自動的にRegistryへ登録しない。

```text
Failure / Observation
→ Generalized Lesson
→ actual reuse demand / concrete consumer
→ Minimal Knowledge Index candidate
```

Materialization候補条件:

```text
- 実際に2回以上再利用された
OR
- 具体的なconsumerが存在する
```

必要になった場合のMinimal Knowledge Indexは次程度に留める。

```text
ID
Rule / Lesson
Source Evidence
Applicable Repository
Status
```

KnowledgeはExecution Authorityを付与しない。

## PHASE 5 — Repository / LAB Boundary Cleanup

Repository mass mergeはしない。

Operational Class:

| Repository | Class |
| --- | --- |
| WELFARE-AI-ENGINEERING-PLATFORM | PLATFORM |
| severe-behavior-support-spfx | PRODUCT |
| audit-management-system-mvp | PRODUCT / PRODUCTION EVIDENCE SOURCE |
| welfare-m365-dx-diagnostic | COMMERCIAL |
| ai-development-control-center | PLATFORM / READ-ONLY SUBSYSTEM |
| zatsuzen-homepage | LAB |
| hinata | LAB |

LABにWAEP本体と同じstanding governance ceremonyを既定適用しない。

Repository ClassはAuthorityではない。

## PHASE 6 — 30-Day Minimal WAEP Validation

新機能開発ではなく観測期間とする。

主要指標:

```text
1. Genuine LOW pilot: 3-5
2. Governance work time: reduced
3. Delivery speed: not degraded
4. Authority / Safety incident: 0
5. HIGH-boundary violation by LOW misclassification: 0
```

固定安全条件:

```text
Cross-Repo WRITE: HOLD
Knowledge != Execution Authority
Production / Sensitive / Destructive: explicit Human Gate retained
UNKNOWN / HOLD / DENY != PASS
```

## PHASE 7 — Final Adoption / Partial Rollback

30日後に次の3択で判断する。

```text
A. ADOPT
B. ADOPT WITH CORRECTION
C. PARTIAL ROLLBACK
```

問題が特定operation classに限定される場合は、そのclassだけを旧Gateへ戻す。

全面rollbackを既定としない。

## Current Priority Order

```text
Priority 1
CURRENT / Evidence Consolidationを一度だけ完了する

Priority 2
別途Human GOが成立した場合のみLOW-1..LOW-4 Authority Transitionを有効化する

Priority 3
通常のPRODUCT / COMMERCIAL開発へ戻る

Priority 4
通常開発からgenuine LOW pilotを自然収集する

Priority 5
30-day Minimal WAEP evaluationを行う
```

## Frozen / Deferred During Validation

```text
Cross-Repo WRITE restart
Full Knowledge Registry expansion
Multi-Agent WRITE expansion
Control Plane WRITE expansion
Repository mass merge
New Gate family
New Evidence genre
GitHub Pro migration
Public repositoryization
```

## Development-Time Allocation Direction

WAEP自体を開発する比率を下げる。

通常の開発時間はPRODUCT / COMMERCIALへ戻す。

優先候補:

```text
severe-behavior-support-spfx
welfare-m365-dx-diagnostic
```

WAEP側の変更は、Current-State hygiene、安全修正、Minimal Operating Model検証に必要な範囲へ限定する。

## Preserved Authority Boundary

```text
Knowledge Available != Execution Authority
Risk Decision FAST != Execution Authority
Verification PASS != Human Land / Merge Authority
Human Land != Deploy
Human Land != LIVE WRITE
Human Land != Production Mutation
Human Land != Cross-Repo WRITE
UNKNOWN / HOLD / DENY != PASS
```
