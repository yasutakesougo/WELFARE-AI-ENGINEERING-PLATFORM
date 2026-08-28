# WAEP Productivity and Operations Ledger V1

```text
Measurement window: four weeks by default
Minimum sample: five comparable development work units
Status: TEMPLATE / NOT MEASURED
Record revision: DEFINITION / DOCUMENT CORRECTION-1
Definition / Document status: PASS / LOCKED
Independent Definition / Document Re-Review-2: PASS / LOCKABLE
Human Definition / Document Lock GO: RECEIVED
User gate label: AEP-4-DOCUMENT-EVIDENCE-PACK-V1 Definition / Document Lock GO
Canonical pack: WAEP-4-DOCUMENT-EVIDENCE-PACK-V1
Lock recorded at: 2026-08-28 11:37:24 +0900
Lock basis SHA-256: e6bbe87791a4810961ad8fae574a965ed98a07a351fe745260e2df65a4bc5267
Use for personal ranking: PROHIBITED
Downstream authority: NOT GRANTED
```

## 1. Purpose

Measure whether AI plus WAEP reduces total human effort while preserving review,
verification, safety, and operational quality. The ledger separates observed
facts from estimates and does not claim causal improvement without a comparable
baseline.

## 2. Work-unit ledger

Create one row per bounded work unit. A work unit must have one clear outcome,
one source repository, and one exact starting and ending revision or evidence
reference.

| Field | Required value |
| --- | --- |
| `workUnitId` | Stable local identifier |
| `date` | ISO date |
| `repository` | Exact repository name |
| `startSha` | Exact starting revision or `N/A` for a non-code evidence task |
| `endSha` | Exact ending revision/evidence revision or `N/A` |
| `startAt` | ISO timestamp, or `N/A` when no time measurement applies |
| `endAt` | ISO timestamp, or `N/A` when no time measurement applies |
| `workClass` | Definition / Review / Correction / Implementation / Verification / Pilot / Operations |
| `baselineMode` | Comparable-human / historical / none |
| `aiMode` | None / assisted / multi-agent |
| `baselineMinutes` | Comparable baseline time, or `UNKNOWN` when unavailable |
| `manualMinutes` | Human work time excluding `humanInterventionMinutes` |
| `aiMinutes` | Active AI interaction time |
| `elapsedMinutes` | Wall-clock elapsed time |
| `reviewCount` | Independent or human review cycles |
| `correctionCount` | Correction iterations |
| `ciFailureCount` | CI failures attributable to the work unit |
| `ciFailureBreakdown` | Counts classified as KNOWN / NEW / FLAKY / ENVIRONMENT / UNKNOWN |
| `humanInterventionMinutes` | Time spent resolving AI uncertainty or correcting output |
| `knowledgeReuseCount` | Number of distinct reuse events, not an effectiveness claim |
| `knowledgeReuseStage` | None / DISCOVERED / CONSIDERED / APPLIED / VERIFIED_EFFECTIVE |
| `knowledgeReuseEffective` | YES / NO / UNKNOWN / NOT_APPLICABLE, with evidence |
| `avoidedWorkMinutes` | Estimated or derived avoided work; never actual elapsed time |
| `supportMinutes` | Post-completion support or operational follow-up |
| `measurementProvenance` | Per-value status and source for every time or derived value |
| `result` | PASS / HOLD / UNKNOWN / FAIL / INCONCLUSIVE / NOT_TESTED / NOT_APPLICABLE |
| `evidenceRefs` | Links or immutable local references |
| `notes` | Fact-only context; no personal ranking |

## 3. Measurement rules

- Every measured or derived value must carry a status of `MEASURED`,
  `ESTIMATED`, `DERIVED`, `UNKNOWN`, or `NOT_APPLICABLE`, plus a source of
  `MANUAL`, `TIMER`, `SYSTEM_EVENT`, or `ESTIMATED` where applicable.
- `manualMinutes` excludes `humanInterventionMinutes`; intervention time is
  counted once in the total human-effort formula.
