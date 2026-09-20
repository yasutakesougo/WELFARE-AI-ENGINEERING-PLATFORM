import { describe, expect, it } from "vitest";
import {
  createDefaultMaintenanceInput,
  createNotApplicableSubjectIdentity,
  createOptionalSubjectIdentity,
  createSubjectIdentity,
  decisionHold,
  decisionPending,
  decisionGo,
  evaluateMaintenanceReadiness,
  exactStopFacts,
  humanGateStateIdentityUnknown,
  humanGateStateRequiredNotConsumed,
  humanGateStateInvalidContradictory,
  type EvidenceFact,
  type MaintenanceReadinessInput,
  type SubjectIdentity,
} from "../../src/maintenance_readiness/index.js";

type CaseInput = Partial<MaintenanceReadinessInput> & Pick<MaintenanceReadinessInput, "currentSubject" | "evidenceSubject">;

function caseInput(overrides: Partial<MaintenanceReadinessInput> = {}): MaintenanceReadinessInput {
  return createDefaultMaintenanceInput({
    currentSubject: createSubjectIdentity(
      "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
      "2c1f79746780134298b7b1729c9447d33e1fffb2",
      "main",
      "refs/heads/main",
      "1.0.0",
      "maintenance-readiness-operational-profile",
    ),
    evidenceSubject: createSubjectIdentity(
      "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
      "2c1f79746780134298b7b1729c9447d33e1fffb2",
      "main",
      "refs/heads/main",
      "1.0.0",
      "maintenance-readiness-operational-profile",
    ),
    mandatoryReadinessFactsComplete: true,
    humanGateState: "REQUIRED / NOT CONSUMED",
    humanDecisionState: decisionPending(),
    humanGateIdentityRequiredForTransition: true,
    humanGateContradictionPreventsSafeNextAction: true,
    evidenceFacts: {
      mandatoryEvidenceCoverageComplete: true,
      evidence: [],
      operations: [],
      reviews: [],
    },
    readinessFacts: [],
    stopFacts: exactStopFacts(),
    ...overrides,
  });
}

