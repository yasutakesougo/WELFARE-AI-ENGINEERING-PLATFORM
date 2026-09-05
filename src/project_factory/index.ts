export type ProjectType = "INTERNAL_TOOL" | "WEB_APP" | "SPFX_APP";
export type RiskClass = "LOW" | "MEDIUM" | "HIGH";

export interface ProjectBindings {
  capabilityPackRefs: readonly string[];
  adapterRefs: readonly string[];
  workerPolicyRef: string;
  authorityPolicyRef: string;
  knowledgeApplicabilityPolicyRef: string;
}

export interface ProjectProfile {
  projectId: string;
  repositoryRef: string;
  lifecycleState: string;
  portfolioRole: string;
  projectTypes: readonly ProjectType[];
  riskClass: RiskClass;
  bindings: ProjectBindings;
}

export interface TaskRequest {
  taskId: string;
  requiredCapabilities: readonly string[];
}

export interface ProjectAdapter {
  adapterRef: string;
  repositoryRef: string;
  capabilityCommands: Readonly<Record<string, string>>;
}

export interface WorkerCandidate {
  workerId: string;
  capabilities: readonly string[];
  acceptedRiskClasses: readonly RiskClass[];
}

export interface AuthorityPolicyExplanation {
  authorityPolicyRef: string;
  humanGateRequired: boolean;
}

export interface ProjectFactoryInput {
  project: ProjectProfile;
  task: TaskRequest;
  adapters: readonly ProjectAdapter[];
  workers: readonly WorkerCandidate[];
  authorityPolicies: readonly AuthorityPolicyExplanation[];
}

export interface ProjectFactoryExplanation {
  status: "EXPLAINED";
  projectId: string;
  taskId: string;
  capabilityRefs: readonly string[];
  adapterRef: string;
  workerId: string;
  authorityPolicyRef: string;
  humanGateRequired: boolean;
  executionAuthorized: false;
}

export interface ProjectFactoryHold {
  status: "HOLD";
  reason:
    | "UNKNOWN_PROJECT_IDENTITY"
    | "UNKNOWN_TASK_IDENTITY"
    | "UNKNOWN_REPOSITORY"
    | "UNRESOLVED_CAPABILITY"
    | "UNRESOLVED_ADAPTER"
    | "UNRESOLVED_WORKER"
    | "UNRESOLVED_AUTHORITY_POLICY";
}

export type ProjectFactoryResult = ProjectFactoryExplanation | ProjectFactoryHold;

const unique = (values: readonly string[]): readonly string[] => [...new Set(values)];

export function explainExistingProjectRoute(input: ProjectFactoryInput): ProjectFactoryResult {
  const { project, task } = input;

  if (project.projectId.trim() === "") {
    return { status: "HOLD", reason: "UNKNOWN_PROJECT_IDENTITY" };
  }

  if (task.taskId.trim() === "") {
    return { status: "HOLD", reason: "UNKNOWN_TASK_IDENTITY" };
  }

  if (project.repositoryRef.trim() === "") {
    return { status: "HOLD", reason: "UNKNOWN_REPOSITORY" };
  }

  const requiredCapabilities = unique(task.requiredCapabilities);
  const unresolvedCapability = requiredCapabilities.some(
    (capability) => !project.bindings.capabilityPackRefs.includes(capability),
  );
  if (unresolvedCapability) {
    return { status: "HOLD", reason: "UNRESOLVED_CAPABILITY" };
  }

  const adapter = input.adapters.find(
    (candidate) =>
      candidate.repositoryRef === project.repositoryRef &&
      project.bindings.adapterRefs.includes(candidate.adapterRef) &&
      requiredCapabilities.every((capability) => capability in candidate.capabilityCommands),
  );
  if (adapter === undefined) {
    return { status: "HOLD", reason: "UNRESOLVED_ADAPTER" };
  }

  const worker = input.workers.find(
    (candidate) =>
      candidate.acceptedRiskClasses.includes(project.riskClass) &&
      requiredCapabilities.every((capability) => candidate.capabilities.includes(capability)),
  );
  if (worker === undefined) {
    return { status: "HOLD", reason: "UNRESOLVED_WORKER" };
  }

  const authorityPolicy = input.authorityPolicies.find(
    (candidate) => candidate.authorityPolicyRef === project.bindings.authorityPolicyRef,
  );
  if (authorityPolicy === undefined) {
    return { status: "HOLD", reason: "UNRESOLVED_AUTHORITY_POLICY" };
  }

  return {
    status: "EXPLAINED",
    projectId: project.projectId,
    taskId: task.taskId,
    capabilityRefs: requiredCapabilities,
    adapterRef: adapter.adapterRef,
    workerId: worker.workerId,
    authorityPolicyRef: authorityPolicy.authorityPolicyRef,
    humanGateRequired: authorityPolicy.humanGateRequired,
    executionAuthorized: false,
  };
}
