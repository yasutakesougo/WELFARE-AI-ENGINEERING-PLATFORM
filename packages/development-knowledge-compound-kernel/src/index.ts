export type EvidenceRelation = "SUPPORTING" | "CONTRADICTING" | "INCONCLUSIVE";
export type ResultClass =
  | "VALID_NEW"
  | "VALID_EXISTING_IDEMPOTENT"
  | "VALID_NEW_VERSION"
  | "INVALID_SCHEMA"
  | "INVALID_EVIDENCE_REFERENCE"
  | "INVALID_AUTHORITY_FIELD"
  | "INVALID_IDENTITY"
  | "HOLD_UNKNOWN";

export interface DevelopmentEventIdentity {
  sourceRepository: string;
  sourceEventId: string;
}

export interface ResolutionKey {
  contractType: "KnowledgeCandidate@v1";
  sourceRepository: string;
  sourceEventId: string;
  contentDigest: string;
}

export interface EvidenceLineage {
  derivedFromKnowledgeRefs: string[];
  derivedFromDecisionRefs: string[];
}

export interface StructuredEvidenceReference {
  evidenceRef: string;
  relation: EvidenceRelation;
  lineage?: EvidenceLineage;
}

export interface CandidateResolutionResult {
  contractType: "CandidateResolutionResult@v1";
  resultClass: ResultClass;
  authority: "NON_AUTHORITATIVE";
  errorIds: string[];
  holdReasonIds: string[];
  evidenceConflict: boolean;
  resolutionKey?: ResolutionKey;
  candidateRef?: string;
  priorCandidateRefs?: string[];
  normalizedEvidenceRefs?: StructuredEvidenceReference[];
}

type JsonRecord = Record<string, unknown>;

const CANDIDATE_FIELDS = new Set([
  "candidateId", "contractVersion", "candidateVersion", "observation", "problem",
  "suspectedRootCause", "proposedRule", "sourceRefs", "evidenceRefs", "scope",
  "createdBy", "creationMode", "createdAt", "contentDigest", "nonAuthoritative",
]);
const REQUIRED_CANDIDATE_FIELDS = [...CANDIDATE_FIELDS].filter((field) => field !== "nonAuthoritative");
const AUTHORITY_FIELDS = new Set([
  "active", "current", "status", "lifecyclestatus", "confidence", "confidencescore",
  "validated", "validationresult", "validatedscope", "productionsafe", "runtimeeligible",
  "runtimebinding", "maturity", "supersessionstate", "authoritativelifecycle",
  "selfapprovaleligible", "verified", "verificationresult", "authoritydecision",
  "promotiondecision", "runtimebindingdecision",
]);
const RELATION_ORDER: Record<EvidenceRelation, number> = {
  SUPPORTING: 0,
  CONTRADICTING: 1,
  INCONCLUSIVE: 2,
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
function keysExactly(value: JsonRecord, allowed: readonly string[]): boolean {
  const set = new Set(allowed);
  return Object.keys(value).every((key) => set.has(key));
}
function compareCodePointSequence(a: string, b: string): number {
  const left = Array.from(a);
  const right = Array.from(b);
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const l = left[i]!.codePointAt(0)!;
    const r = right[i]!.codePointAt(0)!;
    if (l !== r) return l < r ? -1 : 1;
  }
  if (left.length === right.length) return 0;
  return left.length < right.length ? -1 : 1;
}
function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareCodePointSequence);
}
function invalid(resultClass: ResultClass, errorId: string): CandidateResolutionResult {
  return {
    contractType: "CandidateResolutionResult@v1",
    resultClass,
    authority: "NON_AUTHORITATIVE",
    errorIds: [errorId],
    holdReasonIds: [],
    evidenceConflict: false,
  };
}
function hold(reasonIds: string[]): CandidateResolutionResult {
  return {
    contractType: "CandidateResolutionResult@v1",
    resultClass: "HOLD_UNKNOWN",
    authority: "NON_AUTHORITATIVE",
    errorIds: [],
    holdReasonIds: uniqueSorted(reasonIds),
    evidenceConflict: false,
  };
}
function isResolutionResult(value: unknown): value is CandidateResolutionResult {
  return isRecord(value)
    && value.contractType === "CandidateResolutionResult@v1"
    && typeof value.resultClass === "string"
    && value.authority === "NON_AUTHORITATIVE"
    && Array.isArray(value.errorIds)
    && Array.isArray(value.holdReasonIds)
    && typeof value.evidenceConflict === "boolean";
}
function validateStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function validateIdentity(input: unknown): DevelopmentEventIdentity | CandidateResolutionResult {
  if (!isRecord(input) || !keysExactly(input, ["sourceRepository", "sourceEventId"])) {
    return invalid("INVALID_IDENTITY", "INVALID_RESOLUTION_IDENTITY");
  }
  if (!isNonEmptyString(input.sourceRepository) || !isNonEmptyString(input.sourceEventId)) {
    return invalid("INVALID_IDENTITY", "INVALID_RESOLUTION_IDENTITY");
  }
  return { sourceRepository: input.sourceRepository, sourceEventId: input.sourceEventId };
}

