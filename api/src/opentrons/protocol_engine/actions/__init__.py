"""ProtocolEngine action interfaces.

Actions are the driver of state changes in the ProtocolEngine.
"""

from .action_dispatcher import ActionDispatcher
from .action_handler import ActionHandler

from .actions import (
    Action,
    PlayAction,
    PauseAction,
    StopAction,
    StopErrorDetails,
    CommandUpdatedAction,
    CommandFailedAction,
)

__all__ = [
    # action pipeline interface
    "ActionDispatcher",
    # action reaction interface
    "ActionHandler",
    # action values
    "Action",
    "PlayAction",
    "PauseAction",
    "StopAction",
    "StopErrorDetails",
    "CommandUpdatedAction",
    "CommandFailedAction",
]
