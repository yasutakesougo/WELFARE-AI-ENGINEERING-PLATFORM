export type UnderstandingAssessmentState =
  | "NOT_REQUIRED"
  | "PENDING"
  | "SUFFICIENT"
  | "INSUFFICIENT"
  | "CONTRADICTORY"
  | "STALE"
  | "UNKNOWN";

export type ApplicabilityResult = "REQUIRED" | "NOT_REQUIRED" | "UNKNOWN";
export type MaterialityResult = "NON_MATERIAL" | "MATERIAL" | "UNKNOWN";
export type StructuralValidationResult = "VALID" | "INVALID" | "UNKNOWN";

export type ValidatorClass =
  | "DETERMINISTIC_VALIDATOR"
  | "INDEPENDENT_HUMAN_REVIEWER"
  | "MODEL_ASSISTED_VALIDATOR";

export type ResponseMode =
  | "HUMAN_FREEFORM_EXPLANATION"
  | "HUMAN_CORRECTED_AI_SUMMARY"
  | "HUMAN_VERIFIED_STRUCTURED_ANSWER"
  | "LIVE_QUESTION_RESPONSE";

export type UnderstandingDebtClass =
  | "MISSING"
  | "STALE"
  | "CONTRADICTORY"
  | "UNEXPLAINED_DECISION"
  | "ORPHAN_RATIONALE";

export type UnderstandingDebtRequiredAction =
  | "REFRESH"
  | "CLARIFY"
  | "RECONCILE"
  | "DOCUMENT"
  | "HUMAN_REVIEW";

export type RiskSignal =
  | "AUTHORITY_SENSITIVE_CHANGE"
  | "SECURITY_BOUNDARY_CHANGE"
  | "DATA_MODEL_CHANGE"
  | "IRREVERSIBLE_OR_DESTRUCTIVE_CHANGE"
  | "PRODUCTION_WRITE_CHANGE"
  | "CROSS_SYSTEM_INTEGRATION_CHANGE"
  | "MAJOR_ARCHITECTURE_CHANGE"
  | "NEW_RUNTIME_OR_EXECUTION_PATH"
  | "NEW_AUTOMATION_OR_AGENT_AUTHORITY_PATH"
  | "MATERIAL_BUSINESS_RULE_CHANGE"
  | "HIGH_RISK_WELFARE_LOGIC_CHANGE";

export type MaterialChangeSignal =
  | "AUTHORITY_BOUNDARY_CHANGE"
  | "SECURITY_BOUNDARY_CHANGE"
  | "DATA_MODEL_SEMANTIC_CHANGE"
  | "EXTERNAL_SIDE_EFFECT_CHANGE"
  | "ROLLBACK_OR_CONTAINMENT_CHANGE"
  | "SCOPE_EXPANSION"
  | "ARCHITECTURE_DECISION_REPLACEMENT"
  | "HIGH_RISK_BUSINESS_RULE_CHANGE"
  | "TARGET_BINDING_CHANGE"
  | "OPERATION_BINDING_CHANGE"
  | "TOOL_BINDING_CHANGE";

export interface ApplicabilityEvaluatorInput {
  workstreamIdentity: string;
  changeIdentity: string;
  riskPolicyVersion: string;
  explicitRiskSignals: RiskSignal[];
  existingRiskLane: string | null;
  evidenceRefs: string[];
  explicitlyLowRiskNonGoverned?: boolean;
  classificationEvidenceComplete: boolean;
}

export interface MaterialityEvaluatorInput {
  workstreamIdentity: string;
  changeIdentity: string;
  explicitMaterialSignals: MaterialChangeSignal[];
  explicitlyNonMaterial: boolean;
  classificationEvidenceComplete: boolean;
  evidenceRefs: string[];
}

export interface UnderstandingEvidenceSubject {
  workstreamId: string;
  artifactRef: string;
  artifactDigest: string | "UNKNOWN";
  accountableSubjectRef: string;
  accountableRole: string;
  ownershipContextRef: string;
  gateContext: string;
}

export interface HumanResponseRef {
  questionId: string;
  responseRef: string;
  responseMode: ResponseMode;
}

export interface UnderstandingValidationRecord {
  validatorIdentity: string;
  validatorClass: ValidatorClass;
  consistencyState: "SUFFICIENT" | "INSUFFICIENT" | "CONTRADICTORY" | "UNKNOWN";
  contradictions: string[];
  missingConcepts: string[];
  evidenceRefs: string[];
}

export interface UnderstandingEvidenceRecord {
  understandingCheckId: string;
  subject: UnderstandingEvidenceSubject;
  understandingPolicyVersion: string;
  questionSetVersion: string;
  applicabilityDecisionRef: string;
  riskClass: string;
  requiredQuestions: string[];
  humanResponses: HumanResponseRef[];
  validation: UnderstandingValidationRecord;
  assessmentDecisionRef: string;
  assessmentReason: string;
  state: UnderstandingAssessmentState;
  validatedAt: string;
  validatedAgainst: {
    definitionRef: string;
    scopeRef: string | null;
    implementationRef: string | null;
    currentStateRef: string | null;
    semanticFingerprint: string | "UNKNOWN";
  };
  invalidatedBy: string[];
}

export interface UnderstandingAssessmentDecision {
  decisionRef: string;
  state: UnderstandingAssessmentState;
  basisEvidenceRefs: string[];
  validatorIdentity: string;
  validatorClass: ValidatorClass;
  decidedAt: string;
}

export interface NormalizedUnderstandingDebtObservation {
  understandingDebtId: string;
  workstreamId: string;
  debtClass: UnderstandingDebtClass;
  risk: "HIGH" | "MEDIUM" | "LOW";
  basis: string;
  evidenceRefs: string[];
  currentAssessmentState: UnderstandingAssessmentState;
  requiredAction: UnderstandingDebtRequiredAction;
  autoMutationAllowed: false;
}
