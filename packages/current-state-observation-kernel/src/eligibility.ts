import { fail, ok, type StructuredResult } from "./result.js";
import type {
  AuthorityResult,
  GateBoundObservationV1,
  GateFreshnessVerificationV1,
  MutationEligibility
} from "./types.js";

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
  observation: GateBoundObservationV1;
  freshness?: GateFreshnessVerificationV1;
  authority: AuthorityResult;
}): StructuredResult<MutationEligibility> {
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
  if (input.freshness !== undefined && input.freshness.freshnessStatus !== "FRESH") {
    return fail("HOLD", {
      classification: "NOT_FRESH",
      message: "technical freshness != authority",
      value: { eligible: false, reason: "HOLD" }
    });
  }
  return ok({ eligible: true, reason: "PASS" });
}
