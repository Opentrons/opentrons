# noqa: D100
from __future__ import annotations
from typing import TYPE_CHECKING

from .actions import (
    Action,
    ResumeFromRecoveryAction,
    SucceedCommandAction,
    FailCommandAction,
)
from ..commands.command import DefinedErrorData
from ..error_recovery_policy import ErrorRecoveryType

if TYPE_CHECKING:
    from ..state.update_types import StateUpdate


def get_state_updates(action: Action) -> list[StateUpdate]:
    """Extract all the StateUpdates that the StateStores should apply when they apply an action."""
    if isinstance(action, SucceedCommandAction):
        return [action.state_update]

    elif isinstance(action, FailCommandAction) and isinstance(
        action.error, DefinedErrorData
    ):
        if action.type == ErrorRecoveryType.ASSUME_FALSE_POSITIVE_AND_CONTINUE:
            return [
                action.error.state_update,
                action.error.state_update_if_false_positive,
            ]
        else:
            return [action.error.state_update]

    elif isinstance(action, ResumeFromRecoveryAction):
        return [action.state_update]

    else:
        return []
