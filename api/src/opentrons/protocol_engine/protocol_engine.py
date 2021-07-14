"""ProtocolEngine class definition."""
from .resources import ResourceProviders
from .state import State, StateStore, StateView
from .commands import Command, CommandRequest, CommandStatus, CommandMapper
from .execution import CommandExecutor, QueueWorker


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
        return self._state_store.state_view

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
        self._state_store.handle_command(command)
        return command

    async def execute_command_by_id(self, command_id: str) -> Command:
        """Execute a protocol engine command by its identifier."""
        queued_command = self.state_view.commands.get(command_id)

        running_command = self._command_mapper.update_command(
            command=queued_command,
            startedAt=self._resources.model_utils.get_timestamp(),
            status=CommandStatus.RUNNING,
        )

        self._state_store.handle_command(running_command)
        completed_command = await self._command_executor.execute(running_command)
        self._state_store.handle_command(completed_command)

        return completed_command

    async def execute_command(
        self,
        request: CommandRequest,
        command_id: str,
    ) -> Command:
        """Execute a command request, waiting for it to complete."""
        created_at = self._resources.model_utils.get_timestamp()

        queued_command = self._command_mapper.map_request_to_command(
            request=request,
            command_id=command_id,
            created_at=created_at,
        )

        running_command = self._command_mapper.update_command(
            command=queued_command,
            startedAt=created_at,
            status=CommandStatus.RUNNING,
        )

        self._state_store.handle_command(running_command)
        completed_command = await self._command_executor.execute(running_command)
        self._state_store.handle_command(completed_command)

        return completed_command

    def start(self) -> None:
        """Executing commands in the queue until the queue is exhausted."""
        self._queue_worker.start()

    def stop(self) -> None:
        """Stop or pause executing commands in the queue."""
        self._queue_worker.stop()
