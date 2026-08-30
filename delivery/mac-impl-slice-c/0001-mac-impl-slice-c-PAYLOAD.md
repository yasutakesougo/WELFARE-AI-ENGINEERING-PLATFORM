# 0001-mac-impl-slice-c-24a3937680a25c8e0a5ce5e136dd1c98395d1f51.patch

```text
SHA-256: e307fb24037dc40e8ece2077f30b78485cb2bee60324716bc513f15bb6d6099c
Bytes: 61903
From: 24a3937680a25c8e0a5ce5e136dd1c98395d1f51
Base: f146e6544ba16f19be7237691a7d43efa955c36c
```

Save the following fenced content (excluding fences) as the patch file.

```diff
From 24a3937680a25c8e0a5ce5e136dd1c98395d1f51 Mon Sep 17 00:00:00 2001
From: Cursor Agent <cursoragent@cursor.com>
Date: Sun, 30 Aug 2026 10:51:26 +0000
Subject: [PATCH] feat: implement MULTI-AGENT-COORDINATION-V1 Slice C
 shared-state binding
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

Add pure FULL shared-state snapshot parser/validator with lifecycle matrix,
bounded evidence attribution, snapshotDigest, and embedded progression
decision identity checks. Preserve Slice A/B behavior; cover C01–C47.
---
 src/domain/multiAgentCoordination.ts | 734 ++++++++++++++++++++++
 test/multiAgentCoordination.test.ts  | 891 +++++++++++++++++++++++++++
 2 files changed, 1625 insertions(+)

diff --git a/src/domain/multiAgentCoordination.ts b/src/domain/multiAgentCoordination.ts
index a7bc582..2e08f8d 100644
--- a/src/domain/multiAgentCoordination.ts
+++ b/src/domain/multiAgentCoordination.ts
@@ -12,6 +12,12 @@ export const MULTI_AGENT_COORDINATION_PROGRESSION_INPUT_SCHEMA =
   "MULTI-AGENT-COORDINATION-PROGRESSION-INPUT-V1" as const;
 export const MULTI_AGENT_COORDINATION_PROGRESSION_DECISION_SCHEMA =
   "MULTI-AGENT-COORDINATION-PROGRESSION-DECISION-V1" as const;
+export const MULTI_AGENT_COORDINATION_SHARED_STATE_SNAPSHOT_SCHEMA =
+  "MULTI-AGENT-COORDINATION-SHARED-STATE-SNAPSHOT-V1" as const;
+export const MULTI_AGENT_COORDINATION_SHARED_STATE_DIGEST_DOMAIN =
+  "MAC_SHARED_STATE_SNAPSHOT_V1" as const;
+export const MULTI_AGENT_COORDINATION_PROGRESSION_DECISION_DIGEST_DOMAIN =
+  "MAC_PROGRESSION_DECISION_V1" as const;
 
 export const MULTI_AGENT_COORDINATION_ID_MAX = 128 as const;
 export const MULTI_AGENT_COORDINATION_TASK_REFS_MAX = 32 as const;
@@ -22,9 +28,12 @@ export const MULTI_AGENT_COORDINATION_CONCURRENCY_REFS_MAX = 16 as const;
 export const MULTI_AGENT_COORDINATION_SOURCE_ID_MAX = 128 as const;
 export const MULTI_AGENT_COORDINATION_CONCURRENCY_MAX = 32 as const;
 export const MULTI_AGENT_COORDINATION_TIMESTAMP_MAX = 64 as const;
+export const MULTI_AGENT_COORDINATION_EVIDENCE_BINDINGS_MAX = 32 as const;
 
 /** Slice B implements only the pure progression evaluator. Execution surfaces remain disabled. */
 export const MULTI_AGENT_COORDINATION_PROGRESSION_EVALUATOR_IMPLEMENTED = true as const;
+/** Slice C implements only pure shared-state snapshot binding validation. */
+export const MULTI_AGENT_COORDINATION_SHARED_STATE_BINDING_IMPLEMENTED = true as const;
 export const MULTI_AGENT_COORDINATION_EXECUTION_IMPLEMENTED = false as const;
 export const MULTI_AGENT_COORDINATION_PROVIDER_INVOCATION_IMPLEMENTED = false as const;
 export const MULTI_AGENT_COORDINATION_HARNESS_INVOCATION_IMPLEMENTED = false as const;
@@ -231,6 +240,53 @@ export interface CoordinationProgressionDecisionV1 {
   coordinationProgressionReason: CoordinationProgressionReasonV1;
 }
 
+export type CoordinationEvidenceOwnerScopeV1 = "COORDINATION" | "TASK";
+export type CoordinationEvidenceKindV1 = "EVIDENCE" | "AUDIT";
+
+export interface CoordinationEvidenceBindingV1 {
+  ref: string;
+  evidenceDigest: string;
+  ownerScope: CoordinationEvidenceOwnerScopeV1;
+  coordinationId: string;
+  taskId: string | null;
+  kind: CoordinationEvidenceKindV1;
+  sourceId: string;
+}
+
+export interface CoordinationTaskStateBindingV1 {
+  taskId: string;
+  taskRoutingFingerprint: string;
+  workerId: string | null;
+  workerAuthorityFingerprint: string | null;
+  routingDecisionFingerprint: string | null;
+  humanDecisionRef: string | null;
+  executionAuthorizationRef: string | null;
+  executionAttemptId: string | null;
+  executionOutcomeRef: string | null;
+  resultValidationRef: string | null;
+  resourceLockDecisionRef: string | null;
+  coordinationProgressionStatus: CoordinationProgressionStatusV1;
+  progressionDecision: CoordinationProgressionDecisionV1;
+  progressionDecisionRef: string;
+  progressionDecisionFingerprint: string;
+  evidenceBindings: CoordinationEvidenceBindingV1[];
+}
+
+export interface CoordinationSharedStateSnapshotV1 {
+  schemaVersion: typeof MULTI_AGENT_COORDINATION_SHARED_STATE_SNAPSHOT_SCHEMA;
+  snapshotDigest: string;
+  coordinationId: string;
+  coordinationPlanFingerprint: string;
+  taskStates: CoordinationTaskStateBindingV1[];
+  coordinationEvidenceBindings: CoordinationEvidenceBindingV1[];
+  auditBindings: CoordinationEvidenceBindingV1[];
+}
+
+export type CoordinationSharedStateSnapshotDigestPayloadV1 = Omit<
+  CoordinationSharedStateSnapshotV1,
+  "snapshotDigest"
+>;
+
 export interface CoordinationPlanBindingV1 {
   plan: CoordinationPlanV1;
   coordinationPlanFingerprint: string;
@@ -422,6 +478,17 @@ async function sha256Canonical(value: unknown): Promise<string> {
     .join("");
 }
 
+async function sha256DomainSeparated(domain: string, value: unknown): Promise<string> {
+  const payload = `${domain}\n${canonicalJson(value)}`;
+  const digest = await crypto.subtle.digest(
+    "SHA-256",
+    new TextEncoder().encode(payload),
+  );
+  return [...new Uint8Array(digest)]
+    .map((byte) => byte.toString(16).padStart(2, "0"))
+    .join("");
+}
+
 export async function computeCoordinationPlanFingerprint(
   plan: CoordinationPlanV1,
 ): Promise<string> {
@@ -998,3 +1065,670 @@ export function parseCoordinationProgressionDecisionV1(
     },
   };
 }
+
+const SHARED_STATE_SNAPSHOT_KEYS = [
+  "schemaVersion",
+  "snapshotDigest",
+  "coordinationId",
+  "coordinationPlanFingerprint",
+  "taskStates",
+  "coordinationEvidenceBindings",
+  "auditBindings",
+] as const;
+
+const TASK_STATE_BINDING_KEYS = [
+  "taskId",
+  "taskRoutingFingerprint",
+  "workerId",
+  "workerAuthorityFingerprint",
+  "routingDecisionFingerprint",
+  "humanDecisionRef",
+  "executionAuthorizationRef",
+  "executionAttemptId",
+  "executionOutcomeRef",
+  "resultValidationRef",
+  "resourceLockDecisionRef",
+  "coordinationProgressionStatus",
+  "progressionDecision",
+  "progressionDecisionRef",
+  "progressionDecisionFingerprint",
+  "evidenceBindings",
+] as const;
+
+const EVIDENCE_BINDING_KEYS = [
+  "ref",
+  "evidenceDigest",
+  "ownerScope",
+  "coordinationId",
+  "taskId",
+  "kind",
+  "sourceId",
+] as const;
+
+type LifecycleRefRequirementV1 = "R" | "O" | "N";
+
+type LifecycleMatrixRowV1 = {
+  workerId: LifecycleRefRequirementV1;
+  workerAuthorityFingerprint: LifecycleRefRequirementV1;
+  routingDecisionFingerprint: LifecycleRefRequirementV1;
+  humanDecisionRef: LifecycleRefRequirementV1;
+  executionAuthorizationRef: LifecycleRefRequirementV1;
+  executionAttemptId: LifecycleRefRequirementV1;
+  executionOutcomeRef: LifecycleRefRequirementV1;
+  resultValidationRef: LifecycleRefRequirementV1;
+  resourceLockDecisionRef: LifecycleRefRequirementV1;
+  evidenceBindings: LifecycleRefRequirementV1;
+};
+
+const LIFECYCLE_REFERENCE_MATRIX: Record<
+  CoordinationProgressionStatusV1,
+  LifecycleMatrixRowV1
+> = {
+  PLANNED: {
+    workerId: "N",
+    workerAuthorityFingerprint: "N",
+    routingDecisionFingerprint: "N",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "N",
+    executionAttemptId: "N",
+    executionOutcomeRef: "N",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "N",
+    evidenceBindings: "O",
+  },
+  WAITING_DEPENDENCY: {
+    workerId: "O",
+    workerAuthorityFingerprint: "O",
+    routingDecisionFingerprint: "O",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "N",
+    executionAttemptId: "N",
+    executionOutcomeRef: "N",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "O",
+  },
+  WAITING_RESOURCE: {
+    workerId: "R",
+    workerAuthorityFingerprint: "R",
+    routingDecisionFingerprint: "R",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "N",
+    executionAttemptId: "N",
+    executionOutcomeRef: "N",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "R",
+    evidenceBindings: "O",
+  },
+  WAITING_HUMAN_GATE: {
+    workerId: "R",
+    workerAuthorityFingerprint: "R",
+    routingDecisionFingerprint: "R",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "N",
+    executionAttemptId: "N",
+    executionOutcomeRef: "N",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "O",
+  },
+  READY: {
+    workerId: "R",
+    workerAuthorityFingerprint: "R",
+    routingDecisionFingerprint: "R",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "R",
+    executionAttemptId: "N",
+    executionOutcomeRef: "N",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "O",
+  },
+  RUNNING: {
+    workerId: "R",
+    workerAuthorityFingerprint: "R",
+    routingDecisionFingerprint: "R",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "R",
+    executionAttemptId: "R",
+    executionOutcomeRef: "O",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "O",
+  },
+  HOLD: {
+    workerId: "O",
+    workerAuthorityFingerprint: "O",
+    routingDecisionFingerprint: "O",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "O",
+    executionAttemptId: "N",
+    executionOutcomeRef: "N",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "O",
+  },
+  NOT_EXECUTED: {
+    workerId: "O",
+    workerAuthorityFingerprint: "O",
+    routingDecisionFingerprint: "O",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "R",
+    executionAttemptId: "N",
+    executionOutcomeRef: "N",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "O",
+  },
+  CANCELLED: {
+    workerId: "O",
+    workerAuthorityFingerprint: "O",
+    routingDecisionFingerprint: "O",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "O",
+    executionAttemptId: "N",
+    executionOutcomeRef: "N",
+    resultValidationRef: "N",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "O",
+  },
+  FAILED: {
+    workerId: "R",
+    workerAuthorityFingerprint: "R",
+    routingDecisionFingerprint: "R",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "R",
+    executionAttemptId: "R",
+    executionOutcomeRef: "R",
+    resultValidationRef: "O",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "R",
+  },
+  SUCCEEDED: {
+    workerId: "R",
+    workerAuthorityFingerprint: "R",
+    routingDecisionFingerprint: "R",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "R",
+    executionAttemptId: "R",
+    executionOutcomeRef: "R",
+    resultValidationRef: "R",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "R",
+  },
+  UNKNOWN: {
+    workerId: "O",
+    workerAuthorityFingerprint: "O",
+    routingDecisionFingerprint: "O",
+    humanDecisionRef: "O",
+    executionAuthorizationRef: "O",
+    executionAttemptId: "O",
+    executionOutcomeRef: "O",
+    resultValidationRef: "O",
+    resourceLockDecisionRef: "O",
+    evidenceBindings: "O",
+  },
+};
+
+function isSourceId(value: unknown): value is string {
+  return (
+    typeof value === "string" &&
+    value.length >= 1 &&
+    value.length <= MULTI_AGENT_COORDINATION_SOURCE_ID_MAX
+  );
+}
+
+function nullableOpaqueRef(value: unknown): value is string | null {
+  return value === null || isOpaqueRef(value);
+}
+
+function matchesNullableRefRequirement(
+  requirement: LifecycleRefRequirementV1,
+  value: string | null,
+): boolean {
+  if (requirement === "R") return isOpaqueRef(value);
+  if (requirement === "N") return value === null;
+  return nullableOpaqueRef(value);
+}
+
+function evidenceBindingIdentityTuple(binding: CoordinationEvidenceBindingV1): string {
+  return canonicalJson({
+    ref: binding.ref,
+    evidenceDigest: binding.evidenceDigest,
+    ownerScope: binding.ownerScope,
+    coordinationId: binding.coordinationId,
+    taskId: binding.taskId,
+    kind: binding.kind,
+    sourceId: binding.sourceId,
+  });
+}
+
+function evidenceOwnerIdentity(binding: CoordinationEvidenceBindingV1): string {
+  return canonicalJson({
+    ownerScope: binding.ownerScope,
+    coordinationId: binding.coordinationId,
+    taskId: binding.taskId,
+    kind: binding.kind,
+  });
+}
+
+function parseEvidenceBindingV1(
+  raw: unknown,
+): CoordinationParseResultV1<CoordinationEvidenceBindingV1> {
+  if (!isPlainObject(raw) || !hasExactKeys(raw, EVIDENCE_BINDING_KEYS)) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+  if (
+    !isOpaqueRef(raw.ref) ||
+    !isFingerprint(raw.evidenceDigest) ||
+    (raw.ownerScope !== "COORDINATION" && raw.ownerScope !== "TASK") ||
+    !isLocalId(raw.coordinationId) ||
+    (raw.taskId !== null && !isAgentTaskId(raw.taskId)) ||
+    (raw.kind !== "EVIDENCE" && raw.kind !== "AUDIT") ||
+    !isSourceId(raw.sourceId)
+  ) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+  if (raw.ownerScope === "COORDINATION" && raw.taskId !== null) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+  if (raw.ownerScope === "TASK" && raw.taskId === null) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+  return {
+    ok: true,
+    value: {
+      ref: raw.ref,
+      evidenceDigest: raw.evidenceDigest,
+      ownerScope: raw.ownerScope,
+      coordinationId: raw.coordinationId,
+      taskId: raw.taskId as string | null,
+      kind: raw.kind,
+      sourceId: raw.sourceId,
+    },
+  };
+}
+
+function parseEvidenceBindingArrayV1(
+  raw: unknown,
+): CoordinationParseResultV1<CoordinationEvidenceBindingV1[]> {
+  if (
+    !Array.isArray(raw) ||
+    raw.length > MULTI_AGENT_COORDINATION_EVIDENCE_BINDINGS_MAX
+  ) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+  const bindings: CoordinationEvidenceBindingV1[] = [];
+  for (const item of raw) {
+    const parsed = parseEvidenceBindingV1(item);
+    if (!parsed.ok) return parsed;
+    bindings.push(parsed.value);
+  }
+  return { ok: true, value: bindings };
+}
+
+function lifecycleMatrixIsCoherent(task: CoordinationTaskStateBindingV1): boolean {
+  const matrix = LIFECYCLE_REFERENCE_MATRIX[task.coordinationProgressionStatus];
+  if (
+    !matchesNullableRefRequirement(matrix.workerId, task.workerId) ||
+    !matchesNullableRefRequirement(
+      matrix.workerAuthorityFingerprint,
+      task.workerAuthorityFingerprint,
+    ) ||
+    !matchesNullableRefRequirement(
+      matrix.routingDecisionFingerprint,
+      task.routingDecisionFingerprint,
+    ) ||
+    !matchesNullableRefRequirement(matrix.humanDecisionRef, task.humanDecisionRef) ||
+    !matchesNullableRefRequirement(
+      matrix.executionAuthorizationRef,
+      task.executionAuthorizationRef,
+    ) ||
+    !matchesNullableRefRequirement(matrix.executionAttemptId, task.executionAttemptId) ||
+    !matchesNullableRefRequirement(matrix.executionOutcomeRef, task.executionOutcomeRef) ||
+    !matchesNullableRefRequirement(matrix.resultValidationRef, task.resultValidationRef) ||
+    !matchesNullableRefRequirement(
+      matrix.resourceLockDecisionRef,
+      task.resourceLockDecisionRef,
+    )
+  ) {
+    return false;
+  }
+
+  if (matrix.evidenceBindings === "R" && task.evidenceBindings.length < 1) return false;
+  if (matrix.evidenceBindings === "N" && task.evidenceBindings.length > 0) return false;
+
+  const workerNull = task.workerId === null;
+  const authorityNull = task.workerAuthorityFingerprint === null;
+  const routingNull = task.routingDecisionFingerprint === null;
+  if (workerNull !== authorityNull || workerNull !== routingNull) return false;
+  if (!workerNull) {
+    if (!isFingerprint(task.workerAuthorityFingerprint)) return false;
+    if (!isFingerprint(task.routingDecisionFingerprint)) return false;
+  }
+
+  if (task.executionAttemptId !== null && task.executionAuthorizationRef === null) {
+    return false;
+  }
+  if (task.executionOutcomeRef !== null && task.executionAttemptId === null) {
+    return false;
+  }
+  if (task.resultValidationRef !== null && task.executionOutcomeRef === null) {
+    return false;
+  }
+  if (
+    task.coordinationProgressionStatus === "SUCCEEDED" &&
+    (task.executionOutcomeRef === null ||
+      task.resultValidationRef === null ||
+      task.evidenceBindings.length < 1)
+  ) {
+    return false;
+  }
+  if (
+    task.coordinationProgressionStatus === "FAILED" &&
+    (task.executionOutcomeRef === null || task.evidenceBindings.length < 1)
+  ) {
+    return false;
+  }
+  if (
+    task.coordinationProgressionStatus === "RUNNING" &&
+    task.resultValidationRef !== null
+  ) {
+    return false;
+  }
+  if (
+    task.coordinationProgressionStatus === "NOT_EXECUTED" &&
+    (task.executionAttemptId !== null ||
+      task.executionOutcomeRef !== null ||
+      task.resultValidationRef !== null)
+  ) {
+    return false;
+  }
+  if (
+    task.coordinationProgressionStatus === "PLANNED" &&
+    (task.workerId !== null ||
+      task.workerAuthorityFingerprint !== null ||
+      task.routingDecisionFingerprint !== null ||
+      task.executionAuthorizationRef !== null ||
+      task.executionAttemptId !== null ||
+      task.executionOutcomeRef !== null ||
+      task.resultValidationRef !== null ||
+      task.resourceLockDecisionRef !== null)
+  ) {
+    return false;
+  }
+
+  return true;
+}
+
+async function parseTaskStateBindingV1(
+  raw: unknown,
+  snapshotCoordinationId: string,
+  snapshotPlanFingerprint: string,
+  admittedTask: CoordinationTaskRefV1,
+): Promise<CoordinationParseResultV1<CoordinationTaskStateBindingV1>> {
+  if (!isPlainObject(raw) || !hasExactKeys(raw, TASK_STATE_BINDING_KEYS)) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+  if (
+    !isAgentTaskId(raw.taskId) ||
+    !isFingerprint(raw.taskRoutingFingerprint) ||
+    (raw.workerId !== null && !isLocalId(raw.workerId)) ||
+    (raw.workerAuthorityFingerprint !== null && !isFingerprint(raw.workerAuthorityFingerprint)) ||
+    (raw.routingDecisionFingerprint !== null && !isFingerprint(raw.routingDecisionFingerprint)) ||
+    !nullableOpaqueRef(raw.humanDecisionRef) ||
+    !nullableOpaqueRef(raw.executionAuthorizationRef) ||
+    !nullableOpaqueRef(raw.executionAttemptId) ||
+    !nullableOpaqueRef(raw.executionOutcomeRef) ||
+    !nullableOpaqueRef(raw.resultValidationRef) ||
+    !nullableOpaqueRef(raw.resourceLockDecisionRef) ||
+    !includesValue(PROGRESSION_STATUSES, raw.coordinationProgressionStatus) ||
+    !isOpaqueRef(raw.progressionDecisionRef) ||
+    !isFingerprint(raw.progressionDecisionFingerprint)
+  ) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+
+  const evidenceParsed = parseEvidenceBindingArrayV1(raw.evidenceBindings);
+  if (!evidenceParsed.ok) return evidenceParsed;
+
+  const decisionParsed = parseCoordinationProgressionDecisionV1(raw.progressionDecision);
+  if (!decisionParsed.ok) return decisionParsed;
+  const progressionDecision = decisionParsed.value;
+
+  const expectedFingerprint = await computeCoordinationProgressionDecisionFingerprint(
+    progressionDecision,
+  );
+  if (raw.progressionDecisionFingerprint !== expectedFingerprint) {
+    return { ok: false, reason: "REJECTED_BINDING" };
+  }
+  if (
+    progressionDecision.coordinationId !== snapshotCoordinationId ||
+    progressionDecision.coordinationPlanFingerprint !== snapshotPlanFingerprint ||
+    progressionDecision.taskId !== raw.taskId ||
+    progressionDecision.coordinationProgressionStatus !== raw.coordinationProgressionStatus
+  ) {
+    return { ok: false, reason: "REJECTED_BINDING" };
+  }
+  if (raw.taskId !== admittedTask.taskId) {
+    return { ok: false, reason: "REJECTED_BINDING" };
+  }
+  if (raw.taskRoutingFingerprint !== admittedTask.taskRoutingFingerprint) {
+    return { ok: false, reason: "REJECTED_BINDING" };
+  }
+
+  for (const evidence of evidenceParsed.value) {
+    if (evidence.coordinationId !== snapshotCoordinationId) {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+    if (evidence.kind !== "EVIDENCE") {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+    if (evidence.ownerScope !== "TASK" || evidence.taskId !== raw.taskId) {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+  }
+
+  const taskState: CoordinationTaskStateBindingV1 = {
+    taskId: raw.taskId,
+    taskRoutingFingerprint: raw.taskRoutingFingerprint,
+    workerId: raw.workerId as string | null,
+    workerAuthorityFingerprint: raw.workerAuthorityFingerprint as string | null,
+    routingDecisionFingerprint: raw.routingDecisionFingerprint as string | null,
+    humanDecisionRef: raw.humanDecisionRef as string | null,
+    executionAuthorizationRef: raw.executionAuthorizationRef as string | null,
+    executionAttemptId: raw.executionAttemptId as string | null,
+    executionOutcomeRef: raw.executionOutcomeRef as string | null,
+    resultValidationRef: raw.resultValidationRef as string | null,
+    resourceLockDecisionRef: raw.resourceLockDecisionRef as string | null,
+    coordinationProgressionStatus: raw.coordinationProgressionStatus,
+    progressionDecision,
+    progressionDecisionRef: raw.progressionDecisionRef,
+    progressionDecisionFingerprint: raw.progressionDecisionFingerprint,
+    evidenceBindings: evidenceParsed.value,
+  };
+
+  if (!lifecycleMatrixIsCoherent(taskState)) {
+    return { ok: false, reason: "REJECTED_CONTRADICTION" };
+  }
+
+  return { ok: true, value: taskState };
+}
+
+function validateGlobalEvidenceBindings(
+  bindings: readonly CoordinationEvidenceBindingV1[],
+): CoordinationParseReasonV1 | null {
+  const exactTuples = new Set<string>();
+  const digestByRef = new Map<string, string>();
+  const ownerByIdentity = new Map<string, string>();
+
+  for (const binding of bindings) {
+    const exact = evidenceBindingIdentityTuple(binding);
+    if (exactTuples.has(exact)) return "REJECTED_CONTRADICTION";
+    exactTuples.add(exact);
+
+    const priorDigest = digestByRef.get(binding.ref);
+    if (priorDigest !== undefined && priorDigest !== binding.evidenceDigest) {
+      return "REJECTED_CONTRADICTION";
+    }
+    digestByRef.set(binding.ref, binding.evidenceDigest);
+
+    const immutableIdentity = canonicalJson({
+      ref: binding.ref,
+      evidenceDigest: binding.evidenceDigest,
+    });
+    const owner = evidenceOwnerIdentity(binding);
+    const priorOwner = ownerByIdentity.get(immutableIdentity);
+    if (priorOwner !== undefined && priorOwner !== owner) {
+      return "REJECTED_CONTRADICTION";
+    }
+    ownerByIdentity.set(immutableIdentity, owner);
+  }
+
+  return null;
+}
+
+export async function computeCoordinationProgressionDecisionFingerprint(
+  decision: CoordinationProgressionDecisionV1,
+): Promise<string> {
+  return sha256DomainSeparated(
+    MULTI_AGENT_COORDINATION_PROGRESSION_DECISION_DIGEST_DOMAIN,
+    decision,
+  );
+}
+
+export async function computeCoordinationSharedStateSnapshotDigest(
+  payload: CoordinationSharedStateSnapshotDigestPayloadV1,
+): Promise<string> {
+  return sha256DomainSeparated(
+    MULTI_AGENT_COORDINATION_SHARED_STATE_DIGEST_DOMAIN,
+    payload,
+  );
+}
+
+export async function parseCoordinationSharedStateSnapshotV1(
+  raw: unknown,
+  binding: CoordinationPlanBindingV1,
+): Promise<CoordinationParseResultV1<CoordinationSharedStateSnapshotV1>> {
+  if (!isPlainObject(raw) || !hasExactKeys(raw, SHARED_STATE_SNAPSHOT_KEYS)) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+  if (
+    raw.schemaVersion !== MULTI_AGENT_COORDINATION_SHARED_STATE_SNAPSHOT_SCHEMA ||
+    !isFingerprint(raw.snapshotDigest) ||
+    !isLocalId(raw.coordinationId) ||
+    !isFingerprint(raw.coordinationPlanFingerprint) ||
+    !Array.isArray(raw.taskStates) ||
+    raw.taskStates.length > MULTI_AGENT_COORDINATION_TASK_REFS_MAX
+  ) {
+    return { ok: false, reason: "REJECTED_SCHEMA" };
+  }
+
+  if (
+    raw.coordinationId !== binding.plan.coordinationId ||
+    raw.coordinationPlanFingerprint !== binding.coordinationPlanFingerprint
+  ) {
+    return { ok: false, reason: "REJECTED_BINDING" };
+  }
+
+  const admittedById = new Map(
+    binding.plan.taskRefs.map((task) => [task.taskId, task] as const),
+  );
+  if (raw.taskStates.length !== admittedById.size) {
+    return { ok: false, reason: "REJECTED_BINDING" };
+  }
+
+  const taskStates: CoordinationTaskStateBindingV1[] = [];
+  const seenTaskIds = new Set<string>();
+  for (const item of raw.taskStates) {
+    if (!isPlainObject(item) || typeof item.taskId !== "string") {
+      return { ok: false, reason: "REJECTED_SCHEMA" };
+    }
+    if (seenTaskIds.has(item.taskId)) {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+    seenTaskIds.add(item.taskId);
+    const admitted = admittedById.get(item.taskId);
+    if (!admitted) {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+    const parsedTask = await parseTaskStateBindingV1(
+      item,
+      raw.coordinationId,
+      raw.coordinationPlanFingerprint,
+      admitted,
+    );
+    if (!parsedTask.ok) return parsedTask;
+    taskStates.push(parsedTask.value);
+  }
+  for (const admittedTaskId of admittedById.keys()) {
+    if (!seenTaskIds.has(admittedTaskId)) {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+  }
+
+  const coordinationEvidenceParsed = parseEvidenceBindingArrayV1(
+    raw.coordinationEvidenceBindings,
+  );
+  if (!coordinationEvidenceParsed.ok) return coordinationEvidenceParsed;
+  for (const evidence of coordinationEvidenceParsed.value) {
+    if (evidence.coordinationId !== raw.coordinationId) {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+    if (evidence.kind !== "EVIDENCE") {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+    if (evidence.ownerScope !== "COORDINATION" || evidence.taskId !== null) {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+  }
+
+  const auditParsed = parseEvidenceBindingArrayV1(raw.auditBindings);
+  if (!auditParsed.ok) return auditParsed;
+  for (const audit of auditParsed.value) {
+    if (audit.coordinationId !== raw.coordinationId) {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+    if (audit.kind !== "AUDIT") {
+      return { ok: false, reason: "REJECTED_BINDING" };
+    }
+    if (audit.ownerScope === "COORDINATION") {
+      if (audit.taskId !== null) return { ok: false, reason: "REJECTED_BINDING" };
+    } else if (audit.ownerScope === "TASK") {
+      if (audit.taskId === null || !admittedById.has(audit.taskId)) {
+        return { ok: false, reason: "REJECTED_BINDING" };
+      }
+    } else {
+      return { ok: false, reason: "REJECTED_SCHEMA" };
+    }
+  }
+
+  const globalEvidence = [
+    ...taskStates.flatMap((task) => task.evidenceBindings),
+    ...coordinationEvidenceParsed.value,
+    ...auditParsed.value,
+  ];
+  const globalFailure = validateGlobalEvidenceBindings(globalEvidence);
+  if (globalFailure) return { ok: false, reason: globalFailure };
+
+  const payload: CoordinationSharedStateSnapshotDigestPayloadV1 = {
+    schemaVersion: MULTI_AGENT_COORDINATION_SHARED_STATE_SNAPSHOT_SCHEMA,
+    coordinationId: raw.coordinationId,
+    coordinationPlanFingerprint: raw.coordinationPlanFingerprint,
+    taskStates,
+    coordinationEvidenceBindings: coordinationEvidenceParsed.value,
+    auditBindings: auditParsed.value,
+  };
+  const expectedDigest = await computeCoordinationSharedStateSnapshotDigest(payload);
+  if (raw.snapshotDigest !== expectedDigest) {
+    return { ok: false, reason: "REJECTED_BINDING" };
+  }
+
+  return {
+    ok: true,
+    value: {
+      ...payload,
+      snapshotDigest: raw.snapshotDigest,
+    },
+  };
+}
diff --git a/test/multiAgentCoordination.test.ts b/test/multiAgentCoordination.test.ts
index cba7d83..f2442da 100644
--- a/test/multiAgentCoordination.test.ts
+++ b/test/multiAgentCoordination.test.ts
@@ -932,3 +932,894 @@ describe("MULTI-AGENT-COORDINATION-V1 Slice B", () => {
     ).toEqual({ ok: false, reason: "REJECTED_CONTRADICTION" });
   });
 });
+
+describe("MULTI-AGENT-COORDINATION-V1 Slice C", () => {
+  const DIGEST_A = "d".repeat(64);
+  const DIGEST_B = "e".repeat(64);
+  const DIGEST_C = "f".repeat(64);
+
+  function twoTaskPlan(): CoordinationPlanV1 {
+    return plan({
+      taskRefs: [
+        {
+          taskId: "task-a",
+          taskRoutingFingerprint: FPA,
+          dependencyTaskIds: [],
+          coordinationMode: "SEQUENTIAL",
+        },
+        {
+          taskId: "task-b",
+          taskRoutingFingerprint: FPB,
+          dependencyTaskIds: ["task-a"],
+          coordinationMode: "SEQUENTIAL",
+        },
+      ],
+    });
+  }
+
+  function decisionFor(
+    current: CoordinationPlanBindingV1,
+    taskId: string,
+    status: coordinationModule.CoordinationProgressionStatusV1,
+    reason: coordinationModule.CoordinationProgressionReasonV1 = "PLAN_ADMITTED",
+  ): coordinationModule.CoordinationProgressionDecisionV1 {
+    return {
+      schemaVersion: MULTI_AGENT_COORDINATION_PROGRESSION_DECISION_SCHEMA,
+      coordinationId: current.plan.coordinationId,
+      coordinationPlanFingerprint: current.coordinationPlanFingerprint,
+      taskId,
+      coordinationProgressionStatus: status,
+      coordinationProgressionReason: reason,
+    };
+  }
+
+  async function withProgression(
+    current: CoordinationPlanBindingV1,
+    taskId: string,
+    status: coordinationModule.CoordinationProgressionStatusV1,
+    reason: coordinationModule.CoordinationProgressionReasonV1,
+    rest: Partial<coordinationModule.CoordinationTaskStateBindingV1>,
+  ): Promise<coordinationModule.CoordinationTaskStateBindingV1> {
+    const progressionDecision = rest.progressionDecision ?? decisionFor(current, taskId, status, reason);
+    const progressionDecisionFingerprint =
+      rest.progressionDecisionFingerprint ??
+      (await coordinationModule.computeCoordinationProgressionDecisionFingerprint(
+        progressionDecision,
+      ));
+    return {
+      taskId,
+      taskRoutingFingerprint:
+        current.plan.taskRefs.find((task) => task.taskId === taskId)?.taskRoutingFingerprint ??
+        FPA,
+      workerId: null,
+      workerAuthorityFingerprint: null,
+      routingDecisionFingerprint: null,
+      humanDecisionRef: null,
+      executionAuthorizationRef: null,
+      executionAttemptId: null,
+      executionOutcomeRef: null,
+      resultValidationRef: null,
+      resourceLockDecisionRef: null,
+      coordinationProgressionStatus: status,
+      progressionDecisionRef: `decision://${taskId}/${status}`,
+      evidenceBindings: [],
+      ...rest,
+      progressionDecision,
+      progressionDecisionFingerprint,
+    };
+  }
+
+  function evidence(
+    overrides: Partial<coordinationModule.CoordinationEvidenceBindingV1> &
+      Pick<coordinationModule.CoordinationEvidenceBindingV1, "ref" | "taskId" | "ownerScope" | "kind">,
+    coordinationId = "coordination-1",
+  ): coordinationModule.CoordinationEvidenceBindingV1 {
+    return {
+      evidenceDigest: DIGEST_A,
+      coordinationId,
+      sourceId: "source-1",
+      ...overrides,
+    };
+  }
+
+  async function snapshotPayload(
+    current: CoordinationPlanBindingV1,
+    taskStates: coordinationModule.CoordinationTaskStateBindingV1[],
+    coordinationEvidenceBindings: coordinationModule.CoordinationEvidenceBindingV1[] = [],
+    auditBindings: coordinationModule.CoordinationEvidenceBindingV1[] = [],
+  ): Promise<coordinationModule.CoordinationSharedStateSnapshotV1> {
+    const payload = {
+      schemaVersion: coordinationModule.MULTI_AGENT_COORDINATION_SHARED_STATE_SNAPSHOT_SCHEMA,
+      coordinationId: current.plan.coordinationId,
+      coordinationPlanFingerprint: current.coordinationPlanFingerprint,
+      taskStates,
+      coordinationEvidenceBindings,
+      auditBindings,
+    };
+    return {
+      ...payload,
+      snapshotDigest: await coordinationModule.computeCoordinationSharedStateSnapshotDigest(payload),
+    };
+  }
+
+  async function plannedSnapshot(
+    current: CoordinationPlanBindingV1,
+  ): Promise<coordinationModule.CoordinationSharedStateSnapshotV1> {
+    const taskStates = [];
+    for (const task of current.plan.taskRefs) {
+      taskStates.push(await withProgression(current, task.taskId, "PLANNED", "PLAN_ADMITTED", {}));
+    }
+    return snapshotPayload(current, taskStates);
+  }
+
+  it("C01 valid FULL snapshot bound to exact plan identity -> PASS", async () => {
+    const current = await binding(twoTaskPlan());
+    const snap = await plannedSnapshot(current);
+    const parsed = await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current);
+    expect(parsed.ok).toBe(true);
+    if (!parsed.ok) throw new Error(parsed.reason);
+    expect(parsed.value.taskStates.map((task) => task.taskId)).toEqual(["task-a", "task-b"]);
+  });
+
+  it("C02 coordinationId mismatch -> fail closed", async () => {
+    const current = await binding();
+    const snap = await plannedSnapshot(current);
+    expect(
+      (
+        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
+          { ...snap, coordinationId: "coordination-other", snapshotDigest: snap.snapshotDigest },
+          current,
+        )
+      ).ok,
+    ).toBe(false);
+  });
+
+  it("C03 plan fingerprint mismatch -> fail closed", async () => {
+    const current = await binding();
+    const snap = await plannedSnapshot(current);
+    expect(
+      (
+        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
+          { ...snap, coordinationPlanFingerprint: FPA },
+          current,
+        )
+      ).ok,
+    ).toBe(false);
+  });
+
+  it("C04 unknown taskId -> fail closed", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-other", "PLANNED", "PLAN_ADMITTED", {
+      taskRoutingFingerprint: FPA,
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C05 duplicate task binding -> fail closed", async () => {
+    const current = await binding(twoTaskPlan());
+    const a = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {});
+    const snap = await snapshotPayload(current, [a, a]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C06 taskRoutingFingerprint mismatch -> fail closed", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      taskRoutingFingerprint: FPB,
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C07 lifecycle matrix accepts OPTIONAL null refs", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "WAITING_DEPENDENCY", "DEPENDENCY_PENDING", {
+      workerId: null,
+      workerAuthorityFingerprint: null,
+      routingDecisionFingerprint: null,
+      resourceLockDecisionRef: null,
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(true);
+  });
+
+  it("C08 lifecycle matrix rejects missing REQUIRED ref", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "READY", "AUTHORIZED_NOT_INVOKED", {
+      workerId: "worker-a",
+      workerAuthorityFingerprint: FPC,
+      routingDecisionFingerprint: FPA,
+      executionAuthorizationRef: null,
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C09 lifecycle matrix rejects MUST_BE_NULL contradiction", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      resourceLockDecisionRef: "lock://1",
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C10 partial snapshot -> reject", async () => {
+    const current = await binding(twoTaskPlan());
+    const a = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {});
+    const snap = await snapshotPayload(current, [a]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C11 task evidence owner mismatch -> reject", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      evidenceBindings: [
+        evidence({
+          ref: "evidence://1",
+          ownerScope: "TASK",
+          taskId: "task-b",
+          kind: "EVIDENCE",
+        }),
+      ],
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C12 coordination evidence with task owner -> reject", async () => {
+    const current = await binding();
+    const snap = await snapshotPayload(current, [
+      await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {}),
+    ], [
+      evidence({
+        ref: "evidence://coord",
+        ownerScope: "TASK",
+        taskId: "task-a",
+        kind: "EVIDENCE",
+      }),
+    ]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C13 audit binding unknown task -> reject", async () => {
+    const current = await binding();
+    const snap = await snapshotPayload(
+      current,
+      [await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {})],
+      [],
+      [
+        evidence({
+          ref: "audit://1",
+          ownerScope: "TASK",
+          taskId: "task-missing",
+          kind: "AUDIT",
+          evidenceDigest: DIGEST_B,
+        }),
+      ],
+    );
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C14 duplicate evidence identity tuple -> reject", async () => {
+    const current = await binding();
+    const dup = evidence({
+      ref: "evidence://dup",
+      ownerScope: "TASK",
+      taskId: "task-a",
+      kind: "EVIDENCE",
+    });
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      evidenceBindings: [dup, dup],
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C15 array order preserved; no sort/dedupe/repair", async () => {
+    const current = await binding(twoTaskPlan());
+    const b = await withProgression(current, "task-b", "PLANNED", "PLAN_ADMITTED", {});
+    const a = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {});
+    const coord = [
+      evidence({
+        ref: "evidence://c2",
+        ownerScope: "COORDINATION",
+        taskId: null,
+        kind: "EVIDENCE",
+        evidenceDigest: DIGEST_B,
+        sourceId: "source-2",
+      }),
+      evidence({
+        ref: "evidence://c1",
+        ownerScope: "COORDINATION",
+        taskId: null,
+        kind: "EVIDENCE",
+        evidenceDigest: DIGEST_C,
+        sourceId: "source-1",
+      }),
+    ];
+    const snap = await snapshotPayload(current, [b, a], coord);
+    const parsed = await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current);
+    expect(parsed.ok).toBe(true);
+    if (!parsed.ok) throw new Error(parsed.reason);
+    expect(parsed.value.taskStates.map((task) => task.taskId)).toEqual(["task-b", "task-a"]);
+    expect(parsed.value.coordinationEvidenceBindings.map((item) => item.ref)).toEqual([
+      "evidence://c2",
+      "evidence://c1",
+    ]);
+  });
+
+  it("C16 bare ref cannot substitute for bounded attribution record", async () => {
+    const current = await binding();
+    const snap = await plannedSnapshot(current);
+    expect(
+      (
+        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
+          {
+            ...snap,
+            coordinationEvidenceBindings: ["evidence://bare"],
+          },
+          current,
+        )
+      ).ok,
+    ).toBe(false);
+  });
+
+  it("C17 progression identity mismatch -> fail closed", async () => {
+    const current = await binding();
+    const progressionDecision = decisionFor(current, "task-a", "READY", "AUTHORIZED_NOT_INVOKED");
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      progressionDecision,
+      progressionDecisionFingerprint:
+        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(
+          progressionDecision,
+        ),
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C18 snapshot validation changes no canonical execution/routing/policy result", async () => {
+    const current = await binding();
+    const before = evaluatedDecision(current, {
+      authorizationObservation: "WAITING_HUMAN_GATE",
+      executionAuthorizationRef: "evidence://human-gate",
+      dependencyEvaluation: "SATISFIED",
+      resourceConcurrencyEvaluation: "PASS",
+    });
+    const snap = await plannedSnapshot(current);
+    await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current);
+    const after = evaluatedDecision(current, {
+      authorizationObservation: "WAITING_HUMAN_GATE",
+      executionAuthorizationRef: "evidence://human-gate",
+      dependencyEvaluation: "SATISFIED",
+      resourceConcurrencyEvaluation: "PASS",
+    });
+    expect(after).toEqual(before);
+  });
+
+  it("C19 no exported persistence / dispatch / invoke / approve / merge / deploy API", () => {
+    const prohibited = /^(execute|dispatch|invoke|approve|merge|deploy|persist|write|append)/i;
+    expect(Object.keys(coordinationModule).filter((key) => prohibited.test(key))).toEqual([]);
+    expect(coordinationModule.MULTI_AGENT_COORDINATION_SHARED_STATE_BINDING_IMPLEMENTED).toBe(true);
+    expect(coordinationModule.MULTI_AGENT_COORDINATION_EXECUTION_IMPLEMENTED).toBe(false);
+  });
+
+  it("C20 existing Slice B progression evaluator behavior unchanged", async () => {
+    const current = await binding();
+    expect(
+      evaluatedDecision(current, {
+        authorizationObservation: "WAITING_HUMAN_GATE",
+        executionAuthorizationRef: "evidence://human-gate",
+        dependencyEvaluation: "SATISFIED",
+        resourceConcurrencyEvaluation: "PASS",
+      }),
+    ).toMatchObject({
+      coordinationProgressionStatus: "WAITING_HUMAN_GATE",
+      coordinationProgressionReason: "HUMAN_GATE_WAIT",
+    });
+  });
+
+  it("C21 SUCCEEDED missing resultValidationRef -> reject", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "SUCCEEDED", "EXECUTION_AND_RESULT_VALID", {
+      workerId: "worker-a",
+      workerAuthorityFingerprint: FPC,
+      routingDecisionFingerprint: FPA,
+      executionAuthorizationRef: "auth://1",
+      executionAttemptId: "attempt-1",
+      executionOutcomeRef: "outcome://1",
+      resultValidationRef: null,
+      evidenceBindings: [
+        evidence({
+          ref: "evidence://success",
+          ownerScope: "TASK",
+          taskId: "task-a",
+          kind: "EVIDENCE",
+        }),
+      ],
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C22 FAILED missing executionOutcomeRef/evidence -> reject", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "FAILED", "EXECUTION_FAILED", {
+      workerId: "worker-a",
+      workerAuthorityFingerprint: FPC,
+      routingDecisionFingerprint: FPA,
+      executionAuthorizationRef: "auth://1",
+      executionAttemptId: "attempt-1",
+      executionOutcomeRef: null,
+      evidenceBindings: [],
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C23 NOT_EXECUTED with executionAttemptId -> reject", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "NOT_EXECUTED", "AUTHORIZATION_DENIED", {
+      executionAuthorizationRef: "auth://deny",
+      executionAttemptId: "attempt-1",
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C24 PLANNED with routing/execution/resource ref -> reject", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      routingDecisionFingerprint: FPA,
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C25 WAITING_HUMAN_GATE with executionAuthorizationRef -> REJECT", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "WAITING_HUMAN_GATE", "HUMAN_GATE_WAIT", {
+      workerId: "worker-a",
+      workerAuthorityFingerprint: FPC,
+      routingDecisionFingerprint: FPA,
+      executionAuthorizationRef: "auth://should-not",
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C26 WAITING_HUMAN_GATE without executionAuthorizationRef -> accepted when other requirements hold", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "WAITING_HUMAN_GATE", "HUMAN_GATE_WAIT", {
+      workerId: "worker-a",
+      workerAuthorityFingerprint: FPC,
+      routingDecisionFingerprint: FPA,
+      humanDecisionRef: "human://gate-1",
+      executionAuthorizationRef: null,
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(true);
+  });
+
+  it("C27 humanDecisionRef never substitutes for executionAuthorizationRef", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "READY", "AUTHORIZED_NOT_INVOKED", {
+      workerId: "worker-a",
+      workerAuthorityFingerprint: FPC,
+      routingDecisionFingerprint: FPA,
+      humanDecisionRef: "human://go",
+      executionAuthorizationRef: null,
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C28 valid exact snapshotDigest -> PASS", async () => {
+    const current = await binding();
+    const snap = await plannedSnapshot(current);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(true);
+  });
+
+  it("C29 snapshotDigest mismatch -> REJECT", async () => {
+    const current = await binding();
+    const snap = await plannedSnapshot(current);
+    expect(
+      (
+        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
+          { ...snap, snapshotDigest: "1".repeat(64) },
+          current,
+        )
+      ).ok,
+    ).toBe(false);
+  });
+
+  it("C30 identical payload deterministically reproduces snapshotDigest", async () => {
+    const current = await binding();
+    const first = await plannedSnapshot(current);
+    const second = await plannedSnapshot(current);
+    expect(first.snapshotDigest).toBe(second.snapshotDigest);
+  });
+
+  it("C31 evidence binding missing evidenceDigest -> REJECT", async () => {
+    const current = await binding();
+    const snap = await plannedSnapshot(current);
+    const broken = {
+      ...snap,
+      coordinationEvidenceBindings: [
+        {
+          ref: "evidence://x",
+          ownerScope: "COORDINATION",
+          coordinationId: current.plan.coordinationId,
+          taskId: null,
+          kind: "EVIDENCE",
+          sourceId: "source-1",
+        },
+      ],
+    };
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(broken, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C32 same ref + conflicting evidenceDigest -> REJECT snapshot-wide", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      evidenceBindings: [
+        evidence({
+          ref: "evidence://same",
+          ownerScope: "TASK",
+          taskId: "task-a",
+          kind: "EVIDENCE",
+          evidenceDigest: DIGEST_A,
+        }),
+      ],
+    });
+    const snap = await snapshotPayload(current, [task], [
+      evidence({
+        ref: "evidence://same",
+        ownerScope: "COORDINATION",
+        taskId: null,
+        kind: "EVIDENCE",
+        evidenceDigest: DIGEST_B,
+      }),
+    ]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C33 progression status missing progressionDecisionRef/fingerprint -> REJECT", async () => {
+    const current = await binding();
+    const snap = await plannedSnapshot(current);
+    const brokenTask = { ...snap.taskStates[0] };
+    delete (brokenTask as { progressionDecisionRef?: string }).progressionDecisionRef;
+    expect(
+      (
+        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
+          { ...snap, taskStates: [brokenTask] },
+          current,
+        )
+      ).ok,
+    ).toBe(false);
+  });
+
+  it("C34 progression binding identity mismatch -> REJECT", async () => {
+    const current = await binding();
+    const wrong = decisionFor(current, "task-a", "HOLD", "AUTHORIZATION_HOLD");
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      progressionDecision: wrong,
+      progressionDecisionFingerprint:
+        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C35 duplicate evidence tuple across different arrays -> REJECT", async () => {
+    const current = await binding();
+    const shared = evidence({
+      ref: "evidence://shared",
+      ownerScope: "COORDINATION",
+      taskId: null,
+      kind: "EVIDENCE",
+      evidenceDigest: DIGEST_A,
+    });
+    // Exact tuple cannot appear in both coordination and audit arrays; audit requires AUDIT kind.
+    // Use identical AUDIT tuples across auditBindings duplication via task+top-level is tested with
+    // same AUDIT identity repeated.
+    const audit = evidence({
+      ref: "audit://shared",
+      ownerScope: "COORDINATION",
+      taskId: null,
+      kind: "AUDIT",
+      evidenceDigest: DIGEST_B,
+    });
+    const snap = await snapshotPayload(
+      current,
+      [await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {})],
+      [],
+      [audit, audit],
+    );
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+    void shared;
+  });
+
+  it("C36 global collision validation preserves original order", async () => {
+    const current = await binding();
+    const audits = [
+      evidence({
+        ref: "audit://2",
+        ownerScope: "COORDINATION",
+        taskId: null,
+        kind: "AUDIT",
+        evidenceDigest: DIGEST_B,
+        sourceId: "s2",
+      }),
+      evidence({
+        ref: "audit://1",
+        ownerScope: "COORDINATION",
+        taskId: null,
+        kind: "AUDIT",
+        evidenceDigest: DIGEST_C,
+        sourceId: "s1",
+      }),
+    ];
+    const snap = await snapshotPayload(
+      current,
+      [await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {})],
+      [],
+      audits,
+    );
+    const parsed = await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current);
+    expect(parsed.ok).toBe(true);
+    if (!parsed.ok) throw new Error(parsed.reason);
+    expect(parsed.value.auditBindings.map((item) => item.ref)).toEqual(["audit://2", "audit://1"]);
+  });
+
+  it("C37 existing Slice B B26 behavior remains unchanged", async () => {
+    const current = await binding();
+    expect(
+      evaluatedDecision(current, {
+        authorizationObservation: "WAITING_HUMAN_GATE",
+        executionAuthorizationRef: "evidence://human-gate",
+        dependencyEvaluation: "SATISFIED",
+        resourceConcurrencyEvaluation: "PASS",
+      }),
+    ).toMatchObject({
+      coordinationProgressionStatus: "WAITING_HUMAN_GATE",
+      coordinationProgressionReason: "HUMAN_GATE_WAIT",
+    });
+  });
+
+  it("C38 Slice C WAITING_HUMAN_GATE with executionAuthorizationRef != null -> REJECT", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "WAITING_HUMAN_GATE", "HUMAN_GATE_WAIT", {
+      workerId: "worker-a",
+      workerAuthorityFingerprint: FPC,
+      routingDecisionFingerprint: FPA,
+      executionAuthorizationRef: "evidence://human-gate",
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C39 Slice C WAITING_HUMAN_GATE with executionAuthorizationRef == null -> PASS when all other requirements hold", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "WAITING_HUMAN_GATE", "HUMAN_GATE_WAIT", {
+      workerId: "worker-a",
+      workerAuthorityFingerprint: FPC,
+      routingDecisionFingerprint: FPA,
+      executionAuthorizationRef: null,
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(true);
+  });
+
+  it("C40 Slice B input reference is not automatically copied into Slice C snapshot", async () => {
+    const current = await binding();
+    const sliceBInput = progressionInput(current, {
+      authorizationObservation: "WAITING_HUMAN_GATE",
+      executionAuthorizationRef: "evidence://human-gate",
+      dependencyEvaluation: "SATISFIED",
+      resourceConcurrencyEvaluation: "PASS",
+    });
+    const decision = evaluatedDecision(current, sliceBInput);
+    const task = await withProgression(
+      current,
+      "task-a",
+      decision.coordinationProgressionStatus,
+      decision.coordinationProgressionReason,
+      {
+        workerId: "worker-a",
+        workerAuthorityFingerprint: FPC,
+        routingDecisionFingerprint: FPA,
+        executionAuthorizationRef: null,
+        progressionDecision: decision,
+      },
+    );
+    expect(sliceBInput.executionAuthorizationRef).toBe("evidence://human-gate");
+    expect(task.executionAuthorizationRef).toBe(null);
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(true);
+  });
+
+  it("C41 humanDecisionRef does not substitute for executionAuthorizationRef in READY/RUNNING/FAILED/SUCCEEDED states", async () => {
+    const current = await binding();
+    for (const [status, reason] of [
+      ["READY", "AUTHORIZED_NOT_INVOKED"],
+      ["RUNNING", "EXECUTION_RUNNING"],
+      ["FAILED", "EXECUTION_FAILED"],
+      ["SUCCEEDED", "EXECUTION_AND_RESULT_VALID"],
+    ] as const) {
+      const task = await withProgression(current, "task-a", status, reason, {
+        workerId: "worker-a",
+        workerAuthorityFingerprint: FPC,
+        routingDecisionFingerprint: FPA,
+        humanDecisionRef: "human://decision",
+        executionAuthorizationRef: null,
+        executionAttemptId: status === "READY" ? null : "attempt-1",
+        executionOutcomeRef: status === "READY" || status === "RUNNING" ? null : "outcome://1",
+        resultValidationRef: status === "SUCCEEDED" ? "result://1" : null,
+        evidenceBindings:
+          status === "FAILED" || status === "SUCCEEDED"
+            ? [
+                evidence({
+                  ref: `evidence://${status}`,
+                  ownerScope: "TASK",
+                  taskId: "task-a",
+                  kind: "EVIDENCE",
+                  evidenceDigest: DIGEST_A,
+                }),
+              ]
+            : [],
+      });
+      const snap = await snapshotPayload(current, [task]);
+      expect(
+        (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+      ).toBe(false);
+    }
+  });
+
+  it("C42 bound progression decision identity is required independently of snapshot executionAuthorizationRef", async () => {
+    const current = await binding();
+    const snap = await plannedSnapshot(current);
+    const broken = {
+      ...snap.taskStates[0],
+      progressionDecisionRef: "",
+    };
+    expect(
+      (
+        await coordinationModule.parseCoordinationSharedStateSnapshotV1(
+          { ...snap, taskStates: [broken] },
+          current,
+        )
+      ).ok,
+    ).toBe(false);
+  });
+
+  it("C43 progressionDecisionFingerprint mismatch against supplied progressionDecision -> REJECT", async () => {
+    const current = await binding();
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      progressionDecisionFingerprint: "9".repeat(64),
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C44 progressionDecision taskId mismatch -> REJECT", async () => {
+    const current = await binding(twoTaskPlan());
+    const wrong = decisionFor(current, "task-b", "PLANNED", "PLAN_ADMITTED");
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      progressionDecision: wrong,
+      progressionDecisionFingerprint:
+        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
+    });
+    const b = await withProgression(current, "task-b", "PLANNED", "PLAN_ADMITTED", {});
+    const snap = await snapshotPayload(current, [task, b]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C45 progressionDecision coordinationId mismatch -> REJECT", async () => {
+    const current = await binding();
+    const wrong = {
+      ...decisionFor(current, "task-a", "PLANNED", "PLAN_ADMITTED"),
+      coordinationId: "coordination-other",
+    };
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      progressionDecision: wrong,
+      progressionDecisionFingerprint:
+        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C46 progressionDecision coordinationPlanFingerprint mismatch -> REJECT", async () => {
+    const current = await binding();
+    const wrong = {
+      ...decisionFor(current, "task-a", "PLANNED", "PLAN_ADMITTED"),
+      coordinationPlanFingerprint: FPA,
+    };
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      progressionDecision: wrong,
+      progressionDecisionFingerprint:
+        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+
+  it("C47 progressionDecision status mismatch -> REJECT", async () => {
+    const current = await binding();
+    const wrong = decisionFor(current, "task-a", "HOLD", "AUTHORIZATION_HOLD");
+    const task = await withProgression(current, "task-a", "PLANNED", "PLAN_ADMITTED", {
+      progressionDecision: wrong,
+      progressionDecisionFingerprint:
+        await coordinationModule.computeCoordinationProgressionDecisionFingerprint(wrong),
+    });
+    const snap = await snapshotPayload(current, [task]);
+    expect(
+      (await coordinationModule.parseCoordinationSharedStateSnapshotV1(snap, current)).ok,
+    ).toBe(false);
+  });
+});
-- 
2.43.0


```
