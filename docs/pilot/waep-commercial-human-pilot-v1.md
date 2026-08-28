# WAEP Commercial Human Pilot V1

```text
Pilot type: HUMAN-OPERATED COMMERCIAL VALIDATION
Default participants: three actual users or business candidates
Status: DEFINITION / NOT TESTED
Record revision: DEFINITION / DOCUMENT CORRECTION-1
Definition / Document status: PASS / LOCKED
Independent Definition / Document Re-Review-2: PASS / LOCKABLE
Human Definition / Document Lock GO: RECEIVED
User gate label: AEP-4-DOCUMENT-EVIDENCE-PACK-V1 Definition / Document Lock GO
Canonical pack: WAEP-4-DOCUMENT-EVIDENCE-PACK-V1
Lock recorded at: 2026-08-28 11:37:24 +0900
Lock basis SHA-256: e3c73f3cb7b9b011a52165847620441df42eb2d12c926df834df72ef4d19efd1
Synthetic evidence alone: insufficient for WTP or price lock
M365 / SharePoint mutation: NOT PERFORMED
Downstream authority: NOT GRANTED
```

## 1. Objective

Test whether the welfare DX diagnostic is understood, valuable, time-bounded,
and commercially actionable for real users. The pilot validates the offer and
the operator's support load; it does not authorize production deployment or
turn a purchase conversation into a formal price lock.

## 2. Boundary

The default pilot is Human-operated and uses synthetic, redacted, or explicitly
approved input. Do not place raw welfare records, disability/medical details,
family identifiers, tenant credentials, cookies, or secrets in GitHub or the
WAEP Knowledge Plane.

If an approved data-handling path is unavailable, record the participant as
`NOT TESTED`; do not substitute synthetic success for a real-customer result.

`APPROVED_REAL` requires a non-identifying authority reference for the approval
decision,
approved system of record, permitted data scope, and expiry. For
`SYNTHETIC` or `REDACTED`, those fields are `NOT_APPLICABLE`. An
`APPROVED_REAL` session without all four references is `HOLD`.

The operator must not mutate customer SharePoint/M365 data during this pilot.
Any later external write requires its own target, preflight, authorization,
read-back, and closeout gates.

## 3. Participant worksheet

Create one immutable worksheet per participant or business candidate:

```yaml
pilotId: CP-001
participantRef: ""
participantType: ACTUAL_USER|BUSINESS_CANDIDATE
dataMode: SYNTHETIC|REDACTED|APPROVED_REAL|NOT_TESTED
operator: ""
startAt: ""
endAt: ""
diagnosticScope: ""
inputEvidenceRefs: []
dataHandling:
  authorityRef: NOT_APPLICABLE
  approvedSystemRef: NOT_APPLICABLE
  approvedScope: NOT_APPLICABLE
  approvalExpiresAt: NOT_APPLICABLE
outputs:
  questionClarity: NOT_MEASURED
  diagnosticElapsedMinutes: NOT_MEASURED
  humanInterventionMinutes: NOT_MEASURED
  deliverableUnderstood: NOT_MEASURED
  perceivedValue: NOT_MEASURED
  supportMinutes: NOT_MEASURED
commercial:
  priceDiscussed: false
  quotedPrice:
    amount: NOT_TESTED
    currency: NOT_TESTED
    terms: NOT_TESTED
  purchaseIntent: NOT_TESTED
  purchaseOutcome: NOT_TESTED
  agreedPrice:
    amount: NOT_TESTED
    currency: NOT_TESTED
    terms: NOT_TESTED
  agreementRef: NOT_TESTED
  decisionReason: NOT_TESTED
  supportAssessment: NOT_TESTED
  supportCapacityBasisRef: NOT_TESTED
  commercialDecisionOwner: NOT_TESTED
  commercialDecisionRef: NOT_TESTED
result: NOT_TESTED
```

