import { describe, expect, it } from "vitest";
import * as maintenanceReadinessApi from "../../src/maintenance_readiness/index.js";
import {
  evaluateMaintenanceReadiness,
  type EvidenceFact,
  type HumanDecisionState,
  type HumanGateState,
  type IdentityComponent,
  type MaintenanceReadinessInput,
  type OperationFact,
  type OperationalEffect,
  type ReviewFact,
  type StopFacts,
  type SubjectIdentity,
} from "../../src/maintenance_readiness/index.js";

// ---------------------------------------------------------------------------
// Test-only fixture builders (must NOT be exported from production API)
// ---------------------------------------------------------------------------

function buildRequiredComponent(value: string | null): IdentityComponent {
  return { applicability: "REQUIRED", value };
}

function buildOptionalComponent(value: string | null): IdentityComponent {
  return { applicability: "OPTIONAL", value };
}

function buildNotApplicableComponent(): IdentityComponent {
  return { applicability: "NOT_APPLICABLE", value: null };
}

function createSubjectIdentity(
  repository: string | null,
  commitSha: string | null,
  branch: string | null,
  prHead: string | null,
  definitionRevision: string | null,
  reviewTarget: string | null,
): SubjectIdentity {
  return {
    repository: buildRequiredComponent(repository),
    commitSha: buildRequiredComponent(commitSha),
    branch: buildRequiredComponent(branch),
    prHead: buildRequiredComponent(prHead),
    definitionRevision: buildRequiredComponent(definitionRevision),
    reviewTarget: buildRequiredComponent(reviewTarget),
  };
}

function createOptionalSubjectIdentity(
  repository: string | null,
  commitSha: string | null,
  branch: string | null,
  prHead: string | null,
  definitionRevision: string | null,
  reviewTarget: string | null,
): SubjectIdentity {
  return {
    repository: buildOptionalComponent(repository),
    commitSha: buildOptionalComponent(commitSha),
    branch: buildOptionalComponent(branch),
    prHead: buildOptionalComponent(prHead),
    definitionRevision: buildOptionalComponent(definitionRevision),
    reviewTarget: buildOptionalComponent(reviewTarget),
  };
}

function createMixedSubjectIdentity(components: {
  repository: IdentityComponent;
  commitSha: IdentityComponent;
  branch: IdentityComponent;
  prHead: IdentityComponent;
  definitionRevision: IdentityComponent;
  reviewTarget: IdentityComponent;
}): SubjectIdentity {
  return components;
}

function createNotApplicableSubjectIdentity(): SubjectIdentity {
  return {
    repository: buildNotApplicableComponent(),
    commitSha: buildNotApplicableComponent(),
    branch: buildNotApplicableComponent(),
    prHead: buildNotApplicableComponent(),
    definitionRevision: buildNotApplicableComponent(),
    reviewTarget: buildNotApplicableComponent(),
  };
}

function decisionPending(): HumanDecisionState {
  return { humanDecisionRequired: true, pending: true, decision: null, goConsumed: false };
}

function decisionGo(): HumanDecisionState {
  return { humanDecisionRequired: true, pending: false, decision: "GO", goConsumed: true };
}

function decisionHold(): HumanDecisionState {
  return { humanDecisionRequired: true, pending: false, decision: "HOLD", goConsumed: false };
}

function decisionNotRequired(): HumanDecisionState {
  return { humanDecisionRequired: false, pending: false, decision: null, goConsumed: false };
}

function humanGateStateIdentityUnknown(): HumanGateState {
  return "IDENTITY UNKNOWN";
}

function humanGateStateInvalidContradictory(): HumanGateState {
  return "INVALID / CONTRADICTORY";
}

function exactStopFacts(): StopFacts {
  return {
    authorityBoundaryReached: false,
    highRiskBoundaryReached: false,
    evidenceCeilingReached: false,
    exactScopeExhausted: false,
    productionBoundaryReached: false,
  };
}

function evidenceFact(
  partial: Pick<EvidenceFact, "kind" | "requirement" | "operationalEffect"> &
    Partial<Pick<EvidenceFact, "id">>,
): EvidenceFact {
  return {
    id: partial.id ?? `evidence-${partial.kind}-${partial.requirement}`,
    kind: partial.kind,
    requirement: partial.requirement,
    operationalEffect: partial.operationalEffect,
  };
}

