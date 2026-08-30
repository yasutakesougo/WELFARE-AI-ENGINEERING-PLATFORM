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

function binding(overrides: Partial<SourceBinding> = {}): SourceBinding {
  return {
    sourceRef: "source-a",
    scopeRef: "scope-a",
    fieldOrDomainRef: "WHOLE_ASSET",
    authorityClaimRef: "claim-a",
    precedence: 1,
    conditionRef: "ALWAYS",
    effectiveFrom: "2026-01-01T00:00:00Z",
    effectiveTo: "UNKNOWN",
    state: "CURRENT",
    ...overrides,
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
    it("accepts one current source only when its authority claim is valid", () => {
      expect(
        evaluateCanonicality({
          bindings: [binding()],
          authorityByClaimRef: { "claim-a": "VALID" },
          referenceTime: NOW,
        }),
      ).toBe("CURRENT");
    });

    it("uses unique resolved precedence instead of an arbitrary winner", () => {
      expect(
        evaluateCanonicality({
          bindings: [binding(), binding({ sourceRef: "source-b", authorityClaimRef: "claim-b", precedence: 2 })],
          authorityByClaimRef: { "claim-a": "VALID", "claim-b": "VALID" },
          referenceTime: NOW,
        }),
      ).toBe("CURRENT");
    });

    it("fails closed on unresolved equal-precedence current claims", () => {
      expect(
        evaluateCanonicality({
          bindings: [binding(), binding({ sourceRef: "source-b", authorityClaimRef: "claim-b", precedence: 1 })],
          authorityByClaimRef: { "claim-a": "VALID", "claim-b": "VALID" },
          referenceTime: NOW,
        }),
      ).toBe("CONFLICT");
    });

    it("does not treat source existence as canonical authority", () => {
      expect(
        evaluateCanonicality({
          bindings: [binding()],
          authorityByClaimRef: { "claim-a": "INVALID" },
          referenceTime: NOW,
        }),
      ).toBe("UNVERIFIED");
    });
  });

  describe("stewardship decision authority", () => {
    it("requires pre-resolved valid authority and current temporal state", () => {
      expect(
        evaluateStewardshipDecisionValidity({
          decision,
          authorityResolution: "VALID",
          temporalCurrentness: "CURRENT",
        }),
      ).toBe("VALID");
    });

    it("does not convert role/decision presence into authority", () => {
      expect(
        evaluateStewardshipDecisionValidity({
          decision,
          authorityResolution: "UNKNOWN",
          temporalCurrentness: "CURRENT",
        }),
      ).toBe("UNKNOWN");
    });

    it("rejects a superseded decision even with otherwise valid authority", () => {
      expect(
        evaluateStewardshipDecisionValidity({
          decision,
          authorityResolution: "VALID",
          temporalCurrentness: "SUPERSEDED",
        }),
      ).toBe("INVALID");
    });
  });

  describe("purpose compatibility / use eligibility", () => {
    it("separates purpose compatibility from access/execution authority", () => {
      expect(
        evaluateUseEligibility({
          purposeApproved: true,
          consumerAuthorized: true,
          scopeCompatible: true,
          sensitivityCurrentness: "CURRENT",
          authorityResolution: "UNKNOWN",
          bindingCurrentness: "CURRENT",
        }),
      ).toBe("UNKNOWN");
    });

    it("returns eligible only when all authority-sensitive dimensions are current and valid", () => {
      expect(
        evaluateUseEligibility({
          purposeApproved: true,
          consumerAuthorized: true,
          scopeCompatible: true,
          sensitivityCurrentness: "CURRENT",
          authorityResolution: "VALID",
          bindingCurrentness: "CURRENT",
        }),
      ).toBe("USE_ELIGIBLE");
    });

    it("returns ineligible on explicit denial", () => {
      expect(
        evaluateUseEligibility({
          purposeApproved: true,
          consumerAuthorized: false,
          scopeCompatible: true,
          sensitivityCurrentness: "CURRENT",
          authorityResolution: "VALID",
          bindingCurrentness: "CURRENT",
        }),
      ).toBe("INELIGIBLE");
    });
  });

  describe("quality freshness", () => {
    it("invalidates past verification when the binding snapshot changes", () => {
      expect(
        evaluateQualityFreshness({
          verification,
          currentBindingSnapshotRef: "binding-2",
          schemaChanged: false,
          semanticsChanged: false,
          qualityRuleChanged: false,
          requiredScopeChanged: false,
        }),
      ).toBe("STALE");
    });

    it("invalidates verification after material policy/semantic changes", () => {
      expect(
        evaluateQualityFreshness({
          verification,
          currentBindingSnapshotRef: "binding-1",
          schemaChanged: false,
          semanticsChanged: true,
          qualityRuleChanged: false,
          requiredScopeChanged: false,
        }),
      ).toBe("STALE");
    });

    it("fails closed when a change dimension is unknown", () => {
      expect(
        evaluateQualityFreshness({
          verification,
          currentBindingSnapshotRef: "binding-1",
          schemaChanged: "UNKNOWN",
          semanticsChanged: false,
          qualityRuleChanged: false,
          requiredScopeChanged: false,
        }),
      ).toBe("UNKNOWN");
    });
  });

  describe("derived data / canonical promotion", () => {
    it("rejects implicit canonical promotion", () => {
      expect(
        evaluateCanonicalPromotionEligibility({
          derivation,
          explicitApprovalDecisionValidity: "INVALID",
        }),
      ).toBe("INELIGIBLE");
    });

    it("allows eligibility only with an explicit valid approval decision", () => {
      expect(
        evaluateCanonicalPromotionEligibility({
          derivation,
          explicitApprovalDecisionValidity: "VALID",
        }),
      ).toBe("ELIGIBLE");
    });
  });

  describe("lifecycle boundary", () => {
    it("never turns disposal eligibility into deletion authority", () => {
      expect(evaluateLifecycleBoundary("DISPOSAL_ELIGIBLE")).toEqual({
        state: "DISPOSAL_ELIGIBLE",
        deletionAuthority: "INVALID",
      });
    });
  });

  describe("reconciliation", () => {
    it("classifies drift without creating repair authority", () => {
      expect(
        evaluateReconciliation({
          values: ["a", "b"],
          complete: true,
          explicitConflict: false,
        }),
      ).toBe("DRIFT_DETECTED");
    });

    it("distinguishes incomplete and unknown", () => {
      expect(evaluateReconciliation({ values: ["a"], complete: false, explicitConflict: false })).toBe("INCOMPLETE");
      expect(evaluateReconciliation({ values: ["UNKNOWN"], complete: true, explicitConflict: false })).toBe("UNKNOWN");
    });
  });

  describe("sensitivity classification currentness", () => {
    it("keeps a fully evidenced unchanged classification current", () => {
      expect(
        evaluateSensitivityCurrentness({
          classification,
          policyVersionChanged: false,
          bindingMateriallyChanged: false,
          decisionSuperseded: false,
        }),
      ).toBe("CURRENT");
    });

    it("marks prior classification stale after policy change", () => {
      expect(
        evaluateSensitivityCurrentness({
          classification,
          policyVersionChanged: true,
          bindingMateriallyChanged: false,
          decisionSuperseded: false,
        }),
      ).toBe("STALE");
    });

    it("marks classification bound to a superseded decision as superseded", () => {
      expect(
        evaluateSensitivityCurrentness({
          classification,
          policyVersionChanged: false,
          bindingMateriallyChanged: false,
          decisionSuperseded: true,
        }),
      ).toBe("SUPERSEDED");
    });

    it("fails closed when classification provenance is missing", () => {
      expect(
        evaluateSensitivityCurrentness({
          classification: { ...classification, classificationDecisionRef: "UNKNOWN" },
          policyVersionChanged: false,
          bindingMateriallyChanged: false,
          decisionSuperseded: false,
        }),
      ).toBe("UNKNOWN");
    });
  });

  describe("temporal / historical currentness", () => {
    it("accepts an effective current record", () => {
      expect(
        evaluateTemporalCurrentness({
          effectiveFrom: "2026-08-01T00:00:00Z",
          effectiveTo: "UNKNOWN",
          supersededByRef: "NONE",
          temporalState: "CURRENT",
          referenceTime: NOW,
        }),
      ).toBe("CURRENT");
    });

    it("rejects expired historical evidence as current", () => {
      expect(
        evaluateTemporalCurrentness({
          effectiveFrom: "2026-01-01T00:00:00Z",
          effectiveTo: "2026-08-01T00:00:00Z",
          supersededByRef: "NONE",
          temporalState: "HISTORICAL",
          referenceTime: NOW,
        }),
      ).toBe("HISTORICAL");
    });

    it("rejects superseded source bindings as current", () => {
      expect(
        evaluateTemporalCurrentness({
          effectiveFrom: "2026-01-01T00:00:00Z",
          effectiveTo: "UNKNOWN",
          supersededByRef: "binding-new",
          temporalState: "SUPERSEDED",
          referenceTime: NOW,
        }),
      ).toBe("SUPERSEDED");
    });

    it("rejects future-effective records", () => {
      expect(
        evaluateTemporalCurrentness({
          effectiveFrom: "2026-09-01T00:00:00Z",
          effectiveTo: "UNKNOWN",
          supersededByRef: "NONE",
          temporalState: "CURRENT",
          referenceTime: NOW,
        }),
      ).toBe("NOT_YET_EFFECTIVE");
    });

    it("fails closed when temporal basis is missing", () => {
      expect(
        evaluateTemporalCurrentness({
          effectiveFrom: "UNKNOWN",
          effectiveTo: "UNKNOWN",
          supersededByRef: "NONE",
          temporalState: "UNKNOWN",
          referenceTime: NOW,
        }),
      ).toBe("UNKNOWN");
    });
  });
});
