"""ProtocolEngine class definition."""
from opentrons.hardware_control import API as HardwareAPI

from .resources import ResourceProviders
from .commands import Command, CommandRequest, CommandMapper
from .execution import QueueWorker

from .state import (
    StateStore,
    StateView,
    PlayAction,
    PauseAction,
    StopAction,
    UpdateCommandAction,
)


class ProtocolEngine:
    """Main ProtocolEngine class.

    A ProtocolEngine instance holds the state of a protocol as it executes,
    and manages calls to a command executor that actually implements the logic
    of the commands themselves.
    """

    _state_store: StateStore
    _command_mapper: CommandMapper
    _resources: ResourceProviders
    _queue_worker: QueueWorker
    _hardware_api: HardwareAPI

    def __init__(
        self,
        state_store: StateStore,
        command_mapper: CommandMapper,
        resources: ResourceProviders,
        queue_worker: QueueWorker,
        hardware_api: HardwareAPI,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self._state_store = state_store
        self._command_mapper = command_mapper
        self._resources = resources
        self._queue_worker = queue_worker
        self._hardware_api = hardware_api

    @property
    def state_view(self) -> StateView:
        """Get an interface to retrieve calculated state values."""
        return self._state_store

    def play(self) -> None:
        """Start or resume executing commands in the queue."""
        self._state_store.handle_action(PlayAction())
        self._queue_worker.start()

    def pause(self) -> None:
        """Pause executing commands in the queue."""
        self._state_store.handle_action(PauseAction())

    def add_command(self, request: CommandRequest) -> Command:
        """Add a command to the `ProtocolEngine`'s queue.

        Arguments:
            request: The command type and payload data used to construct
                the command in state.

        Returns:
            The full, newly queued command.
        """
        command = self._command_mapper.map_request_to_command(
            request=request,
            command_id=self._resources.model_utils.generate_id(),
            created_at=self._resources.model_utils.get_timestamp(),
        )
        self._state_store.handle_action(UpdateCommandAction(command=command))

        return command

    async def add_and_execute_command(self, request: CommandRequest) -> Command:
        """Add a command to the queue and wait for it to complete.

        The engine must be started by calling `play` before the command will
        execute. You only need to call `play` once.

        Arguments:
            request: The command type and payload data used to construct
                the command in state.

        Returns:
            The completed command, whether it succeeded or failed.
        """
        command = self.add_command(request)

        await self._state_store.wait_for(
            condition=self._state_store.commands.get_is_complete,
            command_id=command.id,
        )

        return self._state_store.commands.get(command_id=command.id)

    def halt(self) -> None:
        """Halt execution, stopping all motion and cancelling future commands.

        This method is synchronous to ensure the halt reaches hardware
        as immediately as possible. You should call `stop` after
        calling `halt` for cleanup and to allow the engine to settle before
        continuing with recovery steps.
        """
        self._state_store.handle_action(StopAction())
        self._queue_worker.cancel()
        self._hardware_api.halt()

    async def stop(self, wait_until_complete: bool = False) -> None:
        """Gracefully stop the ProtocolEngine, waiting for it to become idle.

        The engine will finish executing its current command (if any),
        and then shut down. After an engine has been `stop`'ed, it cannot
        be restarted.

        This method should not raise, but if any exceptions happen during
        execution that are not properly caught by the CommandExecutor, they
        will be raised here.

        Arguments:
            wait_until_complete: Wait until _all_ commands have completed
                before stopping the engine.
        """
        if wait_until_complete:
            await self._state_store.wait_for(
                condition=self._state_store.commands.get_all_complete
            )

        self._state_store.handle_action(StopAction())
        await self._queue_worker.join()
