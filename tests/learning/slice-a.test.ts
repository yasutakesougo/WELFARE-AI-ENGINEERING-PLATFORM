import { describe, expect, it } from 'vitest';
import {
  applyDurabilityResult,
  canonicalIdentityMaterial,
  deriveIdentity,
  prepareAdmission,
  recoverFromObservation,
  type AdmissionRequest,
} from '../../src/learning/slice-a.js';

function baseRequest(): AdmissionRequest {
  return {
    attemptId: 'ATTEMPT-1',
    attemptedAt: '2026-08-29T10:40:00+09:00',
    source: {
      sourceRepository: 'repo',
      sourceEventId: 'EV-1',
      sourceArtifactRef: 'artifact://1',
      sourceRevision: 'rev-1',
      observedAt: '2026-08-29T10:39:00+09:00',
      contentDigest: 'digest-1',
    },
    classification: {
      sourceClassification: 'SYNTHETIC',
      classificationEvidenceRefs: [],
    },
    payload: {
      allowedPayloadRef: 'payload://1',
      allowedPayloadDigest: 'payload-digest-1',
      destinationLearningPlane: 'LAB',
    },
    releaseRequirement: {
      sourceClassification: 'SYNTHETIC',
      sourcePolicyReleaseRequirement: 'NOT_REQUIRED',
      productionSensitiveBoundary: 'NOT_SENSITIVE',
      callerStricterRequirement: false,
    },
    releaseDecision: null,
  };
}

function existingFor(req: AdmissionRequest) {
  const id = deriveIdentity(req.source.sourceEventId, req.source.contentDigest);
  return {
    canonicalEventIdentity: id.canonicalEventIdentity,
    identityMaterialHex: id.materialHex,
    sourceEventId: req.source.sourceEventId,
    sourceRevision: req.source.sourceRevision,
    sourceContentDigest: req.source.contentDigest,
    learningEventId: id.learningEventId,
    contentDigest: 'event-digest',
  };
}

