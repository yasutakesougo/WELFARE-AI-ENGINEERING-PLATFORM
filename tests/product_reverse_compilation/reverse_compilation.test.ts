import { describe, expect, it } from "vitest";
import type { EvidenceClaim, SourceSnapshot } from "../../src/product_reverse_compilation/model.js";
import {
  buildReverseEngineeringPack,
  canPersistSource,
  capPatternMaturity,
  createClaim,
} from "../../src/product_reverse_compilation/reverse_compilation.js";

const source: SourceSnapshot = {
  sourceArtifactId: "source-1",
  sourceVersionOrDigest: "sha256:abc",
  sourceLocation: "README.md#workflow",
  capturedAt: "2026-08-31T00:00:00Z",
  captureMethod: "PUBLIC_SOURCE_REPOSITORY",
  freshness: "CURRENT",
  authority: "PUBLIC",
};

const observedClaim: EvidenceClaim = {
  claimId: "claim-1",
  normalizedClaim: "review is required before merge",
  source,
  generatorId: "generator-a",
  derivationClass: "OBSERVED",
  verificationState: "VERIFIED",
  validationEvidence: {
    validatorId: "validator-b",
    validatorClass: "SOURCE_CROSS_CHECK",
    validationBasis: "exact source snapshot and location",
  },
};

describe("product reverse compilation guardrails", () => {
  it("keeps derivation, verification, and freshness as separate axes", () => {
    const claim = createClaim(observedClaim);
    expect(claim.derivationClass).toBe("OBSERVED");
    expect(claim.verificationState).toBe("VERIFIED");
    expect(claim.source.freshness).toBe("CURRENT");
  });

  it("preserves conflict as an explicit verification state", () => {
    const claim = createClaim({
      ...observedClaim,
      verificationState: "CONFLICT",
      validationEvidence: undefined,
    });
    expect(claim.verificationState).toBe("CONFLICT");
  });

  it("fails closed for unknown or sensitive artifact authority", () => {
    expect(canPersistSource("AUTHORITY_UNKNOWN")).toBe(false);
    expect(canPersistSource("SENSITIVE_DATA_PRESENT")).toBe(false);
    expect(canPersistSource("PUBLIC")).toBe(true);
  });

  it("prevents speculative inference from becoming VERIFIED", () => {
    expect(() => createClaim({ ...observedClaim, derivationClass: "SPECULATIVE_INFERENCE" })).toThrow(
      /speculative inference/,
    );
  });

  it("prevents generator self-validation", () => {
    expect(() =>
      createClaim({
        ...observedClaim,
        validationEvidence: {
          validatorId: "generator-a",
          validatorClass: "DETERMINISTIC_VALIDATOR",
          validationBasis: "self assertion",
        },
      }),
    ).toThrow(/self-validate/);
  });

  it("prevents model agreement from establishing external factual verification", () => {
    expect(() =>
      createClaim({
        ...observedClaim,
        requiresExternalFactualConfirmation: true,
        validationEvidence: {
          validatorId: "model-b",
          validatorClass: "INDEPENDENT_MODEL_REVIEWER",
          validationBasis: "model agreement",
        },
      }),
    ).toThrow(/model agreement/);
  });

  it("requires sufficient completeness for factual absence", () => {
    expect(() =>
      createClaim({
        ...observedClaim,
        normalizedClaim: "ABSENT: export capability",
        negativeEvidenceBasis: {
          searchedSources: ["docs"],
          searchScope: "public docs",
          completenessState: "PARTIAL",
        },
      }),
    ).toThrow(/SUFFICIENT completeness/);
  });

  it("caps automatic pattern maturity at GENERALIZATION_CANDIDATE", () => {
    expect(capPatternMaturity("PORTABLE_PATTERN_CANDIDATE")).toBe("GENERALIZATION_CANDIDATE");
    expect(capPatternMaturity("GENERALIZATION_CANDIDATE")).toBe("GENERALIZATION_CANDIDATE");
  });

  it("rejects direct Knowledge Promotion", () => {
    expect(() => capPatternMaturity("PROMOTED_KNOWLEDGE")).toThrow(
      /outside reverse-compilation authority/,
    );
  });

  it("rejects candidate provenance that does not resolve to a claim", () => {
    expect(() =>
      buildReverseEngineeringPack({
        sourceIdentity: source,
        claims: [observedClaim],
        designDecisionCandidates: [
          {
            candidateId: "decision-1",
            sourceClaimIds: ["missing-claim"],
            candidateDecision: "use controlled transition",
            derivationClass: "SUPPORTED_INFERENCE",
            verificationState: "UNVERIFIED",
          },
        ],
      }),
    ).toThrow(/existing claim ids/);
  });

  it("assembles behavioral abstraction without copied expression", () => {
    const pack = buildReverseEngineeringPack({
      sourceIdentity: source,
      claims: [observedClaim],
      patternCandidates: [
        {
          patternId: "pattern-1",
          title: "Controlled Change Lifecycle",
          problem: "unsafe state transition",
          context: ["reviewed change"],
          forces: ["speed", "safety"],
          solutionStructure: "proposal -> review -> verification -> transition",
          consequences: ["auditable transition"],
          failureModes: ["authority bypass"],
          applicability: ["controlled changes"],
          counterexamples: [],
          sourceClaimIds: ["claim-1"],
          maturity: "PORTABLE_PATTERN_CANDIDATE",
        },
      ],
      behavioralStructure: ["proposal", "review", "verification", "transition"],
    });

    expect(pack.minimumReproductionModel.prohibitedExpressionCopy).toBe(true);
    expect(pack.patternCandidates[0]?.maturity).toBe("GENERALIZATION_CANDIDATE");
  });
});