`participantRef` must be a non-identifying local reference. Keep contact
details and any consent or contract records outside the Knowledge Plane, in the
approved system of record. The references above may identify those records but
must not contain their sensitive contents. `purchaseIntent`, `purchaseOutcome`,
quoted price, and agreed price are separate facts; none is inferred from
another.

## 4. Session flow

1. Confirm scope, data mode, and the operator's allowed actions.
2. Present the plain-language question contract.
3. Run the diagnostic without changing customer records.
4. Record start/end time and every human intervention.
5. Present the finding and recommendation in plain language.
6. Ask the participant to explain the value and remaining uncertainty.
7. Discuss a price only as a measured commercial conversation.
8. Record purchase/non-purchase reason and support requirements.
9. Record a support assessment, its capacity-basis reference, and the
   commercial decision owner/reference.
10. Close the worksheet as `CONFIRMED`, `HOLD`, or `NOT TESTED`.

## 5. Evidence classification

| Evidence | Can establish | Cannot establish |
| --- | --- | --- |
| Synthetic case | Flow clarity and deterministic behavior | Real WTP, support load, or purchase decision |
| Human-operated session | Understanding, time, perceived value | Production safety or scale by itself |
| Price conversation | A participant's stated WTP signal | Formal price lock across the market |
| Purchase decision | One commercial outcome | Sustainable capacity for many customers |
| Support log plus explicit support assessment | Operator burden for that session | Long-term incident rate without observation |

## 6. Stop conditions

Stop and record `HOLD` or `NOT TESTED` when:

- the data mode or approved handling path is uncertain;
- `APPROVED_REAL` approval, system, scope, or expiry evidence is missing or expired;
- the participant requests an unauthorized external write;
- output evidence cannot be traced to the diagnostic scope;
- the operator must invent missing customer facts;
- the result is presented as a guarantee or compliance decision;
- a security, privacy, or access incident occurs;
- support load cannot be recorded or explicitly assessed by the decision owner;
  or the support-capacity basis reference is missing.

## 7. Acceptance criteria

- [ ] Three independent Human-operated sessions are completed, or the shortfall
  is recorded as `NOT TESTED`.
- [ ] Each session has start/end time, elapsed time, human intervention,
  perceived value, support time, and an explicit support assessment.
- [ ] Every `APPROVED_REAL` session has non-identifying approval, system, scope,
  and expiry references.
- [ ] `supportAssessment: ACCEPTABLE` has recorded support time, a
  non-identifying capacity-basis reference, and an explicit decision owner.
- [ ] Price discussion and actual purchase decision are recorded separately.
- [ ] Quoted price and agreed price are recorded separately with amount,
  currency, terms, and references where applicable.
- [ ] Synthetic-only outcomes are not used to lock price or claim demand.
- [ ] No raw sensitive data is stored in GitHub or reusable Knowledge content.
- [ ] No SharePoint/M365 mutation, Deploy, Runtime Binding, Ready, or Merge is
  performed by this pilot.

## 8. Commercial decision output

After the default three sessions, produce one of:

```text
COMMERCIAL SIGNAL: SUPPORTED
  All required sessions have human evidence for value and time, a price signal,
  recorded support load, `supportAssessment: ACCEPTABLE`, a non-identifying
  support-capacity basis reference, and an explicit commercial decision
  owner/reference. "Manageable" is never inferred.

COMMERCIAL SIGNAL: INCONCLUSIVE
  Some sessions completed, but WTP or support evidence is insufficient.

COMMERCIAL SIGNAL: NOT TESTED
  No approved human-operated path or insufficient actual participants.
```

None of these outcomes authorizes production deployment or broad customer
onboarding. They only determine the next evidence-gathering step.

`COMMERCIAL SIGNAL: SUPPORTED` is a commercial evidence decision only. It does
not establish engineering correctness, customer authorization, price lock,
production safety, Deploy authority, Runtime Binding, or SharePoint/M365 write
authority.
