import { describe, expect, it } from "vitest";
import { classifyRisk } from "../../src/risk_detector/classifier.js";
import { buildRiskEvidence } from "../../src/risk_detector/evidence.js";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

describe("buildRiskEvidence", () => {
  it("emits summary-only evidence with exact source identity", () => {
    const decision = classifyRisk({ diff: "safe docs change", evidenceComplete: true });
    const evidence = buildRiskEvidence(decision, {
      evidenceComplete: true,
      checkedAt: "2026-08-30T00:00:00.000Z",
      sourceIdentity: { baseSha: SHA_A, headSha: SHA_B }
    });
    expect(evidence.schemaVersion).toBe("RD-EVIDENCE-V1");
    expect(evidence.sourceIdentity).toEqual({ baseSha: SHA_A, headSha: SHA_B });
    expect(JSON.stringify(evidence)).not.toContain("safe docs change");
  });

  it("does not copy raw secret-bearing input into evidence", () => {
    const decision = classifyRisk({ diff: "token=abcdefghijklmnop", evidenceComplete: true });
    const evidence = buildRiskEvidence(decision, { evidenceComplete: true, checkedAt: "2026-08-30T00:00:00.000Z" });
    expect(JSON.stringify(evidence)).not.toContain("abcdefghijklmnop");
  });
});
