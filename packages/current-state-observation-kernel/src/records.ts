import { fail, mapFail, ok, type StructuredResult } from "./result.js";
import {
  CONTRACT,
  type BaseObservationFields,
  type BranchRelationObservationV1,
  type ContractType,
  type GateBoundObservationV1,
  type GateCriticalEvidenceItem,
  type GateFreshnessVerificationV1,
  type GateUseClaimV1,
  type ObservationIdentityBoundary,
  type ObservationResult,
  type PullRequestObservationV1,
  type RepositoryIdentity,
  type RepositoryObservationV1,
  type RetrievalProvenance,
  type SourceClass,
  type TerminalOutcomeV1
} from "./types.js";

const SOURCE_CLASSES: readonly SourceClass[] = [
  "REMOTE_AUTHORITATIVE",
  "REMOTE_DERIVED",
  "LOCAL_OBSERVATION",
  "COMPOSITE_VERIFIED"
];

const OBSERVATION_RESULTS: readonly ObservationResult[] = [
  "COMPLETE",
  "PARTIAL",
  "FAILED",
  "INVALIDATED"
];

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  input: Record<string, unknown>,
  field: string
): StructuredResult<string> {
  const value = input[field];
  if (value === undefined) {
    return fail("FAILED", { field, classification: "MISSING_FIELD", message: `${field} is required` });
  }
  if (typeof value !== "string" || value.length === 0) {
    return fail("FAILED", { field, classification: "INVALID_FIELD", message: `${field} must be a non-empty string` });
  }
  return ok(value);
}

function requiredIso(input: Record<string, unknown>, field: string): StructuredResult<string> {
  const value = requiredString(input, field);
  if (value.status !== "PASS" || value.value === undefined) {
    return value;
  }
  if (!ISO_8601.test(value.value)) {
    return fail("FAILED", {
      field,
      classification: "INVALID_FIELD",
      message: `${field} must be an ISO-8601 UTC timestamp`
    });
  }
  return ok(value.value);
}

function requiredBoolean(input: Record<string, unknown>, field: string): StructuredResult<boolean> {
  const value = input[field];
  if (value === undefined) {
    return fail("FAILED", { field, classification: "MISSING_FIELD", message: `${field} is required` });
  }
  if (typeof value !== "boolean") {
    return fail("FAILED", { field, classification: "INVALID_FIELD", message: `${field} must be a boolean` });
  }
  return ok(value);
}

function optionalString(input: Record<string, unknown>, field: string): StructuredResult<string | undefined> {
  const value = input[field];
  if (value === undefined) {
    return ok(undefined);
  }
  if (typeof value !== "string" || value.length === 0) {
    return fail("FAILED", { field, classification: "INVALID_FIELD", message: `${field} must be a non-empty string when present` });
  }
  return ok(value);
}

function readEnum<T extends string>(
  input: Record<string, unknown>,
  field: string,
  allowed: readonly T[]
): StructuredResult<T> {
  const value = requiredString(input, field);
  if (value.status !== "PASS" || value.value === undefined) {
    return mapFail(value);
  }
  if (!allowed.includes(value.value as T)) {
    return fail("FAILED", {
      field,
      classification: "INVALID_FIELD",
      message: `${field} is not a permitted value`
    });
  }
  return ok(value.value as T);
}

function readStringArray(input: Record<string, unknown>, field: string): StructuredResult<string[]> {
  const value = input[field];
  if (value === undefined) {
    return fail("FAILED", { field, classification: "MISSING_FIELD", message: `${field} is required` });
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return fail("FAILED", { field, classification: "INVALID_FIELD", message: `${field} must be a string array` });
  }
  return ok(value);
}

function readRepositoryIdentity(value: unknown): StructuredResult<RepositoryIdentity> {
  if (!isRecord(value)) {
    return fail("FAILED", { field: "repositoryIdentity", classification: "MISSING_FIELD" });
  }
  const repositoryId = requiredString(value, "repositoryId");
  const host = requiredString(value, "host");
  const owner = requiredString(value, "owner");
  const repository = requiredString(value, "repository");
  for (const part of [repositoryId, host, owner, repository]) {
    if (part.status !== "PASS" || part.value === undefined) {
      return mapFail(part);
    }
  }
  return ok({
    repositoryId: repositoryId.value as string,
    host: host.value as string,
    owner: owner.value as string,
    repository: repository.value as string
  });
}

