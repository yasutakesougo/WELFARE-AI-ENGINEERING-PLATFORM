import { describe, expect, it } from "vitest";
import { resolveCandidate } from "../src/index.js";

const identity = { sourceRepository: "repo-1", sourceEventId: "event-1" };
const context = {
  contractType: "CandidateResolutionContext@v1",
  completeness: "COMPLETE",
  priorCandidates: [],
};

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

describe("DKC post-merge provenance enum correction", () => {
  it("rejects coercible non-string actorType values", () => {
    const result = resolveCandidate(
      identity,
      candidate({ createdBy: { actorType: ["AGENT"], actorId: "agent-1" } }),
      context,
    );
    expect(result.resultClass).toBe("INVALID_SCHEMA");
    expect(result.errorIds).toEqual(["INVALID_FIELD_TYPE"]);
  });

  it("rejects coercible non-string creationMode values", () => {
    const result = resolveCandidate(identity, candidate({ creationMode: ["AUTOMATED"] }), context);
    expect(result.resultClass).toBe("INVALID_SCHEMA");
    expect(result.errorIds).toEqual(["INVALID_FIELD_TYPE"]);
  });

  it("still accepts exact string provenance enum values", () => {
    const result = resolveCandidate(
      identity,
      candidate({
        creationMode: "AUTOMATED",
        createdBy: { actorType: "AUTOMATION", actorId: "automation-1" },
      }),
      context,
    );
    expect(result.resultClass).toBe("VALID_NEW");
  });
});
