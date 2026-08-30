import { expect, it } from "vitest";
import { resolveCandidate } from "../src/index.js";

it("orders canonical evidence refs by Unicode code-point sequence", () => {
  const draft = {
    candidateId: "KC-U",
    contractVersion: "DEVELOPMENT-KNOWLEDGE-COMPOUND-V1",
    candidateVersion: "1",
    observation: "o",
    problem: "p",
    suspectedRootCause: "r",
    proposedRule: "rule",
    sourceRefs: ["SRC"],
    evidenceRefs: [
      { evidenceRef: "EV-😀", relation: "SUPPORTING" },
      { evidenceRef: "EV-\uE000", relation: "SUPPORTING" },
    ],
    scope: { observedIn: ["r"], proposedAppliesTo: ["r"], explicitlyNotValidatedFor: [] },
    createdBy: { actorType: "AGENT", actorId: "a" },
    creationMode: "AGENT_ASSISTED",
    createdAt: "2026-08-29T00:00:00Z",
    contentDigest: "d",
    nonAuthoritative: true,
  };
  const result = resolveCandidate(
    { sourceRepository: "r", sourceEventId: "e" },
    draft,
    { contractType: "CandidateResolutionContext@v1", completeness: "COMPLETE", priorCandidates: [] },
  );
  expect(result.normalizedEvidenceRefs?.map((item) => item.evidenceRef)).toEqual(["EV-\uE000", "EV-😀"]);
});
