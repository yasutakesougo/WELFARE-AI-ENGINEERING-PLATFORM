export type UnknownState = "UNKNOWN";
export type CurrentnessState =
  | "CURRENT"
  | "STALE"
  | "HISTORICAL"
  | "SUPERSEDED"
  | "NOT_YET_EFFECTIVE"
  | "UNKNOWN";

export type AssetKind = "SOURCE" | "DERIVED" | "PROJECTION" | "REFERENCE";
export type CanonicalityState = "CURRENT" | "CONFLICT" | "UNVERIFIED" | "UNKNOWN" | "SUPERSEDED";
export type SourceBindingState = "CURRENT" | "CANDIDATE" | "CONFLICT" | "UNAVAILABLE" | "SUPERSEDED" | "UNKNOWN";
export type DecisionType =
  | "SEMANTIC_APPROVAL"
  | "CANONICAL_SOURCE_APPROVAL"
  | "QUALITY_POLICY_APPROVAL"
  | "SENSITIVITY_CLASSIFICATION"
  | "PURPOSE_APPROVAL"
  | "LIFECYCLE_POLICY_APPROVAL"
  | "SUPERSESSION";
export type AuthorityResolution = "VALID" | "INVALID" | "UNKNOWN";
export type UseEligibility = "USE_ELIGIBLE" | "INELIGIBLE" | "UNKNOWN";
export type QualityResult = "VERIFIED" | "FAILED" | "INCOMPLETE" | "UNKNOWN";
export type LifecycleState =
  | "ACTIVE"
  | "RETAINED"
  | "ARCHIVED"
  | "SUPERSEDED"
  | "DISPOSAL_ELIGIBLE"
  | "DELETION_HOLD"
  | "UNKNOWN";
export type ReconciliationState = "CONSISTENT" | "DRIFT_DETECTED" | "CONFLICT" | "INCOMPLETE" | "UNKNOWN";
export type SensitivityCurrentness = "CURRENT" | "STALE" | "SUPERSEDED" | "UNKNOWN";

export interface BindingSnapshot {
  snapshotRef: string;
  schemaRef: string | "UNKNOWN";
  semanticDefinitionRef: string | "UNKNOWN";
  environmentRef: string | "UNKNOWN";
  scopeRef: string | "UNKNOWN";
  effectiveFrom: string | "UNKNOWN";
  observedAt: string | "UNKNOWN";
}

export interface SourceBinding {
  sourceRef: string;
  scopeRef: string | "UNKNOWN";
  fieldOrDomainRef: string | "WHOLE_ASSET";
  authorityClaimRef: string | "UNKNOWN";
  precedence: number | "UNKNOWN";
  conditionRef: string | "ALWAYS";
  effectiveFrom: string | "UNKNOWN";
  effectiveTo: string | "UNKNOWN";
  state: SourceBindingState;
}

export interface StewardshipDecision {
  decisionRef: string;
  decisionType: DecisionType;
  subjectRef: string;
  decisionAuthorityRef: string;
  authorityBasisRef: string | "UNKNOWN";
  decision: string;
  decidedAt: string;
  effectiveFrom: string | "UNKNOWN";
  effectiveTo: string | "UNKNOWN";
  supersedesDecisionRef: string | "NONE";
}

export interface QualityVerification {
  qualityPolicyRef: string;
  qualityRuleVersion: string;
  verificationMethodRef: string;
  validatorIdentityRef: string | "UNKNOWN";
  validatorClass: "HUMAN" | "SYSTEM" | "AGENT" | "UNKNOWN";
  verifiedAgainstBindingSnapshotRef: string;
  verifiedAt: string;
  invalidationRuleRef: string;
  freshnessState: "CURRENT" | "STALE" | "UNKNOWN";
  result: QualityResult;
}

export interface SensitivityClassification {
  classification: string | "UNKNOWN";
  policyRef: string | "UNKNOWN";
  policyVersion: string | "UNKNOWN";
  classificationDecisionRef: string | "UNKNOWN";
  reviewedAt: string | "UNKNOWN";
  freshnessState: "CURRENT" | "STALE" | "UNKNOWN";
}

export interface Derivation {
  sourceAssetRefs: readonly string[];
  sourceBindingSnapshotRefs: readonly string[];
  transformationRef: string;
  transformationVersion: string;
  producerIdentityRef: string | "UNKNOWN";
  producerClass: "HUMAN" | "SYSTEM" | "AGENT" | "UNKNOWN";
  producedAt: string;
  derivedState: "CURRENT" | "STALE" | "CONFLICT" | "UNKNOWN";
}

export interface TemporalState {
  effectiveFrom: string | "UNKNOWN";
  effectiveTo: string | "UNKNOWN";
  supersededByRef: string | "NONE";
  state: "CURRENT" | "HISTORICAL" | "SUPERSEDED" | "UNKNOWN";
}

