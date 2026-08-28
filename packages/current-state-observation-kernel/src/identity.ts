import { fail, ok, type StructuredResult } from "./result.js";
import type { KernelState, RepositoryIdentity, VersionedRecord } from "./types.js";
import { findByObservationId } from "./state.js";

export function rejectObservationIdReuse(
  state: KernelState,
  observationId: string
): StructuredResult<void> {
  const existing = findByObservationId(state, observationId);
  if (existing !== undefined) {
    return fail("HOLD", {
      classification: "OBSERVATION_ID_REUSE",
      field: "observationId",
      message: "same observationId reuse is PROHIBITED; original record is preserved"
    });
  }
  return ok(undefined);
}

export function originalRecordPreserved(
  state: KernelState,
  observationId: string
): StructuredResult<VersionedRecord> {
  const existing = findByObservationId(state, observationId);
  if (existing === undefined) {
    return fail("UNVERIFIABLE", {
      field: "observationId",
      classification: "RECORD_ABSENT",
      message: "original observation is not in kernel state"
    });
  }
  return ok(existing);
}

export function requireExplicitSuccession(input: {
  supersedesObservationId?: string;
  correctsObservationId?: string;
}): StructuredResult<void> {
  if (input.supersedesObservationId === undefined && input.correctsObservationId === undefined) {
    return fail("HOLD", {
      classification: "SUCCESSION_REQUIRED",
      message: "later state MUST use a new observationId with supersedesObservationId or correctsObservationId"
    });
  }
  return ok(undefined);
}

export function preferStableRepositoryIdentity(
  left: RepositoryIdentity,
  right: RepositoryIdentity
): StructuredResult<{ sameRepository: boolean; comparedBy: "repositoryId" | "owner-name-fallback" }> {
  if (left.repositoryId.length > 0 && right.repositoryId.length > 0) {
    return ok({
      sameRepository: left.repositoryId === right.repositoryId,
      comparedBy: "repositoryId"
    });
  }
  return ok({
    sameRepository: left.host === right.host && left.owner === right.owner && left.repository === right.repository,
    comparedBy: "owner-name-fallback"
  });
}

export function requireTraceability(record: {
  sourceClass?: string;
  retrievalProvenance?: unknown;
  evidenceReferences?: unknown;
}): StructuredResult<void> {
  if (record.sourceClass === undefined) {
    return fail("UNVERIFIABLE", { field: "sourceClass", classification: "MISSING_TRACEABILITY" });
  }
  if (record.retrievalProvenance === undefined) {
    return fail("UNVERIFIABLE", { field: "retrievalProvenance", classification: "MISSING_TRACEABILITY" });
  }
  if (record.evidenceReferences === undefined) {
    return fail("UNVERIFIABLE", { field: "evidenceReferences", classification: "MISSING_TRACEABILITY" });
  }
  return ok(undefined);
}