function validateCandidateShape(input: unknown): JsonRecord | CandidateResolutionResult {
  if (!isRecord(input)) return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  for (const key of Object.keys(input)) {
    if (CANDIDATE_FIELDS.has(key)) continue;
    if (AUTHORITY_FIELDS.has(key.toLowerCase())) {
      return invalid("INVALID_AUTHORITY_FIELD", "AUTHORITY_FIELD_PROHIBITED");
    }
    return invalid("INVALID_SCHEMA", "UNKNOWN_FIELD");
  }
  for (const field of REQUIRED_CANDIDATE_FIELDS) {
    if (!(field in input)) return invalid("INVALID_SCHEMA", "MISSING_REQUIRED_FIELD");
  }
  for (const field of ["candidateId", "candidateVersion", "createdAt", "contentDigest"]) {
    if (!isNonEmptyString(input[field])) {
      return invalid(
        "INVALID_SCHEMA",
        typeof input[field] === "string" ? "EMPTY_REQUIRED_VALUE" : "INVALID_FIELD_TYPE",
      );
    }
  }
  if (input.contractVersion !== "DEVELOPMENT-KNOWLEDGE-COMPOUND-V1") {
    return invalid("INVALID_SCHEMA", "INVALID_CONTRACT_VERSION");
  }
  for (const field of ["observation", "problem", "suspectedRootCause", "proposedRule"]) {
    if (typeof input[field] !== "string") return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }
  if (!validateStringArray(input.sourceRefs)) return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  if (!isRecord(input.createdBy) || !keysExactly(input.createdBy, ["actorType", "actorId"])) {
    return invalid("INVALID_SCHEMA", "UNKNOWN_FIELD");
  }
  if (!["HUMAN", "AGENT", "SERVICE", "AUTOMATION"].includes(String(input.createdBy.actorType))) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }
  if (!isNonEmptyString(input.createdBy.actorId)) return invalid("INVALID_SCHEMA", "EMPTY_REQUIRED_VALUE");
  if (!["HUMAN", "AGENT_ASSISTED", "AUTOMATED"].includes(String(input.creationMode))) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }
  if (!isRecord(input.scope)
      || !keysExactly(input.scope, ["observedIn", "proposedAppliesTo", "explicitlyNotValidatedFor"])) {
    return invalid("INVALID_SCHEMA", "UNKNOWN_FIELD");
  }
  if (!validateStringArray(input.scope.observedIn)
      || !validateStringArray(input.scope.proposedAppliesTo)
      || !validateStringArray(input.scope.explicitlyNotValidatedFor)) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }
  if ("nonAuthoritative" in input && input.nonAuthoritative !== true) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }
  if (!Array.isArray(input.evidenceRefs)) {
    return invalid("INVALID_EVIDENCE_REFERENCE", "INVALID_FIELD_TYPE");
  }
  for (const raw of input.evidenceRefs) {
    if (!isRecord(raw) || !keysExactly(raw, ["evidenceRef", "relation", "lineage"])) {
      return invalid("INVALID_EVIDENCE_REFERENCE", "INVALID_FIELD_TYPE");
    }
    if (!isNonEmptyString(raw.evidenceRef)) {
      return invalid("INVALID_EVIDENCE_REFERENCE", "EMPTY_REQUIRED_VALUE");
    }
    if (!(raw.relation === "SUPPORTING" || raw.relation === "CONTRADICTING" || raw.relation === "INCONCLUSIVE")) {
      return invalid("INVALID_EVIDENCE_REFERENCE", "INVALID_EVIDENCE_RELATION");
    }
    if ("lineage" in raw) {
      if (!isRecord(raw.lineage)
          || !keysExactly(raw.lineage, ["derivedFromKnowledgeRefs", "derivedFromDecisionRefs"])
          || !validateStringArray(raw.lineage.derivedFromKnowledgeRefs)
          || !validateStringArray(raw.lineage.derivedFromDecisionRefs)) {
        return invalid("INVALID_EVIDENCE_REFERENCE", "INVALID_FIELD_TYPE");
      }
    }
  }
  return input;
}

