import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildRegistrySnapshot,
  validateRegistryEntry,
  validateRegistrySnapshot,
  type RegistryEntry,
  type RegistrySnapshot,
} from "../../src/knowledge_registry/registry.js";

const seedIds = [
  "K-EIP001-EI001-C04",
  "K-EIP001-EI001-C05",
  "K-EIP001-EI002-C01",
  "K-EIP001-EI003-C01",
  "K-EIP001-EI003-C02",
  "K-EIP001-EI003-C03",
  "K-EIP001-EI004-C02",
  "K-EIP001-EI004-C03",
  "K-EIP001-EI005-C01",
  "K-EIP001-EI005-C03",
] as const;

function loadEntry(id: string): RegistryEntry {
  return JSON.parse(
    readFileSync(join(process.cwd(), "knowledge", "registry", "entries", `${id}.json`), "utf8"),
  ) as RegistryEntry;
}

function loadSnapshot(): RegistrySnapshot {
  return JSON.parse(
    readFileSync(join(process.cwd(), "knowledge", "registry", "snapshots", "eip-001-seed-v1.json"), "utf8"),
  ) as RegistrySnapshot;
}

describe("EIP-001 registry seed population", () => {
  it("contains exactly the reviewed ten seed entries with valid digests", () => {
    const entries = seedIds.map(loadEntry);
    expect(entries).toHaveLength(10);
    expect(entries.map((entry) => entry.knowledgeId).sort()).toEqual([...seedIds].sort());

    for (const entry of entries) {
      expect(validateRegistryEntry(entry)).toEqual([]);
      expect(entry.title).toBe(entry.knowledgeId);
      expect(entry.knowledgeVersion).toBe(entry.promotion.promotionDecisionRef);
      expect(entry.classification.primaryClass).toBe("ENGINEERING");
      expect(entry.classification.portability).toBe("PORTABLE_CANDIDATE");
      expect(entry.classification.intakeOrigin).toBe("EXTERNAL_INTELLIGENCE");
      expect(entry.promotion.decision).toBe("PROMOTE");
      expect(entry.promotion.maturity).toBe("L2");
      expect(entry.promotion.promotionEvidenceState).toBe("CURRENT");
      expect(entry.lifecycle.knowledgeLifecycle).toBe("ACTIVE");
      expect(entry.lifecycle.registryState).toBe("ACTIVE");
      expect(entry.evidence.targetEvidenceRefs).toEqual([]);
      expect(entry.applicability.globalApplicabilityClaim).toBe("NONE");
      expect(entry.applicability.targetAssessments).toEqual([]);
    }
  });

  it("binds the exact ten entries to a valid reproducible snapshot", () => {
    const entries = seedIds.map(loadEntry);
    const snapshot = loadSnapshot();

    expect(validateRegistrySnapshot(snapshot)).toEqual([]);
    expect(snapshot.members).toHaveLength(10);
    expect(snapshot.members.map((member) => member.knowledgeId).sort()).toEqual([...seedIds].sort());

    const rebuilt = buildRegistrySnapshot(entries, snapshot.capturedAt);
    expect(rebuilt.registrySnapshotId).toBe(snapshot.registrySnapshotId);
    expect(rebuilt.snapshotDigest).toBe(snapshot.snapshotDigest);
    expect(rebuilt.members).toEqual(snapshot.members);
  });
});