function readProvenance(value: unknown): StructuredResult<RetrievalProvenance> {
  if (!isRecord(value)) {
    return fail("FAILED", { field: "retrievalProvenance", classification: "MISSING_FIELD" });
  }
  const sourceSystem = requiredString(value, "sourceSystem");
  const sourceMethod = requiredString(value, "sourceMethod");
  const sourceResource = requiredString(value, "sourceResource");
  const retrievedAt = requiredIso(value, "retrievedAt");
  for (const part of [sourceSystem, sourceMethod, sourceResource, retrievedAt]) {
    if (part.status !== "PASS" || part.value === undefined) {
      return mapFail(part);
    }
  }
  return ok({
    sourceSystem: sourceSystem.value as string,
    sourceMethod: sourceMethod.value as string,
    sourceResource: sourceResource.value as string,
    retrievedAt: retrievedAt.value as string
  });
}

function readIdentityBoundary(value: unknown, field: string): StructuredResult<ObservationIdentityBoundary> {
  if (!isRecord(value)) {
    return fail("FAILED", { field, classification: "MISSING_FIELD" });
  }
  const boundary: ObservationIdentityBoundary = {};
  for (const key of ["defaultBranchSha", "baseSha", "headSha"] as const) {
    const part = optionalString(value, key);
    if (part.status !== "PASS") {
      return fail("FAILED", { field: `${field}.${key}`, classification: part.classification, message: part.message });
    }
    if (part.value !== undefined) {
      boundary[key] = part.value;
    }
  }
  return ok(boundary);
}

const FAILURE_RESULTS: readonly ObservationResult[] = ["PARTIAL", "FAILED", "INVALIDATED"];

function readUnknownArray(input: Record<string, unknown>, field: string): StructuredResult<unknown[]> {
  const value = input[field];
  if (value === undefined) {
    return fail("FAILED", { field, classification: "MISSING_FIELD", message: `${field} is required` });
  }
  if (!Array.isArray(value)) {
    return fail("FAILED", { field, classification: "INVALID_FIELD", message: `${field} must be an array` });
  }
  return ok(value);
}

function readMutationAttempts(input: Record<string, unknown>): StructuredResult<0 | 1> {
  const value = input.mutationAttempts;
  if (value === undefined) {
    return fail("FAILED", {
      field: "mutationAttempts",
      classification: "MISSING_FIELD",
      message: "mutationAttempts is required and MUST NOT be inferred as 0"
    });
  }
  if (typeof value !== "number" || !Number.isInteger(value) || (value !== 0 && value !== 1)) {
    return fail("FAILED", {
      field: "mutationAttempts",
      classification: "INVALID_FIELD",
      message: "mutation attempts per observation <= 1; only integer 0 or 1 is permitted"
    });
  }
  return ok(value);
}

function readMutationPerformed(input: Record<string, unknown>): StructuredResult<boolean | "UNKNOWN"> {
  const value = input.mutationPerformed;
  if (value === undefined) {
    return fail("FAILED", { field: "mutationPerformed", classification: "MISSING_FIELD" });
  }
  if (value === true || value === false || value === "UNKNOWN") {
    return ok(value);
  }
  return fail("FAILED", {
    field: "mutationPerformed",
    classification: "INVALID_FIELD",
    message: "mutationPerformed MUST be true, false, or UNKNOWN"
  });
}

function readEvidenceComparison(value: unknown): StructuredResult<{
  requiredEvidence: GateCriticalEvidenceItem[];
  observedEvidence: GateCriticalEvidenceItem[];
  missingRequiredMembers: string[];
}> {
  if (!isRecord(value)) {
    return fail("FAILED", { field: "evidenceComparison", classification: "MISSING_FIELD" });
  }
  const requiredEvidence = readEvidenceItems(value.requiredEvidence, "evidenceComparison.requiredEvidence");
  const observedEvidence = readEvidenceItems(value.observedEvidence, "evidenceComparison.observedEvidence");
  const missingRequiredMembers = readStringArray(
    value as Record<string, unknown>,
    "missingRequiredMembers"
  );
  for (const part of [requiredEvidence, observedEvidence, missingRequiredMembers]) {
    if (part.status !== "PASS") {
      return mapFail(part);
    }
  }
  return ok({
    requiredEvidence: requiredEvidence.value as GateCriticalEvidenceItem[],
    observedEvidence: observedEvidence.value as GateCriticalEvidenceItem[],
    missingRequiredMembers: missingRequiredMembers.value as string[]
  });
}

