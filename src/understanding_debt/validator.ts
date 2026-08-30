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

const PROHIBITED_RAW_KEYS = new Set([
  "rawSensitiveContent",
  "rawWelfareData",
  "credential",
  "credentials",
  "token",
  "secret",
  "password",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasNonEmptyString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string" && record[key] !== "";
}

function containsProhibitedRawKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsProhibitedRawKey);
  }

  if (!isRecord(value)) {
    return false;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (PROHIBITED_RAW_KEYS.has(key)) {
      return true;
    }
    if (containsProhibitedRawKey(nested)) {
      return true;
    }
  }

  return false;
}

export function validateUnderstandingEvidence(
  value: unknown,
): StructuralValidationResult {
  if (!isRecord(value)) {
    return "INVALID";
  }

  if (containsProhibitedRawKey(value)) {
    return "INVALID";
  }

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

  if (requiredTopLevelStrings.some((key) => !hasNonEmptyString(value, key))) {
    return "INVALID";
  }

  if (typeof value.state !== "string" || !ASSESSMENT_STATES.has(value.state)) {
    return "INVALID";
  }

  if (!Array.isArray(value.requiredQuestions) || !Array.isArray(value.humanResponses)) {
    return "INVALID";
  }

  if (!Array.isArray(value.invalidatedBy)) {
    return "INVALID";
  }

  if (!isRecord(value.subject)) {
    return "INVALID";
  }
  const subject = value.subject;

  const subjectStrings = [
    "workstreamId",
    "artifactRef",
    "artifactDigest",
    "accountableSubjectRef",
    "accountableRole",
    "ownershipContextRef",
    "gateContext",
  ];
  if (subjectStrings.some((key) => !hasNonEmptyString(subject, key))) {
    return "INVALID";
  }

  if (!isRecord(value.validation)) {
    return "INVALID";
  }
  const validation = value.validation;

  if (!hasNonEmptyString(validation, "validatorIdentity")) {
    return "INVALID";
  }
  if (!VALIDATOR_CLASSES.has(validation.validatorClass as ValidatorClass)) {
    return "INVALID";
  }
  if (
    typeof validation.consistencyState !== "string" ||
    !CONSISTENCY_STATES.has(validation.consistencyState)
  ) {
    return "INVALID";
  }
  if (
    !Array.isArray(validation.contradictions) ||
    !Array.isArray(validation.missingConcepts) ||
    !Array.isArray(validation.evidenceRefs)
  ) {
    return "INVALID";
  }

  if (!isRecord(value.validatedAgainst)) {
    return "INVALID";
  }
  const validatedAgainst = value.validatedAgainst;

  if (!hasNonEmptyString(validatedAgainst, "definitionRef")) {
    return "INVALID";
  }
  if (!hasNonEmptyString(validatedAgainst, "semanticFingerprint")) {
    return "INVALID";
  }

  return "VALID";
}

export function isCanonicalValidatorClass(value: unknown): value is ValidatorClass {
  return typeof value === "string" && VALIDATOR_CLASSES.has(value as ValidatorClass);
}
