import { createHash } from "node:crypto";

export type PrimaryClass = "PROJECT" | "DOMAIN" | "ENGINEERING";
export type Maturity = "L2" | "L3" | "L4" | "L5";
export type EvidenceState = "CURRENT" | "STALE" | "CONFLICT" | "UNKNOWN";
export type VerificationState = "PASS" | "STALE" | "CONFLICT" | "UNKNOWN";
export type KnowledgeLifecycle = "ACTIVE" | "SUPERSEDED" | "WITHDRAWN";
export type RegistryState = "ACTIVE" | "HOLD" | "RETIRED";
export type UseMode =
  | "DISCOVERY"
  | "SUGGESTION_INPUT"
  | "REVIEW_INPUT"
  | "APPLICABILITY_ASSESSMENT_INPUT"
  | "POLICY_INPUT_CANDIDATE";
export type Resolution = "ELIGIBLE" | "INELIGIBLE" | "HOLD" | "UNKNOWN";

export interface TargetKnowledgeAssessment {
  targetAssessmentId: string;
  targetContextRef: string;
  knowledgeId: string;
  knowledgeVersion: string;
  applicabilityDecision: "APPLICABLE_CANDIDATE" | "NOT_APPLICABLE" | "HOLD" | "UNKNOWN";
  adoptionState:
    | "NOT_ASSESSED"
    | "ADOPTED_EQUIVALENT"
    | "ADOPTED_EXACT"
    | "REJECTED"
    | "HOLD"
    | "UNKNOWN";
  targetEvidenceRefs: string[];
  verificationState: VerificationState;
  assessedAt: string;
  assessmentRuleVersion: string;
}

export interface RegistryEntry {
  schemaVersion: "1";
  registryEntryId: string;
  knowledgeId: string;
  knowledgeVersion: string;
  entryDigest: string;
  title: string;
  generalizedRule: string;
  classification: {
    classificationResultRef: string;
    primaryClass: PrimaryClass;
    portability: "PORTABLE_CANDIDATE";
    intakeOrigin: "INTERNAL_EVIDENCE" | "EXTERNAL_INTELLIGENCE" | "OTHER_LOCKED_ORIGIN";
  };
  promotion: {
    promotionDecisionRef: string;
    decision: "PROMOTE";
    maturity: Maturity;
    promotionEvidenceState: EvidenceState;
  };
  lifecycle: {
    knowledgeLifecycle: KnowledgeLifecycle;
    registryState: RegistryState;
  };
  evidence: {
    sourceEvidenceRefs: string[];
    targetEvidenceRefs: string[];
    verificationState: VerificationState;
    lastVerifiedAt: string;
  };
  applicability: {
    globalApplicabilityClaim: "NONE";
    targetAssessments: TargetKnowledgeAssessment[];
  };
  consumption: {
    candidateUseModes: UseMode[];
  };
  supersession: {
    supersededByKnowledgeVersion: string | null;
    compatibilityRef: string | null;
  };
}

export interface RegistrySnapshotMember {
  registryEntryId: string;
  knowledgeId: string;
  knowledgeVersion: string;
  entryDigest: string;
}

export interface RegistrySnapshot {
  registrySnapshotId: string;
  registrySchemaVersion: "1";
  capturedAt: string;
  members: RegistrySnapshotMember[];
  snapshotDigest: string;
}

export interface ResolutionRequest {
  registrySnapshot: RegistrySnapshot;
  targetContextRef: string;
  requestedUseMode: UseMode;
  targetSensitive: boolean;
}

export interface KnowledgeInputEnvelope {
  knowledgeResolutionId: string;
  registrySnapshotId: string;
  knowledgeId: string;
  knowledgeVersion: string;
  entryDigest: string;
  requestedUseMode: UseMode;
  targetContextRef: string;
  resolution: Resolution;
  reasonCodes: string[];
  sourceEvidenceRefs: string[];
  targetAssessmentRefs: string[];
  resolvedAt: string;
}

const resolutionRank: Record<Resolution, number> = {
  ELIGIBLE: 0,
  UNKNOWN: 1,
  HOLD: 2,
  INELIGIBLE: 3,
};

