from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from .checkpoint import ResumeDecision
from .models import AuthorityFreshness, EffectState, RunState


class TransitionDecision(str, Enum):
    ALLOW_TRANSITION = "ALLOW_TRANSITION"
    RETRY_ELIGIBLE = "RETRY_ELIGIBLE"
    RECOVERY_ELIGIBLE = "RECOVERY_ELIGIBLE"
    REAUTHORIZE_REQUIRED = "REAUTHORIZE_REQUIRED"
    RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED"
    DEFINITION_MISMATCH = "DEFINITION_MISMATCH"
    STALE_LEASE_REJECTED = "STALE_LEASE_REJECTED"
    TERMINAL_STATE_PROTECTED = "TERMINAL_STATE_PROTECTED"
    HOLD_REQUIRED = "HOLD_REQUIRED"


TERMINAL_STATES = frozenset({
    RunState.SUCCEEDED,
    RunState.FAILED,
    RunState.DENIED,
    RunState.CANCELLED,
})


@dataclass(frozen=True)
class TransitionEvidence:
    current_authority_freshness: AuthorityFreshness
    definition_matches: bool
    capability_compatible: bool
    lease_current: bool
    fence_current: bool
    effect_state: Optional[EffectState] = None
    resume_decision: Optional[ResumeDecision] = None


@dataclass(frozen=True)
class ChildPropagation:
    child_state: RunState
    parent_state: RunState
    explicit_parent_failure_rule: bool = False


def _safety_precondition(evidence: TransitionEvidence) -> Optional[TransitionDecision]:
    if not evidence.definition_matches:
        return TransitionDecision.DEFINITION_MISMATCH
    if not evidence.lease_current or not evidence.fence_current:
        return TransitionDecision.STALE_LEASE_REJECTED
    if evidence.effect_state is EffectState.EFFECT_UNKNOWN:
        return TransitionDecision.RECONCILIATION_REQUIRED
    if evidence.effect_state in (EffectState.EFFECT_CONFLICT, EffectState.EFFECT_IN_FLIGHT):
        return TransitionDecision.HOLD_REQUIRED
    if evidence.current_authority_freshness is not AuthorityFreshness.CURRENT:
        return TransitionDecision.REAUTHORIZE_REQUIRED
    if not evidence.capability_compatible:
        return TransitionDecision.REAUTHORIZE_REQUIRED
    return None


def transition_decision(
    current_state: RunState,
    target_state: RunState,
    evidence: TransitionEvidence,
) -> TransitionDecision:
    if current_state in TERMINAL_STATES and target_state is not current_state:
        return TransitionDecision.TERMINAL_STATE_PROTECTED

    safety = _safety_precondition(evidence)
    if safety is not None:
        return safety

    if current_state is target_state:
        return TransitionDecision.ALLOW_TRANSITION

    allowed = {
        RunState.PENDING: {RunState.AUTHORIZED, RunState.DENIED, RunState.CANCELLED},
        RunState.AUTHORIZED: {RunState.RUNNING, RunState.CANCELLED},
        RunState.RUNNING: {
            RunState.WAITING_HUMAN,
            RunState.WAITING_CALLBACK,
            RunState.SUSPENDED,
            RunState.SUCCEEDED,
            RunState.FAILED,
            RunState.CANCELLED,
            RunState.UNKNOWN,
        },
        RunState.WAITING_HUMAN: {RunState.AUTHORIZED, RunState.DENIED, RunState.CANCELLED},
        RunState.WAITING_CALLBACK: {RunState.AUTHORIZED, RunState.SUSPENDED, RunState.CANCELLED, RunState.UNKNOWN},
        RunState.SUSPENDED: {RunState.AUTHORIZED, RunState.CANCELLED, RunState.UNKNOWN},
        RunState.UNKNOWN: {RunState.SUSPENDED, RunState.FAILED, RunState.CANCELLED},
    }
    if target_state in allowed.get(current_state, set()):
        return TransitionDecision.ALLOW_TRANSITION
    return TransitionDecision.HOLD_REQUIRED


def retry_decision(
    current_state: RunState,
    evidence: TransitionEvidence,
    *,
    technically_retryable: bool,
) -> TransitionDecision:
    if current_state in TERMINAL_STATES and current_state is not RunState.FAILED:
        return TransitionDecision.TERMINAL_STATE_PROTECTED
    if not technically_retryable:
        return TransitionDecision.HOLD_REQUIRED

    safety = _safety_precondition(evidence)
    if safety is not None:
        return safety

    if evidence.effect_state is EffectState.EFFECT_APPLIED:
        return TransitionDecision.HOLD_REQUIRED
    if evidence.effect_state is EffectState.EFFECT_NOT_APPLIED or evidence.effect_state is None:
        return TransitionDecision.RETRY_ELIGIBLE
    return TransitionDecision.HOLD_REQUIRED


def recovery_decision(
    current_state: RunState,
    evidence: TransitionEvidence,
) -> TransitionDecision:
    if current_state in TERMINAL_STATES:
        return TransitionDecision.TERMINAL_STATE_PROTECTED

    safety = _safety_precondition(evidence)
    if safety is not None:
        return safety

    if evidence.resume_decision in (
        ResumeDecision.RECONCILIATION_REQUIRED,
        ResumeDecision.DUPLICATE_MUTATION_PROHIBITED,
    ):
        return TransitionDecision.RECONCILIATION_REQUIRED
    if evidence.resume_decision is ResumeDecision.REAUTHORIZE_REQUIRED:
        return TransitionDecision.REAUTHORIZE_REQUIRED
    if evidence.resume_decision in (
        ResumeDecision.DEFINITION_MISMATCH,
        ResumeDecision.HOLD_REQUIRED,
    ):
        return TransitionDecision.HOLD_REQUIRED

    if current_state in (RunState.SUSPENDED, RunState.UNKNOWN, RunState.WAITING_CALLBACK):
        return TransitionDecision.RECOVERY_ELIGIBLE
    return TransitionDecision.HOLD_REQUIRED


def parent_propagation_decision(propagation: ChildPropagation) -> TransitionDecision:
    if propagation.child_state in (RunState.FAILED, RunState.DENIED, RunState.CANCELLED):
        if propagation.explicit_parent_failure_rule:
            return TransitionDecision.ALLOW_TRANSITION
        return TransitionDecision.HOLD_REQUIRED
    return TransitionDecision.ALLOW_TRANSITION