function canonicalLineage(value: unknown): EvidenceLineage | undefined {
  if (!isRecord(value)) return undefined;
  return {
    derivedFromKnowledgeRefs: uniqueSorted(value.derivedFromKnowledgeRefs as string[]),
    derivedFromDecisionRefs: uniqueSorted(value.derivedFromDecisionRefs as string[]),
  };
}
function lineageKey(lineage: EvidenceLineage | undefined): string {
  if (!lineage) return "NONE";
  return JSON.stringify([lineage.derivedFromKnowledgeRefs, lineage.derivedFromDecisionRefs]);
}
function normalizeEvidence(entries: unknown[]): { normalized: StructuredEvidenceReference[]; conflict: boolean } {
  const byIdentity = new Map<string, StructuredEvidenceReference>();
  const relationsByRef = new Map<string, Set<EvidenceRelation>>();
  for (const raw of entries) {
    const entry = raw as JsonRecord;
    const evidenceRef = entry.evidenceRef as string;
    const relation = entry.relation as EvidenceRelation;
    const lineage = "lineage" in entry ? canonicalLineage(entry.lineage) : undefined;
    const identity = JSON.stringify([evidenceRef, relation, lineageKey(lineage)]);
    if (!byIdentity.has(identity)) {
      byIdentity.set(identity, lineage ? { evidenceRef, relation, lineage } : { evidenceRef, relation });
    }
    const set = relationsByRef.get(evidenceRef) ?? new Set<EvidenceRelation>();
    set.add(relation);
    relationsByRef.set(evidenceRef, set);
  }
  const normalized = [...byIdentity.values()].sort((a, b) => {
    const refOrder = compareCodePointSequence(a.evidenceRef, b.evidenceRef);
    if (refOrder !== 0) return refOrder;
    const relationOrder = RELATION_ORDER[a.relation] - RELATION_ORDER[b.relation];
    if (relationOrder !== 0) return relationOrder;
    return compareCodePointSequence(lineageKey(a.lineage), lineageKey(b.lineage));
  });
  return {
    normalized,
    conflict: [...relationsByRef.values()].some((relations) => relations.size > 1),
  };
}

