"""ProtocolEngine class definition."""
from __future__ import annotations
from typing import Union

from opentrons_shared_data.deck import load as load_deck
from opentrons.protocols.api_support.constants import STANDARD_DECK
from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.util.helpers import utc_now

from .errors import ProtocolEngineError, UnexpectedProtocolError
from .execution import CommandHandlers
from .state import StateStore, StateView
from .commands import (
    CommandRequestType,
    CompletedCommandType,
    FailedCommandType,
)


class ProtocolEngine:
    """
    Main ProtocolEngine class.

    A ProtocolEngine instance holds the state of a protocol as it executes,
    and manages calls to a command executor that actually implements the logic
    of the commands themselves.
    """

    state_store: StateStore
    _handlers: CommandHandlers

    @classmethod
    def create(cls, hardware: HardwareAPI) -> ProtocolEngine:
        """Create a ProtocolEngine instance."""
        deck_definition = load_deck(STANDARD_DECK, 2)
        state_store = StateStore(deck_definition=deck_definition)
        handlers = CommandHandlers.create(
            hardware=hardware,
            state=StateView.create_view(state_store)
        )

        return cls(state_store=state_store, handlers=handlers)

    def __init__(
        self,
        state_store: StateStore,
        handlers: CommandHandlers,
    ) -> None:
        """
        Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self.state_store = state_store
        self._handlers = handlers

    async def execute_command(
        self,
        request: CommandRequestType,
        command_id: str,
    ) -> Union[CompletedCommandType, FailedCommandType]:
        """Execute a command request, waiting for it to complete."""
        cmd_impl = request.get_implementation()
        created_at = utc_now()
        cmd = cmd_impl.create_command(created_at).to_running(created_at)
        done_cmd: Union[CompletedCommandType, FailedCommandType]

        # store the command prior to execution
        self.state_store.handle_command(cmd, command_id=command_id)

        # execute the command
        try:
            result = await cmd_impl.execute(self._handlers)
            completed_at = utc_now()
            done_cmd = cmd.to_completed(result, completed_at)

        except Exception as error:
            failed_at = utc_now()
            if not isinstance(error, ProtocolEngineError):
                error = UnexpectedProtocolError(error)
            done_cmd = cmd.to_failed(error, failed_at)

        # store the done command
        self.state_store.handle_command(done_cmd, command_id=command_id)

        return done_cmd
