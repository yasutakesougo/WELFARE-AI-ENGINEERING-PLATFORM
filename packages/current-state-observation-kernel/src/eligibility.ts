import { fail, ok, type StructuredResult } from "./result.js";
import type {
  AuthorityResult,
  GateBoundObservationV1,
  GateFreshnessVerificationV1,
  KernelState,
  MutationEligibility
} from "./types.js";
import { REQUIRED_MUTATION_VERIFICATION_PURPOSE } from "./types.js";
import { resolveLatestApplicableFreshness } from "./freshness.js";
import { derivedConsumed, observationHasTerminalState } from "./derived-state.js";

export function evaluateAuthority(authority: AuthorityResult): StructuredResult<AuthorityResult> {
  if (authority.decision === "GO" && authority.authorityDecisionRef !== undefined && authority.authorityDecisionRef.length > 0) {
    return ok(authority);
  }
  if (authority.decision === "HOLD" || authority.decision === "UNKNOWN" || authority.decision === "NONE") {
    return fail("NOT_AUTHORIZED", {
      classification: "AUTHORITY_FAILURE",
      message: "NOT_AUTHORIZED is reserved for a separately evaluated authority failure",
      value: authority
    });
  }
  return fail("NOT_AUTHORIZED", {
    classification: "AUTHORITY_FAILURE",
    message: "Technical PASS without valid authority is NOT_AUTHORIZED",
    value: authority
  });
}

export function evaluateMutationEligibility(input: {
  state: KernelState;
  observation: GateBoundObservationV1;
  authority: AuthorityResult;
  requiredVerificationPurpose?: string;
  freshness?: GateFreshnessVerificationV1;
}): StructuredResult<MutationEligibility> {
  const purpose = input.requiredVerificationPurpose ?? REQUIRED_MUTATION_VERIFICATION_PURPOSE;
  const latest = resolveLatestApplicableFreshness(input.state, {
    gateBoundObservationId: input.observation.observationId,
    logicalMutationId: input.observation.logicalMutationId,
    attemptGeneration: input.observation.attemptGeneration,
    verificationPurpose: purpose
  });

  if (latest === undefined) {
    return fail("HOLD", {
      classification: "MISSING_APPLICABLE_FRESHNESS",
      message: "evaluateMutationEligibility without applicable freshness → HOLD",
      value: { eligible: false, reason: "HOLD" }
    });
  }

  if (input.freshness !== undefined && input.freshness.observationId !== latest.observationId) {
    return fail("HOLD", {
      classification: "OLDER_FRESH_UNUSABLE",
      message: "later applicable non-FRESH makes an older FRESH unusable; eligibility MUST use the latest completed applicable verification",
      value: { eligible: false, reason: "HOLD" }
    });
  }

  if (latest.freshnessStatus !== "FRESH") {
    return fail("HOLD", {
      classification: "NOT_FRESH",
      message: "only the latest completed applicable FRESH verification may proceed to remaining eligibility checks",
      value: { eligible: false, reason: "HOLD" }
    });
  }

  if (latest.verificationPurpose !== purpose) {
    return fail("HOLD", {
      classification: "FRESHNESS_PURPOSE_MISMATCH",
      message: "verificationPurpose MUST match the required action phase",
      value: { eligible: false, reason: "HOLD" }
    });
  }

  if (observationHasTerminalState(input.state, input.observation.observationId)) {
    return fail("HOLD", {
      classification: "GATE_NOT_REUSABLE",
      message: "any TERMINAL_* state → observation not reusable",
      value: { eligible: false, reason: "HOLD" }
    });
  }

  if (derivedConsumed(input.state, input.observation.observationId)) {
    return fail("HOLD", {
      classification: "GATE_CONSUMED",
      message: "TERMINAL_CONSUMED_SUCCESS → derived consumed = true",
      value: { eligible: false, reason: "HOLD" }
    });
  }

  const authority = evaluateAuthority(input.authority);
  if (authority.status !== "PASS") {
    return fail("NOT_AUTHORIZED", {
      classification: "AUTHORITY_FAILURE",
      message: authority.message,
      value: { eligible: false, reason: "NOT_AUTHORIZED" }
    });
  }
  if (input.observation.observationResult !== "COMPLETE" || input.observation.consistencyResult !== "PASS") {
    return fail("HOLD", {
      classification: "TECHNICAL_STATE_INVALID",
      value: { eligible: false, reason: "HOLD" }
    });
  }
  if (!input.observation.validForAction) {
    return fail("HOLD", {
      classification: "GATE_NOT_VALID_FOR_ACTION",
      value: { eligible: false, reason: "HOLD" }
    });
  }
  return ok({ eligible: true, reason: "PASS" });
}
