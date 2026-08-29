import { describe, expect, it } from "vitest";
import { resolveCandidate } from "../src/index.js";

const identity = { sourceRepository: "repo-1", sourceEventId: "event-1" };

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    candidateId: "KC-1",
    contractVersion: "DEVELOPMENT-KNOWLEDGE-COMPOUND-V1",
    candidateVersion: "1",
    observation: "observed",
    problem: "problem",
    suspectedRootCause: "cause",
    proposedRule: "rule",
    sourceRefs: ["SRC-1"],
    evidenceRefs: [{ evidenceRef: "EV-1", relation: "SUPPORTING" }],
    scope: {
      observedIn: ["repo-1"],
      proposedAppliesTo: ["repo-1"],
      explicitlyNotValidatedFor: [],
    },
    createdBy: { actorType: "AGENT", actorId: "agent-1" },
    creationMode: "AGENT_ASSISTED",
    createdAt: "2026-08-29T00:00:00Z",
    contentDigest: "digest-1",
    nonAuthoritative: true,
    ...overrides,
  };
}

function key(contentDigest = "digest-1") {
  return {
    contractType: "KnowledgeCandidate@v1",
    sourceRepository: "repo-1",
    sourceEventId: "event-1",
    contentDigest,
  };
}

function context(priorCandidates: unknown[] = [], completeness: "COMPLETE" | "UNKNOWN" = "COMPLETE") {
  return {
    contractType: "CandidateResolutionContext@v1",
    completeness,
    priorCandidates,
  };
}

