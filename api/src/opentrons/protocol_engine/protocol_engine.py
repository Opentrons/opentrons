"""ProtocolEngine class definition."""
from typing import Optional
from opentrons.hardware_control import API as HardwareAPI

from .resources import ModelUtils
from .commands import Command, CommandCreate
from .types import LabwareOffset, LabwareOffsetCreate
from .execution import QueueWorker, create_queue_worker
from .state import StateStore, StateView
from .plugins import AbstractPlugin, PluginStarter
from .actions import (
    ActionDispatcher,
    PlayAction,
    PauseAction,
    StopAction,
    FinishAction,
    FinishErrorDetails,
    QueueCommandAction,
    AddLabwareOffsetAction,
    HardwareStoppedAction,
)


class ProtocolEngine:
    """Main ProtocolEngine class.

    A ProtocolEngine instance holds the state of a protocol as it executes,
    and manages calls to a command executor that actually implements the logic
    of the commands themselves.
    """

    def __init__(
        self,
        hardware_api: HardwareAPI,
        state_store: StateStore,
        action_dispatcher: Optional[ActionDispatcher] = None,
        plugin_starter: Optional[PluginStarter] = None,
        queue_worker: Optional[QueueWorker] = None,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        This constructor does not inject provider implementations. Prefer the
        ProtocolEngine.create factory classmethod.
        """
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._model_utils = model_utils or ModelUtils()

        self._action_dispatcher = action_dispatcher or ActionDispatcher(
            sink=self._state_store
        )
        self._plugin_starter = plugin_starter or PluginStarter(
            state=self._state_store,
            action_dispatcher=self._action_dispatcher,
        )
        self._queue_worker = queue_worker or create_queue_worker(
            hardware_api=self._hardware_api,
            state_store=self._state_store,
            action_dispatcher=self._action_dispatcher,
        )

        self._queue_worker.start()

    @property
    def state_view(self) -> StateView:
        """Get an interface to retrieve calculated state values."""
        return self._state_store

    def add_plugin(self, plugin: AbstractPlugin) -> None:
        """Add a plugin to the engine to customize behavior."""
        self._plugin_starter.start(plugin)

    def play(self) -> None:
        """Start or resume executing commands in the queue."""
        # TODO(mc, 2021-08-05): if starting, ensure plungers motors are
        # homed if necessary
        action = PlayAction()
        self._state_store.commands.validate_action_allowed(action)
        self._action_dispatcher.dispatch(action)
        self._queue_worker.start()

    def pause(self) -> None:
        """Pause executing commands in the queue."""
        action = PauseAction()
        self._state_store.commands.validate_action_allowed(action)
        self._action_dispatcher.dispatch(action)

    def add_command(self, request: CommandCreate) -> Command:
        """Add a command to the `ProtocolEngine`'s queue.

        Arguments:
            request: The command type and payload data used to construct
                the command in state.

        Returns:
            The full, newly queued command.
        """
        command_id = self._model_utils.generate_id()
        action = QueueCommandAction(
            request=request,
            command_id=command_id,
            created_at=self._model_utils.get_timestamp(),
        )
        self._action_dispatcher.dispatch(action)

        return self._state_store.commands.get(command_id)

    async def add_and_execute_command(self, request: CommandCreate) -> Command:
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

        return self._state_store.commands.get(command.id)

    async def stop(self) -> None:
        """Stop execution immediately, halting all motion and cancelling future commands.

        After an engine has been `stop`'ed, it cannot be restarted.
        """
        self._action_dispatcher.dispatch(StopAction())
        self._queue_worker.cancel()
        await self._hardware_api.halt()
        await self._hardware_api.stop(home_after=False)
        self._action_dispatcher.dispatch(HardwareStoppedAction())

    async def wait_until_complete(self) -> None:
        """Wait until there are no more commands to execute.

        This will happen if all commands are executed or if one command fails.
        """
        await self._state_store.wait_for(
            condition=self._state_store.commands.get_all_complete
        )

    async def finish(self, error: Optional[Exception] = None) -> None:
        """Gracefully finish using the ProtocolEngine, waiting for it to become idle.

        The engine will finish executing its current command (if any),
        and then shut down. After an engine has been `finished`'ed, it cannot
        be restarted.

        This method should not raise, but if any exceptions happen during
        execution that are not properly caught by the CommandExecutor, they
        will be raised here.

        Arguments:
            error: An error that caused the stop, if applicable.
        """
        if error:
            error_details: Optional[FinishErrorDetails] = FinishErrorDetails(
                error_id=self._model_utils.generate_id(),
                created_at=self._model_utils.get_timestamp(),
                error=error,
            )
        else:
            error_details = None

        self._action_dispatcher.dispatch(FinishAction(error_details=error_details))

        try:
            await self._queue_worker.join()
        finally:
            await self._hardware_api.stop(home_after=False)

        self._action_dispatcher.dispatch(HardwareStoppedAction())
        self._plugin_starter.stop()

    def add_labware_offset(self, request: LabwareOffsetCreate) -> LabwareOffset:
        """Add a new labware offset and return it.

        The added offset will apply to subsequent `LoadLabwareCommand`s.

        To retrieve offsets later, see `.state_view.labware`.
        """
        labware_offset_id = self._model_utils.generate_id()
        created_at = self._model_utils.get_timestamp()
        self._action_dispatcher.dispatch(
            AddLabwareOffsetAction(
                labware_offset_id=labware_offset_id,
                created_at=created_at,
                request=request,
            )
        )
        return self.state_view.labware.get_labware_offset(
            labware_offset_id=labware_offset_id
        )