function operationFact(
  partial: Pick<OperationFact, "kind" | "operationalEffect"> & Partial<Pick<OperationFact, "id">>,
): OperationFact {
  return {
    id: partial.id ?? `operation-${partial.kind}`,
    kind: partial.kind,
    operationalEffect: partial.operationalEffect,
  };
}

function reviewFact(
  partial: Pick<ReviewFact, "kind" | "operationalEffect"> & Partial<Pick<ReviewFact, "id">>,
): ReviewFact {
  return {
    id: partial.id ?? `review-${partial.kind}`,
    kind: partial.kind,
    operationalEffect: partial.operationalEffect,
  };
}

function createDefaultMaintenanceInput(
  overrides: Partial<MaintenanceReadinessInput> = {},
): MaintenanceReadinessInput {
  const currentSubject = createSubjectIdentity(
    "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
    "5ab8470a8185bda286f5b4d662e07ac39c27ede7",
    "main",
    "refs/heads/main",
    "1.0.0",
    "maintenance-readiness-operational-profile",
  );

  const evidenceSubject = createSubjectIdentity(
    "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
    "5ab8470a8185bda286f5b4d662e07ac39c27ede7",
    "main",
    "refs/heads/main",
    "1.0.0",
    "maintenance-readiness-operational-profile",
  );

  return {
    currentSubject,
    evidenceSubject,
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
  };
}

function caseInput(overrides: Partial<MaintenanceReadinessInput> = {}): MaintenanceReadinessInput {
  return createDefaultMaintenanceInput(overrides);
}

function matchingRequiredSubjects(): Pick<
  MaintenanceReadinessInput,
  "currentSubject" | "evidenceSubject"