function strongestResolution(current: Resolution, candidate: Resolution): Resolution {
  return resolutionRank[candidate] > resolutionRank[current] ? candidate : current;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) {
      throw new TypeError("Canonical JSON cannot encode undefined, functions, or symbols");
    }
    return encoded;
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const object = value as Record<string, unknown>;
  const keys = Object.keys(object).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(",")}}`;
}

export function sha256Canonical(value: unknown): string {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

export function computeEntryDigest(entry: Omit<RegistryEntry, "entryDigest">): string {
  return sha256Canonical(entry);
}

export function validateRegistryEntry(entry: RegistryEntry): string[] {
  const reasons: string[] = [];
  if (entry.schemaVersion !== "1") reasons.push("UNSUPPORTED_SCHEMA_VERSION");
  if (!entry.registryEntryId || !entry.knowledgeId || !entry.knowledgeVersion) reasons.push("MISSING_IDENTITY");
  if (!entry.title || !entry.generalizedRule) reasons.push("MISSING_KNOWLEDGE_CONTENT");
  if (!entry.classification.classificationResultRef) reasons.push("MISSING_CLASSIFICATION_REF");
  if (!entry.promotion.promotionDecisionRef) reasons.push("MISSING_PROMOTION_REF");
  if (entry.evidence.sourceEvidenceRefs.length === 0) reasons.push("MISSING_SOURCE_EVIDENCE");
  if (!entry.evidence.lastVerifiedAt) reasons.push("MISSING_LAST_VERIFIED_AT");
  const { entryDigest: _ignored, ...withoutDigest } = entry;
  if (entry.entryDigest !== computeEntryDigest(withoutDigest)) reasons.push("ENTRY_DIGEST_MISMATCH");
  return reasons;
}

export function buildRegistrySnapshot(entries: RegistryEntry[], capturedAt: string): RegistrySnapshot {
  const members = entries
    .map((entry) => ({
      registryEntryId: entry.registryEntryId,
      knowledgeId: entry.knowledgeId,
      knowledgeVersion: entry.knowledgeVersion,
      entryDigest: entry.entryDigest,
    }))
    .sort((a, b) => {
      const ak = `${a.knowledgeId}\u0000${a.knowledgeVersion}\u0000${a.registryEntryId}\u0000${a.entryDigest}`;
      const bk = `${b.knowledgeId}\u0000${b.knowledgeVersion}\u0000${b.registryEntryId}\u0000${b.entryDigest}`;
      return ak.localeCompare(bk);
    });
  const snapshotDigest = sha256Canonical({ registrySchemaVersion: "1", members });
  return {
    registrySnapshotId: `registry-v1-${snapshotDigest}`,
    registrySchemaVersion: "1",
    capturedAt,
    members,
    snapshotDigest,
  };
}

export function validateRegistrySnapshot(snapshot: RegistrySnapshot): string[] {
  const reasons: string[] = [];
  const expectedDigest = sha256Canonical({
    registrySchemaVersion: snapshot.registrySchemaVersion,
    members: [...snapshot.members].sort((a, b) => {
      const ak = `${a.knowledgeId}\u0000${a.knowledgeVersion}\u0000${a.registryEntryId}\u0000${a.entryDigest}`;
      const bk = `${b.knowledgeId}\u0000${b.knowledgeVersion}\u0000${b.registryEntryId}\u0000${b.entryDigest}`;
      return ak.localeCompare(bk);
    }),
  });
  if (snapshot.snapshotDigest !== expectedDigest) reasons.push("SNAPSHOT_DIGEST_MISMATCH");
  if (snapshot.registrySnapshotId !== `registry-v1-${expectedDigest}`) reasons.push("SNAPSHOT_ID_MISMATCH");
  return reasons;
}

export function resolveRegistryEntry(
  entry: RegistryEntry,
  request: ResolutionRequest,
  resolvedAt: string,
): KnowledgeInputEnvelope {
  const reasons = validateRegistryEntry(entry);
  let resolution: Resolution = reasons.length > 0 ? "HOLD" : "ELIGIBLE";

  const snapshotReasons = validateRegistrySnapshot(request.registrySnapshot);
  if (snapshotReasons.length > 0) {
    resolution = strongestResolution(resolution, "HOLD");
    reasons.push(...snapshotReasons);
  }

  const member = request.registrySnapshot.members.find(
    (candidate) =>
      candidate.registryEntryId === entry.registryEntryId &&
      candidate.knowledgeId === entry.knowledgeId &&
      candidate.knowledgeVersion === entry.knowledgeVersion,
  );
  if (!member) {
    resolution = strongestResolution(resolution, "HOLD");
    reasons.push("ENTRY_NOT_BOUND_TO_SNAPSHOT");
  } else if (member.entryDigest !== entry.entryDigest) {
    resolution = strongestResolution(resolution, "HOLD");
    reasons.push("SNAPSHOT_ENTRY_DIGEST_MISMATCH");
  }

  if (entry.lifecycle.knowledgeLifecycle === "SUPERSEDED" || entry.lifecycle.knowledgeLifecycle === "WITHDRAWN") {
    resolution = strongestResolution(resolution, "INELIGIBLE");
    reasons.push("KNOWLEDGE_NOT_ACTIVE");
  }
  if (entry.lifecycle.registryState === "RETIRED") {
    resolution = strongestResolution(resolution, "INELIGIBLE");
    reasons.push("REGISTRY_RETIRED");
  } else if (entry.lifecycle.registryState !== "ACTIVE") {
    resolution = strongestResolution(resolution, "HOLD");
    reasons.push("REGISTRY_NOT_ACTIVE");
  }
  if (entry.promotion.promotionEvidenceState !== "CURRENT") {
    resolution = strongestResolution(resolution, "HOLD");
    reasons.push("PROMOTION_EVIDENCE_NOT_CURRENT");
  }
  if (entry.evidence.verificationState !== "PASS") {
    resolution = strongestResolution(resolution, "HOLD");
    reasons.push("VERIFICATION_NOT_PASS");
  }
  if (!entry.consumption.candidateUseModes.includes(request.requestedUseMode)) {
    resolution = strongestResolution(resolution, "INELIGIBLE");
    reasons.push("USE_MODE_NOT_ALLOWED");
  }

  const targetAssessment = entry.applicability.targetAssessments.find(
    (candidate) =>
      candidate.targetContextRef === request.targetContextRef &&
      candidate.knowledgeId === entry.knowledgeId &&
      candidate.knowledgeVersion === entry.knowledgeVersion,
  );

  const requiresTargetAssessment =
    request.targetSensitive ||
    request.requestedUseMode === "POLICY_INPUT_CANDIDATE" ||
    request.requestedUseMode === "APPLICABILITY_ASSESSMENT_INPUT";

  if (requiresTargetAssessment) {
    if (!targetAssessment) {
      resolution = strongestResolution(resolution, "HOLD");
      reasons.push("TARGET_ASSESSMENT_REQUIRED");
    } else if (
      targetAssessment.verificationState !== "PASS" ||
      targetAssessment.applicabilityDecision !== "APPLICABLE_CANDIDATE"
    ) {
      resolution = strongestResolution(resolution, "HOLD");
      reasons.push("TARGET_ASSESSMENT_NOT_APPLICABLE_PASS");
    }
  }

  return {
    knowledgeResolutionId: sha256Canonical({
      registrySnapshotId: request.registrySnapshot.registrySnapshotId,
      entryDigest: entry.entryDigest,
      targetContextRef: request.targetContextRef,
      requestedUseMode: request.requestedUseMode,
      resolvedAt,
    }),
    registrySnapshotId: request.registrySnapshot.registrySnapshotId,
    knowledgeId: entry.knowledgeId,
    knowledgeVersion: entry.knowledgeVersion,
    entryDigest: entry.entryDigest,
    requestedUseMode: request.requestedUseMode,
    targetContextRef: request.targetContextRef,
    resolution,
    reasonCodes: [...new Set(reasons)].sort(),
    sourceEvidenceRefs: [...entry.evidence.sourceEvidenceRefs],
    targetAssessmentRefs: targetAssessment ? [targetAssessment.targetAssessmentId] : [],
    resolvedAt,
  };
}
