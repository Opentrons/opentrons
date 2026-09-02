"""A wrapper for a protocol run that lives as a proxy in its own process."""

import asyncio
import logging
from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple, get_args

from opentrons import identify_hardware_process
from opentrons.config import feature_flags
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import (
    AbstractModule as HardwareModuleAPI,
)
from opentrons.hardware_control.modules import (
    ModuleModel as HardwareModuleModel,
)
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.hardware_control.types import HardwareEvent, HardwareEventHandler
from opentrons.protocol_engine import (
    Command,
    CommandCreate,
    CommandErrorSlice,
    CommandPointer,
    CommandSlice,
    DeckType,
    ErrorOccurrence,
    StateSummary,
)
from opentrons.protocol_engine import (
    Config as ProtocolEngineConfig,
)
from opentrons.protocol_engine.create_protocol_engine import create_protocol_engine
from opentrons.protocol_engine.resources.camera_provider import CameraSettings
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
from opentrons.protocol_engine.types import (
    CommandAnnotation,
    CommandPreconditions,
    CSVRuntimeParamPaths,
    DeckConfigurationType,
    EngineStatus,
    LabwareOffset,
    LabwareOffsetCreate,
    LegacyLabwareOffsetCreate,
    PrimitiveRunTimeParamValuesType,
    RunTimeParameter,
)
from opentrons.protocol_engine.types.execution import PostRunHardwareState
from opentrons.protocol_reader.protocol_source import ProtocolSource
from opentrons.protocol_runner.create_simulating_orchestrator import (
    create_simulating_orchestrator,
)
from opentrons.protocol_runner.protocol_runner import RunResult
from opentrons.protocol_runner.run_coordinator import AbstractRunCoordinator, ParseMode
from opentrons.protocol_runner.run_orchestrator import RunOrchestrator
from opentrons.protocols.api_support.deck_type import should_load_fixed_trash
from opentrons.util.pyro.pyro_serialization import (
    OpentronsPyroSerializer,
    serpent_enum_registration,
)
from opentrons.util.pyro.pyro_synchronous_adapter import (
    convert_result_to_proxy,
    convert_result_to_wrapped_dict,
    pyro_behavior,
)
from opentrons_shared_data.errors import EnumeratedError
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
)
from opentrons_shared_data.labware.types import LabwareUri
from opentrons_shared_data.robot.types import RobotType, RobotTypeEnum

from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.runs.error_recovery_mapping import (
    create_error_recovery_policy_from_rules,
)
from robot_server.runs.error_recovery_models import ErrorRecoveryRule
from robot_server.service.pyro_utils.pyro_resource import RobotServerPyroResource
from robot_server.service.pyro_utils.resource_utilities import get_pyro_resource
from robot_server.service.pyro_utils.serpent_type_registry import (
    register_robot_server_types,
)

log = logging.getLogger(__name__)


# register_process_types runs for both the robot server process and the run subprocess
def register_process_types() -> None:
    """Register classes and types sent and received by the protocol subprocess."""
    with serpent_enum_registration():
        for enum_type in [
            DeckType,
            EngineStatus,
            ParseMode,
            PostRunHardwareState,
        ]:
            OpentronsPyroSerializer.register_enum(enum_type)
        for hardware_module_model in get_args(HardwareModuleModel):
            OpentronsPyroSerializer.register_enum(hardware_module_model)

    for pydantic_model in [
        CameraSettings,
        CommandAnnotation,
        CommandPreconditions,
        CommandSlice,
        CommandErrorSlice,
        CommandPointer,
        CommandAnnotationsSlice,
        ErrorRecoveryRule,
        LabwareDefinition2,
        LabwareDefinition3,
        LabwareOffset,
        LabwareOffsetCreate,
        LegacyLabwareOffsetCreate,
        NozzleMap,
        ProtocolSource,
        ProtocolResource,
        RunResult,
        StateSummary,
        FlexStackerSubState,
        NozzleMapNotification,
        TipAttachedNotification,
        FlexStackerSubstateNotification,
        CurrentCommandNotification,
        FinalizedCommandNotification,
    ]:
        OpentronsPyroSerializer.register_pydantic_model(pydantic_model)  # type: ignore[arg-type]
    for rtp in get_args(RunTimeParameter):
        OpentronsPyroSerializer.register_pydantic_model(rtp)
    # We do two levels of get_args because it's an annotated type union
    for command in get_args(get_args(Command)[0]):
        OpentronsPyroSerializer.register_pydantic_model(command)
    for command_create in get_args(get_args(CommandCreate)[0]):
        OpentronsPyroSerializer.register_pydantic_model(command_create)


