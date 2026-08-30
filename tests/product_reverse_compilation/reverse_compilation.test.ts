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
  derivationClass: "OBSERVED",
  verificationState: "VERIFIED",
};

describe("product reverse compilation guardrails", () => {
  it("keeps derivation, verification, and freshness as separate axes", () => {
    const claim = createClaim(observedClaim);
    expect(claim.derivationClass).toBe("OBSERVED");
    expect(claim.verificationState).toBe("VERIFIED");
    expect(claim.source.freshness).toBe("CURRENT");
  });

  it("fails closed for unknown or sensitive artifact authority", () => {
    expect(canPersistSource("AUTHORITY_UNKNOWN")).toBe(false);
    expect(canPersistSource("SENSITIVE_DATA_PRESENT")).toBe(false);
    expect(canPersistSource("PUBLIC")).toBe(true);
  });

  it("prevents speculative inference from becoming VERIFIED", () => {
    expect(() =>
      createClaim({
        ...observedClaim,
        derivationClass: "SPECULATIVE_INFERENCE",
      }),
    ).toThrow(/speculative inference/);
  });

  it("requires completeness basis for negative claims", () => {
    expect(() =>
      createClaim({
        ...observedClaim,
        normalizedClaim: "ABSENT: export capability",
      }),
    ).toThrow(/negative claim/);
  });

  it("does not promote a single-product pattern to portable maturity", () => {
    expect(capPatternMaturity("PORTABLE_PATTERN_CANDIDATE", 1, true)).toBe(
      "GENERALIZATION_CANDIDATE",
    );
    expect(capPatternMaturity("PORTABLE_PATTERN_CANDIDATE", 2, true)).toBe(
      "PORTABLE_PATTERN_CANDIDATE",
    );
  });

  it("rejects direct Knowledge Promotion", () => {
    expect(() => capPatternMaturity("PROMOTED_KNOWLEDGE", 10, true)).toThrow(
      /outside reverse-compilation authority/,
    );
  });

  it("marks minimum reproduction as behavioral abstraction only", () => {
    const pack = buildReverseEngineeringPack({
      sourceIdentity: source,
      claims: [observedClaim],
      behavioralStructure: ["proposal", "review", "verification", "transition"],
    });

    expect(pack.minimumReproductionModel.prohibitedExpressionCopy).toBe(true);
    expect(pack.patternMaturity).toBe("SOURCE_SPECIFIC_PATTERN");
  });
});
