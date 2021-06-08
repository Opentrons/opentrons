"""ProtocolEngine class definition."""
from __future__ import annotations

from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.util.helpers import utc_now

from .errors import ProtocolEngineError, UnexpectedProtocolError
from .execution import CommandHandlers
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
            deck_definition=deck_def, deck_fixed_labware=fixed_labware
        )

        return cls(state_store=state_store, resources=resources, hardware=hardware)

    def __init__(
        self,
        hardware: HardwareAPI,
        state_store: StateStore,
        resources: ResourceProviders,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self._hardware = hardware
        self._state_store = state_store
        self._resources = resources

    @property
    def state_view(self) -> StateView:
        """Get an interface to retrieve calculated state values."""
        return self._state_store.state_view

    def get_state(self) -> State:
        """Get the engine's underlying state."""
        return self._state_store.get_state()

    async def execute_command(
        self,
        request: CommandRequest,
        command_id: str,
    ) -> Command:
        """Execute a command request, waiting for it to complete."""
        cmd_impl = request.get_implementation()
        created_at = utc_now()
        command = cmd_impl.create_command(
            command_id=command_id,
            created_at=created_at,
            status=CommandStatus.RUNNING,
        ).copy(update={"startedAt": created_at})

        # store the command prior to execution
        self._state_store.handle_command(command, command_id=command_id)

        # TODO(mc, 2021-06-16): refactor command execution after command
        # models have been simplified to delegate to CommandExecutor. This
        # should involve ditching the relatively useless CommandHandler class
        handlers = CommandHandlers(
            hardware=self._hardware,
            resources=self._resources,
            state=self.state_view,
        )

        # execute the command
        try:
            result = await cmd_impl.execute(handlers)
            completed_at = utc_now()
            command = command.copy(
                update={
                    "result": result,
                    "completedAt": completed_at,
                    "status": CommandStatus.EXECUTED,
                }
            )

        except Exception as error:
            completed_at = utc_now()
            if not isinstance(error, ProtocolEngineError):
                error = UnexpectedProtocolError(error)

            command = command.copy(
                update={
                    # TODO(mc, 2021-06-21): return structured error details
                    "error": str(error),
                    "completedAt": completed_at,
                    "status": CommandStatus.FAILED,
                }
            )

        # store the done command
        self._state_store.handle_command(command, command_id=command_id)

        return command

    def add_command(self, request: CommandRequest) -> Command:
        """Add a command to ProtocolEngine."""
        # TODO(mc, 2021-06-14): ID generation and timestamp generation need to
        # be redone / reconsidered. Too much about command execution has leaked
        # into the root ProtocolEngine class, so we should delegate downwards.
        command_id = self._resources.id_generator.generate_id()
        created_at = utc_now()
        command_impl = request.get_implementation()
        command = command_impl.create_command(
            command_id=command_id,
            created_at=created_at,
        )

        self._state_store.handle_command(command, command_id=command_id)

        return command
