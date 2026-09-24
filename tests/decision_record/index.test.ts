import { describe, expect, it } from "vitest";
import {
  type DecisionRecord,
  type DecisionType,
  type DurableDecisionProvenance,
  validatePositiveAuthority,
} from "../../src/decision_record/index.js";

const SUBJECT = "repo:waep/pr:117/head:7027c323ba7b8b2a136318bce0921ce41abee3fe";

function record(overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  return {
    decisionId: "decision-1",
    occurredAt: "2026-09-20T00:33:57Z",
    projectId: "waep",
    decisionType: "MERGE_GO",
    outcome: "GO",
    actorRef: "human:yasutakesougo",
    subjectRef: SUBJECT,
    evidenceRefs: ["evidence:review-1"],
    decisionSourceRefs: ["source:durable-human-go-1"],
    reason: "Human GO",
    ...overrides,
  };
}

function provenance(
  source: DecisionRecord,
  overrides: Partial<DurableDecisionProvenance> = {},
): DurableDecisionProvenance {
  return {
    sourcesVerified: true,
    decisionExistenceEstablished: true,
    decisionTypeEstablished: true,
    actorEstablished: true,
    subjectEstablished: true,
    outcomeEstablished: true,
    occurrenceTimeEstablished: true,
    decisionType: source.decisionType,
    actorRef: source.actorRef,
    subjectRef: source.subjectRef,
    outcome: source.outcome,
    occurredAt: source.occurredAt,
    ...overrides,
  };
}

function validate(source: DecisionRecord) {
  return validatePositiveAuthority({
    record: source,
    provenance: provenance(source),
    requiredDecisionType: source.decisionType,
    expectedSubjectRef: source.subjectRef,
  });
}