function attachFailureFields<T extends BaseObservationFields>(
  record: T,
  input: Record<string, unknown>
): StructuredResult<T> {
  if (!FAILURE_RESULTS.includes(record.observationResult)) {
    return ok(record);
  }
  const failureClass = requiredString(input, "failureClass");
  const unavailableFields = readStringArray(input, "unavailableFields");
  const errorEvidenceReferences = readStringArray(input, "errorEvidenceReferences");
  const retryability = readEnum(input, "retryability", [
    "NONE",
    "WAIT",
    "NEW_OBSERVATION_REQUIRED",
    "NOT_RETRYABLE"
  ] as const);
  for (const part of [failureClass, unavailableFields, errorEvidenceReferences, retryability]) {
    if (part.status !== "PASS") {
      return fail("FAILED", {
        classification: "MISSING_FAILURE_CONTRACT",
        field: part.field,
        message: "PARTIAL, FAILED, and INVALIDATED observations MUST carry failureClass, unavailableFields, errorEvidenceReferences, and retryability"
      });
    }
  }
  return ok({
    ...record,
    failureClass: failureClass.value as string,
    unavailableFields: unavailableFields.value as string[],
    errorEvidenceReferences: errorEvidenceReferences.value as string[],
    retryability: retryability.value as BaseObservationFields["retryability"]
  });
}

function readEvidenceItems(value: unknown, field: string): StructuredResult<GateCriticalEvidenceItem[]> {
  if (!Array.isArray(value)) {
    return fail("FAILED", { field, classification: "MISSING_FIELD", message: `${field} is required` });
  }
  const items: GateCriticalEvidenceItem[] = [];
  for (const [index, entry] of value.entries()) {
    if (!isRecord(entry)) {
      return fail("FAILED", { field: `${field}[${index}]`, classification: "INVALID_FIELD" });
    }
    const key = requiredString(entry, "key");
    const evidenceType = requiredString(entry, "evidenceType");
    const sourceResource = requiredString(entry, "sourceResource");
    const retrievedAt = requiredIso(entry, "retrievedAt");
    const observedValue = requiredString(entry, "observedValue");
    if (
      key.status !== "PASS" ||
      evidenceType.status !== "PASS" ||
      sourceResource.status !== "PASS" ||
      retrievedAt.status !== "PASS" ||
      observedValue.status !== "PASS"
    ) {
      return fail("FAILED", { field: `${field}[${index}]`, classification: "INVALID_FIELD" });
    }
    const observedIdentity = optionalString(entry, "observedIdentity");
    const versionToken = optionalString(entry, "versionToken");
    if (observedIdentity.status !== "PASS") {
      return mapFail(observedIdentity);
    }
    if (versionToken.status !== "PASS") {
      return mapFail(versionToken);
    }
    const item: GateCriticalEvidenceItem = {
      key: key.value as string,
      evidenceType: evidenceType.value as string,
      sourceResource: sourceResource.value as string,
      retrievedAt: retrievedAt.value as string,
      observedValue: observedValue.value as string
    };
    if (observedIdentity.value !== undefined) {
      item.observedIdentity = observedIdentity.value;
    }
    if (versionToken.value !== undefined) {
      item.versionToken = versionToken.value;
    }
    items.push(item);
  }
  return ok(items);
}

