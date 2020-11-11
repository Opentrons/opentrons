"""ProtocolEngine class definition."""
from __future__ import annotations
from typing import Union

from opentrons_shared_data.deck import load as load_deck
from opentrons.protocols.api_support.constants import STANDARD_DECK
from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.util.helpers import utc_now

from .execution import CommandExecutor
from .state import StateStore, StateView

from .command_models import (
    CommandRequestType,
    RunningCommandType,
    CompletedCommandType,
    FailedCommandType,
    RunningCommand
)


class ProtocolEngine:
    """
    Main ProtocolEngine class.

    A ProtocolEngine instance holds the state of a protocol as it executes,
    and manages calls to a command executor that actually implements the logic
    of the commands themselves.
    """

    @classmethod
    def create(cls, hardware: HardwareAPI) -> ProtocolEngine:
        """Create a ProtocolEngine instance."""
        deck_definition = load_deck(STANDARD_DECK, 2)
        state_store = StateStore(deck_definition=deck_definition)
        executor = CommandExecutor.create(
            hardware=hardware,
            state=StateView.create_view(state_store)
        )

        return cls(state_store=state_store, executor=executor)

    def __init__(
        self,
        state_store: StateStore,
        executor: CommandExecutor,
    ) -> None:
        """
        Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self.state_store = state_store
        self.executor = executor

    async def execute_command(
        self,
        request: CommandRequestType,
        command_id: str,
    ) -> Union[CompletedCommandType, FailedCommandType]:
        """Handle a command request by creating and executing the command."""
        created_at = utc_now()
        cmd: RunningCommandType = RunningCommand(  # type: ignore[assignment]
            created_at=created_at,
            started_at=created_at,
            request=request,
        )

        self.state_store.handle_command(cmd, command_id=command_id)
        completed_cmd = await self.executor.execute_command(cmd)
        self.state_store.handle_command(completed_cmd, command_id=command_id)

        return completed_cmd
