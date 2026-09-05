import { describe, expect, it } from "vitest";
import {
  explainExistingProjectRoute,
  type ProjectFactoryInput,
} from "../../src/project_factory/index.js";

const baseInput = (): ProjectFactoryInput => ({
  project: {
    projectId: "waep",
    repositoryRef: "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
    lifecycleState: "ACTIVE",
    portfolioRole: "CORE",
    projectTypes: ["INTERNAL_TOOL"],
    riskClass: "MEDIUM",
    bindings: {
      capabilityPackRefs: ["TYPESCRIPT", "UNIT_TEST"],
      adapterRefs: ["WAEP_TS_V1"],
      workerPolicyRef: "DEFAULT_WORKER_POLICY",
      authorityPolicyRef: "WAEP_MEDIUM_V1",
      knowledgeApplicabilityPolicyRef: "WAEP_KNOWLEDGE_V1",
    },
  },
  task: {
    taskId: "project-factory-slice-a",
    requiredCapabilities: ["TYPESCRIPT", "UNIT_TEST"],
  },
  adapters: [
    {
      adapterRef: "WAEP_TS_V1",
      repositoryRef: "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
      capabilityCommands: {
        TYPESCRIPT: "npm run typecheck",
        UNIT_TEST: "npm test",
      },
    },
  ],
  workers: [
    {
      workerId: "typescript-worker",
      capabilities: ["TYPESCRIPT", "UNIT_TEST"],
      acceptedRiskClasses: ["LOW", "MEDIUM"],
    },
  ],
  knownAuthorityPolicyRefs: ["WAEP_MEDIUM_V1"],
});

type HoldReason = Extract<ReturnType<typeof explainExistingProjectRoute>, { status: "HOLD" }>["reason"];
type FailClosedCase = readonly [
  mutate: (input: ProjectFactoryInput) => void,
  reason: HoldReason,
];

describe("explainExistingProjectRoute", () => {
  it("deterministically explains a bounded existing-project route without granting execution authority", () => {
    const first = explainExistingProjectRoute(baseInput());
    const second = explainExistingProjectRoute(baseInput());

    expect(first).toEqual(second);
    expect(first).toEqual({
      status: "EXPLAINED",
      projectId: "waep",
      taskId: "project-factory-slice-a",
      capabilityRefs: ["TYPESCRIPT", "UNIT_TEST"],
      adapterRef: "WAEP_TS_V1",
      workerId: "typescript-worker",
      authorityPolicyRef: "WAEP_MEDIUM_V1",
      humanGateRequired: true,
      executionAuthorized: false,
    });
  });

  it("fails closed for unresolved required state", () => {
    const cases: readonly FailClosedCase[] = [
      [(input) => { input.project.projectId = ""; }, "UNKNOWN_PROJECT_IDENTITY"],
      [(input) => { input.project.repositoryRef = ""; }, "UNKNOWN_REPOSITORY"],
      [(input) => { input.task.requiredCapabilities = ["SECURITY_REVIEW"]; }, "UNRESOLVED_CAPABILITY"],
      [(input) => { input.adapters = []; }, "UNRESOLVED_ADAPTER"],
      [(input) => { input.workers = []; }, "UNRESOLVED_WORKER"],
      [(input) => { input.knownAuthorityPolicyRefs = []; }, "UNRESOLVED_AUTHORITY_POLICY"],
    ];

    for (const [mutate, reason] of cases) {
      const input = baseInput();
      mutate(input);
      expect(explainExistingProjectRoute(input)).toEqual({ status: "HOLD", reason });
    }
  });
});