function parseBaseObservation(
  input: Record<string, unknown>,
  contractType: ContractType
): StructuredResult<BaseObservationFields> {
  const observationId = requiredString(input, "observationId");
  const observationStartedAt = requiredIso(input, "observationStartedAt");
  const observationCompletedAt = requiredIso(input, "observationCompletedAt");
  const observationSource = requiredString(input, "observationSource");
  const sourceClass = readEnum(input, "sourceClass", SOURCE_CLASSES);
  const observationResult = readEnum(input, "observationResult", OBSERVATION_RESULTS);
  const identityBefore = readIdentityBoundary(input.identityBefore, "identityBefore");
  const identityAfter = readIdentityBoundary(input.identityAfter, "identityAfter");
  const consistencyResult = readEnum(input, "consistencyResult", ["PASS", "INVALIDATED", "UNVERIFIABLE"]);
  const evidenceReferences = readStringArray(input, "evidenceReferences");
  const retrievalProvenance = readProvenance(input.retrievalProvenance);
  const repositoryIdentity = readRepositoryIdentity(input.repositoryIdentity);
  const supersedesObservationId = optionalString(input, "supersedesObservationId");
  const correctsObservationId = optionalString(input, "correctsObservationId");

  const parts = [
    observationId,
    observationStartedAt,
    observationCompletedAt,
    observationSource,
    sourceClass,
    observationResult,
    identityBefore,
    identityAfter,
    consistencyResult,
    evidenceReferences,
    retrievalProvenance,
    repositoryIdentity,
    supersedesObservationId,
    correctsObservationId
  ];
  for (const part of parts) {
    if (part.status !== "PASS") {
      return mapFail(part);
    }
  }

  const base: BaseObservationFields = {
    contractType,
    observationId: observationId.value as string,
    observationStartedAt: observationStartedAt.value as string,
    observationCompletedAt: observationCompletedAt.value as string,
    observationSource: observationSource.value as string,
    sourceClass: sourceClass.value as SourceClass,
    observationResult: observationResult.value as ObservationResult,
    identityBefore: identityBefore.value as ObservationIdentityBoundary,
    identityAfter: identityAfter.value as ObservationIdentityBoundary,
    consistencyResult: consistencyResult.value as BaseObservationFields["consistencyResult"],
    evidenceReferences: evidenceReferences.value as string[],
    retrievalProvenance: retrievalProvenance.value as RetrievalProvenance,
    repositoryIdentity: repositoryIdentity.value as RepositoryIdentity
  };
  if (supersedesObservationId.value !== undefined) {
    base.supersedesObservationId = supersedesObservationId.value;
  }
  if (correctsObservationId.value !== undefined) {
    base.correctsObservationId = correctsObservationId.value;
  }
  return attachFailureFields(base, input);
}

function asInput(value: unknown): StructuredResult<Record<string, unknown>> {
  if (!isRecord(value)) {
    return fail("FAILED", { classification: "INVALID_INPUT", message: "JSON-compatible object required" });
  }
  return ok(value);
}

export function parseRepositoryObservation(input: unknown): StructuredResult<RepositoryObservationV1> {
  const object = asInput(input);
  if (object.status !== "PASS" || object.value === undefined) {
    return mapFail(object);
  }
  const base = parseBaseObservation(object.value, CONTRACT.RepositoryObservation);
  if (base.status !== "PASS" || base.value === undefined) {
    return mapFail(base);
  }
  const observedDefaultBranchSha = optionalString(object.value, "observedDefaultBranchSha");
  if (observedDefaultBranchSha.status !== "PASS") {
    return mapFail(observedDefaultBranchSha);
  }
  if (base.value.observationResult === "COMPLETE" && observedDefaultBranchSha.value === undefined) {
    return fail("PARTIAL", {
      field: "observedDefaultBranchSha",
      classification: "UNAVAILABLE_FIELD",
      message: "COMPLETE repository observation requires observedDefaultBranchSha"
    });
  }
  const record: RepositoryObservationV1 = { ...base.value, contractType: CONTRACT.RepositoryObservation };
  if (observedDefaultBranchSha.value !== undefined) {
    record.observedDefaultBranchSha = observedDefaultBranchSha.value;
  }
  return finalizeObservation(record);
}