export interface DataAsset {
  assetId: string;
  domain: string;
  assetKind: AssetKind;
  currentBindingSnapshot: BindingSnapshot;
  canonicalityState: CanonicalityState;
  sourceBindings: readonly SourceBinding[];
  semanticDefinitionRef: string | "UNKNOWN";
  stewardshipDecisionRefs: readonly string[];
  qualityVerification: QualityVerification;
  sensitivity: SensitivityClassification;
  lifecycleState: LifecycleState;
  reconciliationState: ReconciliationState;
  permittedPurposeRefs: readonly string[];
  consumerPolicyRefs: readonly string[];
  derivation: Derivation | null;
  temporalState: TemporalState;
}

export interface CanonicalityInput {
  bindings: readonly SourceBinding[];
  authorityByClaimRef: Readonly<Record<string, AuthorityResolution>>;
  referenceTime: string;
}

function parseTime(value: string | "UNKNOWN"): number | null {
  if (value === "UNKNOWN") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function bindingIsEffective(binding: SourceBinding, referenceTime: number): boolean | null {
  const from = parseTime(binding.effectiveFrom);
  const to = parseTime(binding.effectiveTo);
  if (binding.effectiveFrom !== "UNKNOWN" && from === null) return null;
  if (binding.effectiveTo !== "UNKNOWN" && to === null) return null;
  if (from !== null && referenceTime < from) return false;
  if (to !== null && referenceTime >= to) return false;
  return true;
}

export function evaluateCanonicality(input: CanonicalityInput): CanonicalityState {
  const referenceTime = parseTime(input.referenceTime);
  if (referenceTime === null) return "UNKNOWN";

  const current = input.bindings.filter((binding) => {
    const effective = bindingIsEffective(binding, referenceTime);
    return binding.state === "CURRENT" && effective === true;
  });

  if (input.bindings.some((binding) => binding.state === "CONFLICT")) return "CONFLICT";
  if (current.length === 0) {
    return input.bindings.some((binding) => binding.state === "SUPERSEDED") ? "SUPERSEDED" : "UNVERIFIED";
  }

  const unresolvedAuthority = current.some(
    (binding) =>
      binding.authorityClaimRef === "UNKNOWN" ||
      input.authorityByClaimRef[binding.authorityClaimRef] === undefined ||
      input.authorityByClaimRef[binding.authorityClaimRef] === "UNKNOWN",
  );
  if (unresolvedAuthority) return "UNKNOWN";

  const valid = current.filter(
    (binding) => binding.authorityClaimRef !== "UNKNOWN" && input.authorityByClaimRef[binding.authorityClaimRef] === "VALID",
  );
  if (valid.length === 0) return "UNVERIFIED";
  if (valid.length === 1) return "CURRENT";

  const numericPrecedence = valid.filter((binding) => typeof binding.precedence === "number");
  if (numericPrecedence.length !== valid.length) return "CONFLICT";
  const best = Math.min(...numericPrecedence.map((binding) => binding.precedence as number));
  return numericPrecedence.filter((binding) => binding.precedence === best).length === 1 ? "CURRENT" : "CONFLICT";
}

export interface DecisionValidityInput {
  decision: StewardshipDecision;
  authorityResolution: AuthorityResolution;
  temporalCurrentness: CurrentnessState;
}

export function evaluateStewardshipDecisionValidity(input: DecisionValidityInput): AuthorityResolution {
  if (input.authorityResolution === "UNKNOWN" || input.temporalCurrentness === "UNKNOWN") return "UNKNOWN";
  if (input.authorityResolution !== "VALID") return "INVALID";
  if (input.temporalCurrentness !== "CURRENT") return "INVALID";
  if (input.decision.authorityBasisRef === "UNKNOWN") return "UNKNOWN";
  return "VALID";
}

export interface UseEligibilityInput {
  purposeApproved: boolean | "UNKNOWN";
  consumerAuthorized: boolean | "UNKNOWN";
  scopeCompatible: boolean | "UNKNOWN";
  sensitivityCurrentness: SensitivityCurrentness;
  authorityResolution: AuthorityResolution;
  bindingCurrentness: CurrentnessState;
}

export function evaluateUseEligibility(input: UseEligibilityInput): UseEligibility {
  const values = [input.purposeApproved, input.consumerAuthorized, input.scopeCompatible] as const;
  if (values.includes(false) || input.authorityResolution === "INVALID") return "INELIGIBLE";
  if (
    values.includes("UNKNOWN") ||
    input.authorityResolution === "UNKNOWN" ||
    input.sensitivityCurrentness !== "CURRENT" ||
    input.bindingCurrentness !== "CURRENT"
  ) {
    return "UNKNOWN";
  }
  return "USE_ELIGIBLE";
}

export interface QualityFreshnessInput {
  verification: QualityVerification;
  currentBindingSnapshotRef: string;
  schemaChanged: boolean | "UNKNOWN";
  semanticsChanged: boolean | "UNKNOWN";
  qualityRuleChanged: boolean | "UNKNOWN";
  requiredScopeChanged: boolean | "UNKNOWN";
}

export function evaluateQualityFreshness(input: QualityFreshnessInput): "CURRENT" | "STALE" | "UNKNOWN" {
  const dimensions = [input.schemaChanged, input.semanticsChanged, input.qualityRuleChanged, input.requiredScopeChanged] as const;
  if (dimensions.includes("UNKNOWN")) return "UNKNOWN";
  if (input.verification.verifiedAgainstBindingSnapshotRef !== input.currentBindingSnapshotRef) return "STALE";
  if (dimensions.includes(true)) return "STALE";
  if (input.verification.result !== "VERIFIED" || input.verification.freshnessState !== "CURRENT") return "UNKNOWN";
  return "CURRENT";
}

export interface CanonicalPromotionInput {
  derivation: Derivation | null;
  explicitApprovalDecisionValidity: AuthorityResolution;
}

export function evaluateCanonicalPromotionEligibility(input: CanonicalPromotionInput): "ELIGIBLE" | "INELIGIBLE" | "UNKNOWN" {
  if (input.derivation === null) return "INELIGIBLE";
  if (input.derivation.derivedState !== "CURRENT") return input.derivation.derivedState === "UNKNOWN" ? "UNKNOWN" : "INELIGIBLE";
  if (input.explicitApprovalDecisionValidity === "UNKNOWN") return "UNKNOWN";
  return input.explicitApprovalDecisionValidity === "VALID" ? "ELIGIBLE" : "INELIGIBLE";
}

export interface LifecycleEvaluation {
  state: LifecycleState;
  deletionAuthority: AuthorityResolution;
}

export function evaluateLifecycleBoundary(state: LifecycleState): LifecycleEvaluation {
  return { state, deletionAuthority: "INVALID" };
}

export interface ReconciliationInput {
  values: readonly (string | "UNKNOWN")[];
  complete: boolean;
  explicitConflict: boolean;
}

export function evaluateReconciliation(input: ReconciliationInput): ReconciliationState {
  if (input.explicitConflict) return "CONFLICT";
  if (!input.complete) return "INCOMPLETE";
  if (input.values.length === 0 || input.values.includes("UNKNOWN")) return "UNKNOWN";
  return new Set(input.values).size === 1 ? "CONSISTENT" : "DRIFT_DETECTED";
}

export interface SensitivityCurrentnessInput {
  classification: SensitivityClassification;
  policyVersionChanged: boolean | "UNKNOWN";
  bindingMateriallyChanged: boolean | "UNKNOWN";
  decisionSuperseded: boolean | "UNKNOWN";
}

export function evaluateSensitivityCurrentness(input: SensitivityCurrentnessInput): SensitivityCurrentness {
  if (input.decisionSuperseded === true) return "SUPERSEDED";
  if (
    input.classification.classification === "UNKNOWN" ||
    input.classification.policyRef === "UNKNOWN" ||
    input.classification.policyVersion === "UNKNOWN" ||
    input.classification.classificationDecisionRef === "UNKNOWN" ||
    input.classification.reviewedAt === "UNKNOWN" ||
    input.policyVersionChanged === "UNKNOWN" ||
    input.bindingMateriallyChanged === "UNKNOWN" ||
    input.decisionSuperseded === "UNKNOWN"
  ) {
    return "UNKNOWN";
  }
  if (input.policyVersionChanged || input.bindingMateriallyChanged || input.classification.freshnessState === "STALE") return "STALE";
  if (input.classification.freshnessState !== "CURRENT") return "UNKNOWN";
  return "CURRENT";
}

export interface TemporalCurrentnessInput {
  effectiveFrom: string | "UNKNOWN";
  effectiveTo: string | "UNKNOWN";
  supersededByRef: string | "NONE";
  temporalState: TemporalState["state"];
  referenceTime: string;
}

export function evaluateTemporalCurrentness(input: TemporalCurrentnessInput): CurrentnessState {
  if (input.supersededByRef !== "NONE" || input.temporalState === "SUPERSEDED") return "SUPERSEDED";
  const referenceTime = parseTime(input.referenceTime);
  const from = parseTime(input.effectiveFrom);
  const to = parseTime(input.effectiveTo);
  if (referenceTime === null) return "UNKNOWN";
  if (input.effectiveFrom === "UNKNOWN" || from === null) return "UNKNOWN";
  if (input.effectiveTo !== "UNKNOWN" && to === null) return "UNKNOWN";
  if (referenceTime < from) return "NOT_YET_EFFECTIVE";
  if (to !== null && referenceTime >= to) return "HISTORICAL";
  if (input.temporalState === "HISTORICAL") return "HISTORICAL";
  if (input.temporalState === "UNKNOWN") return "UNKNOWN";
  return "CURRENT";
}
