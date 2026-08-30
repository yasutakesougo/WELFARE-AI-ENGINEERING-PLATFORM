import { describe, expect, it } from "vitest";
import { classifyRisk } from "../../src/risk_detector/classifier.js";

describe("Risk Detector Slice A", () => {
  it("defaults ordinary code changes to FAST", () => {
    const result = classifyRisk({ changedFiles: ["src/ui/button.ts"], diff: "+ const label = 'save';" });
    expect(result.lane).toBe("FAST");
    expect(result.humanGateRequired).toBe(false);
    expect(result.classificationBasis).toBe("ACTUAL_DIFF");
  });

  it("classifies production deployment as GOVERNED", () => {
    const result = classifyRisk({ diff: "+ deploy production config" });
    expect(result.lane).toBe("GOVERNED");
    expect(result.riskSignals.some((signal) => signal.boundary === "R1_PRODUCTION")).toBe(true);
  });

  it("does not govern auth-related filenames without an effective authority change", () => {
    const result = classifyRisk({ changedFiles: ["src/auth/types.ts"], diff: "+ export type AuthState = 'signed-in';" });
    expect(result.lane).toBe("FAST");
  });

  it("classifies explicit permission grant as GOVERNED", () => {
    const result = classifyRisk({ intent: "grant admin permission to deployment role" });
    expect(result.lane).toBe("GOVERNED");
    expect(result.riskSignals.some((signal) => signal.boundary === "R2_AUTHORITY")).toBe(true);
  });

  it("blocks plaintext secret material", () => {
    const result = classifyRisk({ diff: "+ API_KEY=abcDEF0123456789" });
    expect(result.lane).toBe("BLOCKED");
    expect(result.blocked).toBe(true);
    expect(result.humanGateRequired).toBe(false);
  });

  it("classifies destructive changes as GOVERNED", () => {
    const result = classifyRisk({ intent: "truncate audit table after migration" });
    expect(result.lane).toBe("GOVERNED");
    expect(result.riskSignals.some((signal) => signal.boundary === "R4_DESTRUCTIVE")).toBe(true);
  });

  it("classifies significant paid API activity as GOVERNED", () => {
    const result = classifyRisk({ intent: "large-scale paid api calls for backfill" });
    expect(result.lane).toBe("GOVERNED");
    expect(result.riskSignals.some((signal) => signal.boundary === "R5_EXTERNAL_COST")).toBe(true);
  });

  it("escalates dangerous-boundary uncertainty when evidence is incomplete", () => {
    const result = classifyRisk({ intent: "review production behavior", evidenceComplete: false });
    expect(result.lane).toBe("GOVERNED");
    expect(result.riskSignals).toEqual([]);
  });

  it("keeps ordinary incomplete evidence FAST", () => {
    const result = classifyRisk({ intent: "rename local helper", evidenceComplete: false });
    expect(result.lane).toBe("FAST");
  });

  it("uses PRELIMINARY when no diff exists", () => {
    const result = classifyRisk({ intent: "add synthetic fixture" });
    expect(result.classificationBasis).toBe("PRELIMINARY");
  });
});
