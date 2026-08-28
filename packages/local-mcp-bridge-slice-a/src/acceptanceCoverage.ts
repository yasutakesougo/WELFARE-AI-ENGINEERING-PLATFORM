export type AcceptanceCoverageStatus =
  | 'IMPLEMENTED'
  | 'NOT_APPLICABLE_SLICE_A'
  | 'DEFERRED_BY_DEFINITION';

export type AcceptanceEvidenceType = 'CONTRACT' | 'POLICY' | 'FIXTURE' | 'SELF_CHECK' | 'MIXED' | 'DEFERRED';

export interface AcceptanceCoverageEntry {
  acId: `AC-${string}`;
  status: AcceptanceCoverageStatus;
  evidenceType: AcceptanceEvidenceType;
  evidenceIds: readonly string[];
  rationale: string;
}

const evidenceByAc: Readonly<Record<number, readonly string[]>> = {
  1: ['CONTRACT:CapabilityRegistry'],
  2: ['POLICY:TrustedContainmentRegistry', 'FIXTURE:root identity replacement'],
  3: ['FIXTURE:symlink escape containment fail', 'FIXTURE:path traversal containment fail'],
  4: ['CONTRACT:ProcessObservationLimited', 'SELF_CHECK:ProcessFieldAllowlist'],
  5: ['POLICY:PreAccessEligibility', 'FIXTURE:unknown pre-access classification'],
  6: ['FIXTURE:evidence persistence request', 'CONTRACT:CapabilityRegistry'],
  7: ['FIXTURE:internal subprocess request', 'CONTRACT:CapabilityRegistry'],
  8: ['CONTRACT:EvidenceEmit', 'FIXTURE:evidence-emit-001'],
  9: ['CONTRACT:RepositoryObservation', 'FIXTURE:repo-observation-stale-tracking'],
  10: ['CONTRACT:ShadowResultPlaneSeparation', 'SELF_CHECK:ObservationPlaneSeparation'],
  11: ['POLICY:SearchBoundsFinitePositiveInteger', 'FIXTURE:invalid zero search bound'],
  12: ['CONTRACT:SanitizedLogResult', 'FIXTURE:log-sanitized-001'],
  13: ['FIXTURE:secret-like filename preclassified restricted', 'FIXTURE:personal-data-like marker preclassified restricted'],
  14: ['FIXTURE:runtime disabled', 'FIXTURE:execution-capable runtime unreachable in slice A'],
  15: ['CONTRACT:EvidenceEmit', 'FIXTURE:evidence-emit-001'],
  16: ['POLICY:DependencyExactBinding', 'FIXTURE:dependency exact-ref mismatch'],
  17: ['CONTRACT:RepositoryObservation', 'FIXTURE:repo-observation-clean'],
  18: ['CONTRACT:RepositoryObservation', 'FIXTURE:repo-observation-identity-movement'],
  19: ['FIXTURE:repo-observation-identity-movement'],
  20: ['CONTRACT:RepositoryObservation', 'FIXTURE:repo-observation-untracked'],
  21: ['CONTRACT:CapabilityRegistry', 'FIXTURE:unknown capability'],
  22: ['CONTRACT:CapabilityRegistry', 'FIXTURE:internal subprocess request'],
  23: ['CONTRACT:SearchObservationSummary', 'FIXTURE:search-partial-001'],
  24: ['POLICY:DataZoneTargetBinding', 'FIXTURE:data-zone target scope mismatch'],
  25: ['POLICY:DependencyExactBinding', 'FIXTURE:dependency exact-ref mismatch'],
  26: ['POLICY:PreAccessEligibility', 'FIXTURE:unknown pre-access classification'],
  27: ['FIXTURE:production zone read'],
  29: ['CONTRACT:CapabilityRegistry', 'FIXTURE:production cannot self-declare allow'],
  30: ['CONTRACT:CapabilityRegistry', 'FIXTURE:unknown capability'],
  31: ['POLICY:DependencyExactBinding', 'FIXTURE:dependency exact-ref mismatch'],
  32: ['POLICY:SearchBoundsFinitePositiveInteger', 'FIXTURE:missing search bounds', 'FIXTURE:invalid fractional search bound'],
  33: ['CONTRACT:SearchObservationSummary', 'FIXTURE:search-partial-001'],
  35: ['CONTRACT:SearchObservationSummary', 'FIXTURE:search-partial-001'],
  36: ['POLICY:DependencyExactBinding', 'FIXTURE:dependency exact-ref mismatch'],
  37: ['POLICY:DataZoneAccessMapping', 'FIXTURE:untrusted development claim cannot authorize read'],
  38: ['POLICY:DataZoneTargetBinding', 'FIXTURE:externally authorized trusted config can allow development read'],
  39: ['FIXTURE:untrusted development claim cannot authorize read'],
  40: ['FIXTURE:untrusted metadata may only tighten access'],
  47: ['POLICY:TrustedConfigurationAuthority', 'FIXTURE:trusted config cannot self-authorize'],
  48: ['POLICY:TrustedConfigurationAuthority', 'FIXTURE:externally authorized trusted config can allow development read'],
  49: ['POLICY:TrustedConfigurationImmutableRef', 'FIXTURE:trusted config mutable exact ref rejected', 'FIXTURE:trusted config integrity failure'],
  50: ['POLICY:DataZoneAccessMapping'],
  51: ['POLICY:DataZoneAccessMapping', 'POLICY:PreAccessEligibility'],
  52: ['POLICY:DataZoneAccessMapping'],
  53: ['FIXTURE:untrusted metadata may only tighten access'],
  54: ['POLICY:PreAccessEligibility', 'FIXTURE:unknown pre-access classification'],
  55: ['POLICY:TrustedConfigurationAuthority', 'FIXTURE:trusted config cannot self-authorize'],
};