describe("DKC Slice A pure candidate resolution kernel", () => {
  it("DKC-A-V01/V16 resolves exact replay idempotently", () => {
    const first = resolveCandidate(identity, candidate(), context());
    expect(first.resultClass).toBe("VALID_NEW");
    const second = resolveCandidate(
      identity,
      candidate({ candidateId: "KC-REPLAY" }),
      context([{ candidateRef: "KC-1", resolutionKey: key() }]),
    );
    expect(second.resultClass).toBe("VALID_EXISTING_IDEMPOTENT");
    expect(second.candidateRef).toBe("KC-1");
    expect(second.priorCandidateRefs).toEqual(["KC-1"]);
  });

  it("DKC-A-V02/V17 creates a new version for changed content digest", () => {
    const result = resolveCandidate(
      identity,
      candidate({ candidateId: "KC-2", contentDigest: "digest-2" }),
      context([{ candidateRef: "KC-1", resolutionKey: key("digest-1") }]),
    );
    expect(result.resultClass).toBe("VALID_NEW_VERSION");
    expect(result.resolutionKey?.contentDigest).toBe("digest-2");
    expect(result.priorCandidateRefs).toEqual(["KC-1"]);
  });

  it("DKC-A-V03 keeps different source event identities distinct", () => {
    const result = resolveCandidate(
      { sourceRepository: "repo-1", sourceEventId: "event-2" },
      candidate(),
      context([{ candidateRef: "KC-OLD", resolutionKey: key() }]),
    );
    expect(result.resultClass).toBe("VALID_NEW");
  });

  it("DKC-A-V04/V22 deduplicates exact evidence identity without strength increase", () => {
    const evidence = { evidenceRef: "EV-1", relation: "SUPPORTING" };
    const result = resolveCandidate(identity, candidate({ evidenceRefs: [evidence, evidence] }), context());
    expect(result.resultClass).toBe("VALID_NEW");
    expect(result.normalizedEvidenceRefs).toHaveLength(1);
    expect(result.evidenceConflict).toBe(false);
  });

  it.each(["SUPPORTING", "CONTRADICTING", "INCONCLUSIVE"])(
    "DKC-A-V05-V07 retains structured %s evidence",
    (relation) => {
      const result = resolveCandidate(
        identity,
        candidate({ evidenceRefs: [{ evidenceRef: "EV-X", relation }] }),
        context(),
      );
      expect(result.resultClass).toBe("VALID_NEW");
      expect(result.normalizedEvidenceRefs?.[0]?.relation).toBe(relation);
    },
  );

  it("DKC-A-V08 rejects bare string evidence refs", () => {
    const result = resolveCandidate(identity, candidate({ evidenceRefs: ["EV-1"] }), context());
    expect(result.resultClass).toBe("INVALID_EVIDENCE_REFERENCE");
  });

  it.each(["validatedScope", "ACTIVE", "runtimeEligible", "selfApprovalEligible", "verified", "VeRiFiEd"])(
    "DKC-A-V09/V20/V28 rejects authority-bearing field %s",
    (field) => {
      const result = resolveCandidate(identity, candidate({ [field]: true }), context());
      expect(result.resultClass).toBe("INVALID_AUTHORITY_FIELD");
      expect(result.errorIds).toEqual(["AUTHORITY_FIELD_PROHIBITED"]);
    },
  );

  it("DKC-A-V10 accepts AUTOMATED provenance shape without authority", () => {
    const result = resolveCandidate(
      identity,
      candidate({
        creationMode: "AUTOMATED",
        createdBy: { actorType: "AUTOMATION", actorId: "automation-1" },
      }),
      context(),
    );
    expect(result.resultClass).toBe("VALID_NEW");
    expect(result.authority).toBe("NON_AUTHORITATIVE");
  });

  it("DKC-A-V11/V25 is insensitive to object-member and input-array order", () => {
    const evidenceA = [
      {
        evidenceRef: "EV-B",
        relation: "INCONCLUSIVE",
        lineage: { derivedFromKnowledgeRefs: ["K2", "K1", "K1"], derivedFromDecisionRefs: ["D2", "D1"] },
      },
      { evidenceRef: "EV-A", relation: "SUPPORTING" },
    ];
    const evidenceB = [...evidenceA].reverse();
    const priorA = [
      { candidateRef: "KC-B", resolutionKey: key("old-b") },
      { candidateRef: "KC-A", resolutionKey: key("old-a") },
    ];
    const priorB = [...priorA].reverse();
    const a = resolveCandidate(identity, candidate({ contentDigest: "new", evidenceRefs: evidenceA }), context(priorA));
    const b = resolveCandidate(identity, candidate({ evidenceRefs: evidenceB, contentDigest: "new" }), context(priorB));
    expect(a).toEqual(b);
    expect(a.priorCandidateRefs).toEqual(["KC-A", "KC-B"]);
  });

  it("DKC-A-V12 rejects missing source identity", () => {
    const result = resolveCandidate({ sourceRepository: "repo-1" }, candidate(), context());
    expect(result.resultClass).toBe("INVALID_IDENTITY");
    expect(result.errorIds).toEqual(["INVALID_RESOLUTION_IDENTITY"]);
  });

  it("DKC-SC1-V15 resolves empty COMPLETE prior context as VALID_NEW", () => {
    expect(resolveCandidate(identity, candidate(), context()).resultClass).toBe("VALID_NEW");
  });

  it("DKC-SC1-V18 fails closed on UNKNOWN context", () => {
    const result = resolveCandidate(identity, candidate(), context([], "UNKNOWN"));
    expect(result.resultClass).toBe("HOLD_UNKNOWN");
    expect(result.holdReasonIds).toEqual(["PRIOR_CONTEXT_INCOMPLETE"]);
    expect(result.resolutionKey).toBeUndefined();
  });

  it("DKC-SC1-V19 rejects missing candidate field", () => {
    const draft = candidate();
    delete (draft as Record<string, unknown>).problem;
    const result = resolveCandidate(identity, draft, context());
    expect(result.resultClass).toBe("INVALID_SCHEMA");
    expect(result.errorIds).toEqual(["MISSING_REQUIRED_FIELD"]);
  });

  it("DKC-SC1-V21 rejects unknown candidate field", () => {
    const result = resolveCandidate(identity, candidate({ extra: "x" }), context());
    expect(result.resultClass).toBe("INVALID_SCHEMA");
    expect(result.errorIds).toEqual(["UNKNOWN_FIELD"]);
  });

  it("DKC-SC1-V23 preserves conflicting relations and marks evidenceConflict", () => {
    const result = resolveCandidate(
      identity,
      candidate({
        evidenceRefs: [
          { evidenceRef: "EV-1", relation: "INCONCLUSIVE" },
          { evidenceRef: "EV-1", relation: "SUPPORTING" },
          { evidenceRef: "EV-1", relation: "CONTRADICTING" },
        ],
      }),
      context(),
    );
    expect(result.resultClass).toBe("VALID_NEW");
    expect(result.evidenceConflict).toBe(true);
    expect(result.normalizedEvidenceRefs?.map((entry) => entry.relation)).toEqual([
      "SUPPORTING",
      "CONTRADICTING",
      "INCONCLUSIVE",
    ]);
  });

  it("DKC-SC1-V26 fails closed when one resolution key maps to different refs", () => {
    const result = resolveCandidate(
      identity,
      candidate(),
      context([
        { candidateRef: "KC-A", resolutionKey: key() },
        { candidateRef: "KC-B", resolutionKey: key() },
      ]),
    );
    expect(result.resultClass).toBe("HOLD_UNKNOWN");
    expect(result.holdReasonIds).toEqual(["PRIOR_CONTEXT_CONFLICT"]);
  });

  it("DKC-SC1-V27 fails closed when one ref maps to different resolution keys", () => {
    const result = resolveCandidate(
      identity,
      candidate(),
      context([
        { candidateRef: "KC-A", resolutionKey: key("digest-a") },
        { candidateRef: "KC-A", resolutionKey: key("digest-b") },
      ]),
    );
    expect(result.resultClass).toBe("HOLD_UNKNOWN");
    expect(result.holdReasonIds).toEqual(["PRIOR_CONTEXT_CONFLICT"]);
  });

  it("collapses duplicate prior entries with same key and ref", () => {
    const prior = { candidateRef: "KC-A", resolutionKey: key() };
    const result = resolveCandidate(identity, candidate(), context([prior, prior]));
    expect(result.resultClass).toBe("VALID_EXISTING_IDEMPOTENT");
    expect(result.priorCandidateRefs).toEqual(["KC-A"]);
  });

  it("rejects malformed prior context without inference", () => {
    const result = resolveCandidate(identity, candidate(), {
      contractType: "CandidateResolutionContext@v1",
      completeness: "COMPLETE",
      priorCandidates: [{ candidateRef: "", resolutionKey: key() }],
    });
    expect(result.resultClass).toBe("INVALID_SCHEMA");
    expect(result.errorIds).toEqual(["INVALID_PRIOR_CONTEXT"]);
  });

  it("normalizes lineage arrays deterministically", () => {
    const result = resolveCandidate(
      identity,
      candidate({
        evidenceRefs: [
          {
            evidenceRef: "EV-L",
            relation: "SUPPORTING",
            lineage: {
              derivedFromKnowledgeRefs: ["K2", "K1", "K2"],
              derivedFromDecisionRefs: ["D2", "D1", "D1"],
            },
          },
        ],
      }),
      context(),
    );
    expect(result.normalizedEvidenceRefs?.[0]?.lineage).toEqual({
      derivedFromKnowledgeRefs: ["K1", "K2"],
      derivedFromDecisionRefs: ["D1", "D2"],
    });
  });

  it("never emits external authority fields in valid result", () => {
    const result = resolveCandidate(identity, candidate(), context());
    expect(result.authority).toBe("NON_AUTHORITATIVE");
    expect(result).not.toHaveProperty("validatedScope");
    expect(result).not.toHaveProperty("runtimeEligible");
    expect(result).not.toHaveProperty("confidence");
  });
});
