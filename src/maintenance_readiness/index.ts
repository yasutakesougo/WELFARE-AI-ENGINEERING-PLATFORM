export type OperationalState = "UNKNOWN" | "BLOCKED" | "DEGRADED" | "PASS";

export type HumanGateState =
  | "NOT REQUIRED"
  | "REQUIRED / NOT CONSUMED"
  | "GO / CONSUMED"
  | "INVALID / CONTRADICTORY"
  | "IDENTITY UNKNOWN";

export type HumanDecisionState =
  | {
      humanDecisionRequired: false;
      pending: false;
      decision: null;
      goConsumed: false;
    }
  | {
      humanDecisionRequired: true;
      pending: true;
      decision: null;
      goConsumed: false;
    }
  | {
      humanDecisionRequired: true;
      pending: false;
      decision: "GO";
      goConsumed: true;
    }
  | {
      humanDecisionRequired: true;
      pending: false;
      decision: "HOLD";
      goConsumed: false;
    };

export type IdentityApplicability = "REQUIRED" | "OPTIONAL" | "NOT_APPLICABLE";

/**
 * Discriminated identity component.
 * Canonical invariant: applicability === "NOT_APPLICABLE" => value === null.
 */
export type IdentityComponent =
  | { applicability: "REQUIRED"; value: string | null }
  | { applicability: "OPTIONAL"; value: string | null }
  | { applicability: "NOT_APPLICABLE"; value: null };

export interface SubjectIdentity {
  repository: IdentityComponent;
  commitSha: IdentityComponent;
  branch: IdentityComponent;
  prHead: IdentityComponent;
  definitionRevision: IdentityComponent;
  reviewTarget: IdentityComponent;
}

export type IdentityComparison = "MATCH" | "MISMATCH" | "UNKNOWN";

export type OperationalEffect =
  | "NO_STATE_EFFECT"
  | "STATE_DETERMINING_UNKNOWN"
  | "CONFIRMED_OPERATIONAL_BLOCKER"
  | "NON_BLOCKING_LIMITATION";

export interface EvidenceFact {
  id: string;
  requirement: "MANDATORY" | "OPTIONAL";
  kind: "AVAILABLE_ACCEPTED" | "AVAILABLE_NOT_ACCEPTED" | "UNAVAILABLE" | "INSUFFICIENT" | "FAILED";
  operationalEffect: OperationalEffect;
}

export interface OperationFact {
  id: string;
  kind: "SUCCEEDED" | "FAILED";
  operationalEffect: OperationalEffect;
}

export interface ReviewFact {
  id: string;
  kind: "PASS" | "FAILED";
  operationalEffect: OperationalEffect;
}

export interface EvidenceFacts {
  mandatoryEvidenceCoverageComplete: boolean;
  evidence: readonly EvidenceFact[];
  operations: readonly OperationFact[];
  reviews: readonly ReviewFact[];
}

export interface ReadinessFact {
  id: string;
  operationalEffect: OperationalEffect;
}

export interface StopFacts {
  authorityBoundaryReached: boolean;
  highRiskBoundaryReached: boolean;
  evidenceCeilingReached: boolean;
  exactScopeExhausted: boolean;
  productionBoundaryReached: boolean;
}

export interface MaintenanceReadinessInput {
  currentSubject: SubjectIdentity;
  evidenceSubject: SubjectIdentity;
  mandatoryReadinessFactsComplete: boolean;
  humanGateState: HumanGateState;
  humanDecisionState: HumanDecisionState;
  humanGateIdentityRequiredForTransition: boolean;
  humanGateContradictionPreventsSafeNextAction: boolean;
  evidenceFacts: EvidenceFacts;
  readinessFacts: readonly ReadinessFact[];
  stopFacts: StopFacts;
}

export interface MaintenanceReadinessResult {
  operationalState: OperationalState;
  humanGateState: HumanGateState;
  humanDecisionState: HumanDecisionState;
  identityComparison: IdentityComparison;
  implementationAuthorized: false;
  executionAuthorized: false;
  stop: boolean;
}

const IDENTITY_COMPONENTS = [
  "repository",
  "commitSha",
  "branch",
  "prHead",
  "definitionRevision",
  "reviewTarget",
] as const;

