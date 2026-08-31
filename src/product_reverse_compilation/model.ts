export type DerivationClass =
  | "OBSERVED"
  | "DETERMINISTIC_DERIVATION"
  | "SUPPORTED_INFERENCE"
  | "SPECULATIVE_INFERENCE"
  | "UNKNOWN";

export type VerificationState =
  | "UNVERIFIED"
  | "PARTIAL"
  | "VERIFIED"
  | "CONFLICT"
  | "UNKNOWN";

export type FreshnessState =
  | "CURRENT"
  | "STALE"
  | "SUPERSEDED"
  | "UNAVAILABLE"
  | "UNKNOWN";

export type ArtifactAuthorityState =
  | "PUBLIC"
  | "USER_AUTHORIZED_PRIVATE"
  | "CONFIDENTIAL_RESTRICTED"
  | "SENSITIVE_DATA_PRESENT"
  | "AUTHORITY_UNKNOWN";

export type ValidatorClass =
  | "DETERMINISTIC_VALIDATOR"
  | "INDEPENDENT_HUMAN_REVIEWER"
  | "INDEPENDENT_MODEL_REVIEWER"
  | "SOURCE_CROSS_CHECK";

export type PatternMaturity =
  | "SOURCE_SPECIFIC_PATTERN"
  | "GENERALIZATION_CANDIDATE"
  | "PORTABLE_PATTERN_CANDIDATE"
  | "PROMOTED_KNOWLEDGE";

export type EvidenceCompletenessState = "SUFFICIENT" | "PARTIAL" | "UNKNOWN";

export interface SourceSnapshot {
  sourceArtifactId: string;
  sourceVersionOrDigest: string;
  sourceLocation: string;
  capturedAt: string;
  captureMethod: string;
  freshness: FreshnessState;
  authority: ArtifactAuthorityState;
}

export interface ValidationEvidence {
  validatorId: string;
  validatorClass: ValidatorClass;
  validationBasis: string;
}

export interface NegativeEvidenceBasis {
  searchedSources: string[];
  searchScope: string;
  completenessState: EvidenceCompletenessState;
}

export interface EvidenceClaim {
  claimId: string;
  normalizedClaim: string;
  source: SourceSnapshot;
  generatorId: string;
  derivationClass: DerivationClass;
  verificationState: VerificationState;
  requiresExternalFactualConfirmation?: boolean;
  validationEvidence?: ValidationEvidence;
  negativeEvidenceBasis?: NegativeEvidenceBasis;
}

export interface DesignDecisionCandidate {
  candidateId: string;
  sourceClaimIds: string[];
  candidateDecision: string;
  derivationClass: DerivationClass;
  verificationState: VerificationState;
}

export interface PatternCandidate {
  patternId: string;
  title: string;
  problem: string;
  context: string[];
  forces: string[];
  solutionStructure: string;
  consequences: string[];
  failureModes: string[];
  applicability: string[];
  counterexamples: string[];
  sourceClaimIds: string[];
  maturity: PatternMaturity;
}

export interface ReverseEngineeringPack {
  sourceIdentity: SourceSnapshot;
  claims: EvidenceClaim[];
  designDecisionCandidates: DesignDecisionCandidate[];
  patternCandidates: PatternCandidate[];
  unknowns: string[];
  minimumReproductionModel: {
    behavioralStructure: string[];
    prohibitedExpressionCopy: true;
  };
}
