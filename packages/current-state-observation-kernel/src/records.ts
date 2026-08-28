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
    const itemValue = requiredString(entry, "value");
    if (key.status !== "PASS" || itemValue.status !== "PASS") {
      return fail("FAILED", { field: `${field}[${index}]`, classification: "INVALID_FIELD" });
    }
    const versionToken = optionalString(entry, "versionToken");
    if (versionToken.status !== "PASS") {
      return mapFail(versionToken);
    }
    const item: GateCriticalEvidenceItem = {
      key: key.value as string,
      value: itemValue.value as string
    };
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
  return ok(base);
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
  for (const part of [pullRequestId, state, draft, merged, observedBaseSha, observedHeadSha]) {
    if (part.status !== "PASS") {
      return fail("FAILED", { field: part.field, classification: part.classification, message: part.message });
    }
  }
  if (mergeableRaw !== undefined && typeof mergeableRaw !== "boolean") {
    return fail("FAILED", { field: "mergeable", classification: "INVALID_FIELD" });
  }
  const record: PullRequestObservationV1 = {
    ...base.value,
    contractType: CONTRACT.PullRequestObservation,
    pullRequestId: pullRequestId.value as string,
    state: state.value as string,
    draft: draft.value as boolean,
    merged: merged.value as boolean
  };
  if (observedBaseSha.value !== undefined) record.observedBaseSha = observedBaseSha.value;
  if (observedHeadSha.value !== undefined) record.observedHeadSha = observedHeadSha.value;
  if (typeof mergeableRaw === "boolean") record.mergeable = mergeableRaw;
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
  const gateCriticalEvidence = readEvidenceItems(object.value.gateCriticalEvidence, "gateCriticalEvidence");
  for (const part of [
    gateType,
    targetIdentity,
    observedBaseSha,
    observedHeadSha,
    authorityDecisionRef,
    validForAction,
    logicalMutationId,
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
  const freshnessStatus = readEnum(object.value, "freshnessStatus", [
    "FRESH",
    "EXPIRED",
    "INVALIDATED",
    "UNVERIFIABLE"
  ]);
  const evidenceReferences = readStringArray(object.value, "evidenceReferences");
  const retrievalProvenance = readProvenance(object.value.retrievalProvenance);
  const gateCriticalEvidence = readEvidenceItems(object.value.gateCriticalEvidence, "gateCriticalEvidence");
  const parts = [
    observationId,
    observationStartedAt,
    observationCompletedAt,
    sourceObservationId,
    freshnessStatus,
    evidenceReferences,
    retrievalProvenance,
    gateCriticalEvidence
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
    freshnessStatus: freshnessStatus.value as GateFreshnessVerificationV1["freshnessStatus"],
    evidenceReferences: evidenceReferences.value as string[],
    retrievalProvenance: retrievalProvenance.value as RetrievalProvenance,
    gateCriticalEvidence: gateCriticalEvidence.value as GateCriticalEvidenceItem[]
  };
  if (typeof object.value.ttlExpired === "boolean") {
    record.ttlExpired = object.value.ttlExpired;
  }
  return ok(record);
}

export function parseGateUseClaim(input: unknown): StructuredResult<GateUseClaimV1> {
  const object = asInput(input);
  if (object.status !== "PASS" || object.value === undefined) {
    return mapFail(object);
  }
  const observationId = requiredString(object.value, "observationId");
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
  for (const part of [observationId, sourceObservationId, logicalMutationId, attemptGeneration, claimState]) {
    if (part.status !== "PASS") {
      return mapFail(part);
    }
  }
  const record: GateUseClaimV1 = {
    contractType: CONTRACT.GateUseClaim,
    observationId: observationId.value as string,
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
  const mutationPerformed = requiredBoolean(object.value, "mutationPerformed");
  const mutationAttempts = object.value.mutationAttempts;
  for (const part of [
    observationId,
    sourceObservationId,
    logicalMutationId,
    attemptGeneration,
    claimState,
    mutationPerformed
  ]) {
    if (part.status !== "PASS") {
      return mapFail(part);
    }
  }
  if (typeof mutationAttempts !== "number") {
    return fail("FAILED", {
      field: "mutationAttempts",
      classification: "MISSING_FIELD",
      message: "mutationAttempts is required and MUST NOT be inferred as 0"
    });
  }
  return ok({
    contractType: CONTRACT.TerminalOutcome,
    observationId: observationId.value as string,
    sourceObservationId: sourceObservationId.value as string,
    logicalMutationId: logicalMutationId.value as string,
    attemptGeneration: attemptGeneration.value as string,
    claimState: claimState.value as TerminalOutcomeV1["claimState"],
    mutationPerformed: mutationPerformed.value as boolean,
    mutationAttempts
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
      consistencyResult: "INVALIDATED" as const
    };
    return fail("HOLD", {
      classification: "IDENTITY_MOVED",
      message: "composite identity movement invalidates the observation",
      value: invalidated,
      retryability: "NEW_OBSERVATION_REQUIRED"
    });
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
