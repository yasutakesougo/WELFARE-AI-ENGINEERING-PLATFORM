import { ACCESS_METHODS, TIERS, UI_REFERENCE_REGISTRY } from "./registry.mjs";

const ACCESS_AVAILABILITY = new Set(["CONFIRMED", "UNCONFIRMED"]);
const COMPONENT_FIT = new Set(["REUSE", "ADAPT", "NEW"]);
const DEPENDENCY_IMPACT = new Set(["NONE", "EXISTING", "NEW"]);
const HUMAN_EVIDENCE = new Set(["HUMAN", "SIMULATION", "NONE"]);
const MOTION_USED = new Set(["YES", "NO"]);
const AGENT_ACCESS = new Set(["MCP", "SKILL", "REGISTRY"]);

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function push(errors, code, message) {
  errors.push({ code, message });
}

export function validateRegistryResource(resource) {
  const errors = [];
  if (!nonEmpty(resource?.id)) push(errors, "RESOURCE_ID_REQUIRED", "id is required");
  if (!nonEmpty(resource?.name)) push(errors, "RESOURCE_NAME_REQUIRED", "name is required");
  if (!TIERS.includes(resource?.tier)) push(errors, "UNSUPPORTED_TIER", "tier is unsupported");
  if (!nonEmpty(resource?.role)) push(errors, "RESOURCE_ROLE_REQUIRED", "role is required");
  if (!Array.isArray(resource?.preferredAccess) || resource.preferredAccess.some((v) => !ACCESS_METHODS.includes(v))) push(errors, "UNSUPPORTED_ACCESS_METHOD", "preferredAccess contains unsupported access");
  if (!Array.isArray(resource?.fallbackAccess) || resource.fallbackAccess.some((v) => !ACCESS_METHODS.includes(v))) push(errors, "UNSUPPORTED_ACCESS_METHOD", "fallbackAccess contains unsupported access");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(resource?.observationDate ?? "")) push(errors, "OBSERVATION_DATE_REQUIRED", "observationDate must be YYYY-MM-DD");
  if (typeof resource?.freshnessRequired !== "boolean") push(errors, "FRESHNESS_REQUIRED_FLAG", "freshnessRequired must be boolean");
  return errors;
}

export function validateAdoptionRecord(record) {
  const errors = [];
  if (!nonEmpty(record?.problem)) push(errors, "PROBLEM_REQUIRED", "problem is required");
  if (!nonEmpty(record?.researchQuery)) push(errors, "RESEARCH_QUERY_REQUIRED", "researchQuery is required");
  if (!nonEmpty(record?.source)) push(errors, "SOURCE_REQUIRED", "source is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record?.observationDate ?? "")) push(errors, "OBSERVATION_DATE_REQUIRED", "observationDate must be YYYY-MM-DD");
  if (!ACCESS_METHODS.includes(record?.accessMethod)) push(errors, "UNSUPPORTED_ACCESS_METHOD", "accessMethod is unsupported");
  if (!ACCESS_AVAILABILITY.has(record?.accessAvailability)) push(errors, "UNSUPPORTED_ACCESS_AVAILABILITY", "accessAvailability is unsupported");
  if (!COMPONENT_FIT.has(record?.existingComponentFit)) push(errors, "UNSUPPORTED_COMPONENT_FIT", "existingComponentFit is unsupported");
  if (!DEPENDENCY_IMPACT.has(record?.dependencyImpact)) push(errors, "UNSUPPORTED_DEPENDENCY_IMPACT", "dependencyImpact is unsupported");
  if (!HUMAN_EVIDENCE.has(record?.humanEvidenceType)) push(errors, "UNSUPPORTED_HUMAN_EVIDENCE", "humanEvidenceType is unsupported");
  if (!MOTION_USED.has(record?.motionUsed)) push(errors, "UNSUPPORTED_MOTION_USED", "motionUsed is unsupported");

  if (AGENT_ACCESS.has(record?.accessMethod) && record?.accessAvailability === "CONFIRMED" && !nonEmpty(record?.accessAvailabilityEvidence)) {
    push(errors, "ACCESS_AVAILABILITY_EVIDENCE_REQUIRED", "confirmed agent access requires accessAvailabilityEvidence");
  }

  if (!nonEmpty(record?.referenceEvidence)) push(errors, "REFERENCE_EVIDENCE_REQUIRED", "referenceEvidence is required");
  if (!nonEmpty(record?.observedPattern)) push(errors, "OBSERVED_PATTERN_REQUIRED", "observedPattern is required");
  if (!nonEmpty(record?.candidate)) push(errors, "CANDIDATE_REQUIRED", "candidate is required");
  if (!nonEmpty(record?.adaptation)) push(errors, "ADAPTATION_REQUIRED", "adaptation is required");
  if (!nonEmpty(record?.accessibilityImpact)) push(errors, "ACCESSIBILITY_IMPACT_REQUIRED", "accessibilityImpact is required");
  if (!nonEmpty(record?.expectedFrictionReduction)) push(errors, "FRICTION_REDUCTION_REQUIRED", "expectedFrictionReduction is required");
  if (!nonEmpty(record?.renderedAcceptance)) push(errors, "RENDERED_ACCEPTANCE_REQUIRED", "renderedAcceptance is required");

  if (record?.dependencyImpact === "NEW" && !nonEmpty(record?.dependencyJustification)) {
    push(errors, "DEPENDENCY_JUSTIFICATION_REQUIRED", "new dependency requires dependencyJustification");
  }
  if (record?.dependencyImpact === "NONE" && nonEmpty(record?.dependencyJustification)) {
    push(errors, "DEPENDENCY_JUSTIFICATION_FORBIDDEN", "dependencyJustification must be empty when dependencyImpact is NONE");
  }

  if (record?.motionUsed === "YES" && !nonEmpty(record?.motionJustification)) {
    push(errors, "MOTION_JUSTIFICATION_REQUIRED", "motion requires motionJustification");
  }

  if (record?.humanEvidenceType === "SIMULATION" && nonEmpty(record?.humanAcceptance)) {
    push(errors, "SIMULATION_NOT_HUMAN_ACCEPTANCE", "simulation cannot be represented as final human acceptance");
  }
  if (record?.humanEvidenceType === "NONE" && nonEmpty(record?.humanAcceptance)) {
    push(errors, "HUMAN_ACCEPTANCE_WITHOUT_EVIDENCE", "humanAcceptance requires HUMAN evidence type");
  }
  if (record?.humanEvidenceType === "HUMAN" && !nonEmpty(record?.humanAcceptance)) {
    push(errors, "HUMAN_ACCEPTANCE_REQUIRED", "HUMAN evidence type requires humanAcceptance evidence");
  }

  return errors;
}

export function validateRegistry(registry = UI_REFERENCE_REGISTRY) {
  return registry.flatMap((resource) => validateRegistryResource(resource).map((error) => ({ resourceId: resource?.id ?? null, ...error })));
}

export function validateUiReferenceEvidence({ registry = UI_REFERENCE_REGISTRY, adoptionRecord }) {
  return {
    registryErrors: validateRegistry(registry),
    adoptionErrors: validateAdoptionRecord(adoptionRecord),
  };
}
