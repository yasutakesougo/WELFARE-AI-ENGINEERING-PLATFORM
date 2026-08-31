import { describe, expect, it } from "vitest";
import { validateUnderstandingEvidence } from "../src/understanding_debt/index.js";

function contradictoryEvidence(): Record<string, unknown> {
  return {
    understandingCheckId: "synthetic:uc-correction-2",
    subject: {
      workstreamId: "synthetic:WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
      artifactRef: "synthetic:issue-86",
      artifactDigest: "UNKNOWN",
      accountableSubjectRef: "synthetic:human-1",
      accountableRole: "WORKSTREAM_OWNER",
      ownershipContextRef: "synthetic:issue-86",
      gateContext: "DEFINITION_LOCK",
    },
    understandingPolicyVersion: "synthetic:v1",
    questionSetVersion: "synthetic:v1",
    applicabilityDecisionRef: "synthetic:app-1",
    riskClass: "HIGH",
    requiredQuestions: ["synthetic:q1"],
    humanResponses: [
      {
        questionId: "synthetic:q1",
        responseRef: "synthetic:response-1",
        responseMode: "HUMAN_FREEFORM_EXPLANATION",
      },
    ],
    validation: {
      validatorIdentity: "synthetic:reviewer-1",
      validatorClass: "INDEPENDENT_HUMAN_REVIEWER",
      consistencyState: "SUFFICIENT",
      contradictions: ["synthetic:contradiction-1"],
      missingConcepts: [],
      evidenceRefs: ["synthetic:response-1"],
    },
    assessmentDecisionRef: "synthetic:assessment-1",
    assessmentReason: "synthetic contradictory evidence",
    state: "CONTRADICTORY",
    validatedAt: "2026-08-31T00:00:00Z",
    validatedAgainst: {
      definitionRef: "synthetic:issue-86",
      scopeRef: null,
      implementationRef: null,
      currentStateRef: null,
      semanticFingerprint: "UNKNOWN",
    },
    invalidatedBy: [],
  };
}

describe("WAEP-UNDERSTANDING-DEBT-CONTROL-V1 Correction-2", () => {
  it("rejects CONTRADICTORY assessment when consistency claims SUFFICIENT", () => {
    expect(validateUnderstandingEvidence(contradictoryEvidence())).toBe("INVALID");
  });

  it("accepts the same structural record when consistency is explicitly CONTRADICTORY", () => {
    const evidence = contradictoryEvidence();
    (evidence.validation as Record<string, unknown>).consistencyState = "CONTRADICTORY";
    expect(validateUnderstandingEvidence(evidence)).toBe("VALID");
  });
});
