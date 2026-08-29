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
  "candidateId",
  "contractVersion",
  "candidateVersion",
  "observation",
  "problem",
  "suspectedRootCause",
  "proposedRule",
  "sourceRefs",
  "evidenceRefs",
  "scope",
  "createdBy",
  "creationMode",
  "createdAt",
  "contentDigest",
  "nonAuthoritative",
]);

const REQUIRED_CANDIDATE_FIELDS = [...CANDIDATE_FIELDS].filter(
  (field) => field !== "nonAuthoritative",
);

const AUTHORITY_FIELDS = new Set(
  [
    "active",
    "current",
    "status",
    "lifecycleStatus",
    "confidence",
    "confidenceScore",
    "validated",
    "validationResult",
    "validatedScope",
    "productionSafe",
    "runtimeEligible",
    "runtimeBinding",
    "maturity",
    "supersessionState",
    "authoritativeLifecycle",
    "selfApprovalEligible",
    "verified",
    "verificationResult",
    "authorityDecision",
    "promotionDecision",
    "runtimeBindingDecision",
  ].map((field) => field.toLowerCase()),
);

const RELATION_ORDER: Record<EvidenceRelation, number> = {
  SUPPORTING: 0,
  CONTRADICTING: 1,
  INCONCLUSIVE: 2,
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keysExactly(value: JsonRecord, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
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

function validateIdentity(input: unknown): DevelopmentEventIdentity | CandidateResolutionResult {
  if (!isRecord(input) || !keysExactly(input, ["sourceRepository", "sourceEventId"])) {
    return invalid("INVALID_IDENTITY", "INVALID_RESOLUTION_IDENTITY");
  }
  if (!isNonEmptyString(input.sourceRepository) || !isNonEmptyString(input.sourceEventId)) {
    return invalid("INVALID_IDENTITY", "INVALID_RESOLUTION_IDENTITY");
  }
  return {
    sourceRepository: input.sourceRepository,
    sourceEventId: input.sourceEventId,
  };
}

function validateStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function validateCandidateShape(input: unknown): CandidateResolutionResult | JsonRecord {
  if (!isRecord(input)) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }

  for (const key of Object.keys(input)) {
    if (!CANDIDATE_FIELDS.has(key)) {
      if (AUTHORITY_FIELDS.has(key.toLowerCase())) {
        return invalid("INVALID_AUTHORITY_FIELD", "AUTHORITY_FIELD_PROHIBITED");
      }
      return invalid("INVALID_SCHEMA", "UNKNOWN_FIELD");
    }
  }

  for (const field of REQUIRED_CANDIDATE_FIELDS) {
    if (!(field in input)) {
      return invalid("INVALID_SCHEMA", "MISSING_REQUIRED_FIELD");
    }
  }

  const requiredNonEmpty = [
    "candidateId",
    "candidateVersion",
    "createdAt",
    "contentDigest",
  ];
  for (const field of requiredNonEmpty) {
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
    if (typeof input[field] !== "string") {
      return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
    }
  }

  if (!validateStringArray(input.sourceRefs)) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }

  if (!isRecord(input.createdBy) || !keysExactly(input.createdBy, ["actorType", "actorId"])) {
    return invalid("INVALID_SCHEMA", "UNKNOWN_FIELD");
  }
  if (!["HUMAN", "AGENT", "SERVICE", "AUTOMATION"].includes(String(input.createdBy.actorType))) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }
  if (!isNonEmptyString(input.createdBy.actorId)) {
    return invalid("INVALID_SCHEMA", "EMPTY_REQUIRED_VALUE");
  }

  if (!["HUMAN", "AGENT_ASSISTED", "AUTOMATED"].includes(String(input.creationMode))) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }

  if (!isRecord(input.scope) || !keysExactly(input.scope, ["observedIn", "proposedAppliesTo", "explicitlyNotValidatedFor"])) {
    return invalid("INVALID_SCHEMA", "UNKNOWN_FIELD");
  }
  if (
    !validateStringArray(input.scope.observedIn) ||
    !validateStringArray(input.scope.proposedAppliesTo) ||
    !validateStringArray(input.scope.explicitlyNotValidatedFor)
  ) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }

  if ("nonAuthoritative" in input && input.nonAuthoritative !== true) {
    return invalid("INVALID_SCHEMA", "INVALID_FIELD_TYPE");
  }

  if (!Array.isArray(input.evidenceRefs)) {
    return invalid("INVALID_EVIDENCE_REFERENCE", "INVALID_FIELD_TYPE");
  }

  for (const entry of input.evidenceRefs) {
    if (!isRecord(entry) || !keysExactly(entry, ["evidenceRef", "relation", "lineage"])) {
      return invalid("INVALID_EVIDENCE_REFERENCE", "INVALID_FIELD_TYPE");
    }
    if (!isNonEmptyString(entry.evidenceRef)) {
      return invalid("INVALID_EVIDENCE_REFERENCE", "EMPTY_REQUIRED_VALUE");
    }
    if (!(entry.relation === "SUPPORTING" || entry.relation === "CONTRADICTING" || entry.relation === "INCONCLUSIVE")) {
      return invalid("INVALID_EVIDENCE_REFERENCE", "INVALID_EVIDENCE_RELATION");
    }
    if ("lineage" in entry) {
      if (
        !isRecord(entry.lineage) ||
        !keysExactly(entry.lineage, ["derivedFromKnowledgeRefs", "derivedFromDecisionRefs"]) ||
        !validateStringArray(entry.lineage.derivedFromKnowledgeRefs) ||
        !validateStringArray(entry.lineage.derivedFromDecisionRefs)
      ) {
        return invalid("INVALID_EVIDENCE_REFERENCE", "INVALID_FIELD_TYPE");
      }
    }
  }

  return input;
}

