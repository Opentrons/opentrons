"""ProtocolEngine class definition."""
from .resources import ResourceProviders
from .commands import Command, CommandRequest, CommandMapper
from .execution import CommandExecutor, QueueWorker

from .state import (
    State,
    StateStore,
    StateView,
    PlayAction,
    PauseAction,
    UpdateCommandAction,
)


class ProtocolEngine:
    """Main ProtocolEngine class.

    A ProtocolEngine instance holds the state of a protocol as it executes,
    and manages calls to a command executor that actually implements the logic
    of the commands themselves.
    """

    _state_store: StateStore
    _command_executor: CommandExecutor
    _command_mapper: CommandMapper
    _resources: ResourceProviders
    _queue_worker: QueueWorker

    def __init__(
        self,
        state_store: StateStore,
        command_executor: CommandExecutor,
        command_mapper: CommandMapper,
        resources: ResourceProviders,
        queue_worker: QueueWorker,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self._state_store = state_store
        self._command_executor = command_executor
        self._command_mapper = command_mapper
        self._resources = resources
        self._queue_worker = queue_worker

    @property
    def state_view(self) -> StateView:
        """Get an interface to retrieve calculated state values."""
        return self._state_store

    def get_state(self) -> State:
        """Get the engine's underlying state."""
        return self._state_store.get_state()

    def add_command(self, request: CommandRequest) -> Command:
        """Add a command to ProtocolEngine."""
        command = self._command_mapper.map_request_to_command(
            request=request,
            command_id=self._resources.model_utils.generate_id(),
            created_at=self._resources.model_utils.get_timestamp(),
        )
        self._state_store.handle_action(UpdateCommandAction(command=command))

        return command

    async def execute_command(self, request: CommandRequest) -> Command:
        """Execute a command request, waiting for it to complete.

        This method will start the engine if it has not been started. The
        engine will remain running after this method is done.
        """
        self.play()
        command = self.add_command(request)

        await self._state_store.wait_for(
            condition=self._state_store.commands.get_is_complete,
            command_id=command.id,
        )

        return self._state_store.commands.get(command_id=command.id)

    def play(self) -> None:
        """Start or resume executing commands in the queue."""
        self._state_store.handle_action(PlayAction())
        self._queue_worker.start()

    def pause(self) -> None:
        """Pause executing commands in the queue."""
        self._state_store.handle_action(PauseAction())

    async def wait_for_done(self) -> None:
        """Wait for the ProtocolEngine to become idle.

        The ProtocolEngine is considered "done" when there is no command
        currently executing nor any commands left in the queue.

        This method should not raise, but if any unexepected exceptions
        happen during command execution that are not properly caught by
        the CommandExecutor, this is where they will be raised.
        """
        await self._state_store.wait_for(self._state_store.commands.get_is_complete)
        await self._queue_worker.stop()
