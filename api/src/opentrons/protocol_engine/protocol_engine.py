"""ProtocolEngine class definition."""
from typing import Optional
from opentrons.hardware_control import API as HardwareAPI

from .resources import ModelUtils
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

    _hardware_api: HardwareAPI
    _state_store: StateStore
    _queue_worker: QueueWorker
    _command_mapper: CommandMapper
    _model_utils: ModelUtils

    def __init__(
        self,
        hardware_api: HardwareAPI,
        state_store: StateStore,
        queue_worker: QueueWorker,
        command_mapper: Optional[CommandMapper] = None,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._queue_worker = queue_worker
        self._command_mapper = command_mapper or CommandMapper()
        self._model_utils = model_utils or ModelUtils()

    @property
    def state_view(self) -> StateView:
        """Get an interface to retrieve calculated state values."""
        return self._state_store

    def play(self) -> None:
        """Start or resume executing commands in the queue."""
        # TODO(mc, 2021-08-05): if starting, ensure plungers motors are
        # homed if necessary
        action = PlayAction()
        self._state_store.commands.validate_action_allowed(action)
        self._state_store.handle_action(action)
        self._queue_worker.start()

    def pause(self) -> None:
        """Pause executing commands in the queue."""
        action = PauseAction()
        self._state_store.commands.validate_action_allowed(action)
        self._state_store.handle_action(action)

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
            command_id=self._model_utils.generate_id(),
            created_at=self._model_utils.get_timestamp(),
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

    async def halt(self) -> None:
        """Halt execution, stopping all motion and cancelling future commands.

        You should call `stop` after calling `halt` for cleanup and to allow
        the engine to settle and recover.
        """
        self._state_store.handle_action(StopAction())
        self._queue_worker.cancel()
        await self._hardware_api.halt()

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

        try:
            await self._queue_worker.join()
        finally:
            await self._hardware_api.stop(home_after=False)
