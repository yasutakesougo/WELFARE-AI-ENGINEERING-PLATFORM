# Knowledge Promotion Gate V1

## Status

```text
Definition: KNOWLEDGE-PROMOTION-GATE-V1
State: PROPOSED / PORTFOLIO DEFINITION CANDIDATE
Source: PR #9
Current-Main Reconciliation: V2 COMPATIBILITY CORRECTION
Definition Lock: NOT AUTHORIZED
Implementation: NOT AUTHORIZED
```

## Objective

One-off observation、unverified assumption、private context、repository-specific semanticsをPortable Knowledgeとして昇格させない。

## Compatibility with WAEP-LEARNING-SYSTEM-V1

この文書のL0-L5はPortfolio-levelのDerived Maturity Classificationである。

Immutable Knowledge Record自身に`maturity`、`ACTIVE`、`CURRENT`、Lifecycle stateを保存しない。

Authoritative Promotionは、LOCKED `WAEP-LEARNING-SYSTEM-V1`の`KnowledgePromotionDecision@v1`とCanonical Decision Resolverに従う。

```text
Portfolio Maturity Classification
  != Knowledge Record stored authority
  != Promotion Decision
  != Lifecycle Decision
  != Runtime Binding
  != Execution Authority
```

## Maturity States

```text
L0 OBSERVED
L1 DOCUMENTED
L2 GENERALIZED
L3 ADOPTED
L4 ENFORCED
L5 PROVEN_CROSS_REPO
```

これらの状態はRegistry ProjectionまたはPortfolio assessmentとして導出する。

### L0 -> L1

- identifiable source evidenceが存在する。
- observationが過剰一般化なしで記録されている。

### L1 -> L2

- root causeまたはbounded causal hypothesisが記録されている。
- PROJECT / DOMAIN / ENGINEERING classificationが完了している。
- generalized ruleにapplicabilityとnon-applicability boundaryがある。

### L2 -> L3

- target repositoryが明示的にadoptしている。
- target authorityは対象Repositoryに残る。
- adoption evidenceが記録されている。

### L3 -> L4

少なくとも一つのdeterministic enforcement evidenceが存在する。

例は次である。

- test
- lint / static check
- CI policy
- human-gate checklist
- runtime authorization gate

Documentation aloneは`ENFORCED`ではない。

### L4 -> L5

- materially distinctな2つ以上のRepository contextでEvidenceがある。
- generalized ruleに未解決P0/P1がない。
- measured outcomeまたはregression evidenceがreuseを支持する。
- latest reviewでSUPERSEDEDではないことを確認している。

## Gate Assessment Results

Portfolio-level gate assessmentは次のいずれかを返す。

- `PROMOTE_CANDIDATE`
- `HOLD_EVIDENCE`
- `HOLD_APPLICABILITY`
- `REJECT_SENSITIVE`
- `REJECT_NOT_PORTABLE`
- `SUPERSEDED`
- `UNKNOWN`

`PROMOTE_CANDIDATE`はAuthoritative Promotion Decisionではない。

Knowledge PlaneへのAuthoritative Promotionには、別途`KnowledgePromotionDecision@v1`が必要である。

`UNKNOWN`とHOLDはPASS-equivalentではない。

## Authority Boundary

このGateは次を認可しない。

```text
Knowledge Record authority mutation
Implementation Start
Worker execution
GitHub mutation
Ready
Merge
Deploy
Production
M365 / SharePoint / Entra mutation
Billing
Customer delivery
Runtime Binding
LIVE WRITE
```
