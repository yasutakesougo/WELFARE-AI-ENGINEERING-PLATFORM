import type { AuthorityResult, ContainmentEvidence, VerifiedDecision } from './contracts';

const now = '2026-08-28T00:00:00+09:00';

export type TrustedDecisionClass = 'SCOPE' | 'AUTHORITY';

export interface TrustedDecisionRecord {
  decisionClass: TrustedDecisionClass;
  decision: VerifiedDecision;
}

const trustedDecisionRecords: readonly TrustedDecisionRecord[] = [
  {
    decisionClass: 'SCOPE',
    decision: {
      result: 'ALLOW',
      producerIdentity: 'fixture:trusted-scope-policy-engine',
      decisionRef: 'synthetic:scope:read',
      targetIdentity: 'fixture:file:readme',
      evaluatedAt: now,
      evidenceRef: 'synthetic:scope:read:evidence',
      verificationState: 'VERIFIED',
    },
  },
  {
    decisionClass: 'AUTHORITY',
    decision: {
      result: 'ALLOW',
      producerIdentity: 'fixture:trusted-authority-engine',
      decisionRef: 'synthetic:authority:read',
      targetIdentity: 'fixture:file:readme',
      evaluatedAt: now,
      evidenceRef: 'synthetic:authority:read:evidence',
      verificationState: 'VERIFIED',
    },
  },
  {
    decisionClass: 'SCOPE',
    decision: {
      result: 'ALLOW',
      producerIdentity: 'fixture:trusted-scope-policy-engine',
      decisionRef: 'synthetic:scope:other-target',
      targetIdentity: 'fixture:file:other',
      evaluatedAt: now,
      evidenceRef: 'synthetic:scope:other-target:evidence',
      verificationState: 'VERIFIED',
    },
  },
];

const trustedContainmentRecords: readonly ContainmentEvidence[] = [
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: 'root:A',
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: 'root:A',
    targetIdentity: 'fixture:file:readme',
    containmentResult: 'PASS',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:pass',
    verificationState: 'VERIFIED',
  },
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: 'root:A',
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: 'root:B',
    targetIdentity: 'fixture:file:readme',
    containmentResult: 'FAIL',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:root-replaced',
    verificationState: 'VERIFIED',
  },
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: 'root:A',
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: 'root:A',
    targetIdentity: 'fixture:file:readme',
    containmentResult: 'FAIL',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:symlink-escape',
    verificationState: 'VERIFIED',
  },
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: 'root:A',
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: 'root:A',
    targetIdentity: 'fixture:file:readme',
    containmentResult: 'UNVERIFIABLE',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:junction-unverifiable',
    verificationState: 'VERIFIED',
  },
  {
    rootBinding: {
      configuredPath: '/fixture/repo',
      resolvedPath: '/fixture/repo',
      resolvedIdentity: 'root:A',
      resolvedAt: now,
      authorityRef: 'synthetic:root-authority',
    },
    observedRootIdentity: 'root:A',
    targetIdentity: 'fixture:file:readme',
    containmentResult: 'FAIL',
    verifiedAt: now,
    evidenceRef: 'synthetic:containment:path-traversal',
    verificationState: 'VERIFIED',
  },
];

const permittedDataZoneAuthorityRefs = new Set([
  'synthetic:authority:development',
  'synthetic:authority:production',
  'synthetic:authority:restricted',
  'authority:external:B',
]);

function cloneDecision(decision: VerifiedDecision): VerifiedDecision {
  return { ...decision };
}

function cloneContainment(evidence: ContainmentEvidence): ContainmentEvidence {
  return { ...evidence, rootBinding: { ...evidence.rootBinding } };
}

export function resolveTrustedDecision(
  decisionClass: TrustedDecisionClass,
  decisionRef: string | undefined,
): VerifiedDecision | undefined {
  if (!decisionRef) return undefined;
  const record = trustedDecisionRecords.find(
    (candidate) => candidate.decisionClass === decisionClass && candidate.decision.decisionRef === decisionRef,
  );
  return record ? cloneDecision(record.decision) : undefined;
}

export function resolveTrustedContainment(evidenceRef: string | undefined): ContainmentEvidence | undefined {
  if (!evidenceRef) return undefined;
  const record = trustedContainmentRecords.find((candidate) => candidate.evidenceRef === evidenceRef);
  return record ? cloneContainment(record) : undefined;
}

export function isPermittedDataZoneAuthorityRef(ref: string | null | undefined): boolean {
  return !!ref && permittedDataZoneAuthorityRefs.has(ref);
}

export function isImmutableConfigurationExactRef(value: string): boolean {
  return /^(?:sha256:[0-9a-f]{64}|commit:[0-9a-f]{40})$/i.test(value.trim());
}

export function trustAnchorHealth(): AuthorityResult {
  return trustedDecisionRecords.length > 0 && trustedContainmentRecords.length > 0 ? 'ALLOW' : 'HOLD';
}
