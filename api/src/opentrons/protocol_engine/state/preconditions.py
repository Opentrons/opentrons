"""Command precondition state and store resource."""

from dataclasses import dataclass

from ..actions import Action
from ._abstract_store import HandlesActions, HasState
from opentrons.protocol_engine.actions.get_state_update import get_state_updates
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.types import CommandPreconditions, PreconditionTypes


@dataclass
class CommandPreconditionState:
    """State of Engine command precondition references."""

    preconditions: CommandPreconditions


class CommandPreconditionStore(HasState[CommandPreconditionState], HandlesActions):
    """Command Precondition container."""

    _state: CommandPreconditionState

    def __init__(self) -> None:
        """Initialize a Command Precondition store and its state."""
        self._state = CommandPreconditionState(
            preconditions=CommandPreconditions(isCameraUsed=False)
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        for state_update in get_state_updates(action):
            self._handle_state_update(state_update)

    def _handle_state_update(self, state_update: update_types.StateUpdate) -> None:
        if state_update.precondition_update != update_types.NO_CHANGE:
            for key in state_update.precondition_update.preconditions:
                if key == PreconditionTypes.IS_CAMERA_USED:
                    self._state.preconditions.isCameraUsed = (
                        state_update.precondition_update.preconditions[key]
                    )


class CommandPreconditionView:
    """Read-only engine created Command Precondition state view."""

    _state: CommandPreconditionState

    def __init__(self, state: CommandPreconditionState) -> None:
        """Initialize the view of Command Precondition state.

        Arguments:
            state: Command precondition dataclass used for tracking preconditions used during a protocol.
        """
        self._state = state

    def get_precondition(self) -> CommandPreconditions:
        """Get the Command Preconditions currently set by a protocol."""
        return self._state.preconditions
