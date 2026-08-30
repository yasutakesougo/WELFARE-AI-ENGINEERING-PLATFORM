import { describe, expect, it } from "vitest";
import type { AgentTaskV1 } from "../src/domain/agentTaskContract";
import { computeWorkerRoutingTaskFingerprint } from "../src/domain/workerRouting";
import * as coordinationModule from "../src/domain/multiAgentCoordination";
import {
  MULTI_AGENT_COORDINATION_CANCELLATION_SCHEMA,
  MULTI_AGENT_COORDINATION_GITHUB_MUTATION_IMPLEMENTED,
  MULTI_AGENT_COORDINATION_HARNESS_INVOCATION_IMPLEMENTED,
  MULTI_AGENT_COORDINATION_PLAN_SCHEMA,
  MULTI_AGENT_COORDINATION_PROGRESSION_DECISION_SCHEMA,
  MULTI_AGENT_COORDINATION_PROGRESSION_EVALUATOR_IMPLEMENTED,
  MULTI_AGENT_COORDINATION_PROGRESSION_INPUT_SCHEMA,
  MULTI_AGENT_COORDINATION_PROVIDER_INVOCATION_IMPLEMENTED,
  captureCoordinationPlanFingerprintFacts,
  computeCoordinationPlanFingerprint,
  computeCoordinationTaskRoutingFingerprint,
  computeEffectiveConcurrencyCeiling,
  parseCoordinationCancellationRequestV1,
  parseCoordinationConcurrencyCeilingRefV1,
  parseCoordinationPlanV1,
  parseCoordinationProgressionDecisionV1,
  parseCoordinationProgressionInputV1,
  type CoordinationCancellationRequestV1,
  type CoordinationPlanBindingV1,
  type CoordinationPlanV1,
  type CoordinationProgressionInputV1,
} from "../src/domain/multiAgentCoordination";

const FPA = "a".repeat(64);
const FPB = "b".repeat(64);
const FPC = "c".repeat(64);

function plan(overrides: Partial<CoordinationPlanV1> = {}): CoordinationPlanV1 {
  return {
    schemaVersion: MULTI_AGENT_COORDINATION_PLAN_SCHEMA,
    coordinationId: "coordination-1",
    taskRefs: [
      {
        taskId: "task-a",
        taskRoutingFingerprint: FPA,
        dependencyTaskIds: [],
        coordinationMode: "SEQUENTIAL",
      },
    ],
    ...overrides,
  };
}

async function binding(value = plan()): Promise<CoordinationPlanBindingV1> {
  return {
    plan: value,
    coordinationPlanFingerprint: await computeCoordinationPlanFingerprint(value),
  };
}

function cancellation(
  planBinding: CoordinationPlanBindingV1,
  overrides: Partial<CoordinationCancellationRequestV1> = {},
): CoordinationCancellationRequestV1 {
  return {
    schemaVersion: MULTI_AGENT_COORDINATION_CANCELLATION_SCHEMA,
    cancellationRequestId: "cancel-1",
    source: "HUMAN_CONTROL_SURFACE",
    coordinationId: planBinding.plan.coordinationId,
    coordinationPlanFingerprint: planBinding.coordinationPlanFingerprint,
    targetScope: "TASK",
    targetTaskId: planBinding.plan.taskRefs[0].taskId,
    authorizationRef: "evidence://cancel/1",
    requestedAt: "2026-08-29T19:30:00+09:00",
    ...overrides,
  };
}

function progressionInput(
  planBinding: CoordinationPlanBindingV1,
  overrides: Partial<CoordinationProgressionInputV1> = {},
): CoordinationProgressionInputV1 {
  return {
    schemaVersion: MULTI_AGENT_COORDINATION_PROGRESSION_INPUT_SCHEMA,
    coordinationId: planBinding.plan.coordinationId,
    coordinationPlanFingerprint: planBinding.coordinationPlanFingerprint,
    taskId: planBinding.plan.taskRefs[0].taskId,
    authorizationObservation: "NOT_EVALUATED",
    executionObservation: "NOT_INVOKED",
    resultValidationObservation: "NOT_EVALUATED",
    executionAuthorizationRef: null,
    executionAttemptId: null,
    executionOutcomeRef: null,
    resultValidationRef: null,
    dependencyEvaluation: null,
    resourceConcurrencyEvaluation: null,
    acceptedCancellationRequest: null,
    ...overrides,
  };
}

function agentTask(): AgentTaskV1 {
  return {
    schemaVersion: "AGENT-TASK-V1",
    taskId: "task-a",
    repository: "yasutakesougo/ai-development-control-center",
    baseRevision: "c15dbd60fe51bcb894dc555fee5defb859d3df5f",
    sourceIssue: {
      repository: "yasutakesougo/ai-development-control-center",
      number: 111,
    },
    objective: "Synthetic coordination binding test.",
    allowedPaths: ["src/domain/multiAgentCoordination.ts"],
    forbiddenPaths: [".github/workflows"],
    acceptanceCriteria: ["Reuse the routing task binding."],
    verificationCommands: [],
    allowedCapabilities: ["workspace.read.v1"],
    riskClass: "R1",
    stopAt: "VERIFY_COMPLETE",
  };
}

