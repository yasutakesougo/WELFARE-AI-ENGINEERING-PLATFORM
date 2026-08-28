import type { Capability } from './contracts';

export const DEFINITION_CAPABILITIES: readonly Capability[] = [
  'repository.observe',
  'filesystem.read',
  'filesystem.list',
  'filesystem.search',
  'process.observe_limited',
  'test_result.read_sanitized',
  'log.read_sanitized',
  'evidence.emit',
] as const;

const capabilitySet = new Set<string>(DEFINITION_CAPABILITIES);

export function isDefinitionCapability(capability: string): capability is Capability {
  return capabilitySet.has(capability);
}
