import type {
  ArtifactAuthorityState,
  EvidenceClaim,
  PatternMaturity,
  ReverseEngineeringPack,
  SourceSnapshot,
} from "./model.js";

const PERSISTENCE_BLOCKED = new Set<ArtifactAuthorityState>([
  "CONFIDENTIAL_RESTRICTED",
  "SENSITIVE_DATA_PRESENT",
  "AUTHORITY_UNKNOWN",
]);

export function canPersistSource(authority: ArtifactAuthorityState): boolean {
  return !PERSISTENCE_BLOCKED.has(authority);
}

export function createClaim(input: EvidenceClaim): EvidenceClaim {
  if (!input.claimId.trim() || !input.normalizedClaim.trim()) {
    throw new Error("claim identity and normalized claim are required");
  }

  if (!canPersistSource(input.source.authority)) {
    throw new Error("source authority does not permit persistent reverse-compilation output");
  }

  if (input.verificationState === "VERIFIED" && input.derivationClass === "SPECULATIVE_INFERENCE") {
    throw new Error("speculative inference cannot be VERIFIED");
  }

  if (input.normalizedClaim.startsWith("ABSENT:") && !input.negativeEvidenceBasis?.trim()) {
    throw new Error("negative claim requires evidence-completeness basis");
  }

  return input;
}

export function capPatternMaturity(
  requested: PatternMaturity,
  independentReplicationCount: number,
  counterexampleSearchCompleted: boolean,
): PatternMaturity {
  if (requested === "PROMOTED_KNOWLEDGE") {
    throw new Error("knowledge promotion is outside reverse-compilation authority");
  }

  if (requested === "PORTABLE_PATTERN_CANDIDATE") {
    if (independentReplicationCount < 2 || !counterexampleSearchCompleted) {
      return "GENERALIZATION_CANDIDATE";
    }
  }

  return requested;
}

export function buildReverseEngineeringPack(input: {
  sourceIdentity: SourceSnapshot;
  claims: EvidenceClaim[];
  unknowns?: string[];
  requestedPatternMaturity?: PatternMaturity;
  independentReplicationCount?: number;
  counterexampleSearchCompleted?: boolean;
  behavioralStructure?: string[];
}): ReverseEngineeringPack {
  if (!canPersistSource(input.sourceIdentity.authority)) {
    throw new Error("source must pass authorization/sensitivity gate before persistence");
  }

  const claims = input.claims.map(createClaim);
  const patternMaturity = capPatternMaturity(
    input.requestedPatternMaturity ?? "SOURCE_SPECIFIC_PATTERN",
    input.independentReplicationCount ?? 0,
    input.counterexampleSearchCompleted ?? false,
  );

  return {
    sourceIdentity: input.sourceIdentity,
    claims,
    unknowns: input.unknowns ?? [],
    patternMaturity,
    minimumReproductionModel: {
      behavioralStructure: input.behavioralStructure ?? [],
      prohibitedExpressionCopy: true,
    },
  };
}