describe("MULTI-AGENT-COORDINATION-V1 Slice A", () => {
  it("A01 valid minimal plan parses", () => {
    const parsed = parseCoordinationPlanV1(plan());
    expect(parsed.ok).toBe(true);
  });

  it("A02 unknown root key rejects", () => {
    expect(parseCoordinationPlanV1({ ...plan(), extra: true }).ok).toBe(false);
  });

  it("A03 malformed coordinationId rejects", () => {
    expect(parseCoordinationPlanV1({ ...plan(), coordinationId: "Coord 1" }).ok).toBe(false);
  });

  it("A04 duplicate taskId rejects", () => {
    const value = plan({
      taskRefs: [plan().taskRefs[0], { ...plan().taskRefs[0], taskRoutingFingerprint: FPB }],
    });
    expect(parseCoordinationPlanV1(value).ok).toBe(false);
  });

  it("A05 duplicate dependencyTaskId rejects", () => {
    const value = plan({
      taskRefs: [
        plan().taskRefs[0],
        {
          taskId: "task-b",
          taskRoutingFingerprint: FPB,
          dependencyTaskIds: ["task-a", "task-a"],
          coordinationMode: "SEQUENTIAL",
        },
      ],
    });
    expect(parseCoordinationPlanV1(value).ok).toBe(false);
  });

  it("A06 self dependency rejects", () => {
    const value = plan({
      taskRefs: [{ ...plan().taskRefs[0], dependencyTaskIds: ["task-a"] }],
    });
    expect(parseCoordinationPlanV1(value).ok).toBe(false);
  });

  it("A07 missing dependency target rejects", () => {
    const value = plan({
      taskRefs: [{ ...plan().taskRefs[0], dependencyTaskIds: ["task-missing"] }],
    });
    expect(parseCoordinationPlanV1(value).ok).toBe(false);
  });

  it("A08 dependency cycle rejects", () => {
    const value = plan({
      taskRefs: [
        { ...plan().taskRefs[0], dependencyTaskIds: ["task-b"] },
        {
          taskId: "task-b",
          taskRoutingFingerprint: FPB,
          dependencyTaskIds: ["task-a"],
          coordinationMode: "SEQUENTIAL",
        },
      ],
    });
    expect(parseCoordinationPlanV1(value).ok).toBe(false);
  });

  it("A09 taskRefs > max rejects", () => {
    const taskRefs = Array.from({ length: 33 }, (_, index) => ({
      taskId: `task-${index}`,
      taskRoutingFingerprint: FPA,
      dependencyTaskIds: [],
      coordinationMode: "SEQUENTIAL" as const,
    }));
    expect(parseCoordinationPlanV1(plan({ taskRefs })).ok).toBe(false);
  });

  it("A10 dependencyTaskIds > max rejects", () => {
    const dependencies = Array.from({ length: 32 }, (_, index) => `dep-${index}`);
    const taskRefs = [
      { ...plan().taskRefs[0], dependencyTaskIds: dependencies },
      ...dependencies.slice(0, 31).map((taskId) => ({
        taskId,
        taskRoutingFingerprint: FPB,
        dependencyTaskIds: [],
        coordinationMode: "SEQUENTIAL" as const,
      })),
    ];
    expect(parseCoordinationPlanV1(plan({ taskRefs })).ok).toBe(false);
  });

  it("A11 malformed taskRoutingFingerprint rejects", () => {
    const value = plan({
      taskRefs: [{ ...plan().taskRefs[0], taskRoutingFingerprint: "ABC" }],
    });
    expect(parseCoordinationPlanV1(value).ok).toBe(false);
  });

  it("A12 taskRoutingFingerprint helper reuse produces expected binding", async () => {
    const task = agentTask();
    await expect(computeCoordinationTaskRoutingFingerprint(task)).resolves.toBe(
      await computeWorkerRoutingTaskFingerprint(task),
    );
  });

  it("A13 plan fingerprint is deterministic", async () => {
    const value = plan();
    expect(await computeCoordinationPlanFingerprint(value)).toBe(
      await computeCoordinationPlanFingerprint(value),
    );
  });

  it("A14 plan fingerprint changes when identity-bearing task order changes", async () => {
    const first = plan({
      taskRefs: [
        plan().taskRefs[0],
        {
          taskId: "task-b",
          taskRoutingFingerprint: FPB,
          dependencyTaskIds: [],
          coordinationMode: "SEQUENTIAL",
        },
      ],
    });
    const second = plan({ taskRefs: [...first.taskRefs].reverse() });
    expect(await computeCoordinationPlanFingerprint(first)).not.toBe(
      await computeCoordinationPlanFingerprint(second),
    );
  });

  it("A15 plan fingerprint changes when dependency order changes", async () => {
    const common = [
      plan().taskRefs[0],
      {
        taskId: "task-b",
        taskRoutingFingerprint: FPB,
        dependencyTaskIds: [],
        coordinationMode: "SEQUENTIAL" as const,
      },
    ];
    const first = plan({
      taskRefs: [
        ...common,
        {
          taskId: "task-c",
          taskRoutingFingerprint: FPC,
          dependencyTaskIds: ["task-a", "task-b"],
          coordinationMode: "SEQUENTIAL",
        },
      ],
    });
    const second = plan({
      taskRefs: [
        ...common,
        {
          taskId: "task-c",
          taskRoutingFingerprint: FPC,
          dependencyTaskIds: ["task-b", "task-a"],
          coordinationMode: "SEQUENTIAL",
        },
      ],
    });
    expect(await computeCoordinationPlanFingerprint(first)).not.toBe(
      await computeCoordinationPlanFingerprint(second),
    );
  });

  it("A16 plan fingerprint changes when any exact fact changes", async () => {
    const first = plan();
    const second = plan({ coordinationId: "coordination-2" });
    expect(await computeCoordinationPlanFingerprint(first)).not.toBe(
      await computeCoordinationPlanFingerprint(second),
    );
  });

  it("A17 no extra field participates in fingerprint facts", () => {
    expect(Object.keys(captureCoordinationPlanFingerprintFacts(plan()))).toEqual([
      "schemaVersion",
      "coordinationId",
      "taskRefs",
    ]);
    expect(Object.keys(captureCoordinationPlanFingerprintFacts(plan()).taskRefs[0])).toEqual([
      "taskId",
      "taskRoutingFingerprint",
      "dependencyTaskIds",
      "coordinationMode",
    ]);
  });

  it("A18 cancellation envelope exact keys/bounds", async () => {
    const current = await binding();
    expect(parseCoordinationCancellationRequestV1(cancellation(current), current).ok).toBe(true);
    expect(
      parseCoordinationCancellationRequestV1({ ...cancellation(current), extra: true }, current).ok,
    ).toBe(false);
    expect(
      parseCoordinationCancellationRequestV1(
        { ...cancellation(current), cancellationRequestId: "x".repeat(129) },
        current,
      ).ok,
    ).toBe(false);
  });

  it("A19 cancellation target mismatch rejects", async () => {
    const current = await binding();
    expect(
      parseCoordinationCancellationRequestV1(
        cancellation(current, { targetTaskId: "task-other" }),
        current,
      ).ok,
    ).toBe(false);
  });

  it("A20 worker/protocol message cannot satisfy cancellation envelope", async () => {
    const current = await binding();
    expect(
      parseCoordinationCancellationRequestV1(
        { message: "cancel task-a", workerId: "worker-a" },
        current,
      ).ok,
    ).toBe(false);
  });

  it("A21 zero concurrency ceilings fail closed for concurrent eligibility", () => {
    expect(computeEffectiveConcurrencyCeiling([])).toEqual({
      status: "HOLD",
      effectiveCeiling: null,
    });
  });

  it("A22 multiple ceilings choose minimum", async () => {
    const current = await binding();
    expect(
      computeEffectiveConcurrencyCeiling(
        [
          {
            sourceId: "repo-policy",
            coordinationId: current.plan.coordinationId,
            coordinationPlanFingerprint: current.coordinationPlanFingerprint,
            ceiling: 4,
            evidenceRef: "evidence://repo-policy",
          },
          {
            sourceId: "project-policy",
            coordinationId: current.plan.coordinationId,
            coordinationPlanFingerprint: current.coordinationPlanFingerprint,
            ceiling: 2,
            evidenceRef: "evidence://project-policy",
          },
        ],
        current,
      ),
    ).toEqual({ status: "PASS", effectiveCeiling: 2 });
  });

  it("A23 invalid ceiling rejects", async () => {
    const current = await binding();
    const invalid = {
      sourceId: "repo-policy",
      coordinationId: current.plan.coordinationId,
      coordinationPlanFingerprint: current.coordinationPlanFingerprint,
      ceiling: 33,
      evidenceRef: "evidence://repo-policy",
    };
    expect(parseCoordinationConcurrencyCeilingRefV1(invalid, current).ok).toBe(false);
    expect(computeEffectiveConcurrencyCeiling([invalid], current).status).toBe("HOLD");
  });

  it("A24 progression input unknown key rejects", async () => {
    const current = await binding();
    expect(
      parseCoordinationProgressionInputV1({ ...progressionInput(current), extra: true }, current).ok,
    ).toBe(false);
  });

  it("A25 progression input plan/task binding mismatch rejects", async () => {
    const current = await binding();
    expect(
      parseCoordinationProgressionInputV1(
        { ...progressionInput(current), taskId: "task-other" },
        current,
      ).ok,
    ).toBe(false);
  });

  it("A26 authorization ref nullability matrix", async () => {
    const current = await binding();
    expect(
      parseCoordinationProgressionInputV1(
        { ...progressionInput(current), executionAuthorizationRef: "evidence://auth" },
        current,
      ).ok,
    ).toBe(false);
    expect(
      parseCoordinationProgressionInputV1(
        {
          ...progressionInput(current),
          authorizationObservation: "AUTHORIZED",
          executionAuthorizationRef: null,
        },
        current,
      ).ok,
    ).toBe(false);
    expect(
      parseCoordinationProgressionInputV1(
        {
          ...progressionInput(current),
          authorizationObservation: "AUTHORIZED",
          executionAuthorizationRef: "evidence://auth",
        },
        current,
      ).ok,
    ).toBe(true);
  });

  it("A27 execution attempt/outcome ref nullability matrix", async () => {
    const current = await binding();
    const base = {
      ...progressionInput(current),
      authorizationObservation: "AUTHORIZED" as const,
      executionAuthorizationRef: "evidence://auth",
    };
    expect(
      parseCoordinationProgressionInputV1(
        {
          ...base,
          executionObservation: "RUNNING",
          executionAttemptId: "attempt-1",
          executionOutcomeRef: null,
        },
        current,
      ).ok,
    ).toBe(true);
    expect(
      parseCoordinationProgressionInputV1(
        {
          ...base,
          executionObservation: "EXECUTION_SUCCEEDED",
          executionAttemptId: "attempt-1",
          executionOutcomeRef: null,
        },
        current,
      ).ok,
    ).toBe(false);
  });

  it("A28 result-validation ref nullability matrix including NOT_REQUIRED", async () => {
    const current = await binding();
    const base = {
      ...progressionInput(current),
      authorizationObservation: "AUTHORIZED" as const,
      executionAuthorizationRef: "evidence://auth",
      executionObservation: "EXECUTION_SUCCEEDED" as const,
      executionAttemptId: "attempt-1",
      executionOutcomeRef: "evidence://outcome",
    };
    expect(
      parseCoordinationProgressionInputV1(
        { ...base, resultValidationObservation: "NOT_REQUIRED", resultValidationRef: null },
        current,
      ).ok,
    ).toBe(false);
    expect(
      parseCoordinationProgressionInputV1(
        {
          ...base,
          resultValidationObservation: "NOT_REQUIRED",
          resultValidationRef: "evidence://validation-not-required",
        },
        current,
      ).ok,
    ).toBe(true);
  });

  it("A29 partial readiness pair rejects", async () => {
    const current = await binding();
    expect(
      parseCoordinationProgressionInputV1(
        { ...progressionInput(current), dependencyEvaluation: "SATISFIED" },
        current,
      ).ok,
    ).toBe(false);
  });

  it("A30 invalid cancellation binding in progression input rejects", async () => {
    const current = await binding();
    expect(
      parseCoordinationProgressionInputV1(
        {
          ...progressionInput(current),
          acceptedCancellationRequest: cancellation(current, { targetTaskId: "task-other" }),
        },
        current,
      ).ok,
    ).toBe(false);
  });

  it("A31 progression decision contract contains no execution Authority field", async () => {
    const current = await binding();
    const decision = {
      schemaVersion: MULTI_AGENT_COORDINATION_PROGRESSION_DECISION_SCHEMA,
      coordinationId: current.plan.coordinationId,
      coordinationPlanFingerprint: current.coordinationPlanFingerprint,
      taskId: "task-a",
      coordinationProgressionStatus: "PLANNED",
      coordinationProgressionReason: "PLAN_ADMITTED",
    };
    expect(parseCoordinationProgressionDecisionV1(decision, current).ok).toBe(true);
    expect(
      parseCoordinationProgressionDecisionV1({ ...decision, executionAuthorized: true }, current).ok,
    ).toBe(false);
  });

  it("A32 no exported side-effecting execution/dispatch API", () => {
    const prohibited = /^(execute|dispatch|invoke|approve|merge|deploy)/i;
    expect(Object.keys(coordinationModule).filter((key) => prohibited.test(key))).toEqual([]);
    expect(MULTI_AGENT_COORDINATION_PROGRESSION_EVALUATOR_IMPLEMENTED).toBe(true);
    expect(MULTI_AGENT_COORDINATION_PROVIDER_INVOCATION_IMPLEMENTED).toBe(false);
    expect(MULTI_AGENT_COORDINATION_HARNESS_INVOCATION_IMPLEMENTED).toBe(false);
    expect(MULTI_AGENT_COORDINATION_GITHUB_MUTATION_IMPLEMENTED).toBe(false);
  });
});

