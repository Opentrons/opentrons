"""ProtocolEngine class definition."""
from typing import Dict, Optional

from opentrons.protocols.models import LabwareDefinition
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import AbstractModule as HardwareModuleAPI

from .resources import ModelUtils, ModuleDataProvider
from .commands import Command, CommandCreate
from .types import LabwareOffset, LabwareOffsetCreate, LabwareUri, ModuleModel
from .execution import (
    QueueWorker,
    create_queue_worker,
    HardwareEventForwarder,
    HardwareStopper,
)
from .state import StateStore, StateView
from .plugins import AbstractPlugin, PluginStarter
from .actions import (
    ActionDispatcher,
    PlayAction,
    PauseAction,
    PauseSource,
    StopAction,
    FinishAction,
    FinishErrorDetails,
    QueueCommandAction,
    AddLabwareOffsetAction,
    AddLabwareDefinitionAction,
    AddModuleAction,
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
        hardware_api: HardwareControlAPI,
        state_store: StateStore,
        action_dispatcher: Optional[ActionDispatcher] = None,
        plugin_starter: Optional[PluginStarter] = None,
        queue_worker: Optional[QueueWorker] = None,
        model_utils: Optional[ModelUtils] = None,
        hardware_stopper: Optional[HardwareStopper] = None,
        hardware_event_forwarder: Optional[HardwareEventForwarder] = None,
        module_data_provider: Optional[ModuleDataProvider] = None,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        Must be called while an event loop is active.

        This constructor does not inject provider implementations.
        Prefer the `create_protocol_engine()` factory function.
        """
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
            hardware_api=hardware_api,
            state_store=self._state_store,
            action_dispatcher=self._action_dispatcher,
        )
        self._hardware_stopper = hardware_stopper or HardwareStopper(
            hardware_api=hardware_api, state_store=state_store
        )
        self._hardware_event_forwarder = (
            hardware_event_forwarder
            or HardwareEventForwarder(
                hardware_api=hardware_api,
                action_dispatcher=self._action_dispatcher,
            )
        )
        self._module_data_provider = module_data_provider or ModuleDataProvider()

        self._queue_worker.start()
        self._hardware_event_forwarder.start()

    @property
    def state_view(self) -> StateView:
        """Get an interface to retrieve calculated state values."""
        return self._state_store

    def add_plugin(self, plugin: AbstractPlugin) -> None:
        """Add a plugin to the engine to customize behavior."""
        self._plugin_starter.start(plugin)

    def play(self) -> None:
        """Start or resume executing commands in the queue."""
        requested_at = self._model_utils.get_timestamp()
        # TODO(mc, 2021-08-05): if starting, ensure plungers motors are
        # homed if necessary
        action = self._state_store.commands.validate_action_allowed(
            PlayAction(requested_at=requested_at)
        )
        self._action_dispatcher.dispatch(action)
        self._queue_worker.start()

    def pause(self) -> None:
        """Pause executing commands in the queue."""
        action = self._state_store.commands.validate_action_allowed(
            PauseAction(source=PauseSource.CLIENT)
        )
        self._action_dispatcher.dispatch(action)

    def add_command(self, request: CommandCreate) -> Command:
        """Add a command to the `ProtocolEngine`'s queue.

        Arguments:
            request: The command type and payload data used to construct
                the command in state.

        Returns:
            The full, newly queued command.

        Raises:
            SetupCommandNotAllowed: the request specified a setup command,
                but the engine was not idle or paused.
            RunStoppedError: the run has been stopped, so no new commands
                may be added.
        """
        command_id = self._model_utils.generate_id()

        action = self.state_view.commands.validate_action_allowed(
            QueueCommandAction(
                request=request,
                command_id=command_id,
                # TODO(mc, 2021-12-13): generate a command key from params and state
                # https://github.com/Opentrons/opentrons/issues/8986
                command_key=command_id,
                created_at=self._model_utils.get_timestamp(),
            )
        )
        self._action_dispatcher.dispatch(action)
        return self._state_store.commands.get(command_id)

    async def wait_for_command(self, command_id: str) -> None:
        """Wait for a command to be completed."""
        await self._state_store.wait_for(
            self._state_store.commands.get_is_complete,
            command_id=command_id,
        )

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
        await self.wait_for_command(command.id)
        return self._state_store.commands.get(command.id)

    async def stop(self) -> None:
        """Stop execution immediately, halting all motion and cancelling future commands.

        After an engine has been `stop`'ed, it cannot be restarted.

        After a `stop`, you must still call `finish` to give the engine a chance
        to clean up resources and propagate errors.
        """
        action = self._state_store.commands.validate_action_allowed(StopAction())
        self._action_dispatcher.dispatch(action)
        self._queue_worker.cancel()
        await self._hardware_stopper.do_halt()

    async def wait_until_complete(self) -> None:
        """Wait until there are no more commands to execute.

        Raises:
            CommandExecutionFailedError: if any protocol command failed.
        """
        await self._state_store.wait_for(
            condition=self._state_store.commands.get_all_complete
        )

    async def finish(
        self,
        error: Optional[Exception] = None,
        drop_tips_and_home: bool = True,
        set_run_status: bool = True,
    ) -> None:
        """Gracefully finish using the ProtocolEngine, waiting for it to become idle.

        The engine will finish executing its current command (if any),
        and then shut down. After an engine has been `finished`'ed, it cannot
        be restarted.

        This method should not raise, but if any exceptions happen during
        execution that are not properly caught by the CommandExecutor, they
        will be raised here.

        Arguments:
            error: An error that caused the stop, if applicable.
            drop_tips_and_home: Whether to home and drop tips as part of cleanup.
            set_run_status: Whether to calculate a `success` or `failure` run status.
                If `False`, will set status to `stopped`.
        """
        if error:
            error_details: Optional[FinishErrorDetails] = FinishErrorDetails(
                error_id=self._model_utils.generate_id(),
                created_at=self._model_utils.get_timestamp(),
                error=error,
            )
        else:
            error_details = None

        self._action_dispatcher.dispatch(
            FinishAction(error_details=error_details, set_run_status=set_run_status)
        )

        try:
            await self._queue_worker.join()

        # todo(mm, 2022-01-31): We should use something like contextlib.AsyncExitStack
        # to robustly clean up all these resources
        # instead of try/finally, which can't scale without making indentation silly.
        finally:
            # Note: After we stop listening, straggling events might be processed
            # concurrently to the below lines in this .finish() call,
            # or even after this .finish() call completes.
            self._hardware_event_forwarder.stop_soon()

            await self._hardware_stopper.do_stop_and_recover(drop_tips_and_home)

            completed_at = self._model_utils.get_timestamp()
            self._action_dispatcher.dispatch(
                HardwareStoppedAction(completed_at=completed_at)
            )
            await self._plugin_starter.stop()

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

    def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        """Add a labware definition to the state for subsequent labware loads."""
        self._action_dispatcher.dispatch(
            AddLabwareDefinitionAction(definition=definition)
        )
        return self._state_store.labware.get_uri_from_definition(definition)

    async def use_attached_modules(
        self,
        modules_by_id: Dict[str, HardwareModuleAPI],
    ) -> None:
        """Load attached modules directly into state, without locations."""
        actions = [
            AddModuleAction(
                module_id=module_id,
                serial_number=mod.device_info["serial"],
                definition=self._module_data_provider.get_definition(
                    ModuleModel(mod.model())
                ),
            )
            for module_id, mod in modules_by_id.items()
        ]

        for a in actions:
            self._action_dispatcher.dispatch(a)
