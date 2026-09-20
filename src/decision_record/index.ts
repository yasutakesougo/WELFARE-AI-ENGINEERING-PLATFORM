export type DecisionType =
  | "IMPLEMENTATION_START"
  | "READY_GO"
  | "MERGE_GO"
  | "DEPLOY_GO"
  | "EVIDENCE_ACCEPTANCE";

export type DecisionOutcome = "GO" | "HOLD" | "REJECTED";

export interface DecisionRecord {
  decisionId: string;
  occurredAt: string;
  projectId: string;
  taskId?: string;
  decisionType: DecisionType;
  outcome: DecisionOutcome;
  actorRef: string;
  subjectRef: string;
  evidenceRefs: string[];
  decisionSourceRefs: string[];
  reason: string;
  policyRef?: string;
  relatedDecisionRefs?: string[];
}

export interface DurableDecisionProvenance {
  sourcesVerified: boolean;
  decisionExistenceEstablished: boolean;
  decisionTypeEstablished: boolean;
  actorEstablished: boolean;
  subjectEstablished: boolean;
  outcomeEstablished: boolean;
  occurrenceTimeEstablished: boolean;
  decisionType?: DecisionType;
  actorRef?: string;
  subjectRef?: string;
  outcome?: DecisionOutcome;
  occurredAt?: string;
}

export type AuthorityValidationResult =
  | "CHRONOLOGY_CONSISTENT"
  | "AUTHORITY_GAP_CANDIDATE"
  | "AUTHORITY_GAP";

export interface PositiveAuthorityValidationInput {
  record?: DecisionRecord;
  requiredDecisionType: DecisionType;
  expectedSubjectRef: string;
  provenance?: DurableDecisionProvenance;
  observedExecutionAt?: string;
  requireDecisionBeforeObservedExecution?: boolean;
  priorAuthorityRequired?: boolean;
  priorAuthorityValid?: boolean;
  policyRequirementApplies?: boolean;
  policyRequirementSatisfied?: boolean;
  reconciliationConfirmed?: boolean;
}

function isValidTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function provenanceMatchesRecord(
  record: DecisionRecord,
  provenance: DurableDecisionProvenance,
): boolean {
  if (record.decisionSourceRefs.length === 0 || !provenance.sourcesVerified) {
    return false;
  }

  if (
    !provenance.decisionExistenceEstablished ||
    !provenance.decisionTypeEstablished ||
    !provenance.actorEstablished ||
    !provenance.subjectEstablished ||
    !provenance.outcomeEstablished ||
    !provenance.occurrenceTimeEstablished
  ) {
    return false;
  }

  return (
    provenance.decisionType === record.decisionType &&
    provenance.actorRef === record.actorRef &&
    provenance.subjectRef === record.subjectRef &&
    provenance.outcome === record.outcome &&
    provenance.occurredAt === record.occurredAt &&
    isValidTimestamp(record.occurredAt)
  );
}

function positiveAuthorityIsEstablished(
  input: PositiveAuthorityValidationInput,
): boolean {
  const { record, provenance } = input;

  if (!record || !provenance) {
    return false;
  }

  if (record.decisionType !== input.requiredDecisionType || record.outcome !== "GO") {
    return false;
  }

  if (record.subjectRef !== input.expectedSubjectRef) {
    return false;
  }

  if (!provenanceMatchesRecord(record, provenance)) {
    return false;
  }

  if (input.requireDecisionBeforeObservedExecution) {
    if (!input.observedExecutionAt || !isValidTimestamp(input.observedExecutionAt)) {
      return false;
    }

    if (Date.parse(record.occurredAt) >= Date.parse(input.observedExecutionAt)) {
      return false;
    }
  }

  if (input.priorAuthorityRequired && input.priorAuthorityValid !== true) {
    return false;
  }

  if (input.policyRequirementApplies && input.policyRequirementSatisfied !== true) {
    return false;
  }

  return true;
}

export function validatePositiveAuthority(
  input: PositiveAuthorityValidationInput,
): AuthorityValidationResult {
  if (positiveAuthorityIsEstablished(input)) {
    return "CHRONOLOGY_CONSISTENT";
  }

  return input.reconciliationConfirmed === true
    ? "AUTHORITY_GAP"
    : "AUTHORITY_GAP_CANDIDATE";
}
