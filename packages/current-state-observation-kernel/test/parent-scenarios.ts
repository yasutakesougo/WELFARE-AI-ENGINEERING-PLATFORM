export const PARENT_SCENARIO_TITLES = {
  "CSOC-C2-V25": "CI Changed Without Head Movement",
  "CSOC-C2-V26": "Review Dismissed Without Head Movement",
  "CSOC-C2-V27": "Branch Policy Changed",
  "CSOC-C2-V28": "Authority Revoked Before Mutation",
  "CSOC-C2-V29": "Freshness Revalidation Unavailable",
  "CSOC-C2-V30": "GateBoundObservation Expired",
  "CSOC-C2-V31": "Atomic Precondition Failure",
  "CSOC-C2-V32": "Freshness PASS and Valid Authority",
  "CSOC-C3-V33": "Concurrent Double Claim",
  "CSOC-C3-V34": "Losing Claimant Wait Hold",
  "CSOC-C3-V35": "Winning Attempt Non-Terminal",
  "CSOC-C3-V36": "Ambiguous Terminal Outcome",
  "CSOC-C3-V37": "Terminal State Never Available",
  "CSOC-C3-V38": "New Observation Required",
  "CSOC-C3-V39": "Claim Denial Versus Authority Denial",
  "CSOC-C4-V40": "Duplicate Observation Same Logical Action",
  "CSOC-C4-V41": "Explicit Attempt Generation",
  "CSOC-C4-V42": "Immutable Observation Reference",
  "CSOC-C4-V43": "Derived Terminal Consumption",
  "CSOC-C5-V44": "Append-Only Freshness Verification",
  "CSOC-C5-V45": "Later Verification New Record",
  "CSOC-C5-V46": "Latest Applicable Freshness",
  "CSOC-C5-V47": "Freshness Is Not Authority"
} as const;

export type ParentScenarioId = keyof typeof PARENT_SCENARIO_TITLES;

export const PARENT_SCENARIO_IDS = Object.keys(PARENT_SCENARIO_TITLES) as ParentScenarioId[];