function canonicalLineage(lineage: unknown): EvidenceLineage | undefined {
  if (!isRecord(lineage)) return undefined;
  return {
    derivedFromKnowledgeRefs: uniqueSorted(lineage.derivedFromKnowledgeRefs as string[]),
    derivedFromDecisionRefs: uniqueSorted(lineage.derivedFromDecisionRefs as string[]),
  };
}

function normalizeEvidence(entries: unknown[]): {
  normalized: StructuredEvidenceReference[];
  conflict: boolean;
} {
  const byIdentity = new Map<string, StructuredEvidenceReference>();
  const relationsByRef = new Map<string, Set<EvidenceRelation>>();

  for (const raw of entries) {
    const entry = raw as JsonRecord;
    const evidenceRef = entry.evidenceRef as string;
    const relation = entry.relation as EvidenceRelation;
    const lineage = "lineage" in entry ? canonicalLineage(entry.lineage) : undefined;
    const lineageKey = lineage
      ? JSON.stringify([lineage.derivedFromKnowledgeRefs, lineage.derivedFromDecisionRefs])
      : "NONE";
    const identity = JSON.stringify([evidenceRef, relation, lineageKey]);
    if (!byIdentity.has(identity)) {
      byIdentity.set(
        identity,
        lineage ? { evidenceRef, relation, lineage } : { evidenceRef, relation },
      );
    }
    const set = relationsByRef.get(evidenceRef) ?? new Set<EvidenceRelation>();
    set.add(relation);
    relationsByRef.set(evidenceRef, set);
  }

  const normalized = [...byIdentity.values()].sort((a, b) => {
    const refOrder = a.evidenceRef.localeCompare(b.evidenceRef);
    if (refOrder !== 0) return refOrder;
    const relationOrder = RELATION_ORDER[a.relation] - RELATION_ORDER[b.relation];
    if (relationOrder !== 0) return relationOrder;
    const aLineage = a.lineage
      ? JSON.stringify([a.lineage.derivedFromKnowledgeRefs, a.lineage.derivedFromDecisionRefs])
      : "NONE";
    const bLineage = b.lineage
      ? JSON.stringify([b.lineage.derivedFromKnowledgeRefs, b.lineage.derivedFromDecisionRefs])
      : "NONE";
    return aLineage.localeCompare(bLineage);
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
  return JSON.stringify([
    key.contractType,
    key.sourceRepository,
    key.sourceEventId,
    key.contentDigest,
  ]);
}

function validateResolutionKey(value: unknown): ResolutionKey | null {
  if (
    !isRecord(value) ||
    !keysExactly(value, ["contractType", "sourceRepository", "sourceEventId", "contentDigest"]) ||
    value.contractType !== "KnowledgeCandidate@v1" ||
    !isNonEmptyString(value.sourceRepository) ||
    !isNonEmptyString(value.sourceEventId) ||
    !isNonEmptyString(value.contentDigest)
  ) {
    return null;
  }
  return {
    contractType: "KnowledgeCandidate@v1",
    sourceRepository: value.sourceRepository,
    sourceEventId: value.sourceEventId,
    contentDigest: value.contentDigest,
  };
}

function validateContext(input: unknown): ParsedContext | CandidateResolutionResult {
  if (
    !isRecord(input) ||
    !keysExactly(input, ["contractType", "completeness", "priorCandidates"]) ||
    input.contractType !== "CandidateResolutionContext@v1" ||
    !(input.completeness === "COMPLETE" || input.completeness === "UNKNOWN") ||
    !Array.isArray(input.priorCandidates)
  ) {
    return invalid("INVALID_SCHEMA", "INVALID_PRIOR_CONTEXT");
  }

  const logicalEntries = new Map<string, PriorCandidate>();
  const refsToKey = new Map<string, string>();
  const keyToRef = new Map<string, string>();
  let conflict = false;

  for (const raw of input.priorCandidates) {
    if (!isRecord(raw) || !keysExactly(raw, ["candidateRef", "resolutionKey"]) || !isNonEmptyString(raw.candidateRef)) {
      return invalid("INVALID_SCHEMA", "INVALID_PRIOR_CONTEXT");
    }
    const resolutionKey = validateResolutionKey(raw.resolutionKey);
    if (resolutionKey === null) {
      return invalid("INVALID_SCHEMA", "INVALID_PRIOR_CONTEXT");
    }
    const serializedKey = keyString(resolutionKey);
    const priorRefForKey = keyToRef.get(serializedKey);
    if (priorRefForKey !== undefined && priorRefForKey !== raw.candidateRef) conflict = true;
    const priorKeyForRef = refsToKey.get(raw.candidateRef);
    if (priorKeyForRef !== undefined && priorKeyForRef !== serializedKey) conflict = true;
    keyToRef.set(serializedKey, raw.candidateRef);
    refsToKey.set(raw.candidateRef, serializedKey);
    logicalEntries.set(`${serializedKey}\u0000${raw.candidateRef}`, {
      candidateRef: raw.candidateRef,
      resolutionKey,
    });
  }

  return {
    completeness: input.completeness,
    priorCandidates: [...logicalEntries.values()],
    conflict,
  };
}

export function resolveCandidate(
  developmentEventIdentity: unknown,
  candidateDraft: unknown,
  contextInput: unknown,
): CandidateResolutionResult {
  const identity = validateIdentity(developmentEventIdentity);
  if ("resultClass" in identity) return identity;

  const candidate = validateCandidateShape(candidateDraft);
  if ("resultClass" in candidate) return candidate;

  const context = validateContext(contextInput);
  if ("resultClass" in context) return context;

  const holdReasons: string[] = [];
  if (context.completeness === "UNKNOWN") holdReasons.push("PRIOR_CONTEXT_INCOMPLETE");
  if (context.conflict) holdReasons.push("PRIOR_CONTEXT_CONFLICT");
  if (holdReasons.length > 0) return hold(holdReasons);

  const resolutionKey: ResolutionKey = {
    contractType: "KnowledgeCandidate@v1",
    sourceRepository: identity.sourceRepository,
    sourceEventId: identity.sourceEventId,
    contentDigest: candidate.contentDigest as string,
  };
  const targetKey = keyString(resolutionKey);
  const exactMatches = context.priorCandidates.filter(
    (prior) => keyString(prior.resolutionKey) === targetKey,
  );
  const sameSourceEvent = context.priorCandidates.filter(
    (prior) =>
      prior.resolutionKey.sourceRepository === resolutionKey.sourceRepository &&
      prior.resolutionKey.sourceEventId === resolutionKey.sourceEventId,
  );

  const { normalized, conflict } = normalizeEvidence(candidate.evidenceRefs as unknown[]);

  let resultClass: ResultClass;
  let candidateRef: string;
  let priorCandidateRefs: string[];

  if (exactMatches.length > 0) {
    resultClass = "VALID_EXISTING_IDEMPOTENT";
    candidateRef = exactMatches[0]!.candidateRef;
    priorCandidateRefs = [candidateRef];
  } else if (sameSourceEvent.length > 0) {
    resultClass = "VALID_NEW_VERSION";
    candidateRef = candidate.candidateId as string;
    priorCandidateRefs = uniqueSorted(sameSourceEvent.map((prior) => prior.candidateRef));
  } else {
    resultClass = "VALID_NEW";
    candidateRef = candidate.candidateId as string;
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
