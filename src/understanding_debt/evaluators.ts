import type {
  ApplicabilityEvaluatorInput,
  ApplicabilityResult,
  MaterialityEvaluatorInput,
  MaterialityResult,
  UnderstandingAssessmentState,
} from "./types.js";

export function evaluateApplicability(
  input: ApplicabilityEvaluatorInput,
): ApplicabilityResult {
  if (!input.classificationEvidenceComplete) {
    return "UNKNOWN";
  }

  if (input.explicitRiskSignals.length > 0) {
    return "REQUIRED";
  }

  if (input.explicitlyLowRiskNonGoverned === true) {
    return "NOT_REQUIRED";
  }

  return "UNKNOWN";
}

export function evaluateMateriality(
  input: MaterialityEvaluatorInput,
): MaterialityResult {
  if (!input.classificationEvidenceComplete) {
    return "UNKNOWN";
  }

  if (input.explicitMaterialSignals.length > 0) {
    return "MATERIAL";
  }

  if (input.explicitlyNonMaterial) {
    return "NON_MATERIAL";
  }

  return "UNKNOWN";
}

export function deriveAssessmentStateAfterChange(
  currentState: UnderstandingAssessmentState,
  materiality: MaterialityResult,
): UnderstandingAssessmentState {
  if (currentState !== "SUFFICIENT") {
    return currentState;
  }

  if (materiality === "MATERIAL") {
    return "STALE";
  }

  if (materiality === "UNKNOWN") {
    return "UNKNOWN";
  }

  return currentState;
}

export function deriveAssessmentStateAfterOwnershipTransfer(
  applicability: ApplicabilityResult,
): UnderstandingAssessmentState {
  if (applicability === "REQUIRED") {
    return "PENDING";
  }

  if (applicability === "NOT_REQUIRED") {
    return "NOT_REQUIRED";
  }

  return "UNKNOWN";
}
