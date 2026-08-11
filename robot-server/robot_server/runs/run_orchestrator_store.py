"""In-memory storage of ProtocolEngine instances."""

import asyncio
import logging
from typing import Callable, Dict, List, Mapping, Optional, Sequence, Union

from opentrons.config import feature_flags
from opentrons.config import (
    feature_flags as ff,
)
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import (
    AsynchronousModuleErrorNotification,
    EstopState,
    EstopStateNotification,
    HardwareEvent,
    HardwareEventHandler,
    ModuleDisconnectedNotification,
)
from opentrons.protocol_engine import (
    Command,
    CommandCreate,
    CommandErrorSlice,
    CommandPointer,
    CommandSlice,
    DeckType,
    ErrorOccurrence,
    LabwareOffset,
    LabwareOffsetCreate,
    LegacyLabwareOffsetCreate,
    StateSummary,
    error_recovery_policy,
)
from opentrons.protocol_engine import (
    Config as ProtocolEngineConfig,
)
from opentrons.protocol_engine.create_protocol_engine import create_protocol_engine
from opentrons.protocol_engine.errors.exceptions import EStopActivatedError
from opentrons.protocol_engine.resources.camera_provider import (
    CameraProvider,
    CameraSettings,
)
from opentrons.protocol_engine.resources.file_provider import FileProvider
from opentrons.protocol_engine.state.commands import (
    CommandAnnotationsSlice,
    CurrentCommandNotification,
    FinalizedCommandNotification,
)
from opentrons.protocol_engine.state.module_substates import FlexStackerSubState
from opentrons.protocol_engine.state.modules import FlexStackerSubstateNotification
from opentrons.protocol_engine.state.pipettes import (
    NozzleMapNotification,
    TipAttachedNotification,
)
from opentrons.protocol_engine.state.state import EngineEventNotification
from opentrons.protocol_engine.types import (
    CommandAnnotation,
    CSVRuntimeParamPaths,
    DeckConfigurationType,
    EngineStatus,
    PostRunHardwareState,
    PrimitiveRunTimeParamValuesType,
    RunTimeParameter,
)
from opentrons.protocol_runner import (
    RunOrchestrator,
    RunResult,
)
from opentrons.protocol_runner.run_coordinator import ParseMode
from opentrons.protocols.api_support.deck_type import should_load_fixed_trash
from opentrons.types import NozzleMapInterface
from opentrons_shared_data.errors.exceptions import ModuleNotPresent
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.labware.types import LabwareUri
from opentrons_shared_data.robot.types import RobotType, RobotTypeEnum

from .error_recovery_models import ErrorRecoveryRule
from .run_process import DirectedRunProcess
from .run_process_pyro_provider import RunProcessPyroProvider
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.service.legacy.models.settings import CameraCaptureImageSettings
from robot_server.service.pyro_utils.resource_utilities import get_pyro_resource

_log = logging.getLogger(__name__)


class RunConflictError(RuntimeError):
    """An error raised if an active run is already initialized.

    The store will not create a new run orchestrator unless the "current" one is idle.
    """


class NoRunCoordinator(RuntimeError):
    """Raised if you try to get the current run coordinator while there is none."""


async def _do_handle_hardware_event(  # noqa: C901
    run_orchestrator_store: "RunOrchestratorStore", event: HardwareEvent
) -> None:
    if isinstance(event, EstopStateNotification):
        if event.new_state is not EstopState.PHYSICALLY_ENGAGED:
            return
        if run_orchestrator_store.current_run_id is None:
            return
        # todo(mm, 2024-04-17): This estop teardown sequencing belongs in the
        # runner layer.
        run_orchestrator_store.run_coordinator.estop()
        await run_orchestrator_store.run_coordinator.finish(error=EStopActivatedError())
    elif isinstance(event, AsynchronousModuleErrorNotification):
        if run_orchestrator_store.current_run_id is None:
            return
        should_finish = (
            await run_orchestrator_store.run_coordinator.asynchronous_module_error(
                module_model=event.module_model,
                module_serial=event.module_serial,
                error=event.exception,
            )
        )
        if should_finish:
            await run_orchestrator_store.run_coordinator.finish(error=event.exception)
    elif isinstance(event, ModuleDisconnectedNotification):
        if run_orchestrator_store.current_run_id is None:
            return
        should_finish = (
            await run_orchestrator_store.run_coordinator.module_disconnected(
                module_model=event.module_model, module_serial=event.module_serial
            )
        )
        if should_finish:
            await run_orchestrator_store.run_coordinator.finish(
                error=ModuleNotPresent(
                    identifier=event.module_serial or event.module_model
                )
            )


