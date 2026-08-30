export type RiskLane = "FAST" | "GOVERNED" | "BLOCKED";

export type RiskBoundary = "R1_PRODUCTION" | "R2_AUTHORITY" | "R3_SENSITIVE" | "R4_DESTRUCTIVE" | "R5_EXTERNAL_COST";

export interface RiskSignal {
  boundary: RiskBoundary;
  ruleId: string;
  evidence: string;
}

export interface RiskInput {
  changedFiles?: string[];
  intent?: string;
  diff?: string;
  evidenceComplete?: boolean;
}

export interface RiskDecision {
  lane: RiskLane;
  riskSignals: RiskSignal[];
  humanGateRequired: boolean;
  blocked: boolean;
  classificationBasis: "PRELIMINARY" | "ACTUAL_DIFF";
  notes: string[];
}