def register_all_needed_types() -> None:
    """Register both hardware types and robot server types to serialize."""
    register_process_types()
    register_hardware_types()
    register_robot_server_types()


# DirectedRunProcess is created and run as a pyro daemon in its own subprocess
class DirectedRunProcess(AbstractRunCoordinator):
    """A wrapper of the engine and run orchestrator for a pyro process."""

    def __init__(
        self,
        robot_type: RobotType,
        deck_type: DeckType,
    ) -> None:
        self._robot_type = robot_type
        self._deck_type = deck_type
        self._run_id: Optional[str] = None
        self._run_orchestrator: Optional[RunOrchestrator] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._robot_server_resource: Optional[RobotServerPyroResource] = None
        self._hardware_api: Optional[HardwareControlAPI] = None
        log.info(f"Directed Run Process initialized with Run ID: {self._run_id}")

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    async def register_hardware_door_event(self) -> HardwareEventHandler:
        """Create a callback for the door watcher on the hardware controller via the protocol engine.

        The returned callback is meant to run in the hardware API's thread.
        """

        def door_event_handler(
            event: HardwareEvent,
        ) -> None:
            if self._run_orchestrator is not None:
                self._run_orchestrator._protocol_engine._door_watcher._handle_proxy_hardware_door_event(
                    event
                )

        return door_event_handler

    async def _connect_to_hardware_api(self) -> None:
        """Initiate the run resource's connection to the hardware API."""
        self._hardware_api = await identify_hardware_process()

    async def _connect_to_robot_server_resource(self) -> None:
        """Initiate the run resource's connection to the Robot-Server resource."""
        self._robot_server_resource = await get_pyro_resource()

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        """Event loop for use in allowing async methods via Pyro."""
        assert self._loop is not None
        return self._loop

    @loop.setter
    def loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Set an abstract event loop."""
        self._loop = loop

    async def create(
        self,
        run_id: str,
        labware_offsets: Sequence[LabwareOffsetCreate | LegacyLabwareOffsetCreate],
        error_recovery_rules: List[ErrorRecoveryRule],
        error_recovery_is_enabled: bool,
        protocol: Optional[ProtocolResource],
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType] = None,
        run_time_param_paths: Optional[CSVRuntimeParamPaths] = None,
        proxy_of_callback_for_handling_door_events: Optional[
            HardwareEventHandler
        ] = None,
    ) -> None:
        """Create a run orchestrator and protocol engine for a given run."""
        if self._hardware_api is None:
            await self._connect_to_hardware_api()
            assert self._hardware_api is not None
        if self._robot_server_resource is None:
            await self._connect_to_robot_server_resource()
            assert self._robot_server_resource is not None

        self._run_id = run_id

        if protocol is not None:
            load_fixed_trash = should_load_fixed_trash(protocol.source.config)
        else:
            load_fixed_trash = False

        error_recovery_policy = create_error_recovery_policy_from_rules(
            error_recovery_rules, error_recovery_is_enabled
        )

        engine = await create_protocol_engine(
            hardware_api=self._hardware_api,
            config=ProtocolEngineConfig(
                robot_type=self._robot_type,
                deck_type=self._deck_type,
                block_on_door_open=feature_flags.enable_door_safety_switch(
                    RobotTypeEnum.robot_literal_to_enum(self._robot_type)
                ),
            ),
            error_recovery_policy=error_recovery_policy,
            load_fixed_trash=load_fixed_trash,
            deck_configuration=await self._robot_server_resource.get_deck_configuration(),
            file_provider=self._robot_server_resource.get_file_provider(),
            camera_provider=self._robot_server_resource.get_camera_provider(),
            notify_publishers=self._robot_server_resource.get_notify_publishers(),
            updates_callback=self._robot_server_resource.get_engine_updates_callback,
            proxy_of_callback_for_handling_door_events=proxy_of_callback_for_handling_door_events,
        )

        orchestrator = RunOrchestrator.build_orchestrator(
            run_id=run_id,
            protocol_engine=engine,
            hardware_api=self._hardware_api,
            camera_provider=self._robot_server_resource.get_camera_provider(),
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
            await orchestrator.add_labware_offset(offset)

        self._run_orchestrator = orchestrator

    async def create_simulating(self, protocol_resource: ProtocolResource) -> None:
        """Create a simulating runner for use in analysis."""
        self._run_orchestrator = await create_simulating_orchestrator(
            robot_type=protocol_resource.source.robot_type,
            protocol_config=protocol_resource.source.config,
        )

    @property
    def run_id(self) -> Optional[str]:
        """Get the "current" persisted run_id."""
        return self._run_id

    @property
    def _guaranteed_run_orchestrator(self) -> RunOrchestrator:
        assert self._run_orchestrator is not None
        return self._run_orchestrator

    async def play(
        self, deck_configuration: Optional[DeckConfigurationType] = None
    ) -> None:
        """Start or resume the run."""
        await self._guaranteed_run_orchestrator.play(deck_configuration)

    async def run(
        self,
        deck_configuration: DeckConfigurationType,
        protocol_source: Optional[ProtocolSource] = None,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType] = None,
    ) -> RunResult:
        """Start the run."""
        return await self._guaranteed_run_orchestrator.run(
            deck_configuration, protocol_source, run_time_param_values
        )

    async def pause(self) -> None:
        """Pause the run."""
        await self._guaranteed_run_orchestrator.pause()

    async def stop(self) -> None:
        """Stop the run."""
        await self._guaranteed_run_orchestrator.stop()

    async def resume_from_recovery(self, reconcile_false_positive: bool) -> None:
        """Resume the run from recovery."""
        await self._guaranteed_run_orchestrator.resume_from_recovery(
            reconcile_false_positive
        )

    async def finish(
        self,
        # TODO we'll need to register exceptions
        error: Optional[Exception] = None,
        drop_tips_after_run: bool = True,
        set_run_status: bool = True,
        post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
    ) -> None:
        """Finish the run."""
        await self._guaranteed_run_orchestrator.finish(
            error, drop_tips_after_run, set_run_status, post_run_hardware_state
        )

    async def get_state_summary(self) -> StateSummary:
        """Get protocol run data."""
        return await self._guaranteed_run_orchestrator.get_state_summary()

    async def get_preconditions(self) -> CommandPreconditions:
        """Get the preconditions of a protocol run."""
        return await self._guaranteed_run_orchestrator.get_preconditions()

    async def get_loaded_labware_definitions(self) -> List[LabwareDefinition]:
        """Get loaded labware definitions."""
        return await self._guaranteed_run_orchestrator.get_loaded_labware_definitions()

    async def get_run_time_parameters(self) -> List[RunTimeParameter]:
        """Get the list of run time parameters defined in the protocol, if any.

        This returns a list of all run time parameters with their validated definitions
        and client-requested values. Will always be empty before loading the runner.

        If there was an error during RTP definition validation, then this list will
        contain the parameter definitions that were validated before the error occurred.
        These parameters' values will be default values.

        If all definitions validated successfully but an error occurred while
        setting the RTP values with those sent by the client, then only the parameters
        whose values were successfully set will have the client-requested values while
        the others will contain the default values.
        """
        return await self._guaranteed_run_orchestrator.get_run_time_parameters()

    async def get_all_command_annotations(self) -> List[CommandAnnotation]:
        """Get the list of command annotations defined in the protocol, if any."""
        return await self._guaranteed_run_orchestrator.get_all_command_annotations()

    async def get_total_command_annotations_count(self) -> int:
        """Get the total number of command annotations defined in the protocol, if any."""
        return await self._guaranteed_run_orchestrator.get_total_command_annotations_count()

    async def get_command_annotation(self, annotation_id: str) -> CommandAnnotation:
        """Get the command annotation by ID."""
        return await self._guaranteed_run_orchestrator.get_command_annotation(
            annotation_id
        )

    async def get_current_command(self) -> Optional[CommandPointer]:
        """Get the "current" command, if any."""
        return await self._guaranteed_run_orchestrator.get_current_command()

    async def get_most_recently_finalized_command(self) -> Optional[CommandPointer]:
        """Get the most recently finalized command, if any."""
        return await self._guaranteed_run_orchestrator.get_most_recently_finalized_command()

    async def get_command_slice(
        self, cursor: Optional[int], length: int, include_fixit_commands: bool
    ) -> CommandSlice:
        """Get a slice of run commands.

        Args:
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.
            include_fixit_commands: Get all command intents.
        """
        return await self._guaranteed_run_orchestrator.get_command_slice(
            cursor, length, include_fixit_commands
        )

    async def get_length(self) -> int:
        return await self._guaranteed_run_orchestrator.get_length()

    async def delete_command_slice_end(self, length: int) -> None:
        await self._guaranteed_run_orchestrator.delete_command_slice_end(length)

    async def get_command_annotations_slice(
        self, cursor: int, length: int
    ) -> CommandAnnotationsSlice:
        """Get a slice of command annotations in the run."""
        return await self._guaranteed_run_orchestrator.get_command_annotations_slice(
            cursor, length
        )

    async def get_command_error_slice(
        self,
        cursor: int,
        length: int,
    ) -> CommandErrorSlice:
        """Get a slice of run commands errors.

        Args:
            cursor: Requested index of first error in the returned slice.
                If the cursor is omitted, a cursor will be selected automatically
                based on the last error occurrence.
            length: Length of slice to return.
        """
        return await self._guaranteed_run_orchestrator.get_command_error_slice(
            cursor, length
        )

    async def get_command_recovery_target(self) -> Optional[CommandPointer]:
        """Get the current error recovery target."""
        return await self._guaranteed_run_orchestrator.get_command_recovery_target()

    async def get_command(self, command_id: str) -> Command:
        """Get a run's command by ID."""
        return await self._guaranteed_run_orchestrator.get_command(command_id)

    async def get_all_commands(self) -> List[Command]:
        """Get all run commands."""
        return await self._guaranteed_run_orchestrator.get_all_commands()

    async def get_command_errors(self) -> List[ErrorOccurrence]:
        """Get all run command errors."""
        return await self._guaranteed_run_orchestrator.get_command_errors()

    async def get_run_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        return await self._guaranteed_run_orchestrator.get_run_status()

    async def get_is_run_terminal(self) -> bool:
        """Get whether engine is in a terminal state."""
        return await self._guaranteed_run_orchestrator.get_is_run_terminal()

    async def get_camera_capture_image_settings(
        self,
    ) -> Dict[str, Any]:
        """Get camera capture image settings."""
        return (
            await self._guaranteed_run_orchestrator.get_camera_capture_image_settings()
        )

    async def run_has_started(self) -> bool:
        """Get whether the run has started."""
        return await self._guaranteed_run_orchestrator.run_has_started()

    async def run_has_stopped(self) -> bool:
        """Get whether the run has stopped."""
        return await self._guaranteed_run_orchestrator.run_has_stopped()

    async def add_labware_offset(
        self, request: LabwareOffsetCreate | LegacyLabwareOffsetCreate
    ) -> LabwareOffset:
        """Add a new labware offset to state."""
        return await self._guaranteed_run_orchestrator.add_labware_offset(request)

    async def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        """Add a new labware definition to state."""
        return await self._guaranteed_run_orchestrator.add_labware_definition(
            definition
        )

    async def add_camera_enablement_settings(
        self,
        enablement_settings: CameraSettings,
    ) -> CameraSettings:
        """Add new camera enablement settings."""
        return await self._guaranteed_run_orchestrator.add_camera_enablement_settings(
            enablement_settings
        )

    async def add_camera_capture_image_settings(
        self,
        camera_id: Optional[str] = None,
        resolution: Optional[Tuple[int, int]] = None,
        zoom: Optional[float] = None,
        pan: Optional[Tuple[int, int]] = None,
        contrast: Optional[float] = None,
        brightness: Optional[float] = None,
        saturation: Optional[float] = None,
    ) -> None:
        """Add new camera capture image settings."""
        await self._guaranteed_run_orchestrator.add_camera_capture_image_settings(
            camera_id, resolution, zoom, pan, contrast, brightness, saturation
        )

    async def add_command_and_wait_for_interval(
        self,
        command: CommandCreate,
        wait_until_complete: bool = False,
        timeout: Optional[int] = None,
        failed_command_id: Optional[str] = None,
    ) -> Command:
        """Add a new command to execute and wait for it to complete if needed."""
        return (
            await self._guaranteed_run_orchestrator.add_command_and_wait_for_interval(
                command, wait_until_complete, timeout, failed_command_id
            )
        )

    async def estop(self) -> None:
        """Handle an E-stop event from the hardware API."""
        await self._guaranteed_run_orchestrator.estop()

    async def asynchronous_module_error(
        self,
        module_model: HardwareModuleModel,
        module_serial: str | None,
        error: EnumeratedError | None = None,
    ) -> bool:
        """Handle an asynchronous module error reported by hardware.

        If this function returns true, the caller should call finish() immediately; if it returns
        False, the caller should not call finish() until it otherwise would.
        """
        return await self._guaranteed_run_orchestrator.asynchronous_module_error(
            module_model, module_serial, error
        )

    async def module_disconnected(
        self, module_model: HardwareModuleModel, module_serial: str | None
    ) -> bool:
        """Handle an unexpected module disconnection.

        If this function returns true, the caller should call finish() immediately; if it returns
        False, the caller should not call finish() until it otherwise would.
        """
        return await self._guaranteed_run_orchestrator.module_disconnected(
            module_model, module_serial
        )

    # TODO this should work, more or less, since these HardwareModuleAPIs should be proxys
    async def use_attached_modules(
        self, modules_by_id: Dict[str, HardwareModuleAPI]
    ) -> None:
        """Load attached modules directly into state, without locations."""
        await self._guaranteed_run_orchestrator.use_attached_modules(modules_by_id)

    async def load(
        self,
        protocol_source: ProtocolSource,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType],
        # TODO maybe serialized CSV runtime params
        run_time_param_paths: Optional[CSVRuntimeParamPaths],
        parse_mode: ParseMode,
    ) -> None:
        """Load a json/python protocol."""
        await self._guaranteed_run_orchestrator.load(
            protocol_source, run_time_param_values, run_time_param_paths, parse_mode
        )

    async def get_is_okay_to_clear(self) -> bool:
        """Get whether the engine is stopped or sitting idly, so it could be removed."""
        return await self._guaranteed_run_orchestrator.get_is_okay_to_clear()

    def prepare(self) -> None:
        """Prepare live runner for a run."""
        self._guaranteed_run_orchestrator.prepare()

    def get_robot_type(self) -> RobotType:
        """Get engine robot type."""
        return self._robot_type

    def get_deck_type(self) -> DeckType:
        """Get engine deck type."""
        return self._deck_type

    @pyro_behavior(specialty_func=convert_result_to_wrapped_dict, apply_local=False)
    async def get_nozzle_maps(self) -> Mapping[str, NozzleMap]:
        """Get current nozzle maps keyed by pipette id."""
        # NOTE: For the sake of Pyro compatibility this method returns NozzleMap, a serializable type
        return await self._guaranteed_run_orchestrator.get_nozzle_maps()  # type: ignore

    async def get_tip_attached(self) -> Dict[str, bool]:
        """Get current tip state keyed by pipette id."""
        return await self._guaranteed_run_orchestrator.get_tip_attached()

    async def set_error_recovery_policy(
        self,
        error_recovery_rules: List[ErrorRecoveryRule],
        error_recovery_is_enabled: bool,
    ) -> None:
        """Create error recovery policy for the run."""
        policy = create_error_recovery_policy_from_rules(
            error_recovery_rules, error_recovery_is_enabled
        )
        await self._guaranteed_run_orchestrator.set_error_recovery_policy(policy)

    @pyro_behavior(specialty_func=convert_result_to_wrapped_dict, apply_local=False)
    async def get_flex_stacker_substate(self) -> Mapping[str, FlexStackerSubState]:
        """Get current (if any) Flex Stacker Substates keyed by module id."""
        return await self._guaranteed_run_orchestrator.get_flex_stacker_substate()

    async def clear_command_history(self) -> None:
        """Force cleanup of command history."""
        await self._guaranteed_run_orchestrator.clear_command_history()
