"""A wrapper for a protocol run that lives as a proxy in its own process."""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Mapping, Optional, Tuple, cast, get_args

from opentrons.hardware_control.modules import (
    AbstractModule as HardwareModuleAPI,
)
from opentrons.hardware_control.modules import (
    ModuleModel as HardwareModuleModel,
)
from opentrons.hardware_control.nozzle_manager import NozzleMap
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
from opentrons.protocol_engine.commands.command import CommandStatus
from opentrons.protocol_engine.commands.comment import Comment, CommentParams
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryPolicy
from opentrons.protocol_engine.resources.camera_provider import CameraSettings
from opentrons.protocol_engine.state.commands import CommandAnnotationsSlice
from opentrons.protocol_engine.state.module_substates import FlexStackerSubState
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
from opentrons.protocol_runner.protocol_runner import RunResult
from opentrons.protocol_runner.run_coordinator import AbstractRunCoordinator, ParseMode
from opentrons.types import NozzleMapInterface
from opentrons.util.pyro.pyro_serialization import (
    OpentronsPyroSerializer,
    serpent_enum_registration,
)
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.labware.types import LabwareUri
from opentrons_shared_data.robot.types import RobotType


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
        LabwareOffset,
        LabwareOffsetCreate,
        LegacyLabwareOffsetCreate,
        NozzleMap,
        ProtocolSource,
        RunResult,
        StateSummary,
    ]:
        OpentronsPyroSerializer.register_pydantic_model(pydantic_model)  # type: ignore[arg-type]
    # We do two levels of get_args because it's an annotated type union
    for command in get_args(get_args(Command)[0]):
        OpentronsPyroSerializer.register_pydantic_model(command)
    for command_create in get_args(get_args(CommandCreate)[0]):
        OpentronsPyroSerializer.register_pydantic_model(command_create)


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
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        """Event loop for use in allowing async methods via Pyro."""
        assert self._loop is not None
        return self._loop

    @loop.setter
    def loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Set an abstract event loop."""
        self._loop = loop

    def create(self, run_id: str) -> None:
        """Create a run orchestrator and protocol engine for a given run."""
        self._run_id = run_id

    @property
    def run_id(self) -> Optional[str]:
        """Get the "current" persisted run_id."""
        return self._run_id

    def play(self, deck_configuration: Optional[DeckConfigurationType] = None) -> None:
        """Start or resume the run."""
        pass

    async def run(
        self,
        deck_configuration: DeckConfigurationType,
        protocol_source: Optional[ProtocolSource] = None,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType] = None,
    ) -> RunResult:
        """Start the run."""
        return RunResult(
            commands=[],
            state_summary=self.get_state_summary(),
            parameters=[],
            command_annotations=[],
            command_preconditions=None,
        )

    def pause(self) -> None:
        """Pause the run."""
        pass

    async def stop(self) -> None:
        """Stop the run."""
        pass

    def resume_from_recovery(self, reconcile_false_positive: bool) -> None:
        """Resume the run from recovery."""
        pass

    async def finish(
        self,
        # TODO we'll need to register exceptions
        error: Optional[Exception] = None,
        drop_tips_after_run: bool = True,
        set_run_status: bool = True,
        post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
    ) -> None:
        """Finish the run."""
        pass

    def get_state_summary(self) -> StateSummary:
        """Get protocol run data."""
        return StateSummary(
            status=EngineStatus.IDLE,
            errors=[],
            labware=[],
            pipettes=[],
            modules=[],
            labwareOffsets=[],
        )

    def get_preconditions(self) -> CommandPreconditions:
        """Get the preconditions of a protocol run."""
        return CommandPreconditions()

    def get_loaded_labware_definitions(self) -> List[LabwareDefinition]:
        """Get loaded labware definitions."""
        return []

    def get_run_time_parameters(self) -> List[RunTimeParameter]:
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
        return []

    def get_all_command_annotations(self) -> List[CommandAnnotation]:
        """Get the list of command annotations defined in the protocol, if any."""
        return []

    def get_total_command_annotations_count(self) -> int:
        """Get the total number of command annotations defined in the protocol, if any."""
        return 0

    def get_command_annotation(self, annotation_id: str) -> CommandAnnotation:
        """Get the command annotation by ID."""
        return CommandAnnotation(
            id=annotation_id,
            source="fake",
            name="annotation",
            description=None,
            params={},
            parentId=None,
        )

    def get_current_command(self) -> Optional[CommandPointer]:
        """Get the "current" command, if any."""
        return None

    def get_most_recently_finalized_command(self) -> Optional[CommandPointer]:
        """Get the most recently finalized command, if any."""
        return None

    def get_command_slice(
        self, cursor: Optional[int], length: int, include_fixit_commands: bool
    ) -> CommandSlice:
        """Get a slice of run commands.

        Args:
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.
            include_fixit_commands: Get all command intents.
        """
        return CommandSlice(
            commands=[],
            cursor=0,
            total_length=0,
        )

    def get_command_annotations_slice(
        self, cursor: int, length: int
    ) -> CommandAnnotationsSlice:
        """Get a slice of command annotations in the run."""
        return CommandAnnotationsSlice(
            command_annotations=[],
            cursor=0,
            total_length=0,
        )

    def get_command_error_slice(
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
        return CommandErrorSlice(
            commands_errors=[],
            cursor=0,
            total_length=0,
        )

    def get_command_recovery_target(self) -> Optional[CommandPointer]:
        """Get the current error recovery target."""
        return None

    def get_command(self, command_id: str) -> Command:
        """Get a run's command by ID."""
        return Comment(
            id=command_id,
            createdAt=datetime.now(),
            key="abc",
            status=CommandStatus.SUCCEEDED,
            params=CommentParams(message="blah blah"),
        )

    def get_all_commands(self) -> List[Command]:
        """Get all run commands."""
        return []

    def get_command_errors(self) -> List[ErrorOccurrence]:
        """Get all run command errors."""
        return []

    def get_run_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        return EngineStatus.IDLE

    def get_is_run_terminal(self) -> bool:
        """Get whether engine is in a terminal state."""
        return False

    def get_camera_capture_image_settings(
        self,
    ) -> Dict[str, Any]:
        """Get camera capture image settings."""
        return {
            "camera_id": None,
            "resolution": None,
            "zoom": None,
            "pan": None,
            "contrast": None,
            "brightness": None,
            "saturation": None,
        }

    def run_has_started(self) -> bool:
        """Get whether the run has started."""
        return False

    def run_has_stopped(self) -> bool:
        """Get whether the run has stopped."""
        return True

    def add_labware_offset(
        self, request: LabwareOffsetCreate | LegacyLabwareOffsetCreate
    ) -> LabwareOffset:
        """Add a new labware offset to state."""
        return LabwareOffset.model_construct(id="fake")  # type: ignore[call-arg]

    def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        """Add a new labware definition to state."""
        return cast(LabwareUri, "fake/uri/ahh")

    def add_camera_enablement_settings(
        self,
        enablement_settings: CameraSettings,
    ) -> CameraSettings:
        """Add new camera enablement settings."""
        return enablement_settings

    def add_camera_capture_image_settings(
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
        pass

    async def add_command_and_wait_for_interval(
        self,
        command: CommandCreate,
        wait_until_complete: bool = False,
        timeout: Optional[int] = None,
        failed_command_id: Optional[str] = None,
    ) -> Command:
        """Add a new command to execute and wait for it to complete if needed."""
        return Comment(
            id="blah",
            createdAt=datetime.now(),
            key="abc",
            status=CommandStatus.SUCCEEDED,
            params=CommentParams(message="blah blah"),
        )

    def estop(self) -> None:
        """Handle an E-stop event from the hardware API."""
        pass

    async def asynchronous_module_error(
        self, module_model: HardwareModuleModel, module_serial: str | None
    ) -> bool:
        """Handle an asynchronous module error reported by hardware.

        If this function returns true, the caller should call finish() immediately; if it returns
        False, the caller should not call finish() until it otherwise would.
        """
        return False

    async def module_disconnected(
        self, module_model: HardwareModuleModel, module_serial: str | None
    ) -> bool:
        """Handle an unexpected module disconnection.

        If this function returns true, the caller should call finish() immediately; if it returns
        False, the caller should not call finish() until it otherwise would.
        """
        return False

    # TODO this should work, more or less, since these HardwareModuleAPIs should be proxys
    async def use_attached_modules(
        self, modules_by_id: Dict[str, HardwareModuleAPI]
    ) -> None:
        """Load attached modules directly into state, without locations."""
        pass

    async def load(
        self,
        protocol_source: ProtocolSource,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType],
        # TODO maybe serialized CSV runtime params
        run_time_param_paths: Optional[CSVRuntimeParamPaths],
        parse_mode: ParseMode,
    ) -> None:
        """Load a json/python protocol."""
        pass

    def get_is_okay_to_clear(self) -> bool:
        """Get whether the engine is stopped or sitting idly, so it could be removed."""
        return True

    def prepare(self) -> None:
        """Prepare live runner for a run."""
        pass

    def get_robot_type(self) -> RobotType:
        """Get engine robot type."""
        return self._robot_type

    def get_deck_type(self) -> DeckType:
        """Get engine deck type."""
        return self._deck_type

    def get_nozzle_maps(self) -> Mapping[str, NozzleMapInterface]:
        """Get current nozzle maps keyed by pipette id."""
        return {}

    def get_tip_attached(self) -> Dict[str, bool]:
        """Get current tip state keyed by pipette id."""
        return {}

    # TODO figure out how to serialize this
    def set_error_recovery_policy(self, policy: ErrorRecoveryPolicy) -> None:
        """Create error recovery policy for the run."""
        pass

    def get_flex_stacker_substate(self) -> Mapping[str, FlexStackerSubState]:
        """Get current (if any) Flex Stacker Substates keyed by module id."""
        return {}

    def clear_command_history(self) -> None:
        """Force cleanup of command history."""
        pass
