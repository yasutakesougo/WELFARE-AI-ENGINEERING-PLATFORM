import { describe, expect, it } from "vitest";
import {
  MAX_CHANGED_FILES,
  MAX_DIFF_CHARS,
  materializeRiskInput
} from "../../src/risk_detector/materialize.js";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

describe("materializeRiskInput", () => {
  it("binds repository actual diff to exact base and head sha", () => {
    const result = materializeRiskInput({
      mode: "REPOSITORY_COMMIT_RANGE",
      baseSha: SHA_A,
      headSha: SHA_B,
      changedFiles: ["b.ts", "a.ts"],
      diff: "diff --git a/a.ts b/a.ts\n+safe change"
    });
    expect(result.sourceIdentity).toEqual({ baseSha: SHA_A, headSha: SHA_B });
    expect(result.input.changedFiles).toEqual(["a.ts", "b.ts"]);
    expect(result.input.evidenceComplete).toBe(true);
  });

  it("rejects non-exact repository sha identities", () => {
    expect(() => materializeRiskInput({ mode: "REPOSITORY_COMMIT_RANGE", baseSha: "main", headSha: SHA_B, diff: "x" })).toThrow();
  });

  it("keeps preliminary input preliminary by excluding diff", () => {
    const result = materializeRiskInput({ mode: "PRELIMINARY_INPUT", intent: "docs only" });
    expect(result.input.diff).toBeUndefined();
  });

  it("marks binary or truncated material incomplete", () => {
    const result = materializeRiskInput({
      mode: "SUPPLIED_IMMUTABLE_DIFF",
      diff: "binary marker",
      binaryFiles: ["asset.bin"],
      truncated: true
    });
    expect(result.evidenceComplete).toBe(false);
    expect(result.limitations).toContain("BINARY_CONTENT_PRESENT");
    expect(result.limitations).toContain("TRUNCATED_DIFF");
  });

  it("bounds changed files and aggregate diff", () => {
    const result = materializeRiskInput({
      mode: "SUPPLIED_IMMUTABLE_DIFF",
      changedFiles: Array.from({ length: MAX_CHANGED_FILES + 1 }, (_, i) => `${i}.ts`),
      diff: "x".repeat(MAX_DIFF_CHARS + 1)
    });
    expect(result.evidenceComplete).toBe(false);
    expect(result.input.changedFiles).toHaveLength(MAX_CHANGED_FILES);
    expect(result.input.diff).toHaveLength(MAX_DIFF_CHARS);
  });
});
