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

export type PatternMaturity =
  | "SOURCE_SPECIFIC_PATTERN"
  | "GENERALIZATION_CANDIDATE"
  | "PORTABLE_PATTERN_CANDIDATE"
  | "PROMOTED_KNOWLEDGE";

export interface SourceSnapshot {
  sourceArtifactId: string;
  sourceVersionOrDigest: string;
  sourceLocation: string;
  capturedAt: string;
  captureMethod: string;
  freshness: FreshnessState;
  authority: ArtifactAuthorityState;
}

export interface EvidenceClaim {
  claimId: string;
  normalizedClaim: string;
  source: SourceSnapshot;
  derivationClass: DerivationClass;
  verificationState: VerificationState;
  negativeEvidenceBasis?: string;
}

export interface ReverseEngineeringPack {
  sourceIdentity: SourceSnapshot;
  claims: EvidenceClaim[];
  unknowns: string[];
  patternMaturity: PatternMaturity;
  minimumReproductionModel: {
    behavioralStructure: string[];
    prohibitedExpressionCopy: true;
  };
}
