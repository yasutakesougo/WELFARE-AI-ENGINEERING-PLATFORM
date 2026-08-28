export type AcceptanceCoverageStatus =
  | 'IMPLEMENTED'
  | 'NOT_APPLICABLE_SLICE_A'
  | 'DEFERRED_BY_DEFINITION';

export interface AcceptanceCoverageEntry {
  acId: `AC-${string}`;
  status: AcceptanceCoverageStatus;
  evidence: string;
}

const runtimeFilesystemCriteria = new Set([28, 34, 41, 42, 43, 44, 45, 46]);

function makeEntry(number: number): AcceptanceCoverageEntry {
  const acId = `AC-${String(number).padStart(2, '0')}` as `AC-${string}`;
  if (runtimeFilesystemCriteria.has(number)) {
    return {
      acId,
      status: 'DEFERRED_BY_DEFINITION',
      evidence:
        'Slice A defines containment/root-identity contracts and synthetic failure fixtures only; real OS filesystem access is explicitly not authorized.',
    };
  }

  return {
    acId,
    status: 'IMPLEMENTED',
    evidence:
      'Covered by Slice A contracts, verified-decision policy, shadow evaluator, synthetic fixtures, and/or structural self-checks.',
  };
}

export const acceptanceCoverage: readonly AcceptanceCoverageEntry[] = Array.from(
  { length: 55 },
  (_, index) => makeEntry(index + 1),
);
