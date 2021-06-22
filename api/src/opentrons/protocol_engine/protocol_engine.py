"""ProtocolEngine class definition."""
from __future__ import annotations
from typing import Optional

from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.util.helpers import utc_now

from .errors import ProtocolEngineError, UnexpectedProtocolError
from .execution import CommandExecutor
from .resources import ResourceProviders
from .state import State, StateStore, StateView
from .commands import Command, CommandRequest, CommandStatus


class ProtocolEngine:
    """Main ProtocolEngine class.

    A ProtocolEngine instance holds the state of a protocol as it executes,
    and manages calls to a command executor that actually implements the logic
    of the commands themselves.
    """

    _hardware: HardwareAPI
    _state_store: StateStore
    _executor: CommandExecutor
    _resources: ResourceProviders

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
            deck_fixed_labware=fixed_labware,
        )

        executor = CommandExecutor(
            hardware=hardware,
            state_store=state_store,
            resources=resources,
        )

        return cls(
            hardware=hardware,
            state_store=state_store,
            executor=executor,
            resources=resources,
        )

    def __init__(
        self,
        hardware: HardwareAPI,
        state_store: StateStore,
        executor: CommandExecutor,
        resources: ResourceProviders,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self._hardware = hardware
        self._state_store = state_store
        self._executor = executor
        self._resources = resources

    @property
    def state_view(self) -> StateView:
        """Get an interface to retrieve calculated state values."""
        return self._state_store.state_view

    def get_state(self) -> State:
        """Get the engine's underlying state."""
        return self._state_store.get_state()

    # async def execute_command_by_id(self, command_id: str) -> Command:
    #     """Execute a protocol engine command by its identifier."""
    #     command = self.state_view.commands.get_command_by_id(command_id)
    #     started_at = utc_now()
    #     command = command.copy(
    #         update={
    #             "startedAt": started_at,
    #             "status": CommandStatus.RUNNING,
    #         }
    #     )

    #     self._state_store.handle_command(command)

    #     # execute the command
    #     try:
    #         result = await self._executor.execute(command)
    #         completed_at = utc_now()
    #         command = command.copy(
    #             update={
    #                 "result": result,
    #                 "completedAt": completed_at,
    #                 "status": CommandStatus.EXECUTED,
    #             }
    #         )

    #     except Exception as error:
    #         completed_at = utc_now()
    #         if not isinstance(error, ProtocolEngineError):
    #             error = UnexpectedProtocolError(error)

    #         command = command.copy(
    #             update={
    #                 # TODO(mc, 2021-06-21): return structured error details
    #                 "error": str(error),
    #                 "completedAt": completed_at,
    #                 "status": CommandStatus.FAILED,
    #             }
    #         )

    #     # store the done command
    #     self._state_store.handle_command(command)

    #     return command

    def add_command(self, request: CommandRequest) -> Command:
        """Add a command to ProtocolEngine."""
        command = self._executor.create_command(request)
        self._state_store.handle_command(command)
        return command

    async def execute_command_by_id(self, command_id: str) -> Command:
        """Execute a protocol engine command by its identifier."""
        queued_command = self.state_view.commands.get_command_by_id(command_id)
        running_command = self._executor.to_running(queued_command)

        self._state_store.handle_command(running_command)

        completed_command = await self._executor.execute(running_command)

        self._state_store.handle_command(completed_command)

        return completed_command

    async def execute_command(self, request: CommandRequest) -> Command:
        """Execute a command request, waiting for it to complete."""
        queued_command = self._executor.create_command(request)
        running_command = self._executor.to_running(queued_command)

        self._state_store.handle_command(running_command)

        completed_command = await self._executor.execute(running_command)

        self._state_store.handle_command(completed_command)

        return completed_command
