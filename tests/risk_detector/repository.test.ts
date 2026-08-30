import { describe, expect, it } from "vitest";
import { MAX_DIFF_CHARS } from "../../src/risk_detector/materialize.js";
import { recoverGitBufferOverflow } from "../../src/risk_detector/repository.js";

describe("recoverGitBufferOverflow", () => {
  it("converts maxBuffer overflow into bounded truncated evidence", () => {
    const recovered = recoverGitBufferOverflow({
      code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER",
      stdout: "x".repeat(MAX_DIFF_CHARS + 100)
    });
    expect(recovered).toEqual({ stdout: "x".repeat(MAX_DIFF_CHARS), truncated: true });
  });

  it("does not swallow unrelated git failures", () => {
    expect(recoverGitBufferOverflow({ code: "ENOENT", message: "git missing" })).toBeUndefined();
  });
});
