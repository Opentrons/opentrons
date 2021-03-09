"""ProtocolEngine class definition."""
from __future__ import annotations
from typing import Union

from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.util.helpers import utc_now

from .errors import ProtocolEngineError, UnexpectedProtocolError
from .execution import CommandHandlers
from .resources import ResourceProviders
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
    async def create(cls, hardware: HardwareAPI) -> ProtocolEngine:
        """Create a ProtocolEngine instance."""
        resources = ResourceProviders.create()

        # TODO(mc, 2020-11-18): check short trash FF
        # TODO(mc, 2020-11-18): consider moving into a StateStore.create factory
        deck_def = await resources.deck_data.get_deck_definition()
        fixed_labware = await resources.deck_data.get_deck_fixed_labware(deck_def)

        state_store = StateStore(
            deck_definition=deck_def,
            deck_fixed_labware=fixed_labware
        )

        handlers = CommandHandlers.create(
            resources=resources,
            hardware=hardware,
            state=StateView.create_view(state_store),
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