const runtimeFilesystemRationale: Readonly<Record<number, string>> = {
  28: 'Requires real OS-level symlink/junction swap resistance during secure open; Slice A authorizes contracts and synthetic failure evidence only.',
  34: 'Requires proving containment with a real platform adapter; real filesystem access is explicitly outside Slice A authority.',
  41: 'Requires binding a real Approved Root filesystem identity before target access; Slice A does not open local filesystem handles.',
  42: 'Requires detecting replacement of a real Approved Root object during an observation interval; runtime filesystem observation is not authorized.',
  43: 'Requires preventing authority rebinding to a new real filesystem object; Slice A provides only the contract and synthetic deny model.',
  44: 'Requires target access relative to the same authorized real Root identity; no real directory-handle access is authorized in Slice A.',
  45: 'Requires rejecting a real adapter when Root identity continuity cannot be proven; Slice A has no runtime adapter.',
  46: 'Requires real Root identity stability plus real target containment before PASS; Slice A cannot execute the OS secure-open proof.',
};

const runtimeFilesystemCriteria = new Set(Object.keys(runtimeFilesystemRationale).map(Number));

function makeEntry(number: number): AcceptanceCoverageEntry {
  const acId = `AC-${String(number).padStart(2, '0')}` as `AC-${string}`;

  if (runtimeFilesystemCriteria.has(number)) {
    return {
      acId,
      status: 'DEFERRED_BY_DEFINITION',
      evidenceType: 'DEFERRED',
      evidenceIds: [],
      rationale: runtimeFilesystemRationale[number],
    };
  }

  const evidenceIds = evidenceByAc[number];
  if (!evidenceIds?.length) {
    return {
      acId,
      status: 'NOT_APPLICABLE_SLICE_A',
      evidenceType: 'MIXED',
      evidenceIds: [],
      rationale: `AC-${number} has no executable Slice A behavior beyond the locked definition boundary; it is not claimed as implemented evidence.`,
    };
  }

  const prefixes = new Set(evidenceIds.map((id) => id.split(':', 1)[0]));
  const evidenceType: AcceptanceEvidenceType = prefixes.size === 1
    ? (Array.from(prefixes)[0] as AcceptanceEvidenceType)
    : 'MIXED';

  return {
    acId,
    status: 'IMPLEMENTED',
    evidenceType,
    evidenceIds,
    rationale: `${acId} is traced to concrete Slice A contract/policy/fixture evidence: ${evidenceIds.join(', ')}.`,
  };
}

export const acceptanceCoverage: readonly AcceptanceCoverageEntry[] = Array.from(
  { length: 55 },
  (_, index) => makeEntry(index + 1),
);
