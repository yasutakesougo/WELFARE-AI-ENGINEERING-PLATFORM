import { makeHappyScenario } from '../fixtures/synthetic-fixtures.js';
import { shadowEvaluate } from '../src/shadow-evaluator.js';

const result = shadowEvaluate(makeHappyScenario());
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
