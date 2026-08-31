import { describe, expect, it } from "vitest";
import {
  buildRegistrySnapshot,
  computeEntryDigest,
  resolveRegistryEntry,
  type RegistryEntry,
} from "../../src/knowledge_registry/registry.js";

function makeEntry(): RegistryEntry {
  const base: Omit<RegistryEntry, "entryDigest"> = {
    schemaVersion: "1",
    registryEntryId: "REG-K-001-V1",
    knowledgeId: "K-001",
    knowledgeVersion: "1",
    title: "Synthetic portable knowledge",
    generalizedRule: "Unknown evidence must not silently become PASS.",
    classification: {
      classificationResultRef: "KCR-001",
      primaryClass: "ENGINEERING",
      portability: "PORTABLE_CANDIDATE",
      intakeOrigin: "INTERNAL_EVIDENCE",
    },
    promotion: {
      promotionDecisionRef: "PDR-001",
      decision: "PROMOTE",
      maturity: "L2",
      promotionEvidenceState: "CURRENT",
    },
    lifecycle: {
      knowledgeLifecycle: "ACTIVE",
      registryState: "ACTIVE",
    },
    evidence: {
      sourceEvidenceRefs: ["EVIDENCE-001"],
      targetEvidenceRefs: [],
      verificationState: "PASS",
      lastVerifiedAt: "2026-08-31T10:00:00+09:00",
    },
    applicability: {
      globalApplicabilityClaim: "NONE",
      targetAssessments: [],
    },
    consumption: {
      candidateUseModes: ["DISCOVERY", "REVIEW_INPUT", "APPLICABILITY_ASSESSMENT_INPUT"],
    },
    supersession: {
      supersededByKnowledgeVersion: null,
      compatibilityRef: null,
    },
  };
  return { ...base, entryDigest: computeEntryDigest(base) };
}

function snapshotFor(entry: RegistryEntry) {
  return buildRegistrySnapshot([entry], "2026-08-31T10:10:00+09:00");
}

describe("knowledge registry slice A", () => {
  it("produces the same snapshot digest regardless of entry input order", () => {
    const a = makeEntry();
    const bBase = { ...a, registryEntryId: "REG-K-002-V1", knowledgeId: "K-002", title: "Second synthetic rule" };
    const { entryDigest: _ignored, ...bWithoutDigest } = bBase;
    const b = { ...bWithoutDigest, entryDigest: computeEntryDigest(bWithoutDigest) };
    const left = buildRegistrySnapshot([a, b], "2026-08-31T10:10:00+09:00");
    const right = buildRegistrySnapshot([b, a], "2026-08-31T10:10:00+09:00");
    expect(left.snapshotDigest).toBe(right.snapshotDigest);
    expect(left.registrySnapshotId).toBe(right.registrySnapshotId);
  });

  it("allows non-target-sensitive discovery for a valid active entry", () => {
    const entry = makeEntry();
    const result = resolveRegistryEntry(entry, {
      registrySnapshot: snapshotFor(entry),
      targetContextRef: "target-a",
      requestedUseMode: "DISCOVERY",
      targetSensitive: false,
    }, "2026-08-31T10:11:00+09:00");
    expect(result.resolution).toBe("ELIGIBLE");
    expect(result.reasonCodes).toEqual([]);
  });

  it("fails closed when verification is UNKNOWN", () => {
    const original = makeEntry();
    const { entryDigest: _ignored, ...withoutDigest } = original;
    const changed = { ...withoutDigest, evidence: { ...withoutDigest.evidence, verificationState: "UNKNOWN" as const } };
    const entry = { ...changed, entryDigest: computeEntryDigest(changed) };
    const result = resolveRegistryEntry(entry, {
      registrySnapshot: snapshotFor(entry),
      targetContextRef: "target-a",
      requestedUseMode: "DISCOVERY",
      targetSensitive: false,
    }, "2026-08-31T10:12:00+09:00");
    expect(result.resolution).toBe("HOLD");
    expect(result.reasonCodes).toContain("VERIFICATION_NOT_PASS");
  });

  it("does not consume SUPERSEDED knowledge as an active input", () => {
    const original = makeEntry();
    const { entryDigest: _ignored, ...withoutDigest } = original;
    const changed = { ...withoutDigest, lifecycle: { ...withoutDigest.lifecycle, knowledgeLifecycle: "SUPERSEDED" as const } };
    const entry = { ...changed, entryDigest: computeEntryDigest(changed) };
    const result = resolveRegistryEntry(entry, {
      registrySnapshot: snapshotFor(entry),
      targetContextRef: "target-a",
      requestedUseMode: "DISCOVERY",
      targetSensitive: false,
    }, "2026-08-31T10:13:00+09:00");
    expect(result.resolution).toBe("INELIGIBLE");
    expect(result.reasonCodes).toContain("KNOWLEDGE_NOT_ACTIVE");
  });

  it("requires a verified applicable assessment for target-sensitive use", () => {
    const entry = makeEntry();
    const result = resolveRegistryEntry(entry, {
      registrySnapshot: snapshotFor(entry),
      targetContextRef: "target-a",
      requestedUseMode: "REVIEW_INPUT",
      targetSensitive: true,
    }, "2026-08-31T10:14:00+09:00");
    expect(result.resolution).toBe("HOLD");
    expect(result.reasonCodes).toContain("TARGET_ASSESSMENT_REQUIRED");
  });

  it("rejects an unlisted consumption mode without being downgraded to HOLD", () => {
    const entry = makeEntry();
    const result = resolveRegistryEntry(entry, {
      registrySnapshot: snapshotFor(entry),
      targetContextRef: "target-a",
      requestedUseMode: "POLICY_INPUT_CANDIDATE",
      targetSensitive: false,
    }, "2026-08-31T10:15:00+09:00");
    expect(result.resolution).toBe("INELIGIBLE");
    expect(result.reasonCodes).toContain("USE_MODE_NOT_ALLOWED");
    expect(result.reasonCodes).toContain("TARGET_ASSESSMENT_REQUIRED");
  });

  it("holds a tampered entry whose digest no longer matches", () => {
    const entry = makeEntry();
    const tampered = { ...entry, generalizedRule: "tampered" };
    const result = resolveRegistryEntry(tampered, {
      registrySnapshot: snapshotFor(entry),
      targetContextRef: "target-a",
      requestedUseMode: "DISCOVERY",
      targetSensitive: false,
    }, "2026-08-31T10:16:00+09:00");
    expect(result.resolution).toBe("HOLD");
    expect(result.reasonCodes).toContain("ENTRY_DIGEST_MISMATCH");
  });

  it("holds an entry that is not bound to the exact registry snapshot", () => {
    const entry = makeEntry();
    const emptySnapshot = buildRegistrySnapshot([], "2026-08-31T10:17:00+09:00");
    const result = resolveRegistryEntry(entry, {
      registrySnapshot: emptySnapshot,
      targetContextRef: "target-a",
      requestedUseMode: "DISCOVERY",
      targetSensitive: false,
    }, "2026-08-31T10:17:00+09:00");
    expect(result.resolution).toBe("HOLD");
    expect(result.reasonCodes).toContain("ENTRY_NOT_BOUND_TO_SNAPSHOT");
  });
});
