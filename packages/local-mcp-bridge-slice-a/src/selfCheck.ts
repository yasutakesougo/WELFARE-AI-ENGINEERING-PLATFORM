import { acceptanceCoverage } from './acceptanceCoverage';
import { evidenceIdExists } from './evidenceCatalog';
import {
  boundedSearchExhaustionFixture,
  evidenceEmitFixture,
  limitedProcessFixture,
  maliciousInstructionLogFixture,
  repositoryObservationFixtures,
  sliceAFixtures,
} from './fixtures';
import { evaluateShadow } from './shadowEvaluator';
import { trustAnchorHealth } from './trustRegistry';

export interface SelfCheckFailure {
  name: string;
  expected: string;
  actual: string;
  executionPerformed: boolean;
}

function failure(name: string, expected: string, actual: string): SelfCheckFailure {
  return { name, expected, actual, executionPerformed: false };
}

export function runSliceASelfCheck(): readonly SelfCheckFailure[] {
  const failures: SelfCheckFailure[] = [];

  for (const fixture of sliceAFixtures) {
    const result = evaluateShadow(fixture.request);
    if (result.effectiveResult !== fixture.expected || result.executionPerformed !== false) {
      failures.push({
        name: fixture.name,
        expected: fixture.expected,
        actual: result.effectiveResult,
        executionPerformed: result.executionPerformed,
      });
    }
    if (result.observationPerformed !== false || result.observationResult !== null) {
      failures.push(failure(`${fixture.name}: observation plane`, 'not performed / null', String(result.observationResult)));
    }
  }

  const requiredTrustFixtures = [
    'forged verified authority ref rejected',
    'unregistered containment pass rejected',
    'trusted config mutable exact ref rejected',
    'trusted config unknown authority root rejected',
  ];
  const shadowFixtureNames = new Set(sliceAFixtures.map((fixture) => fixture.name));
  for (const name of requiredTrustFixtures) {
    if (!shadowFixtureNames.has(name)) failures.push(failure(`trust fixture ${name}`, 'present', 'missing'));
  }
  if (trustAnchorHealth() !== 'ALLOW') failures.push(failure('synthetic trust registry health', 'ALLOW', trustAnchorHealth()));

  const expectedRepositoryFixtureIds = [
    'repo-observation-dirty',
    'repo-observation-detached',
    'repo-observation-untracked',
    'repo-observation-conflict',
    'repo-observation-stale-tracking',
    'repo-observation-identity-movement',
  ];
  const actualRepositoryIds = new Set(repositoryObservationFixtures.map((fixture) => fixture.observationId));
  for (const id of expectedRepositoryFixtureIds) {
    if (!actualRepositoryIds.has(id)) failures.push(failure(`repository fixture ${id}`, 'present', 'missing'));
  }

  const moved = repositoryObservationFixtures.find((fixture) => fixture.observationId === 'repo-observation-identity-movement');
  if (!moved || moved.observationResult !== 'INVALIDATED' || moved.consistencyResult !== 'FAIL') {
    failures.push(failure('identity movement invalidation', 'INVALIDATED / FAIL', moved?.observationResult ?? 'missing'));
  }

  if (repositoryObservationFixtures.some((fixture) => fixture.branchRelation.remoteCurrentStateResolved !== false)) {
    failures.push(failure('local observation remote-current-state boundary', 'false', 'true'));
  }

  const allowedProcessResourceFields = new Set([
    'cpuPercent',
    'residentMemoryBytes',
    'threadCount',
    'handleCount',
  ]);
  const resourceFields = Object.keys(limitedProcessFixture.resourceSummary);
  for (const field of resourceFields) {
    if (!allowedProcessResourceFields.has(field)) {
      failures.push(failure(`process resource allowlist ${field}`, 'allowed fixed field', 'unexpected field'));
    }
  }
  for (const value of Object.values(limitedProcessFixture.resourceSummary)) {
    if (value !== undefined && typeof value !== 'number') {
      failures.push(failure('process resource value type', 'number only', typeof value));
    }
  }
  const forbiddenProcessFields = ['commandLine', 'environment', 'env', 'stdin', 'memory'];
  for (const field of forbiddenProcessFields) {
    if (Object.prototype.hasOwnProperty.call(limitedProcessFixture, field)) {
      failures.push(failure(`process output forbidden field ${field}`, 'absent', 'present'));
    }
    if (Object.prototype.hasOwnProperty.call(limitedProcessFixture.resourceSummary, field)) {
      failures.push(failure(`process resource forbidden field ${field}`, 'absent', 'present'));
    }
  }

  if (!maliciousInstructionLogFixture.redacted || maliciousInstructionLogFixture.authorityInstructionApplied !== false) {
    failures.push(failure('untrusted log instruction boundary', 'redacted / not applied', 'unsafe'));
  }

  if (
    boundedSearchExhaustionFixture.observationResult !== 'PARTIAL' ||
    !boundedSearchExhaustionFixture.outputTruncated ||
    boundedSearchExhaustionFixture.exhaustedBy === null
  ) {
    failures.push(failure('bounded search exhaustion semantics', 'PARTIAL / truncated / bounded', 'invalid'));
  }

  if (evidenceEmitFixture.persistencePerformed !== false) {
    failures.push(failure('evidence emit persistence boundary', 'false', 'true'));
  }

  if (acceptanceCoverage.length !== 55) {
    failures.push(failure('AC-01..AC-55 mapping count', '55', String(acceptanceCoverage.length)));
  }
  const uniqueAcIds = new Set(acceptanceCoverage.map((entry) => entry.acId));
  if (uniqueAcIds.size !== 55) {
    failures.push(failure('AC-01..AC-55 unique mapping', '55', String(uniqueAcIds.size)));
  }
  for (let number = 1; number <= 55; number += 1) {
    const acId = `AC-${String(number).padStart(2, '0')}`;
    if (!uniqueAcIds.has(acId as `AC-${string}`)) failures.push(failure(`acceptance ${acId}`, 'mapped', 'missing'));
  }

  for (const entry of acceptanceCoverage) {
    if (!entry.rationale.trim()) failures.push(failure(`${entry.acId} rationale`, 'non-empty', 'empty'));

    if (entry.status === 'IMPLEMENTED') {
      if (!entry.evidenceIds.length) failures.push(failure(`${entry.acId} evidence`, 'one or more ids', 'empty'));
      for (const evidenceId of entry.evidenceIds) {
        if (!evidenceIdExists(evidenceId)) {
          failures.push(failure(`${entry.acId} evidence ${evidenceId}`, 'registered concrete evidence', 'unresolved'));
        }
      }
    }

    if (entry.status === 'DEFERRED_BY_DEFINITION' && entry.evidenceIds.length !== 0) {
      failures.push(failure(`${entry.acId} deferred evidence`, 'no false implementation evidence', String(entry.evidenceIds.length)));
    }
  }

  return failures;
}
