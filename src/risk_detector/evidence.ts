import type { RiskDecision } from "./types.js";
import type { SourceIdentity } from "./materialize.js";

export interface RiskEvidence {
  schemaVersion: "RD-EVIDENCE-V1";
  lane: RiskDecision["lane"];
  classificationBasis: RiskDecision["classificationBasis"];
  riskSignals: RiskDecision["riskSignals"];
  humanGateRequired: boolean;
  blocked: boolean;
  evidenceComplete: boolean;
  checkedAt: string;
  sourceIdentity?: SourceIdentity;
}

export function buildRiskEvidence(
  decision: RiskDecision,
  options: { evidenceComplete: boolean; checkedAt?: string; sourceIdentity?: SourceIdentity }
): RiskEvidence {
  return {
    schemaVersion: "RD-EVIDENCE-V1",
    lane: decision.lane,
    classificationBasis: decision.classificationBasis,
    riskSignals: decision.riskSignals.map((signal) => ({ ...signal, evidence: signal.evidence.slice(0, 240) })),
    humanGateRequired: decision.humanGateRequired,
    blocked: decision.blocked,
    evidenceComplete: options.evidenceComplete,
    checkedAt: options.checkedAt ?? new Date().toISOString(),
    ...(options.sourceIdentity ? { sourceIdentity: options.sourceIdentity } : {})
  };
}