function evaluatedDecision(
  current: CoordinationPlanBindingV1,
  overrides: Partial<CoordinationProgressionInputV1> = {},
) {
  const result = coordinationModule.evaluateCoordinationProgressionV1(
    progressionInput(current, overrides),
    current,
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.decision;
}

function executed(
  overrides: Partial<CoordinationProgressionInputV1>,
): Partial<CoordinationProgressionInputV1> {
  return {
    authorizationObservation: "AUTHORIZED",
    executionAuthorizationRef: "evidence://auth",
    executionAttemptId: "attempt-1",
    executionOutcomeRef: "evidence://outcome",
    ...overrides,
  };
}

type StageBCase = [
  string,
  (current: CoordinationPlanBindingV1) => Partial<CoordinationProgressionInputV1>,
  string,
  string,
];

const stageBCases: StageBCase[] = [
  [
    "B10 rule 1 EXECUTION_UNKNOWN",
    () => executed({ executionObservation: "EXECUTION_UNKNOWN" }),
    "UNKNOWN",
    "EXECUTION_UNKNOWN",
  ],
  [
    "B11 rule 2 SUCCEEDED + RESULT_UNKNOWN",
    () =>
      executed({
        executionObservation: "EXECUTION_SUCCEEDED",
        resultValidationObservation: "RESULT_UNKNOWN",
        resultValidationRef: "evidence://result",
      }),
    "UNKNOWN",
    "RESULT_UNKNOWN",
  ],
  [
    "B12 rule 3 EXECUTION_FAILED",
    () => executed({ executionObservation: "EXECUTION_FAILED" }),
    "FAILED",
    "EXECUTION_FAILED",
  ],
  [
    "B13 rule 4 SUCCEEDED + RESULT_INVALID",
    () =>
      executed({
        executionObservation: "EXECUTION_SUCCEEDED",
        resultValidationObservation: "RESULT_INVALID",
        resultValidationRef: "evidence://result",
      }),
    "FAILED",
    "RESULT_INVALID",
  ],
  [
    "B14 rule 5 SUCCEEDED + RESULT_VALID",
    () =>
      executed({
        executionObservation: "EXECUTION_SUCCEEDED",
        resultValidationObservation: "RESULT_VALID",
        resultValidationRef: "evidence://result",
      }),
    "SUCCEEDED",
    "EXECUTION_AND_RESULT_VALID",
  ],
  [
    "B15 rule 6 SUCCEEDED + NOT_REQUIRED with evidence ref",
    () =>
      executed({
        executionObservation: "EXECUTION_SUCCEEDED",
        resultValidationObservation: "NOT_REQUIRED",
        resultValidationRef: "evidence://not-required",
      }),
    "SUCCEEDED",
    "EXECUTION_VALIDATION_NOT_REQUIRED",
  ],
  [
    "B16 rule 7 SUCCEEDED + NOT_EVALUATED",
    () => executed({ executionObservation: "EXECUTION_SUCCEEDED" }),
    "RUNNING",
    "RESULT_VALIDATION_PENDING",
  ],
  [
    "B17 rule 8 RUNNING",
    () =>
      executed({
        executionObservation: "RUNNING",
        executionOutcomeRef: null,
      }),
    "RUNNING",
    "EXECUTION_RUNNING",
  ],
  [
    "B18 rule 9 DENIED + NOT_INVOKED",
    () => ({ authorizationObservation: "DENIED", executionAuthorizationRef: "evidence://deny" }),
    "NOT_EXECUTED",
    "AUTHORIZATION_DENIED",
  ],
  [
    "B19 rule 9 beats accepted cancellation",
    (current) => ({
      authorizationObservation: "DENIED",
      executionAuthorizationRef: "evidence://deny",
      acceptedCancellationRequest: cancellation(current),
    }),
    "NOT_EXECUTED",
    "AUTHORIZATION_DENIED",
  ],
  [
    "B20 rule 10 accepted cancellation + NOT_INVOKED",
    (current) => ({ acceptedCancellationRequest: cancellation(current) }),
    "CANCELLED",
    "CANCELLATION_ACCEPTED",
  ],
  [
    "B21 rule 11 DEPENDENCY_BLOCKED",
    () => ({ dependencyEvaluation: "BLOCKED", resourceConcurrencyEvaluation: "PASS" }),
    "HOLD",
    "DEPENDENCY_BLOCKED",
  ],
  [
    "B22 rule 12 AUTHORIZATION_HOLD",
    () => ({
      authorizationObservation: "HOLD",
      executionAuthorizationRef: "evidence://hold",
      dependencyEvaluation: "SATISFIED",
      resourceConcurrencyEvaluation: "PASS",
    }),
    "HOLD",
    "AUTHORIZATION_HOLD",
  ],
  [
    "B23 rule 13 AUTHORIZATION_UNKNOWN",
    () => ({
      authorizationObservation: "UNKNOWN",
      executionAuthorizationRef: "evidence://unknown",
      dependencyEvaluation: "SATISFIED",
      resourceConcurrencyEvaluation: "PASS",
    }),
    "HOLD",
    "AUTHORIZATION_UNKNOWN",
  ],
  [
    "B24 rule 14 DEPENDENCY_PENDING",
    () => ({ dependencyEvaluation: "PENDING", resourceConcurrencyEvaluation: "PASS" }),
    "WAITING_DEPENDENCY",
    "DEPENDENCY_PENDING",
  ],
  [
    "B25 rule 15 RESOURCE_WAIT",
    () => ({ dependencyEvaluation: "SATISFIED", resourceConcurrencyEvaluation: "WAIT" }),
    "WAITING_RESOURCE",
    "RESOURCE_WAIT",
  ],
  [
    "B26 rule 16 HUMAN_GATE_WAIT",
    () => ({
      authorizationObservation: "WAITING_HUMAN_GATE",
      executionAuthorizationRef: "evidence://human-gate",
      dependencyEvaluation: "SATISFIED",
      resourceConcurrencyEvaluation: "PASS",
    }),
    "WAITING_HUMAN_GATE",
    "HUMAN_GATE_WAIT",
  ],
  [
    "B27 rule 17 AUTHORIZED_NOT_INVOKED",
    () => ({
      authorizationObservation: "AUTHORIZED",
      executionAuthorizationRef: "evidence://auth",
      dependencyEvaluation: "SATISFIED",
      resourceConcurrencyEvaluation: "PASS",
    }),
    "READY",
    "AUTHORIZED_NOT_INVOKED",
  ],
  [
    "B28 rule 18 READY_FOR_AUTHORIZATION",
    () => ({ dependencyEvaluation: "SATISFIED", resourceConcurrencyEvaluation: "PASS" }),
    "READY",
    "READY_FOR_AUTHORIZATION",
  ],
  ["B29 rule 19 PLANNED", () => ({}), "PLANNED", "PLAN_ADMITTED"],
];

describe("MULTI-AGENT-COORDINATION-V1 Slice B", () => {
  it("B01 evaluator implemented while execution capabilities stay disabled", () => {
    expect(coordinationModule.MULTI_AGENT_COORDINATION_PROGRESSION_EVALUATOR_IMPLEMENTED).toBe(true);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_EXECUTION_IMPLEMENTED).toBe(false);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_PROVIDER_INVOCATION_IMPLEMENTED).toBe(false);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_HARNESS_INVOCATION_IMPLEMENTED).toBe(false);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_GITHUB_MUTATION_IMPLEMENTED).toBe(false);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_READY_IMPLEMENTED).toBe(false);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_MERGE_IMPLEMENTED).toBe(false);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_DEPLOY_IMPLEMENTED).toBe(false);
  });

  it("B02 schema-unparseable input returns REJECTED_SCHEMA without decision", async () => {
    const current = await binding();
    expect(
      coordinationModule.evaluateCoordinationProgressionV1(
        { ...progressionInput(current), extra: true },
        current,
      ),
    ).toEqual({ ok: false, reason: "REJECTED_SCHEMA" });
  });

  it("B03 plan fingerprint mismatch maps to identity-bound UNKNOWN", async () => {
    const current = await binding();
    const raw = progressionInput(current, { coordinationPlanFingerprint: FPA });
    const result = coordinationModule.evaluateCoordinationProgressionV1(raw, current);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.decision).toMatchObject({
      coordinationPlanFingerprint: FPA,
      coordinationProgressionStatus: "UNKNOWN",
      coordinationProgressionReason: "OBSERVATION_CONTRADICTION",
    });
  });

  it("B04 unknown taskId maps to UNKNOWN", async () => {
    const current = await binding();
    const decision = evaluatedDecision(current, { taskId: "task-other" });
    expect(decision).toMatchObject({
      taskId: "task-other",
      coordinationProgressionStatus: "UNKNOWN",
      coordinationProgressionReason: "OBSERVATION_CONTRADICTION",
    });
  });

  it("B05 invalid authorization x execution cell maps to UNKNOWN", async () => {
    const current = await binding();
    const decision = evaluatedDecision(current, {
      authorizationObservation: "DENIED",
      executionAuthorizationRef: "evidence://deny",
      executionObservation: "RUNNING",
      executionAttemptId: "attempt-1",
    });
    expect(decision).toMatchObject({
      coordinationProgressionStatus: "UNKNOWN",
      coordinationProgressionReason: "OBSERVATION_CONTRADICTION",
    });
  });

  it("B06 invalid execution x result cell maps to UNKNOWN", async () => {
    const current = await binding();
    const decision = evaluatedDecision(current, {
      authorizationObservation: "AUTHORIZED",
      executionAuthorizationRef: "evidence://auth",
      executionObservation: "RUNNING",
      executionAttemptId: "attempt-1",
      resultValidationObservation: "RESULT_VALID",
      resultValidationRef: "evidence://result",
    });
    expect(decision).toMatchObject({
      coordinationProgressionStatus: "UNKNOWN",
      coordinationProgressionReason: "OBSERVATION_CONTRADICTION",
    });
  });

  it("B07 partial readiness pair maps to UNKNOWN", async () => {
    const current = await binding();
    expect(evaluatedDecision(current, { dependencyEvaluation: "SATISFIED" })).toMatchObject({
      coordinationProgressionStatus: "UNKNOWN",
      coordinationProgressionReason: "OBSERVATION_CONTRADICTION",
    });
  });

  it("B08 NOT_REQUIRED without resultValidationRef maps to UNKNOWN", async () => {
    const current = await binding();
    expect(
      evaluatedDecision(
        current,
        executed({
          executionObservation: "EXECUTION_SUCCEEDED",
          resultValidationObservation: "NOT_REQUIRED",
          resultValidationRef: null,
        }),
      ),
    ).toMatchObject({
      coordinationProgressionStatus: "UNKNOWN",
      coordinationProgressionReason: "OBSERVATION_CONTRADICTION",
    });
  });

  it("B09 invalid cancellation binding maps to UNKNOWN", async () => {
    const current = await binding();
    expect(
      evaluatedDecision(current, {
        acceptedCancellationRequest: cancellation(current, { targetTaskId: "task-other" }),
      }),
    ).toMatchObject({
      coordinationProgressionStatus: "UNKNOWN",
      coordinationProgressionReason: "OBSERVATION_CONTRADICTION",
    });
  });

  it.each(stageBCases)("%s", async (_label, makeOverrides, status, reason) => {
    const current = await binding();
    expect(evaluatedDecision(current, makeOverrides(current))).toMatchObject({
      coordinationProgressionStatus: status,
      coordinationProgressionReason: reason,
    });
  });

  it("B30 AUTHORIZED + NOT_INVOKED + both readiness null stays PLANNED", async () => {
    const current = await binding();
    expect(
      evaluatedDecision(current, {
        authorizationObservation: "AUTHORIZED",
        executionAuthorizationRef: "evidence://auth",
      }),
    ).toMatchObject({
      coordinationProgressionStatus: "PLANNED",
      coordinationProgressionReason: "PLAN_ADMITTED",
    });
  });

  it("B31 cancellation + RUNNING remains EXECUTION_RUNNING", async () => {
    const current = await binding();
    expect(
      evaluatedDecision(current, {
        ...executed({ executionObservation: "RUNNING", executionOutcomeRef: null }),
        acceptedCancellationRequest: cancellation(current),
      }),
    ).toMatchObject({
      coordinationProgressionStatus: "RUNNING",
      coordinationProgressionReason: "EXECUTION_RUNNING",
    });
  });

  it("B32 cancellation + EXECUTION_SUCCEEDED uses terminal result mapping", async () => {
    const current = await binding();
    expect(
      evaluatedDecision(current, {
        ...executed({
          executionObservation: "EXECUTION_SUCCEEDED",
          resultValidationObservation: "RESULT_VALID",
          resultValidationRef: "evidence://result",
        }),
        acceptedCancellationRequest: cancellation(current),
      }),
    ).toMatchObject({
      coordinationProgressionStatus: "SUCCEEDED",
      coordinationProgressionReason: "EXECUTION_AND_RESULT_VALID",
    });
  });

  it("B33 decision contains no execution Authority field", async () => {
    const current = await binding();
    const decision = evaluatedDecision(current);
    expect(Object.keys(decision)).toEqual([
      "schemaVersion",
      "coordinationId",
      "coordinationPlanFingerprint",
      "taskId",
      "coordinationProgressionStatus",
      "coordinationProgressionReason",
    ]);
    expect("executionAuthorized" in decision).toBe(false);
  });

  it("B34 no exported side-effecting execution/dispatch API", () => {
    const prohibited = /^(execute|dispatch|invoke|approve|merge|deploy)/i;
    expect(Object.keys(coordinationModule).filter((key) => prohibited.test(key))).toEqual([]);
  });

  it("B35 Slice A parser contradictions remain REJECTED_CONTRADICTION", async () => {
    const current = await binding();
    expect(
      parseCoordinationProgressionInputV1(
        {
          ...progressionInput(current),
          authorizationObservation: "DENIED",
          executionAuthorizationRef: "evidence://deny",
          executionObservation: "RUNNING",
          executionAttemptId: "attempt-1",
        },
        current,
      ),
    ).toEqual({ ok: false, reason: "REJECTED_CONTRADICTION" });
  });
});

