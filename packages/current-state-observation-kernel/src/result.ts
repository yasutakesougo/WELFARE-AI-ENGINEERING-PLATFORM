import type { KernelStatus, Retryability } from "./types.js";

export interface StructuredResult<T = unknown> {
  status: KernelStatus;
  classification?: string;
  code?: string;
  message?: string;
  field?: string;
  evidenceReferences?: string[];
  retryability?: Retryability;
  value?: T;
}

export function ok<T>(value: T): StructuredResult<T> {
  return { status: "PASS", value };
}

export function fail<T = never>(
  status: Exclude<KernelStatus, "PASS">,
  input: Omit<StructuredResult<T>, "status" | "value"> & { value?: T } = {}
): StructuredResult<T> {
  return { status, ...input };
}

export function mapFail<T>(result: StructuredResult<unknown>): StructuredResult<T> {
  return {
    status: result.status === "PASS" ? "FAILED" : result.status,
    classification: result.classification,
    code: result.code,
    message: result.message,
    field: result.field,
    evidenceReferences: result.evidenceReferences,
    retryability: result.retryability
  };
}

export function isImmediateRetryAuthorized(result: StructuredResult): boolean {
  if (result.classification === "CLAIM_REJECTED") {
    return false;
  }
  if (result.classification === "NEW_OBSERVATION_REQUIRED") {
    return false;
  }
  if (result.retryability === "WAIT" || result.retryability === "NOT_RETRYABLE") {
    return false;
  }
  if (result.retryability === "NEW_OBSERVATION_REQUIRED") {
    return false;
  }
  return result.status === "PASS";
}
