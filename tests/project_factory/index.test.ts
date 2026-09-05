import { describe, expect, it } from "vitest";
import {
  explainExistingProjectRoute,
  planNewProjectBootstrap,
  type BootstrapPlanningInput,
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
  authorityPolicies: [
    {
      authorityPolicyRef: "WAEP_MEDIUM_V1",
      humanGateRequired: true,
    },
  ],
});

const bootstrapInput = (): BootstrapPlanningInput => ({
  request: {
    requestId: "new-project-slice-b",
    proposedProjectId: "sample-web-project",
    proposedRepositoryRef: "yasutakesougo/sample-web-project",
    projectType: "WEB_APP",
    riskClass: "MEDIUM",
    requiredCapabilities: ["UNIT_TEST"],
    portfolioRole: "LABS",
  },
  defaults: {
    capabilityPackRefsByProjectType: {
      INTERNAL_TOOL: ["TYPESCRIPT"],
      WEB_APP: ["TYPESCRIPT", "REACT_FRONTEND"],
      SPFX_APP: ["TYPESCRIPT", "SPFX_BUILD"],
    },
    adapterRefByProjectType: {
      INTERNAL_TOOL: "NODE_TS_V1",
      WEB_APP: "WEB_TS_V1",
      SPFX_APP: "SPFX_TS_V1",
    },
    workerPolicyRef: "DEFAULT_WORKER_POLICY",
    authorityPolicyRefByRisk: {
      LOW: "WAEP_LOW_V1",
      MEDIUM: "WAEP_MEDIUM_V1",
      HIGH: "WAEP_HIGH_V1",
    },
    knowledgeApplicabilityPolicyRef: "WAEP_KNOWLEDGE_V1",
  },
  availableCapabilities: ["TYPESCRIPT", "REACT_FRONTEND", "SPFX_BUILD", "UNIT_TEST"],
  availableAdapterRefs: ["WEB_TS_V1"],
  workers: [
    {
      workerId: "web-worker",
      capabilities: ["TYPESCRIPT", "REACT_FRONTEND", "UNIT_TEST"],
      acceptedRiskClasses: ["LOW", "MEDIUM"],
    },
  ],
  authorityPolicies: [
    {
      authorityPolicyRef: "WAEP_MEDIUM_V1",
      humanGateRequired: true,
    },
  ],
});

type HoldReason = Extract<ReturnType<typeof explainExistingProjectRoute>, { status: "HOLD" }>["reason"];
type FailClosedCase = readonly [
  mutate: (input: ProjectFactoryInput) => void,
  reason: HoldReason,
];

type BootstrapHoldReason = Extract<ReturnType<typeof planNewProjectBootstrap>, { status: "HOLD" }>["reason"];
type BootstrapFailClosedCase = readonly [
  mutate: (input: BootstrapPlanningInput) => void,
  reason: BootstrapHoldReason,
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

  it("keeps Human Gate explanation policy-bound instead of inferring it from risk alone", () => {
    const input = baseInput();
    input.authorityPolicies = [
      {
        authorityPolicyRef: "WAEP_MEDIUM_V1",
        humanGateRequired: false,
      },
    ];

    const result = explainExistingProjectRoute(input);
    expect(result.status).toBe("EXPLAINED");
    if (result.status === "EXPLAINED") {
      expect(result.humanGateRequired).toBe(false);
    }
  });

  it("fails closed for unresolved required state", () => {
    const cases: readonly FailClosedCase[] = [
      [(input) => { input.project.projectId = ""; }, "UNKNOWN_PROJECT_IDENTITY"],
      [(input) => { input.task.taskId = ""; }, "UNKNOWN_TASK_IDENTITY"],
      [(input) => { input.project.repositoryRef = ""; }, "UNKNOWN_REPOSITORY"],
      [(input) => { input.task.requiredCapabilities = ["SECURITY_REVIEW"]; }, "UNRESOLVED_CAPABILITY"],
      [(input) => { input.adapters = []; }, "UNRESOLVED_ADAPTER"],
      [(input) => { input.workers = []; }, "UNRESOLVED_WORKER"],
      [(input) => { input.authorityPolicies = []; }, "UNRESOLVED_AUTHORITY_POLICY"],
    ];

    for (const [mutate, reason] of cases) {
      const input = baseInput();
      mutate(input);
      expect(explainExistingProjectRoute(input)).toEqual({ status: "HOLD", reason });
    }
  });
});