async def handle_hardware_event(
    run_orchestrator_store: "RunOrchestratorStore", event: HardwareEvent
) -> None:
    """Handle an E-stop event from the hardware API.

    When in subprocess mode this executes in the RobotServerPyroResource's event loop.

    Otherwise, this is meant to run in the engine's thread and asyncio event loop.

    This is a public function for unit-testing purposes, but it's an implementation
    detail of the store.

    Implementation is in _do_handle_hardware_event, so this can just catch exceptions.
    """
    try:
        await _do_handle_hardware_event(run_orchestrator_store, event)
    except Exception:
        # This is a background task kicked off by a hardware event,
        # so there's no one to propagate this exception to.
        _log.exception("Exception handling E-stop event.")


def _get_hardware_listener(
    run_orchestrator_store: "RunOrchestratorStore",
) -> HardwareEventHandler:
    """Create a callback for estop events.

    The returned callback is meant to run in the hardware API's thread.
    """
    engine_loop = asyncio.get_running_loop()

    def run_handler_in_engine_thread_from_hardware_thread(
        event: HardwareEvent,
    ) -> None:
        asyncio.run_coroutine_threadsafe(
            handle_hardware_event(run_orchestrator_store, event), engine_loop
        )

    return run_handler_in_engine_thread_from_hardware_thread