describe("maintenance readiness operational profile", () => {
  it("CASE A: technical PASS with human decision pending", () => {
    const input = caseInput();
    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("PASS");
    expect(result.stop).toBe(true);
    expect(result.implementationAuthorized).toBe(false);
    expect(result.executionAuthorized).toBe(false);
  });

  it("CASE B: required exact SHA unknown", () => {
    const input = caseInput({
      currentSubject: createSubjectIdentity(
        "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
        null,
        "main",
        "refs/heads/main",
        "1.0.0",
        "maintenance-readiness-operational-profile",
      ),
      evidenceSubject: createSubjectIdentity(
        "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
        "2c1f79746780134298b7b1729c9447d33e1fffb2",
        "main",
        "refs/heads/main",
        "1.0.0",
        "maintenance-readiness-operational-profile",
      ),
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.identityComparison).toBe("UNKNOWN");
    expect(result.operationalState).toBe("UNKNOWN");
    expect(result.stop).toBe(true);
  });

  it("CASE C: mandatory verification FAILED blocks execution", () => {
    const input = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [{ kind: "FAILED", requirement: "MANDATORY" }],
        operations: [],
        reviews: [],
      },
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("BLOCKED");
    expect(result.stop).toBe(true);
  });

  it("CASE D-1: operation failed with STATE_DETERMINING_UNKNOWN", () => {
    const input = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [{ kind: "UNAVAILABLE", requirement: "MANDATORY" }],
        operations: [{ status: "FAILED", effect: "STATE_DETERMINING_UNKNOWN" }],
        reviews: [],
      },
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("UNKNOWN");
    expect(result.stop).toBe(true);
  });

  it("CASE D-2: operation failed with confirmed blocker", () => {
    const input = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [{ kind: "UNAVAILABLE", requirement: "MANDATORY" }],
        operations: [{ status: "FAILED", effect: "CONFIRMED_OPERATIONAL_BLOCKER" }],
        reviews: [],
      },
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("BLOCKED");
    expect(result.stop).toBe(true);
  });

  it("CASE D-3: optional failed tool is non-blocking", () => {
    const input = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [],
        operations: [{ status: "FAILED", effect: "NON_BLOCKING_LIMITATION" }],
        reviews: [],
      },
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("DEGRADED");
    expect(result.stop).toBe(false);
  });

  it("CASE E: optional supporting evidence unavailable is non-blocking", () => {
    const input = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [{ kind: "UNAVAILABLE", requirement: "OPTIONAL" }],
        operations: [],
        reviews: [],
      },
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("DEGRADED");
    expect(result.stop).toBe(false);
  });

  it("CASE F: explicit Human HOLD does not change technical PASS", () => {
    const input = caseInput({
      humanDecisionState: {
        humanDecisionRequired: true,
        pending: false,
        decision: "HOLD",
        goConsumed: false,
      },
      humanGateState: "REQUIRED / NOT CONSUMED",
      stopFacts: exactStopFacts(),
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("PASS");
    expect(result.humanDecisionState.decision).toBe("HOLD");
    expect(result.implementationAuthorized).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.stop).toBe(true);
  });

  it("precedence tests respect UNKNOWN > BLOCKED > DEGRADED > PASS", () => {
    const unknownInput = caseInput({
      mandatoryReadinessFactsComplete: false,
      evidenceFacts: { mandatoryEvidenceCoverageComplete: true, evidence: [], operations: [], reviews: [] },
    });
    expect(evaluateMaintenanceReadiness(unknownInput).operationalState).toBe("UNKNOWN");

    const blockedInput = caseInput({
      evidenceFacts: { mandatoryEvidenceCoverageComplete: true, evidence: [], operations: [{ status: "FAILED", effect: "CONFIRMED_OPERATIONAL_BLOCKER" }], reviews: [] },
    });
    expect(evaluateMaintenanceReadiness(blockedInput).operationalState).toBe("BLOCKED");

    const degradedInput = caseInput({
      evidenceFacts: { mandatoryEvidenceCoverageComplete: true, evidence: [], operations: [{ status: "FAILED", effect: "NON_BLOCKING_LIMITATION" }], reviews: [] },
    });
    expect(evaluateMaintenanceReadiness(degradedInput).operationalState).toBe("DEGRADED");

    const passInput = caseInput({
      evidenceFacts: { mandatoryEvidenceCoverageComplete: true, evidence: [], operations: [], reviews: [] },
      humanDecisionState: { humanDecisionRequired: false, pending: false, decision: null, goConsumed: false },
      humanGateState: "NOT REQUIRED",
    });
    expect(evaluateMaintenanceReadiness(passInput).operationalState).toBe("PASS");
  });

  it("covers the nine identity applicability pairings deterministically", () => {
    const requiredRequiredMatch = caseInput({
      currentSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
      evidenceSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(requiredRequiredMatch).identityComparison).toBe("MATCH");

    const requiredRequiredMismatch = caseInput({
      currentSubject: createSubjectIdentity("repo", "sha-1", "main", "pr", "rev", "review"),
      evidenceSubject: createSubjectIdentity("repo", "sha-2", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(requiredRequiredMismatch).identityComparison).toBe("MISMATCH");

    const requiredOptionalUnknown = caseInput({
      currentSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha", null, "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(requiredOptionalUnknown).identityComparison).toBe("UNKNOWN");

    const optionalOptionalUnknown = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", null, "main", "pr", "rev", "review"),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(optionalOptionalUnknown).identityComparison).toBe("UNKNOWN");

    const optionalOptionalMismatch = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", "sha-1", "main", "pr", "rev", "review"),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha-2", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(optionalOptionalMismatch).identityComparison).toBe("MISMATCH");

    const optionalNotApplicableMismatch = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
      evidenceSubject: createNotApplicableSubjectIdentity(),
    });
    expect(evaluateMaintenanceReadiness(optionalNotApplicableMismatch).identityComparison).toBe("MISMATCH");

    const leftNotApplicableRequiredUnknown = caseInput({
      currentSubject: createNotApplicableSubjectIdentity(),
      evidenceSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(leftNotApplicableRequiredUnknown).identityComparison).toBe("UNKNOWN");

    const notApplicableOptionalMismatch = caseInput({
      currentSubject: createNotApplicableSubjectIdentity(),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(notApplicableOptionalMismatch).identityComparison).toBe("MISMATCH");

    const notApplicableNotApplicable = caseInput({
      currentSubject: createNotApplicableSubjectIdentity(),
      evidenceSubject: createNotApplicableSubjectIdentity(),
    });
    expect(evaluateMaintenanceReadiness(notApplicableNotApplicable).identityComparison).toBe("MATCH");
  });

  it("human gate mapping is deterministic and separate from operational state", () => {
    const requiredNotConsumed = caseInput({
      humanGateState: "REQUIRED / NOT CONSUMED",
      humanDecisionState: { humanDecisionRequired: true, pending: false, decision: "GO", goConsumed: true },
    });
    expect(evaluateMaintenanceReadiness(requiredNotConsumed).operationalState).toBe("PASS");

    const identityUnknown = caseInput({
      humanGateState: humanGateStateIdentityUnknown(),
      humanGateIdentityRequiredForTransition: true,
      currentSubject: createSubjectIdentity("repo", null, "main", "pr", "rev", "review"),
      evidenceSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(identityUnknown).operationalState).toBe("UNKNOWN");

    const contradiction = caseInput({
      humanGateState: humanGateStateInvalidContradictory(),
      humanGateContradictionPreventsSafeNextAction: true,
    });
    expect(evaluateMaintenanceReadiness(contradiction).operationalState).toBe("BLOCKED");
  });

  it("covers AC-C34 through AC-C43 semantics", () => {
    const explicitHold = caseInput({
      humanDecisionState: {
        humanDecisionRequired: true,
        pending: false,
        decision: "HOLD",
        goConsumed: false,
      },
    });
    expect(explicitHold.humanDecisionState.decision).toBe("HOLD");
    expect(evaluateMaintenanceReadiness(explicitHold).stop).toBe(true);

    const pendingGo = caseInput({ humanDecisionState: decisionPending() });
    expect(pendingGo.humanDecisionState.pending).toBe(true);
    expect(pendingGo.humanDecisionState.decision).toBeNull();
    expect(evaluateMaintenanceReadiness(pendingGo).stop).toBe(true);

    const consumedGo = caseInput({ humanDecisionState: decisionGo() });
    expect(consumedGo.humanDecisionState.goConsumed).toBe(true);
    expect(consumedGo.humanDecisionState.decision).toBe("GO");
    expect(evaluateMaintenanceReadiness(consumedGo).stop).toBe(false);

    const optionalUnknownDoesNotCauseAggregateUnknown = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", null, "main", "pr", "rev", "review"),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(optionalUnknownDoesNotCauseAggregateUnknown).identityComparison).toBe("UNKNOWN");

    const requiredUnknownCausesStateDeterminingUnknown = caseInput({
      currentSubject: createSubjectIdentity("repo", null, "main", "pr", "rev", "review"),
      evidenceSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(requiredUnknownCausesStateDeterminingUnknown).operationalState).toBe("UNKNOWN");

    const optionalVersusNotApplicableMismatch = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
      evidenceSubject: createNotApplicableSubjectIdentity(),
    });
    expect(evaluateMaintenanceReadiness(optionalVersusNotApplicableMismatch).identityComparison).toBe("MISMATCH");
    expect(evaluateMaintenanceReadiness(optionalVersusNotApplicableMismatch).operationalState).toBe("DEGRADED");
  });

  it("authorizes no execution or implementation authority", () => {
    const result = evaluateMaintenanceReadiness(caseInput());
    expect(result.implementationAuthorized).toBe(false);
    expect(result.executionAuthorized).toBe(false);
  });
});

function holdCase(input: MaintenanceReadinessInput) {
  return evaluateMaintenanceReadiness(input);
}
