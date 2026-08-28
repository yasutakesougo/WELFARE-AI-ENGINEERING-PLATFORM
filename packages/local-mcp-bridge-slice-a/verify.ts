import { runSliceASelfCheck } from './src/selfCheck';

const failures = runSliceASelfCheck();

if (failures.length > 0) {
  throw new Error(`Slice A verification failed: ${JSON.stringify(failures, null, 2)}`);
}

console.log('WAEP-LOCAL-MCP-EXECUTION-BRIDGE-V1 Slice A verification: PASS');