export function parsePullRequestObservation(input: unknown): StructuredResult<PullRequestObservationV1> {
  const object = asInput(input);
  if (object.status !== "PASS" || object.value === undefined) {
    return mapFail(object);
  }
  const base = parseBaseObservation(object.value, CONTRACT.PullRequestObservation);
  if (base.status !== "PASS" || base.value === undefined) {
    return mapFail(base);
  }
  const pullRequestId = requiredString(object.value, "pullRequestId");
  const state = requiredString(object.value, "state");
  const draft = requiredBoolean(object.value, "draft");
  const merged = requiredBoolean(object.value, "merged");
  const observedBaseSha = optionalString(object.value, "observedBaseSha");
  const observedHeadSha = optionalString(object.value, "observedHeadSha");
  const mergeableRaw = object.value.mergeable;
  const reviews = object.value.reviews;
  const reviewThreads = object.value.reviewThreads;
  const ciWorkflowEvidence = object.value.ciWorkflowEvidence;
  const branchPolicyEvidence = object.value.branchPolicyEvidence;
  for (const part of [pullRequestId, state, draft, merged, observedBaseSha, observedHeadSha]) {
    if (part.status !== "PASS") {
      return fail("FAILED", { field: part.field, classification: part.classification, message: part.message });
    }
  }
  if (mergeableRaw !== undefined && typeof mergeableRaw !== "boolean") {
    return fail("FAILED", { field: "mergeable", classification: "INVALID_FIELD" });
  }

  const missingComponents: string[] = [];
  if (!Array.isArray(reviews)) missingComponents.push("reviews");
  if (!Array.isArray(reviewThreads)) missingComponents.push("reviewThreads");
  if (!Array.isArray(ciWorkflowEvidence)) missingComponents.push("ciWorkflowEvidence");
  if (!Array.isArray(branchPolicyEvidence)) missingComponents.push("branchPolicyEvidence");

  const record: PullRequestObservationV1 = {
    ...base.value,
    contractType: CONTRACT.PullRequestObservation,
    pullRequestId: pullRequestId.value as string,
    state: state.value as string,
    draft: draft.value as boolean,
    merged: merged.value as boolean,
    reviews: Array.isArray(reviews) ? reviews : [],
    reviewThreads: Array.isArray(reviewThreads) ? reviewThreads : [],
    ciWorkflowEvidence: Array.isArray(ciWorkflowEvidence) ? ciWorkflowEvidence : [],
    branchPolicyEvidence: Array.isArray(branchPolicyEvidence) ? branchPolicyEvidence : []
  };
  if (observedBaseSha.value !== undefined) record.observedBaseSha = observedBaseSha.value;
  if (observedHeadSha.value !== undefined) record.observedHeadSha = observedHeadSha.value;
  if (typeof mergeableRaw === "boolean") record.mergeable = mergeableRaw;

  if (base.value.observationResult === "COMPLETE" && missingComponents.length > 0) {
    const partial: PullRequestObservationV1 = {
      ...record,
      observationResult: "PARTIAL",
      failureClass: "UNAVAILABLE_FIELD",
      unavailableFields: missingComponents,
      errorEvidenceReferences: record.evidenceReferences,
      retryability: "WAIT"
    };
    return fail("HOLD", {
      classification: "PARTIAL_OBSERVATION",
      field: missingComponents[0],
      message: "COMPLETE PullRequestObservation@v1 MUST NOT infer missing review, CI/workflow, or branch-policy evidence",
      value: partial
    });
  }

  return finalizeObservation(record);
}

export function parseBranchRelationObservation(input: unknown): StructuredResult<BranchRelationObservationV1> {
  const object = asInput(input);
  if (object.status !== "PASS" || object.value === undefined) {
    return mapFail(object);
  }
  const base = parseBaseObservation(object.value, CONTRACT.BranchRelationObservation);
  if (base.status !== "PASS" || base.value === undefined) {
    return mapFail(base);
  }
  if (base.value.observationResult !== "COMPLETE") {
    const record: BranchRelationObservationV1 = {
      ...base.value,
      contractType: CONTRACT.BranchRelationObservation
    };
    return finalizeObservation(record);
  }
  const mergeBaseSha = requiredString(object.value, "mergeBaseSha");
  const relation = requiredString(object.value, "relation");
  const aheadBy = object.value.aheadBy;
  const behindBy = object.value.behindBy;
  if (mergeBaseSha.status !== "PASS" || relation.status !== "PASS") {
    return fail("PARTIAL", {
      field: "mergeBaseSha",
      classification: "UNAVAILABLE_FIELD",
      message: "COMPLETE relation resolution requires mergeBaseSha and relation; counts MUST NOT be guessed"
    });
  }
  if (typeof aheadBy !== "number" || typeof behindBy !== "number") {
    return fail("PARTIAL", {
      field: "aheadBy",
      classification: "UNAVAILABLE_FIELD",
      message: "COMPLETE relation resolution requires aheadBy and behindBy; unavailable counts MUST NOT become 0"
    });
  }
  return finalizeObservation({
    ...base.value,
    contractType: CONTRACT.BranchRelationObservation,
    mergeBaseSha: mergeBaseSha.value,
    relation: relation.value,
    aheadBy,
    behindBy
  });
}

