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

export interface IdentityComponent {
  applicability: IdentityApplicability;
  value: string | null;
}

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
  kind: "AVAILABLE_ACCEPTED" | "AVAILABLE_NOT_ACCEPTED" | "UNAVAILABLE" | "INSUFFICIENT" | "FAILED";
  requirement: "MANDATORY" | "OPTIONAL";
}

export type OperationFact =
  | { status: "SUCCEEDED"; effect: "NO_STATE_EFFECT" }
  | { status: "FAILED"; effect: OperationalEffect };

export type ReviewFact =
  | { status: "PASS"; requiredForSafeNextAction: false }
  | { status: "FAILED"; requiredForSafeNextAction: boolean };

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

const REQUIRED_IDENTITY_COMPONENTS = [
  "repository",
  "commitSha",
  "branch",
  "prHead",
  "definitionRevision",
  "reviewTarget",
] as const;

function isNullOrWhitespace(value: string | null): boolean {
  return value === null || value.trim() === "";
}

function compareIdentityValues(current: string | null, evidence: string | null): IdentityComparison {
  if (current === null || evidence === null) {
    return "UNKNOWN";
  }
  if (current === evidence) {
    return "MATCH";
  }
  return "MISMATCH";
}

function comparePair(
  current: IdentityComponent,
  evidence: IdentityComponent,
): {
  comparison: IdentityComparison;
  effect: OperationalEffect;
  requiredInvolved: boolean;
} {
  const currentRequired = current.applicability === "REQUIRED";
  const evidenceRequired = evidence.applicability === "REQUIRED";
  const requiredInvolved = currentRequired || evidenceRequired;

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

  if (current.applicability === "REQUIRED" && evidence.applicability === "OPTIONAL") {
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

  if (current.applicability === "OPTIONAL" && evidence.applicability === "REQUIRED") {
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

  if (current.applicability === "REQUIRED" && evidence.applicability === "REQUIRED") {
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

  return { comparison: "UNKNOWN", effect: "NO_STATE_EFFECT", requiredInvolved: false };
}

function evaluateSubjectIdentity(
  currentSubject: SubjectIdentity,
  evidenceSubject: SubjectIdentity,
): { comparison: IdentityComparison; effects: OperationalEffect[] } {
  let aggregateComparison: IdentityComparison = "MATCH";
  let requiredIdentityUnknown = false;
  let hasMismatch = false;

  const effects: OperationalEffect[] = [];

  for (const key of REQUIRED_IDENTITY_COMPONENTS) {
    const current = currentSubject[key];
    const evidence = evidenceSubject[key];
    const pair = comparePair(current, evidence);

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

  if (requiredIdentityUnknown) {
    aggregateComparison = "UNKNOWN";
  } else if (hasMismatch) {
    aggregateComparison = "MISMATCH";
  } else {
    aggregateComparison = "MATCH";
  }

  return { comparison: aggregateComparison, effects };
}

function evaluateEvidenceEffects(evidenceFacts: EvidenceFacts): OperationalEffect[] {
  const effects: OperationalEffect[] = [];

  for (const fact of evidenceFacts.evidence) {
    switch (fact.kind) {
      case "AVAILABLE_ACCEPTED":
        effects.push("NO_STATE_EFFECT");
        break;
      case "AVAILABLE_NOT_ACCEPTED":
        effects.push(fact.requirement === "MANDATORY" ? "CONFIRMED_OPERATIONAL_BLOCKER" : "NON_BLOCKING_LIMITATION");
        break;
      case "UNAVAILABLE":
        effects.push(fact.requirement === "MANDATORY" ? "STATE_DETERMINING_UNKNOWN" : "NON_BLOCKING_LIMITATION");
        break;
      case "INSUFFICIENT":
        effects.push(fact.requirement === "MANDATORY" ? "STATE_DETERMINING_UNKNOWN" : "NON_BLOCKING_LIMITATION");
        break;
      case "FAILED":
        effects.push(fact.requirement === "MANDATORY" ? "CONFIRMED_OPERATIONAL_BLOCKER" : "NON_BLOCKING_LIMITATION");
        break;
      default:
        break;
    }
  }

  for (const operation of evidenceFacts.operations) {
    if (operation.status === "SUCCEEDED") {
      effects.push("NO_STATE_EFFECT");
    } else {
      effects.push(operation.effect);
    }
  }

  for (const review of evidenceFacts.reviews) {
    if (review.status === "PASS") {
      effects.push("NO_STATE_EFFECT");
    } else {
      effects.push(review.requiredForSafeNextAction ? "CONFIRMED_OPERATIONAL_BLOCKER" : "NON_BLOCKING_LIMITATION");
    }
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
      return humanGateIdentityRequiredForTransition ? "STATE_DETERMINING_UNKNOWN" : "NO_STATE_EFFECT";
    case "INVALID / CONTRADICTORY":
      return humanGateContradictionPreventsSafeNextAction ? "CONFIRMED_OPERATIONAL_BLOCKER" : "NON_BLOCKING_LIMITATION";
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

export function buildRequiredComponent(value: string | null): IdentityComponent {
  return { applicability: "REQUIRED", value };
}

export function buildOptionalComponent(value: string | null): IdentityComponent {
  return { applicability: "OPTIONAL", value };
}

export function buildNotApplicableComponent(): IdentityComponent {
  return { applicability: "NOT_APPLICABLE", value: null };
}

export function createSubjectIdentity(
  repository: string | null,
  commitSha: string | null,
  branch: string | null,
  prHead: string | null,
  definitionRevision: string | null,
  reviewTarget: string | null,
): SubjectIdentity {
  return {
    repository: buildRequiredComponent(repository),
    commitSha: buildRequiredComponent(commitSha),
    branch: buildRequiredComponent(branch),
    prHead: buildRequiredComponent(prHead),
    definitionRevision: buildRequiredComponent(definitionRevision),
    reviewTarget: buildRequiredComponent(reviewTarget),
  };
}

export function createOptionalSubjectIdentity(
  repository: string | null,
  commitSha: string | null,
  branch: string | null,
  prHead: string | null,
  definitionRevision: string | null,
  reviewTarget: string | null,
): SubjectIdentity {
  return {
    repository: buildOptionalComponent(repository),
    commitSha: buildOptionalComponent(commitSha),
    branch: buildOptionalComponent(branch),
    prHead: buildOptionalComponent(prHead),
    definitionRevision: buildOptionalComponent(definitionRevision),
    reviewTarget: buildOptionalComponent(reviewTarget),
  };
}

export function createNotApplicableSubjectIdentity(): SubjectIdentity {
  return {
    repository: buildNotApplicableComponent(),
    commitSha: buildNotApplicableComponent(),
    branch: buildNotApplicableComponent(),
    prHead: buildNotApplicableComponent(),
    definitionRevision: buildNotApplicableComponent(),
    reviewTarget: buildNotApplicableComponent(),
  };
}

export function createDefaultMaintenanceInput(overrides: Partial<MaintenanceReadinessInput> = {}): MaintenanceReadinessInput {
  const currentSubject = createSubjectIdentity(
    "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
    "2c1f79746780134298b7b1729c9447d33e1fffb2",
    "main",
    "refs/heads/main",
    "1.0.0",
    "maintenance-readiness-operational-profile",
  );

  const evidenceSubject = createSubjectIdentity(
    "yasutakesougo/WELFARE-AI-ENGINEERING-PLATFORM",
    "2c1f79746780134298b7b1729c9447d33e1fffb2",
    "main",
    "refs/heads/main",
    "1.0.0",
    "maintenance-readiness-operational-profile",
  );

  return {
    currentSubject,
    evidenceSubject,
    mandatoryReadinessFactsComplete: true,
    humanGateState: "REQUIRED / NOT CONSUMED",
    humanDecisionState: {
      humanDecisionRequired: true,
      pending: true,
      decision: null,
      goConsumed: false,
    },
    humanGateIdentityRequiredForTransition: true,
    humanGateContradictionPreventsSafeNextAction: true,
    evidenceFacts: {
      mandatoryEvidenceCoverageComplete: true,
      evidence: [],
      operations: [],
      reviews: [],
    },
    readinessFacts: [],
    stopFacts: {
      authorityBoundaryReached: false,
      highRiskBoundaryReached: false,
      evidenceCeilingReached: false,
      exactScopeExhausted: false,
      productionBoundaryReached: false,
    },
    ...overrides,
  };
}

export function decisionPending(): HumanDecisionState {
  return { humanDecisionRequired: true, pending: true, decision: null, goConsumed: false };
}

export function decisionGo(): HumanDecisionState {
  return { humanDecisionRequired: true, pending: false, decision: "GO", goConsumed: true };
}

export function decisionHold(): HumanDecisionState {
  return { humanDecisionRequired: true, pending: false, decision: "HOLD", goConsumed: false };
}

export function decisionNotRequired(): HumanDecisionState {
  return { humanDecisionRequired: false, pending: false, decision: null, goConsumed: false };
}

export function humanGateStateNotRequired(): HumanGateState {
  return "NOT REQUIRED";
}

export function humanGateStateRequiredNotConsumed(): HumanGateState {
  return "REQUIRED / NOT CONSUMED";
}

export function humanGateStateConsumedGo(): HumanGateState {
  return "GO / CONSUMED";
}

export function humanGateStateInvalidContradictory(): HumanGateState {
  return "INVALID / CONTRADICTORY";
}

export function humanGateStateIdentityUnknown(): HumanGateState {
  return "IDENTITY UNKNOWN";
}

export function exactStopFacts(): StopFacts {
  return {
    authorityBoundaryReached: false,
    highRiskBoundaryReached: false,
    evidenceCeilingReached: false,
    exactScopeExhausted: false,
    productionBoundaryReached: false,
  };
}

export function evidenceFailedMandatory(): EvidenceFact {
  return { kind: "FAILED", requirement: "MANDATORY" };
}

export function evidenceUnavailableOptional(): EvidenceFact {
  return { kind: "UNAVAILABLE", requirement: "OPTIONAL" };
}

export function optionalLimitFact(): EvidenceFact {
  return { kind: "AVAILABLE_NOT_ACCEPTED", requirement: "OPTIONAL" };
}

export function requiredLimitFact(): EvidenceFact {
  return { kind: "FAILED", requirement: "MANDATORY" };
}

export function plusOptionalEvidence(facts: EvidenceFact[]): EvidenceFact[] {
  return [...facts];
}

export function noStateEffect(): OperationalEffect {
  return "NO_STATE_EFFECT";
}

export function stateDeterminingUnknown(): OperationalEffect {
  return "STATE_DETERMINING_UNKNOWN";
}

export function confirmedOperationalBlocker(): OperationalEffect {
  return "CONFIRMED_OPERATIONAL_BLOCKER";
}

export function nonBlockingLimitation(): OperationalEffect {
  return "NON_BLOCKING_LIMITATION";
}
