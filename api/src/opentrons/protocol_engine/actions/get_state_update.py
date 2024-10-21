# noqa: D100


from .actions import (
    Action,
    ResumeFromRecoveryAction,
    SucceedCommandAction,
    FailCommandAction,
)
from ..commands.command import DefinedErrorData
from ..state.update_types import StateUpdate


def get_state_update(action: Action) -> StateUpdate | None:
    """Extract the StateUpdate from an action, if there is one."""
    if isinstance(action, SucceedCommandAction):
        return action.state_update
    elif isinstance(action, FailCommandAction) and isinstance(
        action.error, DefinedErrorData
    ):
        return action.error.state_update
    elif isinstance(action, ResumeFromRecoveryAction):
        return action.state_update
    else:
        return None

    # FIX BEFORE MERGE:
    # If it's a FailCommandAction, and the error recovery policy was
    # "assume false-positive and continue," there are actually two StateUpdates
    # that we need to return here:
    #
    # 1. The "main" one from the command failure.
    # 2. The "extra" one from assuming it's a false-positive and fixing things up
    #    so we're ready to continue.
    #
    # Or we need to merge them into a single update or something.
