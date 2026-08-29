import { createHash } from 'node:crypto';

export const IDENTITY_CONTRACT = 'WAEP-LEARNING-EVENT-IDENTITY@v1' as const;
export const INGESTION_ATTEMPT_CONTRACT = 'LearningEventIngestionAttempt@v1' as const;
export const LEARNING_EVENT_CONTRACT = 'LearningEvent@v1' as const;

export type DomainResult = 'ADMITTED' | 'DUPLICATE_NO_OP' | 'HELD' | 'DENIED' | 'INVALID';
export type AckState = 'DURABILITY_PENDING' | 'ACKNOWLEDGEABLE';
export type RecoveryState = 'NOT_COMMITTED' | 'COMMITTED' | 'PARTIAL_NONCONFORMANT' | 'UNRESOLVED';
export type SourcePolicyRequirement = 'REQUIRED' | 'NOT_REQUIRED' | 'UNRESOLVED';
export type ProductionBoundary = 'SENSITIVE' | 'NOT_SENSITIVE' | 'UNRESOLVED';
export type ReleaseOutcome = 'ALLOW' | 'ALLOW_WITH_CONDITIONS' | 'DENY' | 'HOLD' | 'MALFORMED' | 'UNAVAILABLE';
export type ConditionState = 'SATISFIED' | 'UNSATISFIED' | 'UNRESOLVED';

export interface SourceIdentity {
  sourceRepository: string;
  sourceEventId: string;
  sourceArtifactRef: string;
  sourceRevision: string;
  observedAt: string;
  contentDigest: string;
}

export interface ClassificationInput {
  sourceClassification: string;
  classificationEvidenceRefs: string[];
}

export interface PayloadInput {
  allowedPayloadRef: string;
  allowedPayloadDigest: string;
  destinationLearningPlane: string;
}

export interface ReleaseDecisionInput {
  ref: string;
  outcome: ReleaseOutcome;
  subjectPayloadRef: string;
  subjectPayloadDigest: string;
  destinationLearningPlane: string;
  conditions: ConditionState[];
}

export interface ReleaseRequirementInput {
  sourceClassification: string;
  sourcePolicyReleaseRequirement: SourcePolicyRequirement;
  productionSensitiveBoundary: ProductionBoundary;
  callerStricterRequirement: boolean;
}

export interface ExistingEventObservation {
  canonicalEventIdentity: string;
  sourceEventId: string;
  sourceRevision: string;
  sourceContentDigest: string;
  learningEventId: string;
  contentDigest: string;
}

export interface AdmissionRequest {
  attemptId: string;
  attemptedAt: string;
  source: SourceIdentity;
  classification: ClassificationInput;
  payload: PayloadInput;
  releaseRequirement: ReleaseRequirementInput;
  releaseDecision?: ReleaseDecisionInput | null;
  existingEvent?: ExistingEventObservation | null;
}

export interface LearningEventCandidate {
  learningEventId: string;
  contractVersion: typeof LEARNING_EVENT_CONTRACT;
  canonicalEventIdentity: string;
  source: SourceIdentity;
  classification: ClassificationInput;
  payload: PayloadInput;
  release: {
    required: boolean;
    learningPayloadReleaseDecisionRef: string | null;
  };
  ingestion: {
    ingestedAt: string;
    ingestionContractVersion: typeof LEARNING_EVENT_CONTRACT;
  };
}

export interface IngestionAttemptRecord {
  attemptId: string;
  contractVersion: typeof INGESTION_ATTEMPT_CONTRACT;
  requestedEventIdentity: string | null;
  sourceRef: string;
  attemptedAt: string;
  result: DomainResult;
  reasonCodes: string[];
  resolvedLearningEventRef: string | null;
  releaseDecisionRef: string | null;
  conditionEvidenceRefs: string[];
  revisionMetadataDifference: boolean;
  contentDigest: string;
}

export type DurabilityPlan =
  | { kind: 'ATOMIC_EVENT_AND_ATTEMPT'; event: LearningEventCandidate; attempt: IngestionAttemptRecord }
  | { kind: 'ATTEMPT_ONLY'; attempt: IngestionAttemptRecord };

export interface PreparedIngestionOutcome {
  attemptId: string;
  domainResult: DomainResult;
  reasonCodes: string[];
  learningEventCandidate: LearningEventCandidate | null;
  ingestionAttemptRecord: IngestionAttemptRecord;
  durabilityPlan: DurabilityPlan;
  acknowledgementState: 'DURABILITY_PENDING';
}

function nonEmpty(value: string): boolean {
  return value.length > 0;
}

function uint64be(value: number): Buffer {
  const out = Buffer.alloc(8);
  out.writeBigUInt64BE(BigInt(value));
  return out;
}