export function parseGateBoundObservation(input: unknown): StructuredResult<GateBoundObservationV1> {
  const object = asInput(input);
  if (object.status !== "PASS" || object.value === undefined) {
    return mapFail(object);
  }
  const base = parseBaseObservation(object.value, CONTRACT.GateBoundObservation);
  if (base.status !== "PASS" || base.value === undefined) {
    return mapFail(base);
  }
  const gateType = requiredString(object.value, "gateType");
  const targetIdentity = requiredString(object.value, "targetIdentity");
  const observedBaseSha = requiredString(object.value, "observedBaseSha");
  const observedHeadSha = requiredString(object.value, "observedHeadSha");
  const authorityDecisionRef = requiredString(object.value, "authorityDecisionRef");
  const validForAction = requiredBoolean(object.value, "validForAction");
  const logicalMutationId = requiredString(object.value, "logicalMutationId");
  const attemptGeneration = requiredString(object.value, "attemptGeneration");
  const gateCriticalEvidence = readEvidenceItems(object.value.gateCriticalEvidence, "gateCriticalEvidence");
  for (const part of [
    gateType,
    targetIdentity,
    observedBaseSha,
    observedHeadSha,
    authorityDecisionRef,
    validForAction,
    logicalMutationId,
    attemptGeneration,
    gateCriticalEvidence
  ]) {
    if (part.status !== "PASS") {
      return mapFail(part);
    }
  }
  return finalizeObservation({
    ...base.value,
    contractType: CONTRACT.GateBoundObservation,
    gateType: gateType.value as string,
    targetIdentity: targetIdentity.value as string,
    observedBaseSha: observedBaseSha.value as string,
    observedHeadSha: observedHeadSha.value as string,
    authorityDecisionRef: authorityDecisionRef.value as string,
    validForAction: validForAction.value as boolean,
    logicalMutationId: logicalMutationId.value as string,
    attemptGeneration: attemptGeneration.value as string,
    gateCriticalEvidence: gateCriticalEvidence.value as GateCriticalEvidenceItem[]
  });
}

export function parseGateFreshnessVerification(input: unknown): StructuredResult<GateFreshnessVerificationV1> {
  const object = asInput(input);
  if (object.status !== "PASS" || object.value === undefined) {
    return mapFail(object);
  }
  const observationId = requiredString(object.value, "observationId");
  const observationStartedAt = requiredIso(object.value, "observationStartedAt");
  const observationCompletedAt = requiredIso(object.value, "observationCompletedAt");
  const sourceObservationId = requiredString(object.value, "sourceObservationId");
  const gateBoundObservationId = requiredString(object.value, "gateBoundObservationId");
  const logicalMutationId = requiredString(object.value, "logicalMutationId");
  const attemptGeneration = requiredString(object.value, "attemptGeneration");
  const verificationPurpose = requiredString(object.value, "verificationPurpose");
  const freshnessVerifiedAt = requiredIso(object.value, "freshnessVerifiedAt");
  const freshnessExpiresAt = optionalString(object.value, "freshnessExpiresAt");
  const freshnessStatus = readEnum(object.value, "freshnessStatus", [
    "FRESH",
    "EXPIRED",
    "INVALIDATED",
    "UNVERIFIABLE"
  ]);
  const evidenceReferences = readStringArray(object.value, "evidenceReferences");
  const gateCriticalEvidenceReferences = readStringArray(object.value, "gateCriticalEvidenceReferences");
  const retrievalProvenance = readProvenance(object.value.retrievalProvenance);
  const gateCriticalEvidence = readEvidenceItems(object.value.gateCriticalEvidence, "gateCriticalEvidence");
  const sourceNativeBindings = readEvidenceItems(object.value.sourceNativeBindings, "sourceNativeBindings");
  const evidenceComparison = readEvidenceComparison(object.value.evidenceComparison);
  if (freshnessExpiresAt.status !== "PASS") {
    return mapFail(freshnessExpiresAt);
  }
  if (freshnessExpiresAt.value !== undefined && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(freshnessExpiresAt.value)) {
    return fail("FAILED", {
      field: "freshnessExpiresAt",
      classification: "INVALID_FIELD",
      message: "freshnessExpiresAt must be an ISO-8601 UTC timestamp when present"
    });
  }
  const parts = [
    observationId,
    observationStartedAt,
    observationCompletedAt,
    sourceObservationId,
    gateBoundObservationId,
    logicalMutationId,
    attemptGeneration,
    verificationPurpose,
    freshnessVerifiedAt,
    freshnessStatus,
    evidenceReferences,
    gateCriticalEvidenceReferences,
    retrievalProvenance,
    gateCriticalEvidence,
    sourceNativeBindings,
    evidenceComparison
  ];
  for (const part of parts) {
    if (part.status !== "PASS") {
      return mapFail(part);
    }
  }
  const record: GateFreshnessVerificationV1 = {
    contractType: CONTRACT.GateFreshnessVerification,
    observationId: observationId.value as string,
    observationStartedAt: observationStartedAt.value as string,
    observationCompletedAt: observationCompletedAt.value as string,
    sourceObservationId: sourceObservationId.value as string,
    gateBoundObservationId: gateBoundObservationId.value as string,
    logicalMutationId: logicalMutationId.value as string,
    attemptGeneration: attemptGeneration.value as string,
    verificationPurpose: verificationPurpose.value as string,
    freshnessVerifiedAt: freshnessVerifiedAt.value as string,
    freshnessStatus: freshnessStatus.value as GateFreshnessVerificationV1["freshnessStatus"],
    evidenceReferences: evidenceReferences.value as string[],
    gateCriticalEvidenceReferences: gateCriticalEvidenceReferences.value as string[],
    retrievalProvenance: retrievalProvenance.value as RetrievalProvenance,
    gateCriticalEvidence: gateCriticalEvidence.value as GateCriticalEvidenceItem[],
    sourceNativeBindings: sourceNativeBindings.value as GateCriticalEvidenceItem[],
    evidenceComparison: evidenceComparison.value as GateFreshnessVerificationV1["evidenceComparison"]
  };
  if (freshnessExpiresAt.value !== undefined) {
    record.freshnessExpiresAt = freshnessExpiresAt.value;
  }
  return ok(record);
}

