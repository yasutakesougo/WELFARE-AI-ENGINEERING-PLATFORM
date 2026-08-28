import { sliceAFixtures } from './fixtures';
import { evaluateShadow } from './shadowEvaluator';

export interface SelfCheckFailure {
  name: string;
  expected: string;
  actual: string;
  executionPerformed: boolean;
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
  }

  return failures;
}
