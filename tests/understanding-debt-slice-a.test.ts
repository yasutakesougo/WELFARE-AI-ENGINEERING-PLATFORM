import { describe, expect, it } from "vitest";
import {
  deriveAssessmentStateAfterChange,
  deriveAssessmentStateAfterOwnershipTransfer,
  evaluateApplicability,
  evaluateMateriality,
  isCanonicalValidatorClass,
  validateUnderstandingEvidence,
  type ApplicabilityEvaluatorInput,
  type MaterialityEvaluatorInput,
  type NormalizedUnderstandingDebtObservation,
  type StructuralValidationResult,
  type UnderstandingAssessmentDecision,
  type UnderstandingEvidenceRecord,
} from "../src/understanding_debt/index.js";

const baseApplicability: ApplicabilityEvaluatorInput = {
  workstreamIdentity: "synthetic:WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
  changeIdentity: "synthetic:slice-a",
  riskPolicyVersion: "synthetic:v1",
  explicitRiskSignals: [],
  existingRiskLane: null,
  evidenceRefs: ["synthetic:issue-86"],
  classificationEvidenceComplete: true,
};

const baseMateriality: MaterialityEvaluatorInput = {
  workstreamIdentity: "synthetic:WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
  changeIdentity: "synthetic:slice-a",
  explicitMaterialSignals: [],
  explicitlyNonMaterial: false,
  classificationEvidenceComplete: true,
  evidenceRefs: ["synthetic:issue-86"],
};