export function parseGateUseClaim(input: unknown): StructuredResult<GateUseClaimV1> {
  const object = asInput(input);
  if (object.status !== "PASS" || object.value === undefined) {
    return mapFail(object);
  }
  const observationId = requiredString(object.value, "observationId");
  const claimId = requiredString(object.value, "claimId");
  const claimantId = requiredString(object.value, "claimantId");
  const claimedAt = requiredIso(object.value, "claimedAt");
  const claimResult = readEnum(object.value, "claimResult", ["CLAIMED", "CLAIM_REJECTED"]);
  const sourceObservationId = requiredString(object.value, "sourceObservationId");
  const logicalMutationId = requiredString(object.value, "logicalMutationId");
  const attemptGeneration = requiredString(object.value, "attemptGeneration");
  const claimState = readEnum(object.value, "claimState", [
    "AVAILABLE",
    "CLAIMED",
    "TERMINAL_CONSUMED_SUCCESS",
    "TERMINAL_INVALIDATED",
    "TERMINAL_NOT_AUTHORIZED",
    "TERMINAL_NO_MUTATION",
    "TERMINAL_OUTCOME_UNKNOWN"
  ]);
  for (const part of [
    observationId,
    claimId,
    claimantId,
    claimedAt,
    claimResult,
    sourceObservationId,
    logicalMutationId,
    attemptGeneration,
    claimState
  ]) {
    if (part.status !== "PASS") {
      return mapFail(part);
    }
  }
  const record: GateUseClaimV1 = {
    contractType: CONTRACT.GateUseClaim,
    observationId: observationId.value as string,
    claimId: claimId.value as string,
    claimantId: claimantId.value as string,
    claimedAt: claimedAt.value as string,
    claimResult: claimResult.value as GateUseClaimV1["claimResult"],
    sourceObservationId: sourceObservationId.value as string,
    logicalMutationId: logicalMutationId.value as string,
    attemptGeneration: attemptGeneration.value as string,
    claimState: claimState.value as GateUseClaimV1["claimState"]
  };
  const phase = optionalString(object.value, "winningAttemptPhase");
  if (phase.status !== "PASS") {
    return mapFail(phase);
  }
  if (phase.value !== undefined) {
    record.winningAttemptPhase = phase.value as GateUseClaimV1["winningAttemptPhase"];
  }
  return ok(record);
}

