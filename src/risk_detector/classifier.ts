import type { RiskBoundary, RiskDecision, RiskInput, RiskSignal } from "./types.js";

type Rule = {
  boundary: RiskBoundary;
  ruleId: string;
  pattern: RegExp;
};

const GOVERNED_RULES: Rule[] = [
  { boundary: "R1_PRODUCTION", ruleId: "R1-PRODUCTION-WRITE", pattern: /\b(prod(?:uction)?|live)\b[\s\S]{0,80}\b(deploy|write|update|config|database|db)\b|\b(deploy|write|update)\b[\s\S]{0,80}\b(prod(?:uction)?|live)\b/i },
  { boundary: "R2_AUTHORITY", ruleId: "R2-AUTHORITY-CHANGE", pattern: /\b(permission|role|authority|authorization|authentication|identity|rbac|acl)\b[\s\S]{0,80}\b(change|grant|revoke|modify|update|expand|reduce)\b|\b(grant|revoke)\b[\s\S]{0,80}\b(permission|role|access)\b/i },
  { boundary: "R3_SENSITIVE", ruleId: "R3-SENSITIVE-HANDLING", pattern: /\b(personal data|pii|sensitive data|credential|secret|api key|token|password|private key)\b[\s\S]{0,100}\b(store|persist|log|send|transfer|handle|expose|write|add)\b/i },
  { boundary: "R4_DESTRUCTIVE", ruleId: "R4-DESTRUCTIVE", pattern: /\b(delete|purge|drop|truncate|destroy|irreversible|overwrite)\b|\b(schema|migration)\b[\s\S]{0,80}\b(irreversible|destructive|drop)\b/i },
  { boundary: "R5_EXTERNAL_COST", ruleId: "R5-EXTERNAL-COST", pattern: /\b(paid|billable|billing|cost|charge|expensive)\b[\s\S]{0,100}\b(api|resource|request|call|execution)\b|\b(mass|bulk|large[- ]scale)\b[\s\S]{0,80}\b(api calls?|requests?|provision)\b/i }
];

const BLOCKED_RULES: Rule[] = [
  { boundary: "R3_SENSITIVE", ruleId: "BLOCK-PLAINTEXT-SECRET", pattern: /(?:api[_-]?key|password|secret|token)\s*[=:]\s*["']?[A-Za-z0-9_\-\/+=]{12,}/i },
  { boundary: "R3_SENSITIVE", ruleId: "BLOCK-PRIVATE-KEY", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i },
  { boundary: "R4_DESTRUCTIVE", ruleId: "BLOCK-PRODUCTION-DESTRUCTIVE", pattern: /\b(prod(?:uction)?|live)\b[\s\S]{0,80}\b(drop database|truncate|purge all|delete all|destroy)\b/i }
];

const DANGEROUS_HINT = /\b(prod(?:uction)?|live|permission|role|authority|authorization|authentication|identity|personal data|pii|sensitive data|credential|secret|api key|token|password|delete|purge|drop|truncate|destroy|irreversible|paid|billable|billing|cost|charge)\b/i;

function materialize(input: RiskInput): string {
  return [input.intent ?? "", ...(input.changedFiles ?? []), input.diff ?? ""].join("\n");
}

function signal(rule: Rule, evidence: string): RiskSignal {
  return { boundary: rule.boundary, ruleId: rule.ruleId, evidence: evidence.slice(0, 240) };
}

function matchingSignals(text: string, rules: Rule[]): RiskSignal[] {
  const results: RiskSignal[] = [];
  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (match) results.push(signal(rule, match[0]));
  }
  return results;
}

export function classifyRisk(input: RiskInput): RiskDecision {
  const text = materialize(input);
  const classificationBasis = input.diff && input.diff.trim().length > 0 ? "ACTUAL_DIFF" : "PRELIMINARY";

  const blockedSignals = matchingSignals(text, BLOCKED_RULES);
  if (blockedSignals.length > 0) {
    return {
      lane: "BLOCKED",
      riskSignals: blockedSignals,
      humanGateRequired: false,
      blocked: true,
      classificationBasis,
      notes: ["Human GO cannot override a BLOCKED condition."]
    };
  }

  const governedSignals = matchingSignals(text, GOVERNED_RULES);
  if (governedSignals.length > 0) {
    return {
      lane: "GOVERNED",
      riskSignals: governedSignals,
      humanGateRequired: true,
      blocked: false,
      classificationBasis,
      notes: ["At least one governed boundary was deterministically detected."]
    };
  }

  if (input.evidenceComplete === false && DANGEROUS_HINT.test(text)) {
    return {
      lane: "GOVERNED",
      riskSignals: [],
      humanGateRequired: true,
      blocked: false,
      classificationBasis,
      notes: ["Dangerous-boundary evidence is incomplete; escalate rather than infer FAST."]
    };
  }

  return {
    lane: "FAST",
    riskSignals: [],
    humanGateRequired: false,
    blocked: false,
    classificationBasis,
    notes: ["No deterministic governed or blocked boundary was detected."]
  };
}