interface PriorCandidate {
  candidateRef: string;
  resolutionKey: ResolutionKey;
}
interface ParsedContext {
  completeness: "COMPLETE" | "UNKNOWN";
  priorCandidates: PriorCandidate[];
  conflict: boolean;
}
function keyString(key: ResolutionKey): string {
  return JSON.stringify([key.contractType, key.sourceRepository, key.sourceEventId, key.contentDigest]);
}
function validateResolutionKey(value: unknown): ResolutionKey | null {
  if (!isRecord(value)
      || !keysExactly(value, ["contractType", "sourceRepository", "sourceEventId", "contentDigest"])
      || value.contractType !== "KnowledgeCandidate@v1"
      || !isNonEmptyString(value.sourceRepository)
      || !isNonEmptyString(value.sourceEventId)
      || !isNonEmptyString(value.contentDigest)) return null;
  return {
    contractType: "KnowledgeCandidate@v1",
    sourceRepository: value.sourceRepository,
    sourceEventId: value.sourceEventId,
    contentDigest: value.contentDigest,
  };
}
function validateContext(input: unknown): ParsedContext | CandidateResolutionResult {
  if (!isRecord(input)
      || !keysExactly(input, ["contractType", "completeness", "priorCandidates"])
      || input.contractType !== "CandidateResolutionContext@v1"
      || !(input.completeness === "COMPLETE" || input.completeness === "UNKNOWN")
      || !Array.isArray(input.priorCandidates)) {
    return invalid("INVALID_SCHEMA", "INVALID_PRIOR_CONTEXT");
  }
  const logicalEntries = new Map<string, PriorCandidate>();
  const refsToKey = new Map<string, string>();
  const keyToRef = new Map<string, string>();
  let conflict = false;
  for (const raw of input.priorCandidates) {
    if (!isRecord(raw)
        || !keysExactly(raw, ["candidateRef", "resolutionKey"])
        || !isNonEmptyString(raw.candidateRef)) {
      return invalid("INVALID_SCHEMA", "INVALID_PRIOR_CONTEXT");
    }
    const resolutionKey = validateResolutionKey(raw.resolutionKey);
    if (!resolutionKey) return invalid("INVALID_SCHEMA", "INVALID_PRIOR_CONTEXT");
    const serializedKey = keyString(resolutionKey);
    const priorRefForKey = keyToRef.get(serializedKey);
    if (priorRefForKey !== undefined && priorRefForKey !== raw.candidateRef) conflict = true;
    const priorKeyForRef = refsToKey.get(raw.candidateRef);
    if (priorKeyForRef !== undefined && priorKeyForRef !== serializedKey) conflict = true;
    keyToRef.set(serializedKey, raw.candidateRef);
    refsToKey.set(raw.candidateRef, serializedKey);
    logicalEntries.set(`${serializedKey}\u0000${raw.candidateRef}`, { candidateRef: raw.candidateRef, resolutionKey });
  }
  return { completeness: input.completeness, priorCandidates: [...logicalEntries.values()], conflict };
}

export function resolveCandidate(
  developmentEventIdentity: unknown,
  candidateDraft: unknown,
  contextInput: unknown,
): CandidateResolutionResult {
  const identityResult = validateIdentity(developmentEventIdentity);
  if (isResolutionResult(identityResult)) return identityResult;
  const candidateResult = validateCandidateShape(candidateDraft);
  if (isResolutionResult(candidateResult)) return candidateResult;
  const contextResult = validateContext(contextInput);
  if (isResolutionResult(contextResult)) return contextResult;

  const holdReasons: string[] = [];
  if (contextResult.completeness === "UNKNOWN") holdReasons.push("PRIOR_CONTEXT_INCOMPLETE");
  if (contextResult.conflict) holdReasons.push("PRIOR_CONTEXT_CONFLICT");
  if (holdReasons.length > 0) return hold(holdReasons);

  const resolutionKey: ResolutionKey = {
    contractType: "KnowledgeCandidate@v1",
    sourceRepository: identityResult.sourceRepository,
    sourceEventId: identityResult.sourceEventId,
    contentDigest: candidateResult.contentDigest as string,
  };
  const targetKey = keyString(resolutionKey);
  const exactMatches = contextResult.priorCandidates.filter(
    (prior) => keyString(prior.resolutionKey) === targetKey,
  );
  const sameSourceEvent = contextResult.priorCandidates.filter(
    (prior) => prior.resolutionKey.sourceRepository === resolutionKey.sourceRepository
      && prior.resolutionKey.sourceEventId === resolutionKey.sourceEventId,
  );
  const { normalized, conflict } = normalizeEvidence(candidateResult.evidenceRefs as unknown[]);

  let resultClass: ResultClass;
  let candidateRef: string;
  let priorCandidateRefs: string[];
  if (exactMatches.length > 0) {
    resultClass = "VALID_EXISTING_IDEMPOTENT";
    candidateRef = exactMatches[0]!.candidateRef;
    priorCandidateRefs = [candidateRef];
  } else if (sameSourceEvent.length > 0) {
    resultClass = "VALID_NEW_VERSION";
    candidateRef = candidateResult.candidateId as string;
    priorCandidateRefs = uniqueSorted(sameSourceEvent.map((prior) => prior.candidateRef));
  } else {
    resultClass = "VALID_NEW";
    candidateRef = candidateResult.candidateId as string;
    priorCandidateRefs = [];
  }

  return {
    contractType: "CandidateResolutionResult@v1",
    resultClass,
    authority: "NON_AUTHORITATIVE",
    errorIds: [],
    holdReasonIds: [],
    evidenceConflict: conflict,
    resolutionKey,
    candidateRef,
    priorCandidateRefs,
    normalizedEvidenceRefs: normalized,
  };
}
