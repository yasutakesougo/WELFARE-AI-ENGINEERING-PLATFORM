import test from "node:test";
import assert from "node:assert/strict";
import { validateAdoptionRecord, validateRegistryResource, validateUiReferenceEvidence } from "./validator.mjs";

const validRecord = Object.freeze({
  problem: "Primary identity is hard to scan",
  researchQuery: "How do real products separate human labels from technical identifiers?",
  source: "mobbin",
  observationDate: "2026-08-31",
  accessMethod: "WEB",
  accessAvailability: "CONFIRMED",
  accessAvailabilityEvidence: "",
  referenceEvidence: "Synthetic reference note for a real-product hierarchy pattern",
  observedPattern: "Human-readable label first, technical identifier secondary",
  candidate: "Promote the human label and demote the technical id",
  existingComponentFit: "REUSE",
  adaptation: "Reuse the existing text hierarchy without changing business logic",
  rejectedAlternatives: "Do not add decorative cards or animation",
  accessibilityImpact: "Neutral to positive; no color-only semantics",
  dependencyImpact: "NONE",
  dependencyJustification: "",
  motionUsed: "NO",
  motionJustification: "",
  expectedFrictionReduction: "Reduce identity-decoding time",
  renderedAcceptance: "Primary label precedes technical id at supported viewports",
  humanEvidenceType: "NONE",
  humanAcceptance: ""
});

const codes = (errors) => errors.map((e) => e.code);

// UIR-A01
 test("valid CORE resource + WEB access passes", () => {
  const resource = { id: "x", name: "X", tier: "CORE", role: "PATTERN", preferredAccess: ["WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true };
  assert.deepEqual(validateRegistryResource(resource), []);
});

// UIR-A02/A03
 test("unsupported tier and access fail", () => {
  assert.ok(codes(validateRegistryResource({ id: "x", name: "X", tier: "BAD", role: "PATTERN", preferredAccess: ["NOPE"], fallbackAccess: [], observationDate: "2026-08-31", freshnessRequired: true })).includes("UNSUPPORTED_TIER"));
  assert.ok(codes(validateAdoptionRecord({ ...validRecord, accessMethod: "NOPE" })).includes("UNSUPPORTED_ACCESS_METHOD"));
});

// UIR-A04/A15/A16
 test("confirmed agent access requires separate availability evidence", () => {
  assert.ok(codes(validateAdoptionRecord({ ...validRecord, accessMethod: "MCP", accessAvailability: "CONFIRMED", accessAvailabilityEvidence: "" })).includes("ACCESS_AVAILABILITY_EVIDENCE_REQUIRED"));
  assert.deepEqual(validateAdoptionRecord({ ...validRecord, accessMethod: "MCP", accessAvailability: "CONFIRMED", accessAvailabilityEvidence: "MCP capability confirmed in current environment" }), []);
  assert.ok(codes(validateAdoptionRecord({ ...validRecord, accessMethod: "MCP", referenceEvidence: "pattern evidence only", accessAvailabilityEvidence: "" })).includes("ACCESS_AVAILABILITY_EVIDENCE_REQUIRED"));
});

// UIR-A05
 test("unconfirmed agent access may fall back without confirmation evidence", () => {
  assert.deepEqual(validateAdoptionRecord({ ...validRecord, accessMethod: "MCP", accessAvailability: "UNCONFIRMED" }), []);
});

// UIR-A06
 test("missing problem fails", () => {
  assert.ok(codes(validateAdoptionRecord({ ...validRecord, problem: "" })).includes("PROBLEM_REQUIRED"));
});

// UIR-A07/A08
 test("simulation cannot become human acceptance and HUMAN requires evidence", () => {
  assert.ok(codes(validateAdoptionRecord({ ...validRecord, humanEvidenceType: "SIMULATION", humanAcceptance: "accepted" })).includes("SIMULATION_NOT_HUMAN_ACCEPTANCE"));
  assert.deepEqual(validateAdoptionRecord({ ...validRecord, humanEvidenceType: "HUMAN", humanAcceptance: "Human reviewer accepted the hierarchy" }), []);
});

// UIR-A09/A19/A20/A21
 test("dependency semantics are deterministic and non-authorizing", () => {
  assert.ok(codes(validateAdoptionRecord({ ...validRecord, dependencyImpact: "NEW", dependencyJustification: "" })).includes("DEPENDENCY_JUSTIFICATION_REQUIRED"));
  assert.deepEqual(validateAdoptionRecord({ ...validRecord, dependencyImpact: "NEW", dependencyJustification: "Needed for a separately authorized implementation" }), []);
  assert.ok(codes(validateAdoptionRecord({ ...validRecord, dependencyImpact: "NONE", dependencyJustification: "unneeded text" })).includes("DEPENDENCY_JUSTIFICATION_FORBIDDEN"));
  assert.deepEqual(validateAdoptionRecord({ ...validRecord, dependencyImpact: "EXISTING", dependencyJustification: "Reuse existing primitive" }), []);
});

// UIR-A10/A17
 test("motion trigger is structural", () => {
  assert.ok(codes(validateAdoptionRecord({ ...validRecord, motionUsed: "YES", motionJustification: "" })).includes("MOTION_JUSTIFICATION_REQUIRED"));
  assert.deepEqual(validateAdoptionRecord({ ...validRecord, motionUsed: "NO", motionJustification: "" }), []);
});

// UIR-A11/A12
 test("reuse path passes and equal input yields equal output", () => {
  const a = validateUiReferenceEvidence({ adoptionRecord: validRecord });
  const b = validateUiReferenceEvidence({ adoptionRecord: { ...validRecord } });
  assert.deepEqual(a, b);
  assert.deepEqual(a.adoptionErrors, []);
  assert.deepEqual(a.registryErrors, []);
});

// UIR-A13/A14 are enforced by fixture contents and imports: node:test/node:assert + local modules only.
 test("fixture is synthetic and validator requires no network/MCP/Skill module", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("./validator.mjs", import.meta.url), "utf8"));
  assert.equal(/https?:\/\//.test(source), false);
  assert.equal(/fetch\s*\(/.test(source), false);
  assert.equal(/child_process|net|http|https/.test(source), false);
});