export function canonicalIdentityMaterial(sourceEventId: string, sourceContentDigest: string): Buffer {
  if (!nonEmpty(sourceEventId) || !nonEmpty(sourceContentDigest)) {
    throw new Error('IDENTITY_INPUT_INVALID');
  }
  const field1 = Buffer.from(sourceEventId.normalize('NFC'), 'utf8');
  const field2 = Buffer.from(sourceContentDigest.normalize('NFC'), 'utf8');
  return Buffer.concat([
    Buffer.from(IDENTITY_CONTRACT, 'utf8'),
    Buffer.from([0]),
    uint64be(field1.byteLength),
    field1,
    uint64be(field2.byteLength),
    field2,
  ]);
}

export function deriveIdentity(sourceEventId: string, sourceContentDigest: string): {
  canonicalEventIdentity: string;
  learningEventId: string;
  identityDigest: string;
  materialHex: string;
} {
  const material = canonicalIdentityMaterial(sourceEventId, sourceContentDigest);
  const identityDigest = createHash('sha256').update(material).digest('hex');
  return {
    canonicalEventIdentity: `LEID1:${identityDigest}`,
    learningEventId: `LE-${identityDigest}`,
    identityDigest,
    materialHex: material.toString('hex'),
  };
}

export function deriveReleaseRequired(input: ReleaseRequirementInput):
  | { kind: 'OK'; required: boolean }
  | { kind: 'HELD'; reasonCode: 'RELEASE_REQUIREMENT_UNRESOLVED' } {
  if (
    input.sourcePolicyReleaseRequirement === 'UNRESOLVED' ||
    input.productionSensitiveBoundary === 'UNRESOLVED'
  ) {
    return { kind: 'HELD', reasonCode: 'RELEASE_REQUIREMENT_UNRESOLVED' };
  }
  return {
    kind: 'OK',
    required:
      input.callerStricterRequirement ||
      input.sourcePolicyReleaseRequirement === 'REQUIRED' ||
      input.productionSensitiveBoundary === 'SENSITIVE',
  };
}

function validateRelease(
  required: boolean,
  payload: PayloadInput,
  decision: ReleaseDecisionInput | null | undefined,
): { result: 'CONTINUE' } | { result: DomainResult; reasonCode: string } {
  if (!required && !decision) return { result: 'CONTINUE' };
  if (required && !decision) return { result: 'HELD', reasonCode: 'MISSING_DEPENDENCY' };
  if (!decision) return { result: 'CONTINUE' };

  if (decision.outcome === 'UNAVAILABLE') return { result: 'HELD', reasonCode: 'RELEASE_RESOLUTION_UNAVAILABLE' };
  if (decision.outcome === 'MALFORMED') return { result: 'INVALID', reasonCode: 'MALFORMED_RELEASE_DECISION' };
  if (decision.outcome === 'HOLD') return { result: 'HELD', reasonCode: 'RELEASE_HOLD' };
  if (decision.outcome === 'DENY') return { result: 'DENIED', reasonCode: 'RELEASE_DENIED' };

  if (
    payload.allowedPayloadRef !== decision.subjectPayloadRef ||
    payload.allowedPayloadDigest !== decision.subjectPayloadDigest ||
    payload.destinationLearningPlane !== decision.destinationLearningPlane
  ) {
    return { result: 'HELD', reasonCode: 'RELEASE_SUBJECT_MISMATCH' };
  }

  if (decision.outcome === 'ALLOW_WITH_CONDITIONS') {
    if (decision.conditions.some((x) => x === 'UNRESOLVED')) {
      return { result: 'HELD', reasonCode: 'RELEASE_CONDITION_UNRESOLVED' };
    }
    if (decision.conditions.some((x) => x === 'UNSATISFIED')) {
      return { result: 'DENIED', reasonCode: 'RELEASE_CONDITION_UNSATISFIED' };
    }
  }
  return { result: 'CONTINUE' };
}

function makeAttempt(
  request: AdmissionRequest,
  requestedEventIdentity: string | null,
  result: DomainResult,
  reasonCodes: string[],
  revisionMetadataDifference: boolean,
  resolvedLearningEventRef: string | null,
): IngestionAttemptRecord {
  const auditMaterial = JSON.stringify({
    attemptId: request.attemptId,
    requestedEventIdentity,
    sourceEventId: request.source.sourceEventId,
    sourceRevision: request.source.sourceRevision,
    result,
    reasonCodes,
    resolvedLearningEventRef,
  });
  return {
    attemptId: request.attemptId,
    contractVersion: INGESTION_ATTEMPT_CONTRACT,
    requestedEventIdentity,
    sourceRef: request.source.sourceArtifactRef,
    attemptedAt: request.attemptedAt,
    result,
    reasonCodes,
    resolvedLearningEventRef,
    releaseDecisionRef: request.releaseDecision?.ref ?? null,
    conditionEvidenceRefs: [],
    revisionMetadataDifference,
    contentDigest: createHash('sha256').update(auditMaterial).digest('hex'),
  };
}

