import type {
  ArtifactAuthorityState,
  DesignDecisionCandidate,
  EvidenceClaim,
  PatternCandidate,
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
  if (!input.claimId.trim() || !input.normalizedClaim.trim() || !input.generatorId.trim()) {
    throw new Error("claim identity, normalized claim, and generator identity are required");
  }

  if (!canPersistSource(input.source.authority)) {
    throw new Error("source authority does not permit persistent reverse-compilation output");
  }

  if (input.verificationState === "VERIFIED" && input.derivationClass === "SPECULATIVE_INFERENCE") {
    throw new Error("speculative inference cannot be VERIFIED");
  }

  if (input.verificationState === "VERIFIED") {
    const validation = input.validationEvidence;
    if (!validation?.validatorId.trim() || !validation.validationBasis.trim()) {
      throw new Error("VERIFIED claim requires validation evidence");
    }
    if (validation.validatorId === input.generatorId) {
      throw new Error("candidate generator cannot self-validate a VERIFIED claim");
    }
    if (
      input.requiresExternalFactualConfirmation &&
      validation.validatorClass === "INDEPENDENT_MODEL_REVIEWER"
    ) {
      throw new Error("model agreement cannot establish external factual verification");
    }
  }

  if (input.normalizedClaim.startsWith("ABSENT:")) {
    const basis = input.negativeEvidenceBasis;
    if (!basis?.searchScope.trim() || basis.searchedSources.length === 0) {
      throw new Error("negative claim requires explicit search scope and sources");
    }
    if (basis.completenessState !== "SUFFICIENT") {
      throw new Error("negative claim cannot assert absence without SUFFICIENT completeness");
    }
  }

  return input;
}

export function capPatternMaturity(requested: PatternMaturity): PatternMaturity {
  if (requested === "PROMOTED_KNOWLEDGE") {
    throw new Error("knowledge promotion is outside reverse-compilation authority");
  }
  if (requested === "PORTABLE_PATTERN_CANDIDATE") {
    return "GENERALIZATION_CANDIDATE";
  }
  return requested;
}

function assertClaimRefsExist(sourceClaimIds: string[], claimIds: ReadonlySet<string>): void {
  if (sourceClaimIds.length === 0 || sourceClaimIds.some((claimId) => !claimIds.has(claimId))) {
    throw new Error("candidate provenance must reference existing claim ids");
  }
}

function validateDesignDecision(
  candidate: DesignDecisionCandidate,
  claimIds: ReadonlySet<string>,
): DesignDecisionCandidate {
  assertClaimRefsExist(candidate.sourceClaimIds, claimIds);
  if (
    candidate.verificationState === "VERIFIED" &&
    candidate.derivationClass === "SPECULATIVE_INFERENCE"
  ) {
    throw new Error("speculative design decision cannot be VERIFIED");
  }
  return candidate;
}

function validatePatternCandidate(
  candidate: PatternCandidate,
  claimIds: ReadonlySet<string>,
): PatternCandidate {
  assertClaimRefsExist(candidate.sourceClaimIds, claimIds);
  return {
    ...candidate,
    maturity: capPatternMaturity(candidate.maturity),
  };
}

export function buildReverseEngineeringPack(input: {
  sourceIdentity: SourceSnapshot;
  claims: EvidenceClaim[];
  designDecisionCandidates?: DesignDecisionCandidate[];
  patternCandidates?: PatternCandidate[];
  unknowns?: string[];
  behavioralStructure?: string[];
}): ReverseEngineeringPack {
  if (!canPersistSource(input.sourceIdentity.authority)) {
    throw new Error("source must pass authorization/sensitivity gate before persistence");
  }

  const claims = input.claims.map(createClaim);
  const claimIds = new Set(claims.map((claim) => claim.claimId));
  const designDecisionCandidates = (input.designDecisionCandidates ?? []).map((candidate) =>
    validateDesignDecision(candidate, claimIds),
  );
  const patternCandidates = (input.patternCandidates ?? []).map((candidate) =>
    validatePatternCandidate(candidate, claimIds),
  );

  return {
    sourceIdentity: input.sourceIdentity,
    claims,
    designDecisionCandidates,
    patternCandidates,
    unknowns: input.unknowns ?? [],
    minimumReproductionModel: {
      behavioralStructure: input.behavioralStructure ?? [],
      prohibitedExpressionCopy: true,
    },
  };
}
