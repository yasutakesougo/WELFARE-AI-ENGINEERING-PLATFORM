import { describe, expect, it } from "vitest";
import {
  evaluateCanonicalPromotionEligibility,
  evaluateCanonicality,
  evaluateLifecycleBoundary,
  evaluateQualityFreshness,
  evaluateReconciliation,
  evaluateSensitivityCurrentness,
  evaluateStewardshipDecisionValidity,
  evaluateTemporalCurrentness,
  evaluateUseEligibility,
  type Derivation,
  type QualityVerification,
  type SensitivityClassification,
  type SourceBinding,
  type StewardshipDecision,
} from "../src/data_stewardship/index.js";

const NOW = "2026-08-30T12:00:00Z";
const FUTURE = "2027-01-01T00:00:00Z";

function binding(overrides: Partial<SourceBinding> = {}): SourceBinding {
  return {
    sourceRef: "source-a",
    scopeRef: "scope-a",
    fieldOrDomainRef: "WHOLE_ASSET",
    authorityClaimRef: "claim-a",
    precedence: 1,
    conditionRef: "ALWAYS",
    effectiveFrom: "2026-01-01T00:00:00Z",
    effectiveTo: FUTURE,
    state: "CURRENT",
    ...overrides,
  };
}

function canonicalInput(bindings: readonly SourceBinding[]) {
  return {
    bindings,
    authorityByClaimRef: { "claim-a": "VALID", "claim-b": "VALID", "claim-c": "VALID" } as const,
    referenceTime: NOW,
    targetScopeRef: "scope-a",
    targetFieldOrDomainRef: "WHOLE_ASSET" as const,
  };
}

const decision: StewardshipDecision = {
  decisionRef: "decision-a",
  decisionType: "CANONICAL_SOURCE_APPROVAL",
  subjectRef: "asset-a",
  decisionAuthorityRef: "authority-a",
  authorityBasisRef: "basis-a",
  decision: "APPROVED",
  decidedAt: "2026-08-01T00:00:00Z",
  effectiveFrom: "2026-08-01T00:00:00Z",
  effectiveTo: "UNKNOWN",
  supersedesDecisionRef: "NONE",
};

const verification: QualityVerification = {
  qualityPolicyRef: "quality-policy-a",
  qualityRuleVersion: "v1",
  verificationMethodRef: "method-a",
  validatorIdentityRef: "validator-a",
  validatorClass: "HUMAN",
  verifiedAgainstBindingSnapshotRef: "binding-1",
  verifiedAt: "2026-08-20T00:00:00Z",
  invalidationRuleRef: "invalidate-on-material-change",
  freshnessState: "CURRENT",
  result: "VERIFIED",
};

const classification: SensitivityClassification = {
  classification: "CONFIDENTIAL",
  policyRef: "policy-a",
  policyVersion: "v1",
  classificationDecisionRef: "classification-decision-a",
  reviewedAt: "2026-08-20T00:00:00Z",
  freshnessState: "CURRENT",
};

const derivation: Derivation = {
  sourceAssetRefs: ["asset-source"],
  sourceBindingSnapshotRefs: ["binding-source-1"],
  transformationRef: "transform-a",
  transformationVersion: "v1",
  producerIdentityRef: "system-a",
  producerClass: "SYSTEM",
  producedAt: "2026-08-20T00:00:00Z",
  derivedState: "CURRENT",
};