> {
  return {
    currentSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    evidenceSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
  };
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
        "5ab8470a8185bda286f5b4d662e07ac39c27ede7",
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
        evidence: [
          evidenceFact({
            kind: "FAILED",
            requirement: "MANDATORY",
            operationalEffect: "CONFIRMED_OPERATIONAL_BLOCKER",
          }),
        ],
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
        evidence: [
          evidenceFact({
            kind: "UNAVAILABLE",
            requirement: "MANDATORY",
            operationalEffect: "NO_STATE_EFFECT",
          }),
        ],
        operations: [
          operationFact({
            kind: "FAILED",
            operationalEffect: "STATE_DETERMINING_UNKNOWN",
          }),
        ],
        reviews: [],
      },
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("UNKNOWN");
    expect(result.stop).toBe(true);
  });

  it("CASE D-2: UNAVAILABLE evidence with NO_STATE_EFFECT must not force UNKNOWN over BLOCKED", () => {
    const input = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [
          evidenceFact({
            id: "ev-unavailable",
            kind: "UNAVAILABLE",
            requirement: "MANDATORY",
            operationalEffect: "NO_STATE_EFFECT",
          }),
        ],
        operations: [
          operationFact({
            id: "op-blocker",
            kind: "FAILED",
            operationalEffect: "CONFIRMED_OPERATIONAL_BLOCKER",
          }),
        ],
        reviews: [],
      },
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("BLOCKED");
    expect(result.stop).toBe(true);
  });

  it("CASE D-3: optional failed tool is non-blocking", () => {
    const input = caseInput({
      humanDecisionState: decisionGo(),
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [],
        operations: [
          operationFact({
            kind: "FAILED",
            operationalEffect: "NON_BLOCKING_LIMITATION",
          }),
        ],
        reviews: [],
      },
    });

    const result = evaluateMaintenanceReadiness(input);
    expect(result.operationalState).toBe("DEGRADED");
    expect(result.stop).toBe(false);
  });

  it("CASE E: optional supporting evidence unavailable is non-blocking", () => {
    const input = caseInput({
      humanDecisionState: decisionGo(),
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [
          evidenceFact({
            kind: "UNAVAILABLE",
            requirement: "OPTIONAL",
            operationalEffect: "NON_BLOCKING_LIMITATION",
          }),
        ],
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
      humanDecisionState: decisionHold(),
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
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [],
        operations: [],
        reviews: [],
      },
    });
    expect(evaluateMaintenanceReadiness(unknownInput).operationalState).toBe("UNKNOWN");

    const blockedInput = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [],
        operations: [
          operationFact({
            kind: "FAILED",
            operationalEffect: "CONFIRMED_OPERATIONAL_BLOCKER",
          }),
        ],
        reviews: [],
      },
    });
    expect(evaluateMaintenanceReadiness(blockedInput).operationalState).toBe("BLOCKED");

    const degradedInput = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [],
        operations: [
          operationFact({
            kind: "FAILED",
            operationalEffect: "NON_BLOCKING_LIMITATION",
          }),
        ],
        reviews: [],
      },
    });
    expect(evaluateMaintenanceReadiness(degradedInput).operationalState).toBe("DEGRADED");

    const passInput = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [],
        operations: [],
        reviews: [],
      },
      humanDecisionState: decisionNotRequired(),
      humanGateState: "NOT REQUIRED",
    });
    expect(evaluateMaintenanceReadiness(passInput).operationalState).toBe("PASS");
  });

  it("covers the nine identity applicability pairings deterministically", () => {
    // REQUIRED × REQUIRED
    const requiredRequiredMatch = caseInput({
      ...matchingRequiredSubjects(),
    });
    expect(evaluateMaintenanceReadiness(requiredRequiredMatch).identityComparison).toBe("MATCH");

    const requiredRequiredMismatch = caseInput({
      currentSubject: createSubjectIdentity("repo", "sha-1", "main", "pr", "rev", "review"),
      evidenceSubject: createSubjectIdentity("repo", "sha-2", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(requiredRequiredMismatch).identityComparison).toBe(
      "MISMATCH",
    );
    expect(evaluateMaintenanceReadiness(requiredRequiredMismatch).operationalState).toBe("UNKNOWN");

    // REQUIRED × OPTIONAL
    const requiredOptionalUnknown = caseInput({
      currentSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha", null, "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(requiredOptionalUnknown).identityComparison).toBe(
      "UNKNOWN",
    );

    // REQUIRED × NOT_APPLICABLE
    const requiredNotApplicable = caseInput({
      currentSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
      evidenceSubject: createNotApplicableSubjectIdentity(),
    });
    expect(evaluateMaintenanceReadiness(requiredNotApplicable).identityComparison).toBe("UNKNOWN");
    expect(evaluateMaintenanceReadiness(requiredNotApplicable).operationalState).toBe("UNKNOWN");

    // OPTIONAL × REQUIRED
    const optionalRequiredUnknown = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", "sha", null, "pr", "rev", "review"),
      evidenceSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(optionalRequiredUnknown).identityComparison).toBe(
      "UNKNOWN",
    );

    // OPTIONAL × OPTIONAL — pair UNKNOWN is allowed; aggregate must remain MATCH
    const optionalOptionalUnknown = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", null, "main", "pr", "rev", "review"),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(optionalOptionalUnknown).identityComparison).toBe("MATCH");
    expect(evaluateMaintenanceReadiness(optionalOptionalUnknown).operationalState).toBe("PASS");

    const optionalOptionalMismatch = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", "sha-1", "main", "pr", "rev", "review"),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha-2", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(optionalOptionalMismatch).identityComparison).toBe(
      "MISMATCH",
    );

    // OPTIONAL × NOT_APPLICABLE
    const optionalNotApplicableMismatch = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
      evidenceSubject: createNotApplicableSubjectIdentity(),
    });
    expect(evaluateMaintenanceReadiness(optionalNotApplicableMismatch).identityComparison).toBe(
      "MISMATCH",
    );

    // NOT_APPLICABLE × REQUIRED
    const leftNotApplicableRequiredUnknown = caseInput({
      currentSubject: createNotApplicableSubjectIdentity(),
      evidenceSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(leftNotApplicableRequiredUnknown).identityComparison).toBe(
      "UNKNOWN",
    );

    // NOT_APPLICABLE × OPTIONAL
    const notApplicableOptionalMismatch = caseInput({
      currentSubject: createNotApplicableSubjectIdentity(),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(evaluateMaintenanceReadiness(notApplicableOptionalMismatch).identityComparison).toBe(
      "MISMATCH",
    );

    // NOT_APPLICABLE × NOT_APPLICABLE — value must be null
    const notApplicableNotApplicable = caseInput({
      currentSubject: createNotApplicableSubjectIdentity(),
      evidenceSubject: createNotApplicableSubjectIdentity(),
    });
    expect(notApplicableNotApplicable.currentSubject.repository).toEqual({
      applicability: "NOT_APPLICABLE",
      value: null,
    });
    expect(evaluateMaintenanceReadiness(notApplicableNotApplicable).identityComparison).toBe(
      "MATCH",
    );
  });

  it("human gate mapping is deterministic and separate from operational state", () => {
    const requiredNotConsumed = caseInput({
      humanGateState: "REQUIRED / NOT CONSUMED",
      humanDecisionState: decisionGo(),
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
    // AC-C34: explicit Human HOLD stops without changing technical PASS
    const explicitHold = caseInput({
      humanDecisionState: decisionHold(),
    });
    expect(explicitHold.humanDecisionState.decision).toBe("HOLD");
    expect(evaluateMaintenanceReadiness(explicitHold).operationalState).toBe("PASS");
    expect(evaluateMaintenanceReadiness(explicitHold).stop).toBe(true);

    // AC-C35: pending human decision stops with null decision
    const pendingGo = caseInput({ humanDecisionState: decisionPending() });
    expect(pendingGo.humanDecisionState.pending).toBe(true);
    expect(pendingGo.humanDecisionState.decision).toBeNull();
    expect(evaluateMaintenanceReadiness(pendingGo).stop).toBe(true);

    // AC-C36: consumed GO does not stop when technical PASS
    const consumedGo = caseInput({ humanDecisionState: decisionGo() });
    expect(consumedGo.humanDecisionState.goConsumed).toBe(true);
    expect(consumedGo.humanDecisionState.decision).toBe("GO");
    expect(evaluateMaintenanceReadiness(consumedGo).stop).toBe(false);

    // AC-C37: OPTIONAL-only UNKNOWN must aggregate to MATCH
    const optionalUnknownDoesNotCauseAggregateUnknown = caseInput({
      currentSubject: createOptionalSubjectIdentity("repo", null, "main", "pr", "rev", "review"),
      evidenceSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(
      evaluateMaintenanceReadiness(optionalUnknownDoesNotCauseAggregateUnknown).identityComparison,
    ).toBe("MATCH");

    // AC-C38: required uncertainty remains fail-closed UNKNOWN
    const requiredUnknownCausesStateDeterminingUnknown = caseInput({
      currentSubject: createSubjectIdentity("repo", null, "main", "pr", "rev", "review"),
      evidenceSubject: createSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
    });
    expect(
      evaluateMaintenanceReadiness(requiredUnknownCausesStateDeterminingUnknown).operationalState,
    ).toBe("UNKNOWN");
    expect(
      evaluateMaintenanceReadiness(requiredUnknownCausesStateDeterminingUnknown).identityComparison,
    ).toBe("UNKNOWN");

    // AC-C39: OPTIONAL versus NOT_APPLICABLE is MISMATCH / DEGRADED
    const optionalVersusNotApplicableMismatch = caseInput({
      humanDecisionState: decisionGo(),
      currentSubject: createOptionalSubjectIdentity("repo", "sha", "main", "pr", "rev", "review"),
      evidenceSubject: createNotApplicableSubjectIdentity(),
    });
    expect(
      evaluateMaintenanceReadiness(optionalVersusNotApplicableMismatch).identityComparison,
    ).toBe("MISMATCH");
    expect(
      evaluateMaintenanceReadiness(optionalVersusNotApplicableMismatch).operationalState,
    ).toBe("DEGRADED");

    // AC-C40: NOT_APPLICABLE identity components carry null value only
    const notApplicable = buildNotApplicableComponent();
    expect(notApplicable.applicability).toBe("NOT_APPLICABLE");
    expect(notApplicable.value).toBeNull();

    // AC-C41: EvidenceFact operationalEffect is explicit and consumed as-is
    const unavailableNoStateEffect = evidenceFact({
      kind: "UNAVAILABLE",
      requirement: "MANDATORY",
      operationalEffect: "NO_STATE_EFFECT",
    });
    expect(unavailableNoStateEffect.operationalEffect).toBe("NO_STATE_EFFECT");
    const acC41 = caseInput({
      evidenceFacts: {
        mandatoryEvidenceCoverageComplete: true,
        evidence: [unavailableNoStateEffect],
        operations: [
          operationFact({
            kind: "FAILED",
            operationalEffect: "CONFIRMED_OPERATIONAL_BLOCKER",
          }),
        ],
        reviews: [],
      },
    });
    expect(evaluateMaintenanceReadiness(acC41).operationalState).toBe("BLOCKED");

    // AC-C42: OperationFact / ReviewFact use id + kind + operationalEffect (no status/effect)
    const operation: OperationFact = operationFact({
      kind: "FAILED",
      operationalEffect: "NON_BLOCKING_LIMITATION",
    });
    const review: ReviewFact = reviewFact({
      kind: "FAILED",
      operationalEffect: "CONFIRMED_OPERATIONAL_BLOCKER",
    });
    expect(operation).toEqual({
      id: "operation-FAILED",
      kind: "FAILED",
      operationalEffect: "NON_BLOCKING_LIMITATION" satisfies OperationalEffect,
    });
    expect(review).toEqual({
      id: "review-FAILED",
      kind: "FAILED",
      operationalEffect: "CONFIRMED_OPERATIONAL_BLOCKER",
    });
    expect("status" in operation).toBe(false);
    expect("effect" in operation).toBe(false);
    expect("status" in review).toBe(false);
    expect("effect" in review).toBe(false);

    // AC-C43: mixed OPTIONAL UNKNOWN with required MATCH elsewhere still aggregates MATCH
    const mixedOptionalUnknown = caseInput({
      currentSubject: createMixedSubjectIdentity({
        repository: buildRequiredComponent("repo"),
        commitSha: buildRequiredComponent("sha"),
        branch: buildOptionalComponent(null),
        prHead: buildRequiredComponent("pr"),
        definitionRevision: buildRequiredComponent("rev"),
        reviewTarget: buildRequiredComponent("review"),
      }),
      evidenceSubject: createMixedSubjectIdentity({
        repository: buildRequiredComponent("repo"),
        commitSha: buildRequiredComponent("sha"),
        branch: buildOptionalComponent("main"),
        prHead: buildRequiredComponent("pr"),
        definitionRevision: buildRequiredComponent("rev"),
        reviewTarget: buildRequiredComponent("review"),
      }),
    });
    expect(evaluateMaintenanceReadiness(mixedOptionalUnknown).identityComparison).toBe("MATCH");
  });

  it("authorizes no execution or implementation authority", () => {
    const result = evaluateMaintenanceReadiness(caseInput());
    expect(result.implementationAuthorized).toBe(false);
    expect(result.executionAuthorized).toBe(false);
  });

  it("exposes only the reviewed canonical production public API", () => {
    const exportedKeys = Object.keys(maintenanceReadinessApi).sort();
    expect(exportedKeys).toEqual(["evaluateMaintenanceReadiness"]);

    const forbiddenHelpers = [
      "buildRequiredComponent",
      "buildOptionalComponent",
      "buildNotApplicableComponent",
      "createSubjectIdentity",
      "createOptionalSubjectIdentity",
      "createNotApplicableSubjectIdentity",
      "createDefaultMaintenanceInput",
      "decisionPending",
      "decisionGo",
      "decisionHold",
      "decisionNotRequired",
      "humanGateStateNotRequired",
      "humanGateStateRequiredNotConsumed",
      "humanGateStateConsumedGo",
      "humanGateStateInvalidContradictory",
      "humanGateStateIdentityUnknown",
      "exactStopFacts",
      "evidenceFailedMandatory",
      "evidenceUnavailableOptional",
      "optionalLimitFact",
      "requiredLimitFact",
      "plusOptionalEvidence",
      "noStateEffect",
      "stateDeterminingUnknown",
      "confirmedOperationalBlocker",
      "nonBlockingLimitation",
    ];

    for (const helper of forbiddenHelpers) {
      expect(maintenanceReadinessApi).not.toHaveProperty(helper);
    }
  });
});