- `startAt` and `endAt` define the measured interval. If either boundary is
  unavailable, `elapsedMinutes` is `UNKNOWN`, not zero.
- Keep estimated avoided work separate from actual elapsed time and baseline
  time. Missing values remain `UNKNOWN` and are never recoded as zero.
- Count review and correction effort as part of total delivery effort.
- Do not treat a faster draft as productivity improvement if verification is
  incomplete or a later correction restores the saved time.
- Preserve failed and cancelled work units as immutable history.
- Do not aggregate across repositories unless each source SHA and scope are
  recorded.
- Classify every CI failure as `KNOWN`, `NEW`, `FLAKY`, `ENVIRONMENT`, or
  `UNKNOWN`; an unclassified failure blocks quality conclusions.
- Record Knowledge reuse count separately from whether reuse was independently
  verified effective.
- Do not use the ledger to rank people, agents, or vendors.

Use this shape for metric-level provenance; do not use one row-level status to
hide mixed evidence quality:

```yaml
measurementProvenance:
  elapsedMinutes:
    status: MEASURED|ESTIMATED|DERIVED|UNKNOWN|NOT_APPLICABLE
    source: MANUAL|TIMER|SYSTEM_EVENT|ESTIMATED|NONE
    evidenceRef: ""
```

## 4. Default four-week run

| Week | Activity | Required output |
| --- | --- | --- |
| 1 | Record baseline and define comparable work units | Five bounded unit definitions or explicit `NOT AVAILABLE` |
| 2 | Record AI-assisted work with the same fields | At least two completed rows |
| 3 | Repeat across Definition, Review, and Verification work | At least two additional rows |
| 4 | Record Pilot/Operations work and reconcile evidence | Final sample, exceptions, and support totals |

If five comparable units are not available, report the sample size and mark the
conclusion `OBSERVATIONAL ONLY`.

## 5. Summary calculations

Use these transparent calculations:

```text
Total human effort
  = manualMinutes + humanInterventionMinutes + supportMinutes

Observed cycle time
  = elapsedMinutes

Quality-adjusted result
  = compare only work units with equivalent verification scope

Monthly solo capacity hours
  = available monthly hours
  - development hours
  - compliance / incident reserve hours

Monthly support capacity hours
  = observed or explicitly allocated hours available for customer support
  (required as a separately evidenced value; it is not inferred from a time saving)

Sustainable customer count
  = floor(monthlySupportCapacityHours / observedSupportHoursPerCustomer)
```

Never convert an estimated time saving directly into customer capacity.
If `monthlySupportCapacityHours` or `observedSupportHoursPerCustomer` is
unknown, the customer-count result is `UNKNOWN`, not zero. Customer capacity
requires observed support, incident, and data-handling load.

Capacity record:

```yaml
capacity:
  availableMonthlyHours: UNKNOWN
  developmentHours: UNKNOWN
  complianceIncidentReserveHours: UNKNOWN
  monthlySupportCapacityHours: UNKNOWN
  observedSupportHoursPerCustomer: UNKNOWN
  customerCount: UNKNOWN
  measurementStatus: UNKNOWN
  evidenceRefs: []
```

## 6. Acceptance criteria

- [ ] At least five work units are present, or the shortfall is recorded.
- [ ] Each row contains exact repository and revision evidence where applicable.
- [ ] Each measured, estimated, or derived value has explicit provenance and
  missing values remain `UNKNOWN` or `NOT_APPLICABLE`.
- [ ] Start/end boundaries and human, AI, elapsed, review, correction, CI, and
  support time are separate.
- [ ] `manualMinutes` and `humanInterventionMinutes` are disjoint.
- [ ] Baseline availability is explicit.
- [ ] CI failures are classified and Knowledge reuse count is separate from
  effectiveness.
- [ ] Failed, held, and unknown work is retained and not recoded as success.
- [ ] No personal ranking or performance score is produced.
- [ ] Capacity inputs, units, and evidence are explicit; a capacity estimate is
  labeled provisional unless support and incident data are observed.