describe('identity contract', () => {
  it('uses deterministic LEID1 SHA-256 identity', () => {
    const a = deriveIdentity('EV-1', 'digest-1');
    const b = deriveIdentity('EV-1', 'digest-1');
    expect(a).toEqual(b);
    expect(a.identityDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(a.canonicalEventIdentity).toBe(`LEID1:${a.identityDigest}`);
    expect(a.learningEventId).toBe(`LE-${a.identityDigest}`);
  });

  it('normalizes NFC-equivalent fields', () => {
    expect(deriveIdentity('e\u0301', 'x').canonicalEventIdentity).toBe(
      deriveIdentity('\u00e9', 'x').canonicalEventIdentity,
    );
  });

  it('uses length prefixes to prevent field-boundary ambiguity', () => {
    expect(canonicalIdentityMaterial('ab', 'c').toString('hex')).not.toBe(
      canonicalIdentityMaterial('a', 'bc').toString('hex'),
    );
  });

  it('fails closed on canonical identity collision evidence', () => {
    const req = baseRequest();
    const existing = existingFor(req);
    req.existingEvent = { ...existing, identityMaterialHex: '00' };
    const result = prepareAdmission(req);
    expect(result.domainResult).toBe('HELD');
    expect(result.reasonCodes).toContain('IDENTITY_DIGEST_COLLISION');
  });
});

describe('duplicate and revision matrix', () => {
  it('exact duplicate returns DUPLICATE_NO_OP', () => {
    const req = baseRequest();
    req.existingEvent = existingFor(req);
    const result = prepareAdmission(req);
    expect(result.domainResult).toBe('DUPLICATE_NO_OP');
    expect(result.durabilityPlan.kind).toBe('ATTEMPT_ONLY');
  });

  it('revision-only same digest is no-op with audit flag', () => {
    const req = baseRequest();
    req.existingEvent = { ...existingFor(req), sourceRevision: 'rev-old' };
    const result = prepareAdmission(req);
    expect(result.domainResult).toBe('DUPLICATE_NO_OP');
    expect(result.ingestionAttemptRecord.revisionMetadataDifference).toBe(true);
  });

  it('same sourceEventId and revision with changed digest is HELD', () => {
    const req = baseRequest();
    const old = deriveIdentity(req.source.sourceEventId, 'different');
    req.existingEvent = {
      canonicalEventIdentity: old.canonicalEventIdentity,
      identityMaterialHex: old.materialHex,
      sourceEventId: req.source.sourceEventId,
      sourceRevision: req.source.sourceRevision,
      sourceContentDigest: 'different',
      learningEventId: old.learningEventId,
      contentDigest: 'event-digest',
    };
    const result = prepareAdmission(req);
    expect(result.domainResult).toBe('HELD');
    expect(result.reasonCodes).toContain('SOURCE_IDENTITY_CONFLICT');
  });
});

describe('classification and release boundary', () => {
  it('rejects unsupported classification', () => {
    const req = baseRequest();
    req.classification.sourceClassification = 'UNKNOWN';
    const result = prepareAdmission(req);
    expect(result.domainResult).toBe('INVALID');
    expect(result.reasonCodes).toContain('UNSUPPORTED_CLASSIFICATION');
  });

  it('holds unresolved release requirement', () => {
    const req = baseRequest();
    req.releaseRequirement.sourcePolicyReleaseRequirement = 'UNRESOLVED';
    expect(prepareAdmission(req).domainResult).toBe('HELD');
  });

  it('denies explicit release DENY', () => {
    const req = baseRequest();
    req.releaseRequirement.callerStricterRequirement = true;
    req.releaseDecision = {
      ref: 'decision://1',
      outcome: 'DENY',
      subjectPayloadRef: req.payload.allowedPayloadRef,
      subjectPayloadDigest: req.payload.allowedPayloadDigest,
      destinationLearningPlane: req.payload.destinationLearningPlane,
      conditions: [],
      conditionEvidenceRefs: [],
    };
    expect(prepareAdmission(req).domainResult).toBe('DENIED');
  });

  it('holds release subject mismatch', () => {
    const req = baseRequest();
    req.releaseRequirement.callerStricterRequirement = true;
    req.releaseDecision = {
      ref: 'decision://1',
      outcome: 'ALLOW',
      subjectPayloadRef: 'other',
      subjectPayloadDigest: req.payload.allowedPayloadDigest,
      destinationLearningPlane: req.payload.destinationLearningPlane,
      conditions: [],
      conditionEvidenceRefs: [],
    };
    const result = prepareAdmission(req);
    expect(result.domainResult).toBe('HELD');
    expect(result.reasonCodes).toContain('RELEASE_SUBJECT_MISMATCH');
  });

  it('holds unresolved ALLOW_WITH_CONDITIONS and retains evidence refs', () => {
    const req = baseRequest();
    req.releaseRequirement.callerStricterRequirement = true;
    req.releaseDecision = {
      ref: 'decision://1',
      outcome: 'ALLOW_WITH_CONDITIONS',
      subjectPayloadRef: req.payload.allowedPayloadRef,
      subjectPayloadDigest: req.payload.allowedPayloadDigest,
      destinationLearningPlane: req.payload.destinationLearningPlane,
      conditions: ['UNRESOLVED'],
      conditionEvidenceRefs: ['evidence://condition-1'],
    };
    const result = prepareAdmission(req);
    expect(result.domainResult).toBe('HELD');
    expect(result.ingestionAttemptRecord.conditionEvidenceRefs).toEqual(['evidence://condition-1']);
  });
});

describe('event and audit contract', () => {
  it('constructs complete immutable event envelope with top-level digest and lineage', () => {
    const result = prepareAdmission(baseRequest());
    expect(result.domainResult).toBe('ADMITTED');
    expect(result.learningEventCandidate?.contentDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(result.learningEventCandidate?.lineage).toEqual({
      derivedFromLearningEventRefs: [],
      derivedFromKnowledgeRefs: [],
      derivedFromDecisionRefs: [],
    });
  });

  it('ADMITTED prepares event + audit as one logical durability unit', () => {
    const result = prepareAdmission(baseRequest());
    expect(result.domainResult).toBe('ADMITTED');
    expect(result.durabilityPlan.kind).toBe('ATOMIC_EVENT_AND_ATTEMPT');
    expect(result.acknowledgementState).toBe('DURABILITY_PENDING');
  });

  it('non-ADMITTED prepares attempt-only durability', () => {
    const req = baseRequest();
    req.releaseRequirement.sourcePolicyReleaseRequirement = 'UNRESOLVED';
    const result = prepareAdmission(req);
    expect(result.domainResult).toBe('HELD');
    expect(result.durabilityPlan.kind).toBe('ATTEMPT_ONLY');
  });

  it('does not acknowledge a terminal domain result when durability fails', () => {
    const prepared = prepareAdmission(baseRequest());
    expect(applyDurabilityResult(prepared, false)).toEqual({
      acknowledgementState: 'DURABILITY_PENDING',
      domainResult: null,
    });
  });

  it('becomes acknowledgeable only after durability succeeds', () => {
    const prepared = prepareAdmission(baseRequest());
    expect(applyDurabilityResult(prepared, true)).toEqual({
      acknowledgementState: 'ACKNOWLEDGEABLE',
      domainResult: 'ADMITTED',
    });
  });

  it.each([
    ['NOT_COMMITTED', 'RETRY_EVALUATION'],
    ['COMMITTED', 'RESOLVE_EXISTING'],
    ['PARTIAL_NONCONFORMANT', 'FAIL_CLOSED'],
    ['UNRESOLVED', 'HOLD'],
  ] as const)('maps recovery state %s deterministically', (state, action) => {
    expect(recoverFromObservation(state).action).toBe(action);
  });
});