function comparePair(
  current: IdentityComponent,
  evidence: IdentityComponent,
): {
  comparison: IdentityComparison;
  effect: OperationalEffect;
  requiredInvolved: boolean;
} {
  const requiredInvolved =
    current.applicability === "REQUIRED" || evidence.applicability === "REQUIRED";

  if (current.applicability === "NOT_APPLICABLE" && evidence.applicability === "NOT_APPLICABLE") {
    return { comparison: "MATCH", effect: "NO_STATE_EFFECT", requiredInvolved: false };
  }

  if (current.applicability === "REQUIRED" && evidence.applicability === "NOT_APPLICABLE") {
    return {
      comparison: "UNKNOWN",
      effect: "STATE_DETERMINING_UNKNOWN",
      requiredInvolved: true,
    };
  }

  if (current.applicability === "NOT_APPLICABLE" && evidence.applicability === "REQUIRED") {
    return {
      comparison: "UNKNOWN",
      effect: "STATE_DETERMINING_UNKNOWN",
      requiredInvolved: true,
    };
  }

  if (current.applicability === "OPTIONAL" && evidence.applicability === "NOT_APPLICABLE") {
    return {
      comparison: "MISMATCH",
      effect: "NON_BLOCKING_LIMITATION",
      requiredInvolved: false,
    };
  }

  if (current.applicability === "NOT_APPLICABLE" && evidence.applicability === "OPTIONAL") {
    return {
      comparison: "MISMATCH",
      effect: "NON_BLOCKING_LIMITATION",
      requiredInvolved: false,
    };
  }

  if (
    (current.applicability === "REQUIRED" && evidence.applicability === "OPTIONAL") ||
    (current.applicability === "OPTIONAL" && evidence.applicability === "REQUIRED") ||
    (current.applicability === "REQUIRED" && evidence.applicability === "REQUIRED")
  ) {
    if (current.value === null || evidence.value === null) {
      return {
        comparison: "UNKNOWN",
        effect: "STATE_DETERMINING_UNKNOWN",
        requiredInvolved: true,
      };
    }
    if (current.value === evidence.value) {
      return { comparison: "MATCH", effect: "NO_STATE_EFFECT", requiredInvolved: true };
    }
    return {
      comparison: "MISMATCH",
      effect: "STATE_DETERMINING_UNKNOWN",
      requiredInvolved: true,
    };
  }

  if (current.applicability === "OPTIONAL" && evidence.applicability === "OPTIONAL") {
    if (current.value === null && evidence.value === null) {
      return { comparison: "MATCH", effect: "NO_STATE_EFFECT", requiredInvolved: false };
    }
    if (current.value === null || evidence.value === null) {
      // Pair-level UNKNOWN is allowed, but OPTIONAL-only uncertainty must not
      // promote the aggregate identity comparison to UNKNOWN.
      return { comparison: "UNKNOWN", effect: "NO_STATE_EFFECT", requiredInvolved: false };
    }
    if (current.value === evidence.value) {
      return { comparison: "MATCH", effect: "NO_STATE_EFFECT", requiredInvolved: false };
    }
    return {
      comparison: "MISMATCH",
      effect: "NON_BLOCKING_LIMITATION",
      requiredInvolved: false,
    };
  }

  return { comparison: "UNKNOWN", effect: "NO_STATE_EFFECT", requiredInvolved };
}

function evaluateSubjectIdentity(
  currentSubject: SubjectIdentity,
  evidenceSubject: SubjectIdentity,
): { comparison: IdentityComparison; effects: OperationalEffect[] } {
  let requiredIdentityUnknown = false;
  let hasMismatch = false;
  const effects: OperationalEffect[] = [];

  for (const key of IDENTITY_COMPONENTS) {
    const pair = comparePair(currentSubject[key], evidenceSubject[key]);

    if (pair.requiredInvolved && pair.comparison === "UNKNOWN") {
      requiredIdentityUnknown = true;
    }

    if (pair.comparison === "MISMATCH") {
      hasMismatch = true;
    }

    if (pair.effect !== "NO_STATE_EFFECT") {
      effects.push(pair.effect);
    }
  }

  // OPTIONAL-only UNKNOWN pairs do not set requiredIdentityUnknown or hasMismatch,
  // so the aggregate remains MATCH.
  const comparison: IdentityComparison = requiredIdentityUnknown
    ? "UNKNOWN"
    : hasMismatch
      ? "MISMATCH"
      : "MATCH";

  return { comparison, effects };
}

