import { describe, expect, it } from "vitest";
import { IMPLEMENTATION_ISOLATION_BOUNDARY } from "../src/index.js";

describe("Draft-15 isolation boundary", () => {
  it("declares the isolated implementation location", () => {
    expect(IMPLEMENTATION_ISOLATION_BOUNDARY).toBe(
      "packages/media-gateway-gpu-executor-poc"
    );
  });
});