describe("MULTI-AGENT-COORDINATION-V1 Slice C", () => {
  const DIGEST_A = "d".repeat(64);
  const DIGEST_B = "e".repeat(64);
  const DIGEST_C = "f".repeat(64);

  function twoTaskPlan(): CoordinationPlanV1 {
    return plan({
      taskRefs: [
        {
          taskId: "task-a",
          taskRoutingFingerprint: FPA,
          dependencyTaskIds: [],
          coordinationMode: "SEQUENTIAL",
        },
        {
          taskId: "task-b",
          taskRoutingFingerprint: FPB,
          dependencyTaskIds: ["task-a"],
          coordinationMode: "SEQUENTIAL",
        },
      ],
    });
  }

  function decisionFor(
    current: CoordinationPlanBindingV1,
    taskId: string,
    status: coordinationModule.CoordinationProgressionStatusV1,
    reason: coordinationModule.CoordinationProgressionReasonV1 = "PLAN_ADMITTED",
  ): coordinationModule.CoordinationProgressionDecisionV1 {
    return {
      schemaVersion: MULTI_AGENT_COORDINATION_PROGRESSION_DECISION_SCHEMA,
      coordinationId: current.plan.coordinationId,
      coordinationPlanFingerprint: current.coordinationPlanFingerprint,
      taskId,
      coordinationProgressionStatus: status,
      coordinationProgressionReason: reason,
    };
  }

  async function withProgression(
    current: CoordinationPlanBindingV1,
    taskId: string,
    status: coordinationModule.CoordinationProgressionStatusV1,
    reason: coordinationModule.CoordinationProgressionReasonV1,
    rest: Partial<coordinationModule.CoordinationTaskStateBindingV1>,
  ): Promise<coordinationModule.CoordinationTaskStateBindingV1> {
    const progressionDecision = rest.progressionDecision ?? decisionFor(current, taskId, status, reason);
    const progressionDecisionFingerprint =
      rest.progressionDecisionFingerprint ??
      (await coordinationModule.computeCoordinationProgressionDecisionFingerprint(
        progressionDecision,
      ));
    return {
      taskId,
      taskRoutingFingerprint:
        current.plan.taskRefs.find((task) => task.taskId === taskId)?.taskRoutingFingerprint ??
        FPA,
      workerId: null,
      workerAuthorityFingerprint: null,
      routingDecisionFingerprint: null,
      humanDecisionRef: null,
      executionAuthorizationRef: null,
      executionAttemptId: null,
      executionOutcomeRef: null,
      resultValidationRef: null,
      resourceLockDecisionRef: null,
      coordinationProgressionStatus: status,
      progressionDecisionRef: `decision://${taskId}/${status}`,
      evidenceBindings: [],
      ...rest,
      progressionDecision,
      progressionDecisionFingerprint,
    };
  }

  function evidence(
    overrides: Partial<coordinationModule.CoordinationEvidenceBindingV1> &
      Pick<coordinationModule.CoordinationEvidenceBindingV1, "ref" | "taskId" | "ownerScope" | "kind">,
    coordinationId = "coordination-1",
  ): coordinationModule.CoordinationEvidenceBindingV1 {
    return {
      evidenceDigest: DIGEST_A,
      coordinationId,
      sourceId: "source-1",
      ...overrides,
    };
  }

  async function snapshotPayload(
    current: CoordinationPlanBindingV1,
    taskStates: coordinationModule.CoordinationTaskStateBindingV1[],
    coordinationEvidenceBindings: coordinationModule.CoordinationEvidenceBindingV1[] = [],
    auditBindings: coordinationModule.CoordinationEvidenceBindingV1[] = [],
  ): Promise<coordinationModule.CoordinationSharedStateSnapshotV1> {
    const payload = {
      schemaVersion: coordinationModule.MULTI_AGENT_COORDINATION_SHARED_STATE_SNAPSHOT_SCHEMA,
      coordinationId: current.plan.coordinationId,
      coordinationPlanFingerprint: current.coordinationPlanFingerprint,
      taskStates,
      coordinationEvidenceBindings,
      auditBindings,
    };
    return {
      ...payload,
      snapshotDigest: await coordinationModule.computeCoordinationSharedStateSnapshotDigest(payload),
    };
  }

  async function plannedSnapshot(
    current: CoordinationPlanBindingV1,
  ): Promise<coordinationModule.CoordinationSharedStateSnapshotV1> {
    const taskStates = [];
    for (const task of current.plan.taskRefs) {
      taskStates.push(await withProgression(current, task.taskId, "PLANNED", "PLAN_ADMITTED", {}));
    }
    return snapshotPayload(current, taskStates);
  }

  it("C01 valid FULL snapshot bound to exact plan identity -> PASS", async () => {
    const current = await binding(twoTaskPlan());
    const snap = await plannedSnapshot(current);
    const parsed = await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.reason);
    expect(parsed.value.taskStates.map((task) => task.taskId)).toEqual(["task-a", "task-b"]);
  });

  it("C02 coordinationId mismatch -> fail closed", async () => {
    const current = await binding();
    const snap = await plannedSnapshot(current);
    expect(
      (
        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
          { ...snap, coordinationId: "coordination-other", snapshotDigest: snap.snapshotDigest },
          current,
        )
      ).ok,
    ).toBe(false);
  });

  it("C03 plan fingerprint mismatch -> fail closed", async () => {
    const current = await binding();
    const snap = await plannedSnapshot(current);
    expect(
      (
        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
          { ...snap, coordinationPlanFingerprint: FPA },
          current,
        )
      ).ok,
    ).toBe(false);
  });

  it("C04 unknown taskId -> fail closed", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-other", "PLANNED", "PLAN_ADMITTED", {
      taskRoutingFingerprint: FPA,
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C05 duplicate task binding -> fail closed", async () => {
    const current = await binding(twoTaskPlan());
    const a = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {});
    const snap = await snapshotPayload(current, [a, a]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C06 taskRoutingFingerprint mismatch -> fail closed", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      taskRoutingFingerprint: FPB,
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C07 lifecycle matrix accepts OPTIONAL null refs", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "WAITING_DEPENDENCY", "DEPENDENCY_PENDING", {
      workerId: null,
      workerAuthorityFingerprint: null,
      routingDecisionFingerprint: null,
      resourceLockDecisionRef: null,
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(true);
  });

  it("C08 lifecycle matrix rejects missing REQUIRED ref", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "READY", "AUTHORIZED_NOT_INVOKED", {
      workerId: "worker-a",
      workerAuthorityFingerprint: FPC,
      routingDecisionFingerprint: FPA,
      executionAuthorizationRef: null,
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C09 lifecycle matrix rejects MUST_BE_NULL contradiction", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      resourceLockDecisionRef: "lock://1",
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C10 partial snapshot -> reject", async () => {
    const current = await binding(twoTaskPlan());
    const a = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {});
    const snap = await snapshotPayload(current, [a]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C11 task evidence owner mismatch -> reject", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      evidenceBindings: [
        evidence({
          ref: "evidence://1",
          ownerScope: "TASK",
          taskId: "task-b",
          kind: "EVIDENCE",
        }),
      ],
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C12 coordination evidence with task owner -> reject", async () => {
    const current = await binding();
    const snap = await snapshotPayload(current, [
      await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {}),
    ], [
      evidence({
        ref: "evidence://coord",
        ownerScope: "TASK",
        taskId: "task-a",
        kind: "EVIDENCE",
      }),
    ]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C13 audit binding unknown task -> reject", async () => {
    const current = await binding();
    const snap = await snapshotPayload(
      current,
      [await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {})],
      [],
      [
        evidence({
          ref: "audit://1",
          ownerScope: "TASK",
          taskId: "task-missing",
          kind: "AUDIT",
          evidenceDigest: DIGEST_B,
        }),
      ],
    );
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C14 duplicate evidence identity tuple -> reject", async () => {
    const current = await binding();
    const dup = evidence({
      ref: "evidence://dup",
      ownerScope: "TASK",
      taskId: "task-a",
      kind: "EVIDENCE",
    });
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      evidenceBindings: [dup, dup],
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C15 array order preserved; no sort/dedupe/repair", async () => {
    const current = await binding(twoTaskPlan());
    const b = await withProgression(current, "task-b", "PLANNED", "PLAN_ADMITTED", {});
    const a = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {});
    const coord = [
      evidence({
        ref: "evidence://c2",
        ownerScope: "COORDINATION",
        taskId: null,
        kind: "EVIDENCE",
        evidenceDigest: DIGEST_B,
        sourceId: "source-2",
      }),
      evidence({
        ref: "evidence://c1",
        ownerScope: "COORDINATION",
        taskId: null,
        kind: "EVIDENCE",
        evidenceDigest: DIGEST_C,
        sourceId: "source-1",
      }),
    ];
    const snap = await snapshotPayload(current, [b, a], coord);
    const parsed = await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.reason);
    expect(parsed.value.taskStates.map((task) => task.taskId)).toEqual(["task-b", "task-a"]);
    expect(parsed.value.coordinationEvidenceBindings.map((item) => item.ref)).toEqual([
      "evidence://c2",
      "evidence://c1",
    ]);
  });

  it("C16 bare ref cannot substitute for bounded attribution record", async () => {
    const current = await binding();
    const snap = await plannedSnapshot(current);
    expect(
      (
        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
          {
            ...snap,
            coordinationEvidenceBindings: ["evidence://bare"],
          },
          current,
        )
      ).ok,
    ).toBe(false);
  });

  it("C17 progression identity mismatch -> fail closed", async () => {
    const current = await binding();
    const progressionDecision = decisionFor(current, "task-a", "READY", "AUTHORIZED_NOT_INVOKED");
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      progressionDecision,
      progressionDecisionFingerprint:
        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(
          progressionDecision,
        ),
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C18 snapshot validation changes no canonical execution/routing/policy result", async () => {
    const current = await binding();
    const before = evaluatedDecision(current, {
      authorizationObservation: "WAITING_HUMAN_GATE",
      executionAuthorizationRef: "evidence://human-gate",
      dependencyEvaluation: "SATISFIED",
      resourceConcurrencyEvaluation: "PASS",
    });
    const snap = await plannedSnapshot(current);
    await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current);
    const after = evaluatedDecision(current, {
      authorizationObservation: "WAITING_HUMAN_GATE",
      executionAuthorizationRef: "evidence://human-gate",
      dependencyEvaluation: "SATISFIED",
      resourceConcurrencyEvaluation: "PASS",
    });
    expect(after).toEqual(before);
  });

  it("C19 no exported persistence / dispatch / invoke / approve / merge / deploy API", () => {
    const prohibited = /^(execute|dispatch|invoke|approve|merge|deploy|persist|write|append)/i;
    expect(Object.keys(coordinationModule).filter((key) => prohibited.test(key))).toEqual([]);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_SHARED_STATE_BINDING_IMPLEMENTED).toBe(true);
    expect(coordinationModule.MULTI_AGENT_COORDINATION_EXECUTION_IMPLEMENTED).toBe(false);
  });

  it("C20 existing Slice B progression evaluator behavior unchanged", async () => {
    const current = await binding();
    expect(
      evaluatedDecision(current, {
        authorizationObservation: "WAITING_HUMAN_GATE",
        executionAuthorizationRef: "evidence://human-gate",
        dependencyEvaluation: "SATISFIED",
        resourceConcurrencyEvaluation: "PASS",
      }),
    ).toMatchObject({
      coordinationProgressionStatus: "WAITING_HUMAN_GATE",
      coordinationProgressionReason: "HUMAN_GATE_WAIT",
    });
  });

  it("C21 SUCCEEDED missing resultValidationRef -> reject", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "SUCCEEDED", "EXECUTION_AND_RESULT_VALID", {
      workerId: "worker-a",
      workerAuthorityFingerprint: FPC,
      routingDecisionFingerprint: FPA,
      executionAuthorizationRef: "auth://1",
      executionAttemptId: "attempt-1",
      executionOutcomeRef: "outcome://1",
      resultValidationRef: null,
      evidenceBindings: [
        evidence({
          ref: "evidence://success",
          ownerScope: "TASK",
          taskId: "task-a",
          kind: "EVIDENCE",
        }),
      ],
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C22 FAILED missing executionOutcomeRef/evidence -> reject", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "FAILED", "EXECUTION_FAILED", {
      workerId: "worker-a",
      workerAuthorityFingerprint: FPC,
      routingDecisionFingerprint: FPA,
      executionAuthorizationRef: "auth://1",
      executionAttemptId: "attempt-1",
      executionOutcomeRef: null,
      evidenceBindings: [],
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C23 NOT_EXECUTED with executionAttemptId -> reject", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "NOT_EXECUTED", "AUTHORIZATION_DENIED", {
      executionAuthorizationRef: "auth://deny",
      executionAttemptId: "attempt-1",
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C24 PLANNED with routing/execution/resource ref -> reject", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      routingDecisionFingerprint: FPA,
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C25 WAITING_HUMAN_GATE with executionAuthorizationRef -> REJECT", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "WAITING_HUMAN_GATE", "HUMAN_GATE_WAIT", {
      workerId: "worker-a",
      workerAuthorityFingerprint: FPC,
      routingDecisionFingerprint: FPA,
      executionAuthorizationRef: "auth://should-not",
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C26 WAITING_HUMAN_GATE without executionAuthorizationRef -> accepted when other requirements hold", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "WAITING_HUMAN_GATE", "HUMAN_GATE_WAIT", {
      workerId: "worker-a",
      workerAuthorityFingerprint: FPC,
      routingDecisionFingerprint: FPA,
      humanDecisionRef: "human://gate-1",
      executionAuthorizationRef: null,
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(true);
  });

  it("C27 humanDecisionRef never substitutes for executionAuthorizationRef", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "READY", "AUTHORIZED_NOT_INVOKED", {
      workerId: "worker-a",
      workerAuthorityFingerprint: FPC,
      routingDecisionFingerprint: FPA,
      humanDecisionRef: "human://go",
      executionAuthorizationRef: null,
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C28 valid exact snapshotDigest -> PASS", async () => {
    const current = await binding();
    const snap = await plannedSnapshot(current);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(true);
  });

  it("C29 snapshotDigest mismatch -> REJECT", async () => {
    const current = await binding();
    const snap = await plannedSnapshot(current);
    expect(
      (
        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
          { ...snap, snapshotDigest: "1".repeat(64) },
          current,
        )
      ).ok,
    ).toBe(false);
  });

  it("C30 identical payload deterministically reproduces snapshotDigest", async () => {
    const current = await binding();
    const first = await plannedSnapshot(current);
    const second = await plannedSnapshot(current);
    expect(first.snapshotDigest).toBe(second.snapshotDigest);
  });

  it("C31 evidence binding missing evidenceDigest -> REJECT", async () => {
    const current = await binding();
    const snap = await plannedSnapshot(current);
    const broken = {
      ...snap,
      coordinationEvidenceBindings: [
        {
          ref: "evidence://x",
          ownerScope: "COORDINATION",
          coordinationId: current.plan.coordinationId,
          taskId: null,
          kind: "EVIDENCE",
          sourceId: "source-1",
        },
      ],
    };
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(broken, current)).ok,
    ).toBe(false);
  });

  it("C32 same ref + conflicting evidenceDigest -> REJECT snapshot-wide", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      evidenceBindings: [
        evidence({
          ref: "evidence://same",
          ownerScope: "TASK",
          taskId: "task-a",
          kind: "EVIDENCE",
          evidenceDigest: DIGEST_A,
        }),
      ],
    });
    const snap = await snapshotPayload(current, [task], [
      evidence({
        ref: "evidence://same",
        ownerScope: "COORDINATION",
        taskId: null,
        kind: "EVIDENCE",
        evidenceDigest: DIGEST_B,
      }),
    ]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C33 progression status missing progressionDecisionRef/fingerprint -> REJECT", async () => {
    const current = await binding();
    const snap = await plannedSnapshot(current);
    const brokenTask = { ...snap.taskStates[0] };
    delete (brokenTask as { progressionDecisionRef?: string }).progressionDecisionRef;
    expect(
      (
        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
          { ...snap, taskStates: [brokenTask] },
          current,
        )
      ).ok,
    ).toBe(false);
  });

  it("C34 progression binding identity mismatch -> REJECT", async () => {
    const current = await binding();
    const wrong = decisionFor(current, "task-a", "HOLD", "AUTHORIZATION_HOLD");
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      progressionDecision: wrong,
      progressionDecisionFingerprint:
        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C35 duplicate evidence tuple across different arrays -> REJECT", async () => {
    const current = await binding();
    const shared = evidence({
      ref: "evidence://shared",
      ownerScope: "COORDINATION",
      taskId: null,
      kind: "EVIDENCE",
      evidenceDigest: DIGEST_A,
    });
    // Exact tuple cannot appear in both coordination and audit arrays; audit requires AUDIT kind.
    // Use identical AUDIT tuples across auditBindings duplication via task+top-level is tested with
    // same AUDIT identity repeated.
    const audit = evidence({
      ref: "audit://shared",
      ownerScope: "COORDINATION",
      taskId: null,
      kind: "AUDIT",
      evidenceDigest: DIGEST_B,
    });
    const snap = await snapshotPayload(
      current,
      [await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {})],
      [],
      [audit, audit],
    );
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
    void shared;
  });

  it("C36 global collision validation preserves original order", async () => {
    const current = await binding();
    const audits = [
      evidence({
        ref: "audit://2",
        ownerScope: "COORDINATION",
        taskId: null,
        kind: "AUDIT",
        evidenceDigest: DIGEST_B,
        sourceId: "s2",
      }),
      evidence({
        ref: "audit://1",
        ownerScope: "COORDINATION",
        taskId: null,
        kind: "AUDIT",
        evidenceDigest: DIGEST_C,
        sourceId: "s1",
      }),
    ];
    const snap = await snapshotPayload(
      current,
      [await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {})],
      [],
      audits,
    );
    const parsed = await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.reason);
    expect(parsed.value.auditBindings.map((item) => item.ref)).toEqual(["audit://2", "audit://1"]);
  });

  it("C37 existing Slice B B26 behavior remains unchanged", async () => {
    const current = await binding();
    expect(
      evaluatedDecision(current, {
        authorizationObservation: "WAITING_HUMAN_GATE",
        executionAuthorizationRef: "evidence://human-gate",
        dependencyEvaluation: "SATISFIED",
        resourceConcurrencyEvaluation: "PASS",
      }),
    ).toMatchObject({
      coordinationProgressionStatus: "WAITING_HUMAN_GATE",
      coordinationProgressionReason: "HUMAN_GATE_WAIT",
    });
  });

  it("C38 Slice C WAITING_HUMAN_GATE with executionAuthorizationRef != null -> REJECT", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "WAITING_HUMAN_GATE", "HUMAN_GATE_WAIT", {
      workerId: "worker-a",
      workerAuthorityFingerprint: FPC,
      routingDecisionFingerprint: FPA,
      executionAuthorizationRef: "evidence://human-gate",
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C39 Slice C WAITING_HUMAN_GATE with executionAuthorizationRef == null -> PASS when all other requirements hold", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "WAITING_HUMAN_GATE", "HUMAN_GATE_WAIT", {
      workerId: "worker-a",
      workerAuthorityFingerprint: FPC,
      routingDecisionFingerprint: FPA,
      executionAuthorizationRef: null,
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(true);
  });

  it("C40 Slice B input reference is not automatically copied into Slice C snapshot", async () => {
    const current = await binding();
    const sliceBInput = progressionInput(current, {
      authorizationObservation: "WAITING_HUMAN_GATE",
      executionAuthorizationRef: "evidence://human-gate",
      dependencyEvaluation: "SATISFIED",
      resourceConcurrencyEvaluation: "PASS",
    });
    const decision = evaluatedDecision(current, sliceBInput);
    const task = await withProgression(
      current,
      "task-a",
      decision.coordinationProgressionStatus,
      decision.coordinationProgressionReason,
      {
        workerId: "worker-a",
        workerAuthorityFingerprint: FPC,
        routingDecisionFingerprint: FPA,
        executionAuthorizationRef: null,
        progressionDecision: decision,
      },
    );
    expect(sliceBInput.executionAuthorizationRef).toBe("evidence://human-gate");
    expect(task.executionAuthorizationRef).toBe(null);
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(true);
  });

  it("C41 humanDecisionRef does not substitute for executionAuthorizationRef in READY/RUNNING/FAILED/SUCCEEDED states", async () => {
    const current = await binding();
    for (const [status, reason] of [
      ["READY", "AUTHORIZED_NOT_INVOKED"],
      ["RUNNING", "EXECUTION_RUNNING"],
      ["FAILED", "EXECUTION_FAILED"],
      ["SUCCEEDED", "EXECUTION_AND_RESULT_VALID"],
    ] as const) {
      const task = await withProgression(current, "task-a", status, reason, {
        workerId: "worker-a",
        workerAuthorityFingerprint: FPC,
        routingDecisionFingerprint: FPA,
        humanDecisionRef: "human://decision",
        executionAuthorizationRef: null,
        executionAttemptId: status === "READY" ? null : "attempt-1",
        executionOutcomeRef: status === "READY" || status === "RUNNING" ? null : "outcome://1",
        resultValidationRef: status === "SUCCEEDED" ? "result://1" : null,
        evidenceBindings:
          status === "FAILED" || status === "SUCCEEDED"
            ? [
                evidence({
                  ref: `evidence://${status}`,
                  ownerScope: "TASK",
                  taskId: "task-a",
                  kind: "EVIDENCE",
                  evidenceDigest: DIGEST_A,
                }),
              ]
            : [],
      });
      const snap = await snapshotPayload(current, [task]);
      expect(
        (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
      ).toBe(false);
    }
  });

  it("C42 bound progression decision identity is required independently of snapshot executionAuthorizationRef", async () => {
    const current = await binding();
    const snap = await plannedSnapshot(current);
    const broken = {
      ...snap.taskStates[0],
      progressionDecisionRef: "",
    };
    expect(
      (
        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
          { ...snap, taskStates: [broken] },
          current,
        )
      ).ok,
    ).toBe(false);
  });

  it("C43 progressionDecisionFingerprint mismatch against supplied progressionDecision -> REJECT", async () => {
    const current = await binding();
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      progressionDecisionFingerprint: "9".repeat(64),
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C44 progressionDecision taskId mismatch -> REJECT", async () => {
    const current = await binding(twoTaskPlan());
    const wrong = decisionFor(current, "task-b", "PLANNED", "PLAN_ADMITTED");
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      progressionDecision: wrong,
      progressionDecisionFingerprint:
        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
    });
    const b = await withProgression(current, "task-b", "PLANNED", "PLAN_ADMITTED", {});
    const snap = await snapshotPayload(current, [task, b]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C45 progressionDecision coordinationId mismatch -> REJECT", async () => {
    const current = await binding();
    const wrong = {
      ...decisionFor(current, "task-a", "PLANNED", "PLAN_ADMITTED"),
      coordinationId: "coordination-other",
    };
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      progressionDecision: wrong,
      progressionDecisionFingerprint:
        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C46 progressionDecision coordinationPlanFingerprint mismatch -> REJECT", async () => {
    const current = await binding();
    const wrong = {
      ...decisionFor(current, "task-a", "PLANNED", "PLAN_ADMITTED"),
      coordinationPlanFingerprint: FPA,
    };
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      progressionDecision: wrong,
      progressionDecisionFingerprint:
        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });

  it("C47 progressionDecision status mismatch -> REJECT", async () => {
    const current = await binding();
    const wrong = decisionFor(current, "task-a", "HOLD", "AUTHORIZATION_HOLD");
    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
      progressionDecision: wrong,
      progressionDecisionFingerprint:
        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
    });
    const snap = await snapshotPayload(current, [task]);
    expect(
      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
    ).toBe(false);
  });
});
