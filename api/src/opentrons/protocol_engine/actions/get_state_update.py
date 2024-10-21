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