describe("planNewProjectBootstrap", () => {
  it("deterministically produces a non-authorizing Project Profile proposal and Bootstrap Plan", () => {
    const first = planNewProjectBootstrap(bootstrapInput());
    const second = planNewProjectBootstrap(bootstrapInput());

    expect(first).toEqual(second);
    expect(first).toEqual({
      status: "PLANNED",
      requestId: "new-project-slice-b",
      projectProfileProposal: {
        projectId: "sample-web-project",
        repositoryRef: "yasutakesougo/sample-web-project",
        lifecycleState: "PROPOSED",
        portfolioRole: "LABS",
        projectTypes: ["WEB_APP"],
        riskClass: "MEDIUM",
        bindings: {
          capabilityPackRefs: ["TYPESCRIPT", "REACT_FRONTEND", "UNIT_TEST"],
          adapterRefs: ["WEB_TS_V1"],
          workerPolicyRef: "DEFAULT_WORKER_POLICY",
          authorityPolicyRef: "WAEP_MEDIUM_V1",
          knowledgeApplicabilityPolicyRef: "WAEP_KNOWLEDGE_V1",
        },
      },
      requiredCapabilities: ["TYPESCRIPT", "REACT_FRONTEND", "UNIT_TEST"],
      adapterRef: "WEB_TS_V1",
      workerId: "web-worker",
      authorityPolicyRef: "WAEP_MEDIUM_V1",
      humanGateRequired: true,
      repositoryCreationAuthorized: false,
      packageInstallationAuthorized: false,
      implementationAuthorized: false,
      executionAuthorized: false,
    });
  });

  it("keeps Bootstrap Plan separate from execution authority", () => {
    const result = planNewProjectBootstrap(bootstrapInput());
    expect(result.status).toBe("PLANNED");
    if (result.status === "PLANNED") {
      expect(result.repositoryCreationAuthorized).toBe(false);
      expect(result.packageInstallationAuthorized).toBe(false);
      expect(result.implementationAuthorized).toBe(false);
      expect(result.executionAuthorized).toBe(false);
    }
  });

  it("fails closed for unresolved new-project planning state", () => {
    const cases: readonly BootstrapFailClosedCase[] = [
      [(input) => { input.request.requestId = ""; }, "UNKNOWN_REQUEST_IDENTITY"],
      [(input) => { input.request.proposedProjectId = ""; }, "UNKNOWN_PROJECT_IDENTITY"],
      [(input) => { input.request.proposedRepositoryRef = ""; }, "UNKNOWN_REPOSITORY"],
      [(input) => { input.request.projectType = null; }, "UNRESOLVED_PROJECT_TYPE"],
      [(input) => { input.request.riskClass = null; }, "UNRESOLVED_RISK_CLASS"],
      [(input) => { input.availableCapabilities = input.availableCapabilities.filter((item) => item !== "UNIT_TEST"); }, "UNRESOLVED_CAPABILITY"],
      [(input) => { input.availableAdapterRefs = []; }, "UNRESOLVED_ADAPTER"],
      [(input) => { input.workers = []; }, "UNRESOLVED_WORKER"],
      [(input) => { input.authorityPolicies = []; }, "UNRESOLVED_AUTHORITY_POLICY"],
    ];

    for (const [mutate, reason] of cases) {
      const input = bootstrapInput();
      mutate(input);
      expect(planNewProjectBootstrap(input)).toEqual({ status: "HOLD", reason });
    }
  });
});