describe("WAEP-DATA-STEWARDSHIP-V1 Slice I-A", () => {
  describe("canonicality", () => {
    it("accepts one current source only when authority and temporal basis are valid", () => {
      expect(evaluateCanonicality(canonicalInput([binding()]))).toBe("CURRENT");
    });

    it("uses unique resolved precedence for the same canonical target", () => {
      expect(
        evaluateCanonicality(
          canonicalInput([binding(), binding({ sourceRef: "source-b", authorityClaimRef: "claim-b", precedence: 2 })]),
        ),
      ).toBe("CURRENT");
    });

    it("returns conflict for equal precedence claims on the same canonical target", () => {
      expect(
        evaluateCanonicality(
          canonicalInput([binding(), binding({ sourceRef: "source-b", authorityClaimRef: "claim-b", precedence: 1 })]),
        ),
      ).toBe("CONFLICT");
    });

    it("does not make different fields compete", () => {
      const bindings = [
        binding({ fieldOrDomainRef: "field-a" }),
        binding({ sourceRef: "source-b", authorityClaimRef: "claim-b", fieldOrDomainRef: "field-b", precedence: 1 }),
      ];
      expect(
        evaluateCanonicality({ ...canonicalInput(bindings), targetFieldOrDomainRef: "field-a" }),
      ).toBe("CURRENT");
      expect(
        evaluateCanonicality({ ...canonicalInput(bindings), targetFieldOrDomainRef: "field-b" }),
      ).toBe("CURRENT");
    });

    it("does not make different scopes compete", () => {
      const bindings = [
        binding({ scopeRef: "scope-a" }),
        binding({ sourceRef: "source-b", authorityClaimRef: "claim-b", scopeRef: "scope-b", precedence: 1 }),
      ];
      expect(evaluateCanonicality(canonicalInput(bindings))).toBe("CURRENT");
      expect(
        evaluateCanonicality({ ...canonicalInput(bindings), targetScopeRef: "scope-b" }),
      ).toBe("CURRENT");
    });

    it("fails closed when effectiveFrom is UNKNOWN", () => {
      expect(evaluateCanonicality(canonicalInput([binding({ effectiveFrom: "UNKNOWN" })]))).toBe("UNKNOWN");
    });

    it("fails closed when effectiveFrom is malformed", () => {
      expect(evaluateCanonicality(canonicalInput([binding({ effectiveFrom: "not-a-date" })]))).toBe("UNKNOWN");
    });

    it("fails closed when effectiveTo is malformed", () => {
      expect(evaluateCanonicality(canonicalInput([binding({ effectiveTo: "not-a-date" })]))).toBe("UNKNOWN");
    });

    it("fails closed when effectiveTo is UNKNOWN", () => {
      expect(evaluateCanonicality(canonicalInput([binding({ effectiveTo: "UNKNOWN" })]))).toBe("UNKNOWN");
    });

    it("does not treat source existence as canonical authority", () => {
      expect(
        evaluateCanonicality({ ...canonicalInput([binding()]), authorityByClaimRef: { "claim-a": "INVALID" } }),
      ).toBe("UNVERIFIED");
    });
  });

  describe("stewardship decision authority", () => {
    it("requires pre-resolved valid authority and current temporal state", () => {
      expect(evaluateStewardshipDecisionValidity({ decision, authorityResolution: "VALID", temporalCurrentness: "CURRENT" })).toBe("VALID");
    });
    it("does not convert decision presence into authority", () => {
      expect(evaluateStewardshipDecisionValidity({ decision, authorityResolution: "UNKNOWN", temporalCurrentness: "CURRENT" })).toBe("UNKNOWN");
    });
    it("rejects superseded decisions", () => {
      expect(evaluateStewardshipDecisionValidity({ decision, authorityResolution: "VALID", temporalCurrentness: "SUPERSEDED" })).toBe("INVALID");
    });
  });

  describe("purpose compatibility / use eligibility", () => {
    it("does not turn purpose compatibility into execution authority", () => {
      expect(evaluateUseEligibility({ purposeApproved: true, consumerAuthorized: true, scopeCompatible: true, sensitivityCurrentness: "CURRENT", authorityResolution: "UNKNOWN", bindingCurrentness: "CURRENT" })).toBe("UNKNOWN");
    });
    it("returns eligible only when all authority-sensitive dimensions pass", () => {
      expect(evaluateUseEligibility({ purposeApproved: true, consumerAuthorized: true, scopeCompatible: true, sensitivityCurrentness: "CURRENT", authorityResolution: "VALID", bindingCurrentness: "CURRENT" })).toBe("USE_ELIGIBLE");
    });
    it("returns ineligible on explicit denial", () => {
      expect(evaluateUseEligibility({ purposeApproved: true, consumerAuthorized: false, scopeCompatible: true, sensitivityCurrentness: "CURRENT", authorityResolution: "VALID", bindingCurrentness: "CURRENT" })).toBe("INELIGIBLE");
    });
  });

  describe("quality freshness", () => {
    it("invalidates verification when the binding snapshot changes", () => {
      expect(evaluateQualityFreshness({ verification, currentBindingSnapshotRef: "binding-2", schemaChanged: false, semanticsChanged: false, qualityRuleChanged: false, requiredScopeChanged: false })).toBe("STALE");
    });
    it("invalidates verification after material semantic change", () => {
      expect(evaluateQualityFreshness({ verification, currentBindingSnapshotRef: "binding-1", schemaChanged: false, semanticsChanged: true, qualityRuleChanged: false, requiredScopeChanged: false })).toBe("STALE");
    });
    it("fails closed on unknown change dimensions", () => {
      expect(evaluateQualityFreshness({ verification, currentBindingSnapshotRef: "binding-1", schemaChanged: "UNKNOWN", semanticsChanged: false, qualityRuleChanged: false, requiredScopeChanged: false })).toBe("UNKNOWN");
    });
  });

  describe("derived data / canonical promotion", () => {
    it("rejects implicit canonical promotion", () => {
      expect(evaluateCanonicalPromotionEligibility({ derivation, explicitApprovalDecisionValidity: "INVALID" })).toBe("INELIGIBLE");
    });
    it("allows eligibility only with an explicit valid approval", () => {
      expect(evaluateCanonicalPromotionEligibility({ derivation, explicitApprovalDecisionValidity: "VALID" })).toBe("ELIGIBLE");
    });
  });

  describe("lifecycle boundary", () => {
    it("never turns disposal eligibility into deletion authority", () => {
      expect(evaluateLifecycleBoundary("DISPOSAL_ELIGIBLE")).toEqual({ state: "DISPOSAL_ELIGIBLE", deletionAuthority: "INVALID" });
    });
  });

  describe("reconciliation", () => {
    it("classifies drift without repair authority", () => {
      expect(evaluateReconciliation({ values: ["a", "b"], complete: true, explicitConflict: false })).toBe("DRIFT_DETECTED");
    });
    it("distinguishes incomplete and unknown", () => {
      expect(evaluateReconciliation({ values: ["a"], complete: false, explicitConflict: false })).toBe("INCOMPLETE");
      expect(evaluateReconciliation({ values: ["UNKNOWN"], complete: true, explicitConflict: false })).toBe("UNKNOWN");
    });
  });

  describe("sensitivity classification currentness", () => {
    it("keeps a fully evidenced classification current only when the freshness rule is current", () => {
      expect(evaluateSensitivityCurrentness({ classification, policyVersionChanged: false, bindingMateriallyChanged: false, decisionSuperseded: false, freshnessRuleResult: "CURRENT" })).toBe("CURRENT");
    });
    it("marks classification stale when the freshness rule expires", () => {
      expect(evaluateSensitivityCurrentness({ classification, policyVersionChanged: false, bindingMateriallyChanged: false, decisionSuperseded: false, freshnessRuleResult: "STALE" })).toBe("STALE");
    });
    it("fails closed when freshness rule resolution is unknown", () => {
      expect(evaluateSensitivityCurrentness({ classification, policyVersionChanged: false, bindingMateriallyChanged: false, decisionSuperseded: false, freshnessRuleResult: "UNKNOWN" })).toBe("UNKNOWN");
    });
    it("marks prior classification stale after policy change", () => {
      expect(evaluateSensitivityCurrentness({ classification, policyVersionChanged: true, bindingMateriallyChanged: false, decisionSuperseded: false, freshnessRuleResult: "CURRENT" })).toBe("STALE");
    });
    it("marks superseded classification as superseded", () => {
      expect(evaluateSensitivityCurrentness({ classification, policyVersionChanged: false, bindingMateriallyChanged: false, decisionSuperseded: true, freshnessRuleResult: "CURRENT" })).toBe("SUPERSEDED");
    });
    it("fails closed when provenance is missing", () => {
      expect(evaluateSensitivityCurrentness({ classification: { ...classification, classificationDecisionRef: "UNKNOWN" }, policyVersionChanged: false, bindingMateriallyChanged: false, decisionSuperseded: false, freshnessRuleResult: "CURRENT" })).toBe("UNKNOWN");
    });
  });

  describe("temporal / historical currentness", () => {
    it("accepts an effective current record", () => {
      expect(evaluateTemporalCurrentness({ effectiveFrom: "2026-08-01T00:00:00Z", effectiveTo: "UNKNOWN", supersededByRef: "NONE", temporalState: "CURRENT", referenceTime: NOW })).toBe("CURRENT");
    });
    it("rejects expired historical evidence", () => {
      expect(evaluateTemporalCurrentness({ effectiveFrom: "2026-01-01T00:00:00Z", effectiveTo: "2026-08-01T00:00:00Z", supersededByRef: "NONE", temporalState: "HISTORICAL", referenceTime: NOW })).toBe("HISTORICAL");
    });
    it("rejects superseded records", () => {
      expect(evaluateTemporalCurrentness({ effectiveFrom: "2026-01-01T00:00:00Z", effectiveTo: "UNKNOWN", supersededByRef: "binding-new", temporalState: "SUPERSEDED", referenceTime: NOW })).toBe("SUPERSEDED");
    });
    it("rejects future-effective records", () => {
      expect(evaluateTemporalCurrentness({ effectiveFrom: "2026-09-01T00:00:00Z", effectiveTo: "UNKNOWN", supersededByRef: "NONE", temporalState: "CURRENT", referenceTime: NOW })).toBe("NOT_YET_EFFECTIVE");
    });
    it("fails closed when temporal basis is missing", () => {
      expect(evaluateTemporalCurrentness({ effectiveFrom: "UNKNOWN", effectiveTo: "UNKNOWN", supersededByRef: "NONE", temporalState: "UNKNOWN", referenceTime: NOW })).toBe("UNKNOWN");
    });
  });
});
