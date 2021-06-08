"""ProtocolEngine class definition."""
from __future__ import annotations

from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.util.helpers import utc_now

from .errors import ProtocolEngineError, UnexpectedProtocolError
from .execution import CommandHandlers
from .resources import ResourceProviders
from .state import State, StateStore, StateView
from .commands import CommandBuilder, Command, CommandRequest


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

        return cls(
            state_store=state_store,
            resources=resources,
            hardware=hardware,
            command_builder=CommandBuilder(),
        )

    def __init__(
        self,
        hardware: HardwareAPI,
        state_store: StateStore,
        resources: ResourceProviders,
        command_builder: CommandBuilder,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self._hardware = hardware
        self._state_store = state_store
        self._resources = resources
        self._command_builder = command_builder

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
        created_at = utc_now()

        queued_command = self._command_builder.build(
            command_request=request,
            command_id=command_id,
            created_at=created_at,
        )

        running_command = self._command_builder.to_running(
            command=queued_command,
            started_at=created_at,
        )

        # store the command prior to execution
        self._state_store.handle_command(running_command, command_id=command_id)

        result = None
        error = None

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
            command_impl = running_command.Implementation()
            result = await command_impl.execute(
                running_command.data,  # type: ignore[arg-type]
                handlers,
            )
        except ProtocolEngineError as e:
            error = e
        except Exception as e:
            error = UnexpectedProtocolError(e)

        done_command = self._command_builder.to_completed(
            command=running_command,
            result=result,
            error=error,
            completed_at=utc_now(),
        )

        # store the done command
        self._state_store.handle_command(done_command, command_id=command_id)

        return done_command

    def add_command(self, request: CommandRequest) -> Command:
        """Add a command to ProtocolEngine."""
        # TODO(mc, 2021-06-14): ID generation and timestamp generation need to
        # be redone / reconsidered. Too much about command execution has leaked
        # into the root ProtocolEngine class, so we should delegate downwards.
        command_id = self._resources.id_generator.generate_id()
        created_at = utc_now()
        queued_command = self._command_builder.build(
            command_request=request,
            command_id=command_id,
            created_at=created_at,
        )

        self._state_store.handle_command(queued_command, command_id=command_id)

        return queued_command