function terminal(
  request: AdmissionRequest,
  requestedEventIdentity: string | null,
  result: Exclude<DomainResult, 'ADMITTED'>,
  reasonCodes: string[],
  revisionMetadataDifference = false,
  resolvedLearningEventRef: string | null = null,
): PreparedIngestionOutcome {
  const attempt = makeAttempt(
    request,
    requestedEventIdentity,
    result,
    reasonCodes,
    revisionMetadataDifference,
    resolvedLearningEventRef,
  );
  return {
    attemptId: request.attemptId,
    domainResult: result,
    reasonCodes,
    learningEventCandidate: null,
    ingestionAttemptRecord: attempt,
    durabilityPlan: { kind: 'ATTEMPT_ONLY', attempt },
    acknowledgementState: 'DURABILITY_PENDING',
  };
}

export function prepareAdmission(request: AdmissionRequest): PreparedIngestionOutcome {
  if (!nonEmpty(request.attemptId) || !nonEmpty(request.attemptedAt)) {
    return terminal(request, null, 'INVALID', ['ATTEMPT_IDENTITY_INVALID']);
  }
  if (
    !nonEmpty(request.source.sourceEventId) ||
    !nonEmpty(request.source.contentDigest) ||
    !nonEmpty(request.source.sourceRevision) ||
    !nonEmpty(request.source.sourceArtifactRef)
  ) {
    return terminal(request, null, 'INVALID', ['SOURCE_IDENTITY_INVALID']);
  }

  const identity = deriveIdentity(request.source.sourceEventId, request.source.contentDigest);
  const releaseReq = deriveReleaseRequired(request.releaseRequirement);
  if (releaseReq.kind === 'HELD') {
    return terminal(request, identity.canonicalEventIdentity, 'HELD', [releaseReq.reasonCode]);
  }

  const existing = request.existingEvent;
  if (existing && existing.sourceEventId === request.source.sourceEventId) {
    if (existing.sourceRevision === request.source.sourceRevision && existing.sourceContentDigest !== request.source.contentDigest) {
      return terminal(request, identity.canonicalEventIdentity, 'HELD', ['SOURCE_IDENTITY_CONFLICT']);
    }
    if (existing.sourceContentDigest === request.source.contentDigest) {
      return terminal(
        request,
        identity.canonicalEventIdentity,
        'DUPLICATE_NO_OP',
        ['CANONICAL_EVENT_ALREADY_EXISTS'],
        existing.sourceRevision !== request.source.sourceRevision,
        existing.learningEventId,
      );
    }
  }

  const release = validateRelease(releaseReq.required, request.payload, request.releaseDecision);
  if (release.result !== 'CONTINUE') {
    return terminal(request, identity.canonicalEventIdentity, release.result, [release.reasonCode]);
  }

  const event: LearningEventCandidate = {
    learningEventId: identity.learningEventId,
    contractVersion: LEARNING_EVENT_CONTRACT,
    canonicalEventIdentity: identity.canonicalEventIdentity,
    source: request.source,
    classification: request.classification,
    payload: request.payload,
    release: {
      required: releaseReq.required,
      learningPayloadReleaseDecisionRef: request.releaseDecision?.ref ?? null,
    },
    ingestion: {
      ingestedAt: request.attemptedAt,
      ingestionContractVersion: LEARNING_EVENT_CONTRACT,
    },
  };
  const attempt = makeAttempt(request, identity.canonicalEventIdentity, 'ADMITTED', [], false, event.learningEventId);
  return {
    attemptId: request.attemptId,
    domainResult: 'ADMITTED',
    reasonCodes: [],
    learningEventCandidate: event,
    ingestionAttemptRecord: attempt,
    durabilityPlan: { kind: 'ATOMIC_EVENT_AND_ATTEMPT', event, attempt },
    acknowledgementState: 'DURABILITY_PENDING',
  };
}

export function applyDurabilityResult(
  prepared: PreparedIngestionOutcome,
  succeeded: boolean,
): { acknowledgementState: AckState; domainResult: DomainResult | null } {
  if (!succeeded) return { acknowledgementState: 'DURABILITY_PENDING', domainResult: null };
  return { acknowledgementState: 'ACKNOWLEDGEABLE', domainResult: prepared.domainResult };
}

export function recoverFromObservation(state: RecoveryState): {
  action: 'RETRY_EVALUATION' | 'RESOLVE_EXISTING' | 'FAIL_CLOSED' | 'HOLD';
  reasonCode: string;
} {
  switch (state) {
    case 'NOT_COMMITTED':
      return { action: 'RETRY_EVALUATION', reasonCode: 'NOT_COMMITTED' };
    case 'COMMITTED':
      return { action: 'RESOLVE_EXISTING', reasonCode: 'COMMITTED' };
    case 'PARTIAL_NONCONFORMANT':
      return { action: 'FAIL_CLOSED', reasonCode: 'PARTIAL_NONCONFORMANT' };
    case 'UNRESOLVED':
      return { action: 'HOLD', reasonCode: 'RECOVERY_UNRESOLVED' };
  }
}
