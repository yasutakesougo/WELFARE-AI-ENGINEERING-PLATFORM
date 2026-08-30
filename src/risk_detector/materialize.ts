import type { RiskInput } from "./types.js";

export const MAX_CHANGED_FILES = 500;
export const MAX_DIFF_CHARS = 250_000;
export const MAX_PER_FILE_CHARS = 50_000;

export type MaterializationMode =
  | "REPOSITORY_COMMIT_RANGE"
  | "SUPPLIED_IMMUTABLE_DIFF"
  | "PRELIMINARY_INPUT";

export interface MaterializationRequest {
  mode: MaterializationMode;
  baseSha?: string;
  headSha?: string;
  changedFiles?: string[];
  diff?: string;
  intent?: string;
  binaryFiles?: string[];
  truncated?: boolean;
  unsupported?: boolean;
}

export interface SourceIdentity {
  baseSha: string;
  headSha: string;
}

export interface MaterializedRiskInput {
  input: RiskInput;
  sourceIdentity?: SourceIdentity;
  evidenceComplete: boolean;
  limitations: string[];
}

const FULL_SHA = /^[0-9a-f]{40}$/i;

function validateFiles(files: string[]): string[] {
  return [...files].sort();
}

export function materializeRiskInput(request: MaterializationRequest): MaterializedRiskInput {
  const changedFiles = validateFiles(request.changedFiles ?? []);
  const limitations: string[] = [];

  if (changedFiles.length > MAX_CHANGED_FILES) limitations.push("CHANGED_FILE_LIMIT_EXCEEDED");
  if ((request.diff?.length ?? 0) > MAX_DIFF_CHARS) limitations.push("AGGREGATE_DIFF_LIMIT_EXCEEDED");
  if (request.truncated) limitations.push("TRUNCATED_DIFF");
  if (request.unsupported) limitations.push("UNSUPPORTED_CONTENT");
  if ((request.binaryFiles?.length ?? 0) > 0) limitations.push("BINARY_CONTENT_PRESENT");

  const perFileMarkers = request.diff?.split(/^diff --git /m) ?? [];
  if (perFileMarkers.some((chunk) => chunk.length > MAX_PER_FILE_CHARS)) {
    limitations.push("PER_FILE_DIFF_LIMIT_EXCEEDED");
  }

  if (request.mode === "PRELIMINARY_INPUT") {
    if (request.diff !== undefined) throw new Error("PRELIMINARY_INPUT must not include diff");
    return {
      input: { changedFiles, intent: request.intent, evidenceComplete: limitations.length === 0 },
      evidenceComplete: limitations.length === 0,
      limitations
    };
  }

  if (!request.diff || request.diff.trim().length === 0) {
    limitations.push("DIFF_MISSING");
  }

  let sourceIdentity: SourceIdentity | undefined;
  if (request.mode === "REPOSITORY_COMMIT_RANGE") {
    if (!request.baseSha || !FULL_SHA.test(request.baseSha)) throw new Error("exact baseSha is required");
    if (!request.headSha || !FULL_SHA.test(request.headSha)) throw new Error("exact headSha is required");
    sourceIdentity = { baseSha: request.baseSha.toLowerCase(), headSha: request.headSha.toLowerCase() };
  }

  const evidenceComplete = limitations.length === 0;
  return {
    input: {
      changedFiles: changedFiles.slice(0, MAX_CHANGED_FILES),
      intent: request.intent,
      diff: (request.diff ?? "").slice(0, MAX_DIFF_CHARS),
      evidenceComplete
    },
    sourceIdentity,
    evidenceComplete,
    limitations
  };
}
