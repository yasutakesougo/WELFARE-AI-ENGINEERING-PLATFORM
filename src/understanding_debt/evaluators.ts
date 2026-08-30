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

  const hasRequiredSignal = input.explicitRiskSignals.length > 0;
  const hasNotRequiredSignal = input.explicitlyLowRiskNonGoverned === true;

  if (hasRequiredSignal && hasNotRequiredSignal) {
    return "UNKNOWN";
  }

  if (hasRequiredSignal) {
    return "REQUIRED";
  }

  if (hasNotRequiredSignal) {
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

  const hasMaterialSignal = input.explicitMaterialSignals.length > 0;
  const hasNonMaterialSignal = input.explicitlyNonMaterial;

  if (hasMaterialSignal && hasNonMaterialSignal) {
    return "UNKNOWN";
  }

  if (hasMaterialSignal) {
    return "MATERIAL";
  }

  if (hasNonMaterialSignal) {
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
