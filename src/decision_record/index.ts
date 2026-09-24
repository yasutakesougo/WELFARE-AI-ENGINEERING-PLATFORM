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

/**
 * Parse an authoritative chronology timestamp into deterministic UTC epoch ms.
 *
 * Accepted:
 * - Explicit UTC (`Z`)
 * - Explicit numeric offset (`±HH:MM` or `±HHMM`)
 *
 * Rejected (fail-closed):
 * - Timezone-less timestamps
 * - Impossible calendar dates (no Date.parse overflow)
 * - Non-ISO / unparseable forms
 */
function parseAuthoritativeTimestamp(value: string): number | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:?\d{2})$/.exec(
      value,
    );
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const fraction = match[7] ?? "0";
  const zone = match[8];
  if (!zone) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }
  if (hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  const daysInMonth = daysInMonthOf(year, month);
  if (day < 1 || day > daysInMonth) {
    return null;
  }

  let offsetMinutes = 0;
  if (zone !== "Z") {
    const zoneMatch = /^([+-])(\d{2}):?(\d{2})$/.exec(zone);
    if (!zoneMatch) {
      return null;
    }
    const offsetHour = Number(zoneMatch[2]);
    const offsetMinute = Number(zoneMatch[3]);
    if (offsetHour > 23 || offsetMinute > 59) {
      return null;
    }
    const sign = zoneMatch[1] === "-" ? -1 : 1;
    offsetMinutes = sign * (offsetHour * 60 + offsetMinute);
  }

  const millisecond = Number((fraction + "000").slice(0, 3));
  // Interpret wall-clock components as UTC, then subtract the explicit offset.
  return Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - offsetMinutes * 60_000;
}

function daysInMonthOf(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
}

function isValidTimestamp(value: string): boolean {
  return parseAuthoritativeTimestamp(value) !== null;
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
    const occurredAtMs = parseAuthoritativeTimestamp(record.occurredAt);
    const observedExecutionAtMs = input.observedExecutionAt
      ? parseAuthoritativeTimestamp(input.observedExecutionAt)
      : null;

    if (occurredAtMs === null || observedExecutionAtMs === null) {
      return false;
    }

    if (occurredAtMs >= observedExecutionAtMs) {
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
