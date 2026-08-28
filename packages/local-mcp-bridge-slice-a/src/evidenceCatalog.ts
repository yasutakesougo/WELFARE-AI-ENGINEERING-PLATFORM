import {
  boundedSearchExhaustionFixture,
  evidenceEmitFixture,
  maliciousInstructionLogFixture,
  repositoryObservationFixtures,
  sliceAFixtures,
} from './fixtures';

const staticEvidenceIds = [
  'CONTRACT:CapabilityRegistry',
  'CONTRACT:ShadowResultPlaneSeparation',
  'CONTRACT:RepositoryObservation',
  'CONTRACT:ProcessObservationLimited',
  'CONTRACT:SanitizedLogResult',
  'CONTRACT:SanitizedTestResult',
  'CONTRACT:EvidenceEmit',
  'CONTRACT:SearchObservationSummary',
  'POLICY:TrustedDecisionRegistry',
  'POLICY:TrustedContainmentRegistry',
  'POLICY:PreAccessEligibility',
  'POLICY:DataZoneTargetBinding',
  'POLICY:DataZoneAccessMapping',
  'POLICY:TrustedConfigurationAuthority',
  'POLICY:TrustedConfigurationImmutableRef',
  'POLICY:DependencyExactBinding',
  'POLICY:SearchBoundsFinitePositiveInteger',
  'SELF_CHECK:ObservationPlaneSeparation',
  'SELF_CHECK:ProcessFieldAllowlist',
  'SELF_CHECK:AcceptanceEvidenceResolution',
] as const;

export const knownEvidenceIds: ReadonlySet<string> = new Set([
  ...staticEvidenceIds,
  ...sliceAFixtures.map((fixture) => `FIXTURE:${fixture.name}`),
  ...repositoryObservationFixtures.map((fixture) => `FIXTURE:${fixture.observationId}`),
  `FIXTURE:${boundedSearchExhaustionFixture.observationId}`,
  `FIXTURE:${maliciousInstructionLogFixture.observationId}`,
  `FIXTURE:${evidenceEmitFixture.evidenceId}`,
]);

export function evidenceIdExists(id: string): boolean {
  return knownEvidenceIds.has(id);
}