class RunOrchestratorStore:
    """Factory and in-memory storage for ProtocolEngine."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        robot_type: RobotType,
        deck_type: DeckType,
        run_process_pyro_provider: RunProcessPyroProvider,
        access_control_status: bool,
    ) -> None:
        """Initialize a run orchestrator storage interface.

        Arguments:
            hardware_api: Hardware control API instance used for ProtocolEngine
                construction.
            robot_type: Passed along to `opentrons.protocol_engine.Config`.
            deck_type: Passed along to `opentrons.protocol_engine.Config`.
            run_process_pyro_provider: If in protocol subprocess mode, provides
                the run process proxy when running a protocol.
            access_control_status: Status of the Auth-Server access control enablement.
        """
        self._hardware_api = hardware_api
        self._robot_type = robot_type
        self._deck_type = deck_type
        self._run_coordinator: Optional[Union[RunOrchestrator, DirectedRunProcess]] = (
            None
        )
        self._default_run_orchestrator: Optional[RunOrchestrator] = None
        self._run_process_pyro_provider = run_process_pyro_provider
        if not feature_flags.hardware_subprocess_enabled():
            hardware_api.register_callback(_get_hardware_listener(self))

        # Locally stored engine state, updated via notifications
        self._nozzle_maps: Optional[Mapping[str, NozzleMapInterface]] = None
        self._tip_attached: Optional[Dict[str, bool]] = None
        self._current_command: Optional[CommandPointer] = None
        self._most_recent_finalized_command: Optional[CommandPointer] = None
        self._flex_stacker_substate: Optional[Mapping[str, FlexStackerSubState]] = None
        self._access_control_mode = access_control_status

    @property
    def run_coordinator(self) -> Union[RunOrchestrator, DirectedRunProcess]:
        """Get the "current" RunOrchestrator or DirectedRunProcess."""
        if self._run_coordinator is None:
            raise NoRunCoordinator()
        return self._run_coordinator

    @property
    def current_run_id(self) -> Optional[str]:
        """Get the run identifier associated with the current run orchestrator."""
        return (
            self.run_coordinator.run_id if self._run_coordinator is not None else None
        )

    def default_run_orchestrator_door_watcher_callback_route_for_proxy(
        self, event: HardwareEvent
    ) -> None:
        """Callback to expose the default run orchestrator door watcher callback to a remote processes."""
        assert self._default_run_orchestrator is not None
        self._default_run_orchestrator._protocol_engine._door_watcher._handle_proxy_hardware_door_event(
            event
        )

    # TODO(mc, 2022-03-21): this resource locking is insufficient;
    # come up with something more sophisticated without race condition holes.
    async def get_default_orchestrator(self) -> RunOrchestrator:
        """Get a "default" RunOrchestrator to use outside the context of a run.

        Raises:
            RunConflictError: if a run-specific run orchestrator is active.
        """
        if (
            self._run_coordinator is not None
            and self.run_coordinator.run_has_started()
            and not self.run_coordinator.run_has_stopped()
        ):
            raise RunConflictError("A run is currently active")

        proxy_door_callback = None
        if ff.hardware_subprocess_enabled():
            pyro_resource = get_pyro_resource()
            proxy_door_callback = (
                pyro_resource.get_default_run_orchestrator_door_watcher_callback()
            )

        default_orchestrator = self._default_run_orchestrator
        if default_orchestrator is None:
            engine = await create_protocol_engine(
                hardware_api=self._hardware_api,
                config=ProtocolEngineConfig(
                    robot_type=self._robot_type,
                    deck_type=self._deck_type,
                    block_on_door_open=False,
                ),
                # Error recovery mode would not make sense outside the context of a run--
                # for example, there would be no equivalent to the `POST /runs/{id}/actions`
                # endpoint to resume normal operation.
                error_recovery_policy=error_recovery_policy.never_recover,
                updates_callback=self.update_engine_status_callback,
                proxy_of_callback_for_handling_door_events=proxy_door_callback,
            )
            self._default_run_orchestrator = RunOrchestrator.build_orchestrator(
                protocol_engine=engine, hardware_api=self._hardware_api
            )

            # Initialize values for the default run orchestrator
            self._clear_stored_engine_state()
            self._nozzle_maps = self._default_run_orchestrator.get_nozzle_maps()
            self._tip_attached = self._default_run_orchestrator.get_tip_attached()
            self._current_command = self._default_run_orchestrator.get_current_command()
            self._most_recent_finalized_command = (
                self._default_run_orchestrator.get_most_recently_finalized_command()
            )
            self._flex_stacker_substate = (
                self._default_run_orchestrator.get_flex_stacker_substate()
            )
            return self._default_run_orchestrator
        return default_orchestrator

    async def create(
        self,
        run_id: str,
        labware_offsets: Sequence[LabwareOffsetCreate | LegacyLabwareOffsetCreate],
        initial_error_recovery_policy: error_recovery_policy.ErrorRecoveryPolicy,
        error_recovery_rules: List[ErrorRecoveryRule],
        error_recovery_is_enabled: bool,
        deck_configuration: DeckConfigurationType,
        file_provider: FileProvider,
        camera_provider: CameraProvider,
        notify_publishers: Callable[[], None],
        protocol: Optional[ProtocolResource],
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType] = None,
        # TODO(jbl 2024-08-02) combine this with run_time_param_values now that theres no ambiguity with Paths
        run_time_param_paths: Optional[CSVRuntimeParamPaths] = None,
    ) -> StateSummary:
        """Create and store a ProtocolRunner and ProtocolEngine for a given Run.

        Args:
            run_id: The run resource the run orchestrator is assigned to.
            labware_offsets: Labware offsets to create the run with.
            initial_error_recovery_policy: How to recover from errors.
            error_recovery_rules: The list of rules the error recovery policy is built for.
                Used instead of initial_error_recovery_policy for Pyro proxy.
            error_recovery_is_enabled: If error recovery is enabled or not.
                Used instead of initial_error_recovery_policy for Pyro proxy.
            deck_configuration: A mapping of fixtures to cutout fixtures the deck will be loaded with.
            file_provider: Wrapper to let the engine read/write data files.
            camera_provider: Wrapper to let the engine use the camera.
            notify_publishers: Utilized by the engine to notify publishers of state changes.
            protocol: The protocol to load the runner with, if any.
            run_time_param_values: Any runtime parameter values to set.
            run_time_param_paths: Any runtime filepath to set.

        Returns:
            The initial equipment and status summary of the engine.

        Raises:
            RunConflictError: The current run orchestrator is not idle, so
            a new one may not be created.
        """
        if feature_flags.protocol_subprocess_enabled():
            return await self.create_pyro(
                run_id=run_id,
                labware_offsets=labware_offsets,
                protocol=protocol,
                error_recovery_rules=error_recovery_rules,
                error_recovery_is_enabled=error_recovery_is_enabled,
                run_time_param_values=run_time_param_values,
                run_time_param_paths=run_time_param_paths,
            )

        if protocol is not None:
            load_fixed_trash = should_load_fixed_trash(protocol.source.config)
        else:
            load_fixed_trash = False

        if self._run_coordinator is not None:
            raise RunConflictError("Another run is currently active.")

        engine = await create_protocol_engine(
            hardware_api=self._hardware_api,
            config=ProtocolEngineConfig(
                robot_type=self._robot_type,
                deck_type=self._deck_type,
                block_on_door_open=feature_flags.enable_door_safety_switch(
                    RobotTypeEnum.robot_literal_to_enum(self._robot_type)
                ),
            ),
            error_recovery_policy=initial_error_recovery_policy,
            load_fixed_trash=load_fixed_trash,
            deck_configuration=deck_configuration,
            file_provider=file_provider,
            camera_provider=camera_provider,
            notify_publishers=notify_publishers,
            updates_callback=self.update_engine_status_callback,
        )

        orchestrator = RunOrchestrator.build_orchestrator(
            run_id=run_id,
            protocol_engine=engine,
            hardware_api=self._hardware_api,
            camera_provider=camera_provider,
            protocol_config=protocol.source.config if protocol else None,
        )

        # FIXME(mm, 2022-12-21): These `await runner.load()`s introduce a
        # concurrency hazard. If two requests simultaneously call this method,
        # they will both "succeed" (with undefined results) instead of one
        # raising RunConflictError.
        if protocol:
            await orchestrator.load(
                protocol.source,
                run_time_param_values=run_time_param_values,
                run_time_param_paths=run_time_param_paths,
                parse_mode=ParseMode.ALLOW_LEGACY_METADATA_AND_REQUIREMENTS,
            )
        else:
            orchestrator.prepare()

        for offset in labware_offsets:
            orchestrator.add_labware_offset(offset)

        summary = orchestrator.get_state_summary()
        self._clear_stored_engine_state()
        self._run_coordinator = orchestrator

        self._initialize_stored_engine_state()

        return summary

    async def clear(self) -> RunResult:
        """Remove the current run orchestrator.

        Raises:
            RunConflictError: The current run orchestrator is not idle, so it cannot
                be cleared.
        """
        if self.run_coordinator.get_is_okay_to_clear():
            await self.run_coordinator.finish(
                drop_tips_after_run=False,
                set_run_status=False,
                post_run_hardware_state=PostRunHardwareState.STAY_ENGAGED_IN_PLACE,
            )
        else:
            raise RunConflictError("Current run is not idle or stopped.")

        run_data = self.run_coordinator.get_state_summary()
        commands = self.run_coordinator.get_all_commands()
        run_time_parameters = self.run_coordinator.get_run_time_parameters()
        command_annotations = self.run_coordinator.get_all_command_annotations()
        preconditions = self.run_coordinator.get_preconditions()

        if feature_flags.protocol_subprocess_enabled():
            self._run_process_pyro_provider.set_active_process_as_used()

        if self._run_coordinator is not None:
            self._run_coordinator.clear_command_history()
            self._run_coordinator = None

        return RunResult(
            state_summary=run_data,
            commands=commands,
            parameters=run_time_parameters,
            command_annotations=command_annotations,
            command_preconditions=preconditions,
        )

    async def create_pyro(
        self,
        run_id: str,
        labware_offsets: Sequence[LabwareOffsetCreate | LegacyLabwareOffsetCreate],
        protocol: Optional[ProtocolResource],
        error_recovery_rules: List[ErrorRecoveryRule],
        error_recovery_is_enabled: bool,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType] = None,
        run_time_param_paths: Optional[CSVRuntimeParamPaths] = None,
    ) -> StateSummary:
        """Eventually this will replace create and make a run process that does the whole run, right now it's a stub."""
        if self._run_coordinator is not None:
            raise RunConflictError("Another run is currently active.")

        run_process = await self._run_process_pyro_provider.wait_for_run_proxy()
        await run_process.create(
            run_id=run_id,
            labware_offsets=labware_offsets,
            protocol=protocol,
            error_recovery_rules=error_recovery_rules,
            error_recovery_is_enabled=error_recovery_is_enabled,
            run_time_param_values=run_time_param_values,
            run_time_param_paths=run_time_param_paths,
            proxy_of_callback_for_handling_door_events=run_process.register_hardware_door_event(),
        )

        summary = run_process.get_state_summary()
        self._clear_stored_engine_state()
        self._run_coordinator = run_process
        self._initialize_stored_engine_state()
        return summary

    # todo(mm, 2024-11-15): Are all of these pass-through methods helpful?
    # Can we delete them and make callers just call .run_orchestrator.play(), etc.?

    def play(self, deck_configuration: Optional[DeckConfigurationType] = None) -> None:
        """Start or resume the run."""
        self.run_coordinator.play(deck_configuration=deck_configuration)

    async def run(self, deck_configuration: DeckConfigurationType) -> RunResult:
        """Start the run."""
        return await self.run_coordinator.run(deck_configuration=deck_configuration)

    def pause(self) -> None:
        """Pause the run."""
        self.run_coordinator.pause()

    async def stop(self) -> None:
        """Stop the run."""
        await self.run_coordinator.stop()

    def resume_from_recovery(self, reconcile_false_positive: bool) -> None:
        """Resume the run from recovery mode."""
        self.run_coordinator.resume_from_recovery(reconcile_false_positive)

    async def finish(self, error: Optional[Exception]) -> None:
        """Finish the run."""
        await self.run_coordinator.finish(error=error)

    def get_state_summary(self) -> StateSummary:
        """Get protocol run data."""
        return self.run_coordinator.get_state_summary()

    def get_loaded_labware_definitions(self) -> List[LabwareDefinition]:
        """Get loaded labware definitions."""
        return self.run_coordinator.get_loaded_labware_definitions()

    def get_nozzle_maps(self) -> Mapping[str, NozzleMapInterface]:
        """Get the current nozzle map keyed by pipette id."""
        assert self._nozzle_maps is not None
        return self._nozzle_maps

    def get_tip_attached(self) -> Dict[str, bool]:
        """Get current tip state keyed by pipette id."""
        assert self._tip_attached is not None
        return self._tip_attached

    def get_run_time_parameters(self) -> List[RunTimeParameter]:
        """Parameter definitions defined by protocol, if any. Will always be empty before execution."""
        return self.run_coordinator.get_run_time_parameters()

    def get_flex_stacker_substate(self) -> Mapping[str, FlexStackerSubState]:
        """Get the current (if any) Flex Stacker Substates keyed by modile id."""
        assert self._flex_stacker_substate is not None
        return self._flex_stacker_substate

    def get_current_command(self) -> Optional[CommandPointer]:
        """Get the current running command, if any."""
        return self._current_command

    def get_most_recently_finalized_command(self) -> Optional[CommandPointer]:
        """Get the most recently finalized command, if any."""
        return self._most_recent_finalized_command

    def get_command_slice(
        self, cursor: Optional[int], length: int, include_fixit_commands: bool
    ) -> CommandSlice:
        """Get a slice of run commands.

        Args:
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.
            include_fixit_commands: Include fixit commands.
        """
        return self.run_coordinator.get_command_slice(
            cursor=cursor, length=length, include_fixit_commands=include_fixit_commands
        )

    def get_command_error_slice(
        self,
        cursor: int,
        length: int,
    ) -> CommandErrorSlice:
        """Get a slice of run commands error.

        Args:
            cursor: Requested index of first command error in the returned slice.
            length: Length of slice to return.
        """
        return self.run_coordinator.get_command_error_slice(
            cursor=cursor, length=length
        )

    def get_command_errors(self) -> list[ErrorOccurrence]:
        """Get all command errors."""
        return self.run_coordinator.get_command_errors()

    def get_command_recovery_target(self) -> Optional[CommandPointer]:
        """Get the current error recovery target."""
        return self.run_coordinator.get_command_recovery_target()

    def get_command(self, command_id: str) -> Command:
        """Get a run's command by ID."""
        return self.run_coordinator.get_command(command_id=command_id)

    def get_total_command_annotations_count(self) -> int:
        """Get the total number of command annotations in the run."""
        return self.run_coordinator.get_total_command_annotations_count()

    def get_command_annotations_slice(
        self,
        cursor: int,
        length: int,
    ) -> CommandAnnotationsSlice:
        """Get a slice of run commands."""
        return self.run_coordinator.get_command_annotations_slice(
            cursor=cursor, length=length
        )

    def get_command_annotation(self, annotation_id: str) -> CommandAnnotation:
        """Get the specified command annotation."""
        return self.run_coordinator.get_command_annotation(annotation_id)

    def get_status(self) -> EngineStatus:
        """Get the current execution status of the run."""
        return self.run_coordinator.get_run_status()

    def get_is_run_terminal(self) -> bool:
        """Get whether run is in a terminal state."""
        return self.run_coordinator.get_is_run_terminal()

    def get_camera_capture_image_settings(
        self, camera_id: str
    ) -> CameraCaptureImageSettings:
        """Get camera capture image settings to state."""
        settings = self.run_coordinator.get_camera_capture_image_settings()

        # todo(chb, 2026-01-12): Currently we only store one set of camera settings in the camera store at a time.
        # Storing multiple will mean updating get_camera_capture_image_settings() to return specific cameras.
        if camera_id != settings["camera_id"]:
            _log.info(
                f"Stored camera ID does not match provided ID, returning stored data for camera ID {settings['camera_id']}."
            )
        return CameraCaptureImageSettings(
            cameraId=settings["camera_id"],
            resolution=settings["resolution"],
            zoom=settings["zoom"],
            pan=settings["pan"],
            contrast=settings["contrast"],
            brightness=settings["brightness"],
            saturation=settings["saturation"],
        )

    def run_was_started(self) -> bool:
        """Get whether the run has started."""
        return self.run_coordinator.run_has_started()

    def add_labware_offset(
        self, request: LabwareOffsetCreate | LegacyLabwareOffsetCreate
    ) -> LabwareOffset:
        """Add a new labware offset to state."""
        return self.run_coordinator.add_labware_offset(request)

    def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        """Add a new labware definition to state."""
        return self.run_coordinator.add_labware_definition(definition)

    def set_error_recovery_policy(
        self,
        policy: error_recovery_policy.ErrorRecoveryPolicy,
        error_recovery_rules: List[ErrorRecoveryRule],
        error_recovery_is_enabled: bool,
    ) -> None:
        """Create run policy rules for error recovery."""
        if isinstance(self.run_coordinator, RunOrchestrator):
            self.run_coordinator.set_error_recovery_policy(policy)
        else:
            self.run_coordinator.set_error_recovery_policy(
                error_recovery_rules, error_recovery_is_enabled
            )

    def set_access_control_status(self, access_control_mode: bool) -> None:
        """Set the access control policy for the Run Orchestrator Store."""
        self._access_control_mode = access_control_mode

    def add_camera_enablement_settings(
        self, enablement_settings: CameraSettings
    ) -> CameraSettings:
        """Add new camera enablement settings to state."""
        return self.run_coordinator.add_camera_enablement_settings(enablement_settings)

    def add_camera_capture_image_settings(
        self, capture_image_settings: CameraCaptureImageSettings
    ) -> None:
        """Add new camera capture image settings to state."""
        self.run_coordinator.add_camera_capture_image_settings(
            camera_id=capture_image_settings.cameraId,
            resolution=capture_image_settings.resolution,
            zoom=capture_image_settings.zoom,
            pan=capture_image_settings.pan,
            contrast=capture_image_settings.contrast,
            brightness=capture_image_settings.brightness,
            saturation=capture_image_settings.saturation,
        )

    async def add_command_and_wait_for_interval(
        self,
        request: CommandCreate,
        wait_until_complete: bool = False,
        timeout: Optional[int] = None,
        failed_command_id: Optional[str] = None,
    ) -> Command:
        """Add a new command to execute and wait for it to complete if needed."""
        return await self.run_coordinator.add_command_and_wait_for_interval(
            command=request,
            failed_command_id=failed_command_id,
            wait_until_complete=wait_until_complete,
            timeout=timeout,
        )

    async def handle_proxy_hardware_event(self, event: HardwareEvent) -> None:
        """Handle an E-stop event from the hardware API.

        When in subprocess mode this will run on the RobotServerPyroResource's event loop.

        This will not be called otherwise, as it is only for proxy callback events.

        Implementation is in _do_handle_hardware_event, so this can just catch exceptions.
        """
        try:
            await _do_handle_hardware_event(self, event)
        except Exception:
            # This is a background task kicked off by a hardware event,
            # so there's no one to propagate this exception to.
            _log.exception("Exception handling E-stop event.")

    def update_engine_status_callback(
        self, events: list[EngineEventNotification]
    ) -> None:
        """Handle protocol engine status updates for the run orchestrator store."""
        for event in events:
            if isinstance(event, NozzleMapNotification):
                self._nozzle_maps = event.nozzle_maps

            if isinstance(event, TipAttachedNotification):
                self._tip_attached = event.tip_attached_dict

            if isinstance(event, CurrentCommandNotification):
                self._current_command = event.running_command_pointer

            if isinstance(event, FinalizedCommandNotification):
                self._most_recent_finalized_command = event.finalized_command_pointer
                self._current_command = (
                    event.running_command_pointer
                    if event.running_command_pointer is not None
                    else event.finalized_command_pointer
                )

            if isinstance(event, FlexStackerSubstateNotification):
                self._flex_stacker_substate = event.stacker_substate_map

    def _initialize_stored_engine_state(self) -> None:
        """Initialize the orchestrator store local engine state."""
        self._nozzle_maps = self.run_coordinator.get_nozzle_maps()
        self._tip_attached = self.run_coordinator.get_tip_attached()
        self._current_command = self.run_coordinator.get_current_command()
        self._most_recent_finalized_command = (
            self.run_coordinator.get_most_recently_finalized_command()
        )
        self._flex_stacker_substate = self.run_coordinator.get_flex_stacker_substate()

    def _clear_stored_engine_state(self) -> None:
        """Clear the stored engine state, called when creating a new run orchestrator so no state persists between runs."""
        self._nozzle_maps = None
        self._tip_attached = None
        self._current_command = None
        self._most_recent_finalized_command = None
        self._flex_stacker_substate = None