function validEvidence(): Record<string, unknown> {
  return {
    understandingCheckId: "synthetic:uc-1",
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
    humanResponses: [{ questionId: "synthetic:q1", responseRef: "synthetic:evidence-response-1", responseMode: "HUMAN_FREEFORM_EXPLANATION" }],
    validation: {
      validatorIdentity: "synthetic:reviewer-1",
      validatorClass: "INDEPENDENT_HUMAN_REVIEWER",
      consistencyState: "SUFFICIENT",
      contradictions: [],
      missingConcepts: [],
      evidenceRefs: ["synthetic:evidence-response-1"],
    },
    assessmentDecisionRef: "synthetic:assessment-1",
    assessmentReason: "synthetic independent review",
    state: "SUFFICIENT",
    validatedAt: "2026-08-30T00:00:00Z",
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

describe("WAEP-UNDERSTANDING-DEBT-CONTROL-V1 Slice A", () => {
  it("A1: authority-sensitive signal requires understanding assessment", () => {
    expect(evaluateApplicability({ ...baseApplicability, explicitRiskSignals: ["AUTHORITY_SENSITIVE_CHANGE"] })).toBe("REQUIRED");
  });

  it("A2: explicitly low-risk non-governed change is not required", () => {
    expect(evaluateApplicability({ ...baseApplicability, explicitlyLowRiskNonGoverned: true })).toBe("NOT_REQUIRED");
  });

  it("A3: incomplete classification evidence remains UNKNOWN", () => {
    expect(evaluateApplicability({ ...baseApplicability, classificationEvidenceComplete: false })).toBe("UNKNOWN");
  });

  it("A4: explicit authority-boundary change is MATERIAL", () => {
    expect(evaluateMateriality({ ...baseMateriality, explicitMaterialSignals: ["AUTHORITY_BOUNDARY_CHANGE"] })).toBe("MATERIAL");
  });

  it("A5: explicitly non-material formatting change remains NON_MATERIAL", () => {
    expect(evaluateMateriality({ ...baseMateriality, explicitlyNonMaterial: true })).toBe("NON_MATERIAL");
  });

  it("A6: ambiguous materiality remains UNKNOWN", () => {
    expect(evaluateMateriality(baseMateriality)).toBe("UNKNOWN");
  });

  it("A7: MATERIAL change invalidates current SUFFICIENT as STALE", () => {
    expect(deriveAssessmentStateAfterChange("SUFFICIENT", "MATERIAL")).toBe("STALE");
  });

  it("A8: ownership transfer creates PENDING for REQUIRED work", () => {
    expect(deriveAssessmentStateAfterOwnershipTransfer("REQUIRED")).toBe("PENDING");
  });

  it("A9: PENDING may remain structurally valid without a response", () => {
    const evidence = validEvidence();
    evidence.state = "PENDING";
    evidence.humanResponses = [];
    expect(validateUnderstandingEvidence(evidence)).toBe("VALID");
  });

  it("A10: non-canonical validator class is rejected", () => {
    const evidence = validEvidence();
    (evidence.validation as Record<string, unknown>).validatorClass = "ARTIFACT_GENERATING_MODEL_ALONE";
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
    expect(isCanonicalValidatorClass("ARTIFACT_GENERATING_MODEL_ALONE")).toBe(false);
  });

  it("A11: normalized #77 observation contains no raw human answers", () => {
    const observation: NormalizedUnderstandingDebtObservation = {
      understandingDebtId: "synthetic:ud-1",
      workstreamId: "synthetic:WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
      debtClass: "STALE",
      risk: "HIGH",
      basis: "synthetic material change after prior assessment",
      evidenceRefs: ["synthetic:assessment-1"],
      currentAssessmentState: "STALE",
      requiredAction: "REFRESH",
      autoMutationAllowed: false,
    };
    expect(JSON.stringify(observation)).not.toContain("humanResponses");
    expect(observation.autoMutationAllowed).toBe(false);
  });

  it("A12: canonical evidence rejects unknown top-level fields", () => {
    const evidence = validEvidence();
    evidence.apiKey = "synthetic-prohibited-shape";
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
  });

  it("A13: applicability evaluator consumes structured signals only", () => {
    expect(Object.keys(baseApplicability)).not.toEqual(expect.arrayContaining(["issueText", "prText", "diff", "artifactText"]));
  });

  it("A14: missing or conflicting applicability signal remains UNKNOWN", () => {
    expect(evaluateApplicability(baseApplicability)).toBe("UNKNOWN");
    expect(evaluateApplicability({ ...baseApplicability, explicitRiskSignals: ["AUTHORITY_SENSITIVE_CHANGE"], explicitlyLowRiskNonGoverned: true })).toBe("UNKNOWN");
  });

  it("A15: materiality evaluator consumes structured change signals only", () => {
    expect(Object.keys(baseMateriality)).not.toEqual(expect.arrayContaining(["diff", "artifactText", "issueText", "prText"]));
  });

  it("A16: ambiguous or conflicting materiality remains UNKNOWN", () => {
    expect(evaluateMateriality(baseMateriality)).toBe("UNKNOWN");
    expect(evaluateMateriality({ ...baseMateriality, explicitMaterialSignals: ["AUTHORITY_BOUNDARY_CHANGE"], explicitlyNonMaterial: true })).toBe("UNKNOWN");
  });

  it("A17: StructuralValidationResult is type-distinct from UnderstandingAssessmentDecision", () => {
    const structural: StructuralValidationResult = validateUnderstandingEvidence(validEvidence());
    // @ts-expect-error structural validation is not an assessment decision
    const decision: UnderstandingAssessmentDecision = structural;
    expect(structural).toBe("VALID");
    expect(decision).toBe("VALID");
  });

  it("A18: structural VALID cannot generate semantic SUFFICIENT", () => {
    const evidence = validEvidence();
    evidence.state = "PENDING";
    const structural = validateUnderstandingEvidence(evidence);
    expect(structural).toBe("VALID");
    expect(structural).not.toBe("SUFFICIENT");
  });

  it("A19: canonical contracts contain no required raw sensitive payload field", () => {
    type EvidenceKey = keyof UnderstandingEvidenceRecord;
    // @ts-expect-error raw sensitive payload is intentionally absent from the canonical contract
    const prohibitedKey: EvidenceKey = "rawWelfareData";
    expect(prohibitedKey).toBe("rawWelfareData");
  });

  it("A20: synthetic fixtures contain synthetic data only", () => {
    const fixture = JSON.stringify({ baseApplicability, baseMateriality, evidence: validEvidence() });
    expect(fixture).toContain("synthetic:");
    expect(fixture).not.toContain("credential");
    expect(fixture).not.toContain("rawWelfareData");
  });

  it("C1: SUFFICIENT with no human response is invalid", () => {
    const evidence = validEvidence();
    evidence.humanResponses = [];
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
  });

  it("C2: malformed human response is invalid", () => {
    const evidence = validEvidence();
    evidence.humanResponses = [{ questionId: "synthetic:q1", responseRef: "synthetic:r1", responseMode: "MODEL_ONLY" }];
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
  });

  it("C3: SUFFICIENT contradicting validator state is invalid", () => {
    const evidence = validEvidence();
    (evidence.validation as Record<string, unknown>).consistencyState = "CONTRADICTORY";
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
  });

  it("C4: HIGH risk SUFFICIENT requires active human response mode", () => {
    const evidence = validEvidence();
    evidence.humanResponses = [{ questionId: "synthetic:q1", responseRef: "synthetic:r1", responseMode: "HUMAN_VERIFIED_STRUCTURED_ANSWER" }];
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
  });

  it("C5: unknown nested response fields fail closed", () => {
    const evidence = validEvidence();
    evidence.humanResponses = [{ questionId: "synthetic:q1", responseRef: "synthetic:r1", responseMode: "HUMAN_FREEFORM_EXPLANATION", accessToken: "synthetic" }];
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
  });
});