describe("DECISION-RECORD-CONTRACT-V1", () => {
  it("S1/V1 preserves READY_GO separately from MERGE_GO in a normal chronology", () => {
    const ready = record({
      decisionId: "ready-1",
      decisionType: "READY_GO",
      occurredAt: "2026-09-20T00:33:01Z",
      decisionSourceRefs: ["source:ready-go"],
    });
    const readyResult = validatePositiveAuthority({
      record: ready,
      provenance: provenance(ready),
      requiredDecisionType: "READY_GO",
      expectedSubjectRef: SUBJECT,
      observedExecutionAt: "2026-09-20T00:33:57Z",
      requireDecisionBeforeObservedExecution: true,
    });

    const merge = record({
      decisionId: "merge-1",
      decisionType: "MERGE_GO",
      occurredAt: "2026-09-20T00:33:57Z",
      decisionSourceRefs: ["source:merge-go"],
      relatedDecisionRefs: [ready.decisionId],
    });
    const mergeResult = validatePositiveAuthority({
      record: merge,
      provenance: provenance(merge),
      requiredDecisionType: "MERGE_GO",
      expectedSubjectRef: SUBJECT,
      observedExecutionAt: "2026-09-20T00:34:01Z",
      requireDecisionBeforeObservedExecution: true,
      priorAuthorityRequired: true,
      priorAuthorityValid: readyResult === "CHRONOLOGY_CONSISTENT",
    });

    expect(readyResult).toBe("CHRONOLOGY_CONSISTENT");
    expect(mergeResult).toBe("CHRONOLOGY_CONSISTENT");
  });

  it("S2/V2 fails closed on exact subject mismatch", () => {
    const merge = record();
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: "repo:waep/pr:117/head:different",
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("S3/V3 rejects MERGE_GO that is not established before Actual Merge", () => {
    const merge = record({ occurredAt: "2026-09-20T00:34:02Z" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
        observedExecutionAt: "2026-09-20T00:34:01Z",
        requireDecisionBeforeObservedExecution: true,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("S4/V4 treats missing MERGE_GO as a gap candidate without fabricating a record", () => {
    expect(
      validatePositiveAuthority({
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("S5/V5 independently requires prior READY_GO and never inherits it from relatedDecisionRefs", () => {
    const merge = record({ relatedDecisionRefs: ["ready-go-claimed"] });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
        priorAuthorityRequired: true,
        priorAuthorityValid: false,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("S6/V6 never mutates authoritative occurredAt during validation", () => {
    const merge = record({ occurredAt: "2026-09-20T00:33:57Z" });
    const before = merge.occurredAt;

    expect(validate(merge)).toBe("CHRONOLOGY_CONSISTENT");
    expect(merge.occurredAt).toBe(before);
  });

  const rejectedOutcomes: ReadonlyArray<
    readonly [DecisionType, "HOLD" | "REJECTED"]
  > = [
    ["READY_GO", "HOLD"],
    ["READY_GO", "REJECTED"],
    ["MERGE_GO", "HOLD"],
    ["MERGE_GO", "REJECTED"],
    ["IMPLEMENTATION_START", "HOLD"],
    ["DEPLOY_GO", "REJECTED"],
    ["EVIDENCE_ACCEPTANCE", "HOLD"],
  ];

  for (const [decisionType, outcome] of rejectedOutcomes) {
    it(`S7/V7 rejects ${decisionType} with outcome ${outcome}`, () => {
      const source = record({ decisionType, outcome });
      expect(
        validatePositiveAuthority({
          record: source,
          provenance: provenance(source),
          requiredDecisionType: decisionType,
          expectedSubjectRef: SUBJECT,
        }),
      ).toBe("AUTHORITY_GAP_CANDIDATE");
    });
  }

  it("S8/V8 rejects reconstructed historical MERGE_GO with asserted time but insufficient provenance", () => {
    const merge = record({ occurredAt: "2026-09-20T00:33:57Z" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge, { sourcesVerified: false }),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
        observedExecutionAt: "2026-09-20T00:34:01Z",
        requireDecisionBeforeObservedExecution: true,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("S9 does not treat decisionSourceRefs as sufficient when provenance facts are incomplete", () => {
    const merge = record();
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge, { actorEstablished: false }),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("S10 does not treat evidenceRefs as proof that the decision existed", () => {
    const merge = record({
      evidenceRefs: ["evidence:exists"],
      decisionSourceRefs: [],
    });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("S11 requires an explicit valid EVIDENCE_ACCEPTANCE GO", () => {
    expect(
      validatePositiveAuthority({
        requiredDecisionType: "EVIDENCE_ACCEPTANCE",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");

    const acceptance = record({
      decisionId: "acceptance-1",
      decisionType: "EVIDENCE_ACCEPTANCE",
      outcome: "GO",
      decisionSourceRefs: ["source:evidence-acceptance"],
    });
    expect(
      validatePositiveAuthority({
        record: acceptance,
        provenance: provenance(acceptance),
        requiredDecisionType: "EVIDENCE_ACCEPTANCE",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("CHRONOLOGY_CONSISTENT");
  });

  it("S12 requires independent reconciliation confirmation before AUTHORITY_GAP", () => {
    const merge = record({ outcome: "HOLD" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");

    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
        reconciliationConfirmed: true,
      }),
    ).toBe("AUTHORITY_GAP");
  });

  it("requires provenance values to match the DecisionRecord rather than trusting establishment flags alone", () => {
    const merge = record();
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge, { actorRef: "human:someone-else" }),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("fails closed when an applicable policy requirement is not satisfied", () => {
    const merge = record();
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
        policyRequirementApplies: true,
        policyRequirementSatisfied: false,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("P1-1 rejects impossible calendar dates for occurredAt", () => {
    const merge = record({ occurredAt: "2026-02-30T00:00:00Z" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("P1-1 rejects timezone-less occurredAt timestamps", () => {
    const merge = record({ occurredAt: "2026-09-20T00:33:57" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("P1-1 accepts explicit UTC occurredAt timestamps", () => {
    const merge = record({ occurredAt: "2026-09-20T00:33:57Z" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
      }),
    ).toBe("CHRONOLOGY_CONSISTENT");
  });

  it("P1-1 accepts explicit offset occurredAt timestamps", () => {
    const merge = record({ occurredAt: "2026-09-20T09:33:57+09:00" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
        observedExecutionAt: "2026-09-20T00:34:01Z",
        requireDecisionBeforeObservedExecution: true,
      }),
    ).toBe("CHRONOLOGY_CONSISTENT");
  });

  it("P1-1 fails closed on invalid chronology using deterministic offset comparison", () => {
    const merge = record({ occurredAt: "2026-09-20T09:34:02+09:00" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
        observedExecutionAt: "2026-09-20T00:34:01Z",
        requireDecisionBeforeObservedExecution: true,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });

  it("P1-1 fails closed when observedExecutionAt is timezone-less", () => {
    const merge = record({ occurredAt: "2026-09-20T00:33:57Z" });
    expect(
      validatePositiveAuthority({
        record: merge,
        provenance: provenance(merge),
        requiredDecisionType: "MERGE_GO",
        expectedSubjectRef: SUBJECT,
        observedExecutionAt: "2026-09-20T00:34:01",
        requireDecisionBeforeObservedExecution: true,
      }),
    ).toBe("AUTHORITY_GAP_CANDIDATE");
  });
});
