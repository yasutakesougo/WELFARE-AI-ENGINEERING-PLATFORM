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
} from "../src/understanding_debt/index.js";

const baseApplicability: ApplicabilityEvaluatorInput = {
  workstreamIdentity: "WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
  changeIdentity: "slice-a",
  riskPolicyVersion: "v1",
  explicitRiskSignals: [],
  existingRiskLane: null,
  evidenceRefs: ["issue:#86"],
  classificationEvidenceComplete: true,
};

const baseMateriality: MaterialityEvaluatorInput = {
  workstreamIdentity: "WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
  changeIdentity: "slice-a",
  explicitMaterialSignals: [],
  explicitlyNonMaterial: false,
  classificationEvidenceComplete: true,
  evidenceRefs: ["issue:#86"],
};

function validEvidence(): Record<string, unknown> {
  return {
    understandingCheckId: "uc-1",
    subject: {
      workstreamId: "WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
      artifactRef: "issue:#86",
      artifactDigest: "UNKNOWN",
      accountableSubjectRef: "subject:human-1",
      accountableRole: "WORKSTREAM_OWNER",
      ownershipContextRef: "issue:#86",
      gateContext: "DEFINITION_LOCK",
    },
    understandingPolicyVersion: "v1",
    questionSetVersion: "v1",
    applicabilityDecisionRef: "app-1",
    riskClass: "HIGH",
    requiredQuestions: ["q1"],
    humanResponses: [
      {
        questionId: "q1",
        responseRef: "evidence:response-1",
        responseMode: "HUMAN_FREEFORM_EXPLANATION",
      },
    ],
    validation: {
      validatorIdentity: "reviewer:1",
      validatorClass: "INDEPENDENT_HUMAN_REVIEWER",
      consistencyState: "SUFFICIENT",
      contradictions: [],
      missingConcepts: [],
      evidenceRefs: ["evidence:response-1"],
    },
    assessmentDecisionRef: "assessment:1",
    assessmentReason: "independent review",
    state: "SUFFICIENT",
    validatedAt: "2026-08-30T00:00:00Z",
    validatedAgainst: {
      definitionRef: "issue:#86",
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
    expect(
      evaluateApplicability({
        ...baseApplicability,
        explicitRiskSignals: ["AUTHORITY_SENSITIVE_CHANGE"],
      }),
    ).toBe("REQUIRED");
  });

  it("A2: explicitly low-risk non-governed change is not required", () => {
    expect(
      evaluateApplicability({
        ...baseApplicability,
        explicitlyLowRiskNonGoverned: true,
      }),
    ).toBe("NOT_REQUIRED");
  });

  it("A3: incomplete classification evidence remains UNKNOWN", () => {
    expect(
      evaluateApplicability({
        ...baseApplicability,
        classificationEvidenceComplete: false,
      }),
    ).toBe("UNKNOWN");
  });

  it("A4: explicit authority-boundary change is MATERIAL", () => {
    expect(
      evaluateMateriality({
        ...baseMateriality,
        explicitMaterialSignals: ["AUTHORITY_BOUNDARY_CHANGE"],
      }),
    ).toBe("MATERIAL");
  });

  it("A5: explicitly non-material formatting change remains NON_MATERIAL", () => {
    expect(
      evaluateMateriality({
        ...baseMateriality,
        explicitlyNonMaterial: true,
      }),
    ).toBe("NON_MATERIAL");
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

  it("A9: structural validity does not promote checkbox-only evidence to SUFFICIENT", () => {
    const evidence = validEvidence();
    evidence.state = "PENDING";
    evidence.humanResponses = [];
    expect(validateUnderstandingEvidence(evidence)).toBe("VALID");
    expect(evidence.state).toBe("PENDING");
  });

  it("A10: non-canonical validator class is rejected", () => {
    const evidence = validEvidence();
    (evidence.validation as Record<string, unknown>).validatorClass = "ARTIFACT_GENERATING_MODEL_ALONE";
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
    expect(isCanonicalValidatorClass("ARTIFACT_GENERATING_MODEL_ALONE")).toBe(false);
  });

  it("A11: normalized #77 observation contains no raw human answers", () => {
    const observation: NormalizedUnderstandingDebtObservation = {
      understandingDebtId: "ud-1",
      workstreamId: "WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
      debtClass: "STALE",
      risk: "HIGH",
      basis: "material change after prior assessment",
      evidenceRefs: ["assessment:1"],
      currentAssessmentState: "STALE",
      requiredAction: "REFRESH",
      autoMutationAllowed: false,
    };
    expect(JSON.stringify(observation)).not.toContain("humanResponses");
    expect(observation.autoMutationAllowed).toBe(false);
  });

  it("A12: canonical evidence rejects raw sensitive payload keys", () => {
    const evidence = validEvidence();
    evidence.rawWelfareData = "synthetic-but-prohibited-shape";
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
  });

  it("A13: evaluator input has no raw Issue/PR/diff field", () => {
    expect(Object.keys(baseApplicability)).not.toEqual(
      expect.arrayContaining(["issueText", "prText", "diff", "artifactText"]),
    );
  });

  it("A14: no explicit signals and no low-risk assertion stays UNKNOWN", () => {
    expect(evaluateApplicability(baseApplicability)).toBe("UNKNOWN");
  });

  it("A15: existing risk lane alone cannot suppress a required signal", () => {
    expect(
      evaluateApplicability({
        ...baseApplicability,
        existingRiskLane: "FAST",
        explicitRiskSignals: ["NEW_AUTOMATION_OR_AGENT_AUTHORITY_PATH"],
      }),
    ).toBe("REQUIRED");
  });

  it("A16: materiality input has no raw diff/artifact field", () => {
    expect(Object.keys(baseMateriality)).not.toEqual(
      expect.arrayContaining(["diff", "artifactText", "issueText", "prText"]),
    );
  });

  it("A17: UNKNOWN materiality cannot silently preserve SUFFICIENT", () => {
    expect(deriveAssessmentStateAfterChange("SUFFICIENT", "UNKNOWN")).toBe("UNKNOWN");
  });

  it("A18: StructuralValidationResult is independent of assessment state", () => {
    const evidence = validEvidence();
    evidence.state = "CONTRADICTORY";
    expect(validateUnderstandingEvidence(evidence)).toBe("VALID");
    expect(evidence.state).toBe("CONTRADICTORY");
  });

  it("A19: missing reproducibility identity is structurally invalid", () => {
    const evidence = validEvidence();
    evidence.questionSetVersion = "";
    expect(validateUnderstandingEvidence(evidence)).toBe("INVALID");
  });

  it("A20: canonical observation can never authorize mutation", () => {
    const observation: NormalizedUnderstandingDebtObservation = {
      understandingDebtId: "ud-2",
      workstreamId: "WAEP-UNDERSTANDING-DEBT-CONTROL-V1",
      debtClass: "MISSING",
      risk: "MEDIUM",
      basis: "missing current assessment",
      evidenceRefs: [],
      currentAssessmentState: "PENDING",
      requiredAction: "HUMAN_REVIEW",
      autoMutationAllowed: false,
    };
    expect(observation.autoMutationAllowed).toBe(false);
  });
});
