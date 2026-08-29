import { describe, expect, it } from "vitest";
import { VERSIONED_CONTRACTS } from "../src/index.js";
import * as publicApi from "../src/index.js";

/**
 * CSOC-C6-V48 is governance traceability only.
 * This is a definition-level / static metadata check, not a runtime domain test
 * and not a production API.
 */
describe("CSOC-C6-V48 governance traceability", () => {
  it("does not expose a production/domain API solely for V48", () => {
    expect(Object.keys(publicApi)).not.toContain("verifyC6V48");
    expect(Object.keys(publicApi)).not.toContain("CSOC_C6_V48");
    expect(VERSIONED_CONTRACTS).toEqual([
      "RepositoryObservation@v1",
      "PullRequestObservation@v1",
      "BranchRelationObservation@v1",
      "GateBoundObservation@v1",
      "GateFreshnessVerification@v1",
      "GateUseClaim@v1",
      "TerminalOutcome@v1"
    ]);
  });
});