export function parseTerminalOutcome(input: unknown): StructuredResult<TerminalOutcomeV1> {
  const object = asInput(input);
  if (object.status !== "PASS" || object.value === undefined) {
    return mapFail(object);
  }
  const observationId = requiredString(object.value, "observationId");
  const claimId = requiredString(object.value, "claimId");
  const sourceObservationId = requiredString(object.value, "sourceObservationId");
  const logicalMutationId = requiredString(object.value, "logicalMutationId");
  const attemptGeneration = requiredString(object.value, "attemptGeneration");
  const claimState = readEnum(object.value, "claimState", [
    "TERMINAL_CONSUMED_SUCCESS",
    "TERMINAL_INVALIDATED",
    "TERMINAL_NOT_AUTHORIZED",
    "TERMINAL_NO_MUTATION",
    "TERMINAL_OUTCOME_UNKNOWN"
  ]);
  const mutationPerformed = readMutationPerformed(object.value);
  const mutationAttempts = readMutationAttempts(object.value);
  for (const part of [
    observationId,
    claimId,
    sourceObservationId,
    logicalMutationId,
    attemptGeneration,
    claimState,
    mutationPerformed,
    mutationAttempts
  ]) {
    if (part.status !== "PASS") {
      return mapFail(part);
    }
  }
  return ok({
    contractType: CONTRACT.TerminalOutcome,
    observationId: observationId.value as string,
    claimId: claimId.value as string,
    sourceObservationId: sourceObservationId.value as string,
    logicalMutationId: logicalMutationId.value as string,
    attemptGeneration: attemptGeneration.value as string,
    claimState: claimState.value as TerminalOutcomeV1["claimState"],
    mutationPerformed: mutationPerformed.value as TerminalOutcomeV1["mutationPerformed"],
    mutationAttempts: mutationAttempts.value as TerminalOutcomeV1["mutationAttempts"]
  });
}

function identitiesEqual(
  before: ObservationIdentityBoundary,
  after: ObservationIdentityBoundary
): boolean {
  return (
    before.defaultBranchSha === after.defaultBranchSha &&
    before.baseSha === after.baseSha &&
    before.headSha === after.headSha
  );
}

export function finalizeObservation<T extends BaseObservationFields>(record: T): StructuredResult<T> {
  if (record.observationResult === "COMPLETE" && record.consistencyResult !== "PASS") {
    return fail("HOLD", {
      classification: "INCONSISTENT_COMPLETE",
      message: "COMPLETE requires consistencyResult=PASS",
      value: record
    });
  }
  if (!identitiesEqual(record.identityBefore, record.identityAfter)) {
    const invalidated = {
      ...record,
      observationResult: "INVALIDATED" as const,
      consistencyResult: "INVALIDATED" as const,
      failureClass: record.failureClass ?? "IDENTITY_MOVED",
      unavailableFields: record.unavailableFields ?? [],
      errorEvidenceReferences: record.errorEvidenceReferences ?? record.evidenceReferences,
      retryability: record.retryability ?? "NEW_OBSERVATION_REQUIRED"
    };
    return fail("HOLD", {
      classification: "IDENTITY_MOVED",
      message: "composite identity movement invalidates the observation",
      value: invalidated,
      retryability: "NEW_OBSERVATION_REQUIRED"
    });
  }
  if (FAILURE_RESULTS.includes(record.observationResult)) {
    if (
      record.failureClass === undefined ||
      record.unavailableFields === undefined ||
      record.errorEvidenceReferences === undefined ||
      record.retryability === undefined
    ) {
      return fail("FAILED", {
        classification: "MISSING_FAILURE_CONTRACT",
        message: "PARTIAL, FAILED, and INVALIDATED observations MUST carry failureClass, unavailableFields, errorEvidenceReferences, and retryability"
      });
    }
  }
  if (record.observationResult === "PARTIAL") {
    return fail("HOLD", { classification: "PARTIAL_OBSERVATION", value: record });
  }
  if (record.observationResult === "FAILED") {
    return fail("FAILED", { classification: "OBSERVATION_FAILED", value: record });
  }
  if (record.observationResult === "INVALIDATED") {
    return fail("HOLD", { classification: "OBSERVATION_INVALIDATED", value: record });
  }
  if (record.sourceClass === "LOCAL_OBSERVATION") {
    return fail("HOLD", {
      classification: "LOCAL_OBSERVATION_NOT_REMOTE_AUTHORITY",
      message: "LOCAL_OBSERVATION MUST NOT resolve Remote Current State",
      value: record
    });
  }
  return ok(record);
}
