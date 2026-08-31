import type { StructuralValidationResult, ValidatorClass } from "./types.js";

const ASSESSMENT_STATES = new Set([
  "NOT_REQUIRED",
  "PENDING",
  "SUFFICIENT",
  "INSUFFICIENT",
  "CONTRADICTORY",
  "STALE",
  "UNKNOWN",
]);

const CONSISTENCY_STATES = new Set([
  "SUFFICIENT",
  "INSUFFICIENT",
  "CONTRADICTORY",
  "UNKNOWN",
]);

const VALIDATOR_CLASSES = new Set<ValidatorClass>([
  "DETERMINISTIC_VALIDATOR",
  "INDEPENDENT_HUMAN_REVIEWER",
  "MODEL_ASSISTED_VALIDATOR",
]);

const RESPONSE_MODES = new Set([
  "HUMAN_FREEFORM_EXPLANATION",
  "HUMAN_CORRECTED_AI_SUMMARY",
  "HUMAN_VERIFIED_STRUCTURED_ANSWER",
  "LIVE_QUESTION_RESPONSE",
]);

const TOP_LEVEL_KEYS = new Set([
  "understandingCheckId",
  "subject",
  "understandingPolicyVersion",
  "questionSetVersion",
  "applicabilityDecisionRef",
  "riskClass",
  "requiredQuestions",
  "humanResponses",
  "validation",
  "assessmentDecisionRef",
  "assessmentReason",
  "state",
  "validatedAt",
  "validatedAgainst",
  "invalidatedBy",
]);

const SUBJECT_KEYS = new Set([
  "workstreamId",
  "artifactRef",
  "artifactDigest",
  "accountableSubjectRef",
  "accountableRole",
  "ownershipContextRef",
  "gateContext",
]);

const HUMAN_RESPONSE_KEYS = new Set(["questionId", "responseRef", "responseMode"]);
const VALIDATION_KEYS = new Set([
  "validatorIdentity",
  "validatorClass",
  "consistencyState",
  "contradictions",
  "missingConcepts",
  "evidenceRefs",
]);
const VALIDATED_AGAINST_KEYS = new Set([
  "definitionRef",
  "scopeRef",
  "implementationRef",
  "currentStateRef",
  "semanticFingerprint",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(record: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(record).every((key) => allowed.has(key));
}

function hasNonEmptyString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string" && record[key] !== "";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item !== "");
}

function isNullableString(value: unknown): boolean {
  return value === null || (typeof value === "string" && value !== "");
}

function validateHumanResponse(value: unknown): boolean {
  if (!isRecord(value) || !hasOnlyKeys(value, HUMAN_RESPONSE_KEYS)) return false;
  if (!hasNonEmptyString(value, "questionId") || !hasNonEmptyString(value, "responseRef")) return false;
  return typeof value.responseMode === "string" && RESPONSE_MODES.has(value.responseMode);
}

export function validateUnderstandingEvidence(
  value: unknown,
): StructuralValidationResult {
  if (!isRecord(value) || !hasOnlyKeys(value, TOP_LEVEL_KEYS)) return "INVALID";

  const requiredTopLevelStrings = [
    "understandingCheckId",
    "understandingPolicyVersion",
    "questionSetVersion",
    "applicabilityDecisionRef",
    "riskClass",
    "assessmentDecisionRef",
    "assessmentReason",
    "validatedAt",
  ];
  if (requiredTopLevelStrings.some((key) => !hasNonEmptyString(value, key))) return "INVALID";

  if (typeof value.state !== "string" || !ASSESSMENT_STATES.has(value.state)) return "INVALID";
  if (!isStringArray(value.requiredQuestions) || !Array.isArray(value.humanResponses)) return "INVALID";
  if (!value.humanResponses.every(validateHumanResponse)) return "INVALID";
  if (!isStringArray(value.invalidatedBy) && !(Array.isArray(value.invalidatedBy) && value.invalidatedBy.length === 0)) {
    return "INVALID";
  }

  if (!isRecord(value.subject) || !hasOnlyKeys(value.subject, SUBJECT_KEYS)) return "INVALID";
  const subjectStrings = [
    "workstreamId",
    "artifactRef",
    "artifactDigest",
    "accountableSubjectRef",
    "accountableRole",
    "ownershipContextRef",
    "gateContext",
  ];
  if (subjectStrings.some((key) => !hasNonEmptyString(value.subject as Record<string, unknown>, key))) return "INVALID";

  if (!isRecord(value.validation) || !hasOnlyKeys(value.validation, VALIDATION_KEYS)) return "INVALID";
  const validation = value.validation;
  if (!hasNonEmptyString(validation, "validatorIdentity")) return "INVALID";
  if (!VALIDATOR_CLASSES.has(validation.validatorClass as ValidatorClass)) return "INVALID";
  if (typeof validation.consistencyState !== "string" || !CONSISTENCY_STATES.has(validation.consistencyState)) {
    return "INVALID";
  }
  if (!isStringArray(validation.contradictions) && !(Array.isArray(validation.contradictions) && validation.contradictions.length === 0)) return "INVALID";
  if (!isStringArray(validation.missingConcepts) && !(Array.isArray(validation.missingConcepts) && validation.missingConcepts.length === 0)) return "INVALID";
  if (!isStringArray(validation.evidenceRefs) && !(Array.isArray(validation.evidenceRefs) && validation.evidenceRefs.length === 0)) return "INVALID";

  if (!isRecord(value.validatedAgainst) || !hasOnlyKeys(value.validatedAgainst, VALIDATED_AGAINST_KEYS)) return "INVALID";
  const validatedAgainst = value.validatedAgainst;
  if (!hasNonEmptyString(validatedAgainst, "definitionRef")) return "INVALID";
  if (!hasNonEmptyString(validatedAgainst, "semanticFingerprint")) return "INVALID";
  if (!isNullableString(validatedAgainst.scopeRef)) return "INVALID";
  if (!isNullableString(validatedAgainst.implementationRef)) return "INVALID";
  if (!isNullableString(validatedAgainst.currentStateRef)) return "INVALID";

  if (value.state === "SUFFICIENT") {
    if (value.humanResponses.length === 0) return "INVALID";
    if (validation.consistencyState !== "SUFFICIENT") return "INVALID";
    if (validation.contradictions.length > 0 || validation.missingConcepts.length > 0) return "INVALID";

    if (value.riskClass === "HIGH") {
      const hasActiveHumanResponse = value.humanResponses.some((response) => {
        const record = response as Record<string, unknown>;
        return record.responseMode === "HUMAN_FREEFORM_EXPLANATION" || record.responseMode === "LIVE_QUESTION_RESPONSE";
      });
      if (!hasActiveHumanResponse) return "INVALID";
    }
  }

  if (value.state === "CONTRADICTORY" && validation.consistencyState === "SUFFICIENT") {
    return "INVALID";
  }

  return "VALID";
}

export function isCanonicalValidatorClass(value: unknown): value is ValidatorClass {
  return typeof value === "string" && VALIDATOR_CLASSES.has(value as ValidatorClass);
}