function evaluateEvidenceEffects(evidenceFacts: EvidenceFacts): OperationalEffect[] {
  const effects: OperationalEffect[] = [];

  for (const fact of evidenceFacts.evidence) {
    effects.push(fact.operationalEffect);
  }

  for (const operation of evidenceFacts.operations) {
    effects.push(operation.operationalEffect);
  }

  for (const review of evidenceFacts.reviews) {
    effects.push(review.operationalEffect);
  }

  return effects.filter((effect) => effect !== "NO_STATE_EFFECT");
}

function evaluateHumanGateEffect(
  humanGateState: HumanGateState,
  humanGateIdentityRequiredForTransition: boolean,
  humanGateContradictionPreventsSafeNextAction: boolean,
): OperationalEffect {
  switch (humanGateState) {
    case "NOT REQUIRED":
    case "REQUIRED / NOT CONSUMED":
    case "GO / CONSUMED":
      return "NO_STATE_EFFECT";
    case "IDENTITY UNKNOWN":
      return humanGateIdentityRequiredForTransition
        ? "STATE_DETERMINING_UNKNOWN"
        : "NO_STATE_EFFECT";
    case "INVALID / CONTRADICTORY":
      return humanGateContradictionPreventsSafeNextAction
        ? "CONFIRMED_OPERATIONAL_BLOCKER"
        : "NON_BLOCKING_LIMITATION";
    default:
      return "NO_STATE_EFFECT";
  }
}

function evaluateOperationalState(
  effects: OperationalEffect[],
  mandatoryReadinessFactsComplete: boolean,
  mandatoryEvidenceCoverageComplete: boolean,
  identityComparison: IdentityComparison,
): OperationalState {
  if (
    !mandatoryReadinessFactsComplete ||
    !mandatoryEvidenceCoverageComplete ||
    identityComparison === "UNKNOWN" ||
    effects.includes("STATE_DETERMINING_UNKNOWN")
  ) {
    return "UNKNOWN";
  }

  if (effects.includes("CONFIRMED_OPERATIONAL_BLOCKER")) {
    return "BLOCKED";
  }

  if (effects.includes("NON_BLOCKING_LIMITATION")) {
    return "DEGRADED";
  }

  return "PASS";
}

export function evaluateMaintenanceReadiness(
  input: MaintenanceReadinessInput,
): MaintenanceReadinessResult {
  const identityResult = evaluateSubjectIdentity(input.currentSubject, input.evidenceSubject);

  const evidenceEffects = evaluateEvidenceEffects(input.evidenceFacts);
  const readinessEffects = input.readinessFacts.map((fact) => fact.operationalEffect);
  const humanGateEffect = evaluateHumanGateEffect(
    input.humanGateState,
    input.humanGateIdentityRequiredForTransition,
    input.humanGateContradictionPreventsSafeNextAction,
  );

  const allEffects: OperationalEffect[] = [
    ...identityResult.effects,
    ...evidenceEffects,
    ...readinessEffects,
    humanGateEffect,
  ].filter((effect) => effect !== "NO_STATE_EFFECT");

  const operationalState = evaluateOperationalState(
    allEffects,
    input.mandatoryReadinessFactsComplete,
    input.evidenceFacts.mandatoryEvidenceCoverageComplete,
    identityResult.comparison,
  );

  const stop =
    operationalState === "UNKNOWN" ||
    operationalState === "BLOCKED" ||
    input.humanDecisionState.pending ||
    input.humanDecisionState.decision === "HOLD" ||
    input.stopFacts.authorityBoundaryReached ||
    input.stopFacts.highRiskBoundaryReached ||
    input.stopFacts.evidenceCeilingReached ||
    input.stopFacts.exactScopeExhausted ||
    input.stopFacts.productionBoundaryReached;

  return {
    operationalState,
    humanGateState: input.humanGateState,
    humanDecisionState: input.humanDecisionState,
    identityComparison: identityResult.comparison,
    implementationAuthorized: false,
    executionAuthorized: false,
    stop,
  };
}
