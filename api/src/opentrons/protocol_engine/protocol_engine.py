"""ProtocolEngine class definition."""
from contextlib import AsyncExitStack
from logging import getLogger
from typing import Dict, Optional, Union

from opentrons.protocols.models import LabwareDefinition
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import AbstractModule as HardwareModuleAPI
from opentrons.hardware_control.types import PauseType as HardwarePauseType

from opentrons_shared_data.errors import (
    ErrorCodes,
    EnumeratedError,
)

from .errors import ProtocolCommandFailedError, ErrorOccurrence
from .errors.exceptions import EStopActivatedError
from . import commands, slot_standardization
from .resources import ModelUtils, ModuleDataProvider
from .types import (
    LabwareOffset,
    LabwareOffsetCreate,
    LabwareUri,
    ModuleModel,
    Liquid,
    HexColor,
)
from .execution import (
    QueueWorker,
    create_queue_worker,
    DoorWatcher,
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
    AddLiquidAction,
    AddModuleAction,
    HardwareStoppedAction,
    ResetTipsAction,
    SetPipetteMovementSpeedAction,
    FailCommandAction,
)


_log = getLogger(__name__)


class ProtocolEngine:
    """Main ProtocolEngine class.

    A ProtocolEngine instance holds the state of a protocol as it executes,
    and manages calls to a command executor that actually implements the logic
    of the commands themselves.

    Lifetime:
        Instances are single-use. Each instance is associated with a single protocol,
        or a a single chain of robot control such as Labware Position Check.

    Concurrency:
        Instances live in `asyncio` event loops. Each instance must be constructed inside an
        event loop, and then must be interacted with exclusively through that
        event loop's thread--even for regular non-`async` methods, like `.pause()`.
        (This is because there are background async tasks that monitor state changes using
        primitives that aren't thread-safe. See ChangeNotifier.)
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
        door_watcher: Optional[DoorWatcher] = None,
        module_data_provider: Optional[ModuleDataProvider] = None,
    ) -> None:
        """Initialize a ProtocolEngine instance.

        Must be called while an event loop is active.

        This constructor does not inject provider implementations.
        Prefer the `create_protocol_engine()` factory function.
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
            hardware_api=hardware_api,
            state_store=self._state_store,
            action_dispatcher=self._action_dispatcher,
        )
        self._hardware_stopper = hardware_stopper or HardwareStopper(
            hardware_api=hardware_api,
            state_store=state_store,
        )
        self._door_watcher = door_watcher or DoorWatcher(
            state_store=state_store,
            hardware_api=hardware_api,
            action_dispatcher=self._action_dispatcher,
        )
        self._module_data_provider = module_data_provider or ModuleDataProvider()

        self._queue_worker.start()
        self._door_watcher.start()

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

        if self._state_store.commands.get_is_door_blocking():
            self._hardware_api.pause(HardwarePauseType.PAUSE)
        else:
            self._hardware_api.resume(HardwarePauseType.PAUSE)

    def pause(self) -> None:
        """Pause executing commands in the queue."""
        action = self._state_store.commands.validate_action_allowed(
            PauseAction(source=PauseSource.CLIENT)
        )
        self._action_dispatcher.dispatch(action)
        self._hardware_api.pause(HardwarePauseType.PAUSE)

    def add_command(self, request: commands.CommandCreate) -> commands.Command:
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
        request = slot_standardization.standardize_command(
            request, self.state_view.config.robot_type
        )

        command_id = self._model_utils.generate_id()
        request_hash = commands.hash_command_params(
            create=request,
            last_hash=self._state_store.commands.get_latest_command_hash(),
        )

        action = self.state_view.commands.validate_action_allowed(
            QueueCommandAction(
                request=request,
                request_hash=request_hash,
                command_id=command_id,
                created_at=self._model_utils.get_timestamp(),
            )
        )
        self._action_dispatcher.dispatch(action)
        return self._state_store.commands.get(command_id)

    async def wait_for_command(self, command_id: str) -> None:
        """Wait for a command to be completed.

        Will also return if the engine was stopped before it reached the command.
        """
        await self._state_store.wait_for(
            self._state_store.commands.get_command_is_final,
            command_id=command_id,
        )

    async def add_and_execute_command(
        self, request: commands.CommandCreate
    ) -> commands.Command:
        """Add a command to the queue and wait for it to complete.

        The engine must be started by calling `play` before the command will
        execute. You only need to call `play` once.

        Arguments:
            request: The command type and payload data used to construct
                the command in state.

        Returns:
            The command. If the command completed, it will be succeeded or failed.
            If the engine was stopped before it reached the command,
            the command will be queued.
        """
        command = self.add_command(request)
        await self.wait_for_command(command.id)
        return self._state_store.commands.get(command.id)

    def estop(self, maintenance_run: bool) -> None:
        """Signal to the engine that an estop event occurred.

        If there are any queued commands for the engine, they will be marked
        as failed due to the estop event. If there aren't any queued commands
        *and* this is a maintenance run (which has commands queued one-by-one),
        a series of actions will mark the engine as Stopped. In either case the
        queue worker will be deactivated; the primary difference is that the former
        case will expect the protocol runner to `finish()` the engine, whereas the
        maintenance run will be put into a state wherein the engine can be discarded.
        """
        if self._state_store.commands.get_is_stopped():
            return
        current_id = (
            self._state_store.commands.state.running_command_id
            or self._state_store.commands.state.queued_command_ids.head(None)
        )

        if current_id is not None:
            fail_action = FailCommandAction(
                command_id=current_id,
                error_id=self._model_utils.generate_id(),
                failed_at=self._model_utils.get_timestamp(),
                error=EStopActivatedError(message="Estop Activated"),
            )
            self._action_dispatcher.dispatch(fail_action)

            # In the case where the running command was a setup command - check if there
            # are any pending *run* commands and, if so, clear them all
            current_id = self._state_store.commands.state.queued_command_ids.head(None)
            if current_id is not None:
                fail_action = FailCommandAction(
                    command_id=current_id,
                    error_id=self._model_utils.generate_id(),
                    failed_at=self._model_utils.get_timestamp(),
                    error=EStopActivatedError(message="Estop Activated"),
                )
                self._action_dispatcher.dispatch(fail_action)
            self._queue_worker.cancel()
        elif maintenance_run:
            stop_action = self._state_store.commands.validate_action_allowed(
                StopAction(from_estop=True)
            )
            self._action_dispatcher.dispatch(stop_action)
            hardware_stop_action = HardwareStoppedAction(
                completed_at=self._model_utils.get_timestamp(),
                finish_error_details=FinishErrorDetails(
                    error=EStopActivatedError(message="Estop Activated"),
                    error_id=self._model_utils.generate_id(),
                    created_at=self._model_utils.get_timestamp(),
                ),
            )
            self._action_dispatcher.dispatch(hardware_stop_action)
            self._queue_worker.cancel()
        else:
            _log.info("estop pressed before protocol was started, taking no action.")

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
            condition=self._state_store.commands.get_all_commands_final
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

        This method should not raise. If any exceptions happened during execution that were not
        properly caught by the CommandExecutor, or if any exceptions happen during this
        `finish()` call, they should be saved as `.state_view.get_summary().errors`.

        Arguments:
            error: An error that caused the stop, if applicable.
            drop_tips_and_home: Whether to home and drop tips as part of cleanup.
            set_run_status: Whether to calculate a `success` or `failure` run status.
                If `False`, will set status to `stopped`.
        """
        if self._state_store.commands.state.stopped_by_estop:
            drop_tips_and_home = False
            if error is None:
                error = EStopActivatedError(message="Estop was activated during a run")
        if error:
            if isinstance(error, EnumeratedError) and self._code_in_exception_stack(
                error=error, code=ErrorCodes.E_STOP_ACTIVATED
            ):
                drop_tips_and_home = False

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

        # We have a lot of independent things to tear down. If any teardown fails, we want
        # to continue with the rest, to avoid leaking resources or leaving the engine with a broken
        # state. We use an AsyncExitStack to avoid a gigantic try/finally tree. Note that execution
        # order will be backwards because the stack is first-in-last-out.
        exit_stack = AsyncExitStack()
        exit_stack.push_async_callback(self._plugin_starter.stop)  # Last step.
        exit_stack.push_async_callback(
            self._hardware_stopper.do_stop_and_recover,
            drop_tips_and_home=drop_tips_and_home,
        )
        exit_stack.callback(self._door_watcher.stop)
        exit_stack.push_async_callback(self._queue_worker.join)  # First step.

        try:
            # If any teardown steps failed, this will raise something.
            await exit_stack.aclose()
        except Exception as hardware_stopped_exception:
            _log.exception("Exception during post-run finish steps.")
            finish_error_details: Optional[FinishErrorDetails] = FinishErrorDetails(
                error_id=self._model_utils.generate_id(),
                created_at=self._model_utils.get_timestamp(),
                error=hardware_stopped_exception,
            )
        else:
            finish_error_details = None

        self._action_dispatcher.dispatch(
            HardwareStoppedAction(
                completed_at=self._model_utils.get_timestamp(),
                finish_error_details=finish_error_details,
            )
        )

    def add_labware_offset(self, request: LabwareOffsetCreate) -> LabwareOffset:
        """Add a new labware offset and return it.

        The added offset will apply to subsequent `LoadLabwareCommand`s.

        To retrieve offsets later, see `.state_view.labware`.
        """
        request = slot_standardization.standardize_labware_offset(
            request, self.state_view.config.robot_type
        )

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

    def add_liquid(
        self,
        name: str,
        color: Optional[HexColor],
        description: Optional[str],
        id: Optional[str] = None,
    ) -> Liquid:
        """Add a liquid to the state for subsequent liquid loads."""
        if id is None:
            id = self._model_utils.generate_id()

        liquid = Liquid(
            id=id,
            displayName=name,
            description=(description or ""),
            displayColor=color,
        )

        self._action_dispatcher.dispatch(AddLiquidAction(liquid=liquid))
        return liquid

    def reset_tips(self, labware_id: str) -> None:
        """Reset the tip state of a given labware."""
        # TODO(mm, 2023-03-10): Safely raise an error if the given labware isn't a
        # tip rack?
        self._action_dispatcher.dispatch(ResetTipsAction(labware_id=labware_id))

    # TODO(mm, 2022-11-10): This is a method on ProtocolEngine instead of a command
    # as a quick hack to support Python protocols. We should consider making this a
    # command, or adding speed parameters to existing commands.
    # https://opentrons.atlassian.net/browse/RCORE-373
    def set_pipette_movement_speed(
        self, pipette_id: str, speed: Optional[float]
    ) -> None:
        """Set the speed of a pipette's X/Y/Z movements. Does not affect plunger speed.

        None will use the hardware API's default.
        """
        self._action_dispatcher.dispatch(
            SetPipetteMovementSpeedAction(pipette_id=pipette_id, speed=speed)
        )

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
                module_live_data=mod.live_data,
            )
            for module_id, mod in modules_by_id.items()
        ]

        for a in actions:
            self._action_dispatcher.dispatch(a)

    # TODO(tz, 7-12-23): move this to shared data when we dont relay on ErrorOccurrence
    @staticmethod
    def _code_in_exception_stack(
        error: Union[EnumeratedError, ErrorOccurrence], code: ErrorCodes
    ) -> bool:
        if isinstance(error, ErrorOccurrence):
            # ErrorOccurrence is not the same as the enumerated error exceptions. Check the
            # code by a string value.
            if error.errorCode == code.value.code:
                return True
            return any(
                ProtocolEngine._code_in_exception_stack(wrapped, code)
                for wrapped in error.wrappedErrors
            )

        # From here we have an exception, can just check the code + recurse to wrapped errors.
        if error.code == code:
            return True

        if (
            isinstance(error, ProtocolCommandFailedError)
            and error.original_error is not None
        ):
            # For this specific EnumeratedError child, we recurse on the original_error field
            # in favor of the general error.wrapping field.
            return ProtocolEngine._code_in_exception_stack(error.original_error, code)

        if len(error.wrapping) == 0:
            return False
        return any(
            ProtocolEngine._code_in_exception_stack(wrapped_error, code)
            for wrapped_error in error.wrapping
        )
