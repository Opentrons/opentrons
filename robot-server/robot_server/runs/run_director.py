"""A wrapper for a protocol run that lives as a proxy in its own process."""

from typing import Any, AsyncGenerator, Dict, List, Mapping, Optional, Tuple, cast

from opentrons.hardware_control.modules import (
    AbstractModule as HardwareModuleAPI,
)
from opentrons.hardware_control.modules import (
    ModuleModel as HardwareModuleModel,
)
from opentrons.protocol_engine import (
    Command,
    CommandCreate,
    CommandErrorSlice,
    CommandPointer,
    CommandSlice,
    DeckType,
    ErrorOccurrence,
    ProtocolEngine,
    StateSummary,
)
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
from opentrons.protocol_runner.run_orchestrator import ParseMode
from opentrons.types import NozzleMapInterface
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons.util.pyro.pyro_serialization import PydanticPyroSerializer
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.labware.types import LabwareUri
from opentrons_shared_data.robot.types import RobotType


def register_process_types() -> None:
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
        ProtocolSource,
        RunResult,
        StateSummary,
    ]:
        PydanticPyroSerializer.register_model(pydantic_model)


def create_directed_run_process(
    robot_type: RobotType,
    deck_type: DeckType,
) -> None:
    """Build an instance of the DirectedRunProcess and provide it to Pyro Daemon Factory as a resource."""
    directed_run_process = DirectedRunProcess(robot_type, deck_type)
    try:
        create_pyro_daemon("ot-protocol", directed_run_process, register_process_types)
    finally:
        pass


class DirectedRunProcess:
    """A wrapper of the engine and run orchestrator for a pyro process."""

    def __init__(
        self,
        robot_type: RobotType,
        deck_type: DeckType,
    ) -> None:
        self._robot_type = robot_type
        self._deck_type = deck_type
        self._run_id: Optional[str] = None

    def create(self, run_id: str) -> None:
        """Create a run orchestrator and protocol engine for a given run."""
        self._run_id = run_id

    @property
    def run_id(self) -> Optional[str]:
        return self._run_id

    def play(self, deck_configuration: Optional[DeckConfigurationType] = None) -> None:
        pass

    async def run(
        self,
        deck_configuration: DeckConfigurationType,
        protocol_source: Optional[ProtocolSource] = None,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType] = None,
    ) -> RunResult:
        return RunResult(
            commands=[],
            state_summary=self.get_state_summary(),
            parameters=[],
            command_annotations=[],
            command_preconditions=None,
        )

    def pause(self) -> None:
        pass

    async def stop(self) -> None:
        pass

    def resume_from_recovery(self, reconcile_false_positive: bool) -> None:
        pass

    async def finish(
        self,
        error: Optional[Exception] = None,
        drop_tips_after_run: bool = True,
        set_run_status: bool = True,
        # TODO register this
        post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
    ) -> None:
        pass

    def get_state_summary(self) -> StateSummary:
        # labware = LoadedLabware(
        #     id="abc",
        #     loadName="123",
        #     definitionUri="xyz",
        #     location=DeckSlotLocation(
        #         slotName=DeckSlotName.SLOT_A1,
        #     ),
        #     lid_id=None,
        #     offsetId=None,
        #     displayName=None,
        # )
        return StateSummary(
            status=EngineStatus.IDLE,
            errors=[],
            labware=[],
            pipettes=[],
            modules=[],
            labwareOffsets=[],
        )

    def get_preconditions(self) -> CommandPreconditions:
        return CommandPreconditions()

    def get_loaded_labware_definitions(self) -> List[LabwareDefinition]:
        return []

    def get_run_time_parameters(self) -> List[RunTimeParameter]:
        return []

    def get_all_command_annotations(self) -> List[CommandAnnotation]:
        return []

    def get_total_command_annotations_count(self) -> int:
        return 0

    def get_command_annotation(self, annotation_id: str) -> CommandAnnotation:
        return CommandAnnotation(
            id=annotation_id,
            source="fake",
            name="annotation",
            description=None,
            params={},
            parentId=None,
        )

    def get_current_command(self) -> Optional[CommandPointer]:
        return None

    def get_most_recently_finalized_command(self) -> Optional[CommandPointer]:
        return None

    def get_command_slice(
        self, cursor: Optional[int], length: int, include_fixit_commands: bool
    ) -> CommandSlice:
        return CommandSlice(
            commands=[],
            cursor=0,
            total_length=0,
        )

    def get_command_annotations_slice(
        self, cursor: int, length: int
    ) -> CommandAnnotationsSlice:
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
        return CommandErrorSlice(
            commands_errors=[],
            cursor=0,
            total_length=0,
        )

    def get_command_recovery_target(self) -> Optional[CommandPointer]:
        return None

    # TODO will have to register every command probably
    def get_command(self, command_id: str) -> Command:
        pass

    def get_all_commands(self) -> List[Command]:
        return []

    def get_command_errors(self) -> List[ErrorOccurrence]:
        return []

    # TODO register this
    def get_run_status(self) -> EngineStatus:
        return EngineStatus.IDLE

    def get_is_run_terminal(self) -> bool:
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
        return False

    def run_has_stopped(self) -> bool:
        return True

    # TODO this doesn't return anything yet
    def add_labware_offset(
        self, request: LabwareOffsetCreate | LegacyLabwareOffsetCreate
    ) -> LabwareOffset:
        pass

    def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        return cast(LabwareUri, "fake/uri/ahh")

    def add_camera_enablement_settings(
        self,
        enablement_settings: CameraSettings,
    ) -> CameraSettings:
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

    # TODO this isn't returning anything right now
    async def add_command_and_wait_for_interval(
        self,
        # TODO same thing with Command, this is gonna have do multiple, probably?
        command: CommandCreate,
        wait_until_complete: bool = False,
        timeout: Optional[int] = None,
        failed_command_id: Optional[str] = None,
    ) -> Command:
        pass

    def estop(self) -> None:
        pass

    # TODO HardwareModuleModel, presumably Casey's dealing with this already somewhere
    # TODO use casey's generic enum or an update version
    async def asynchronous_module_error(
        self, module_model: HardwareModuleModel, module_serial: str | None
    ) -> bool:
        return False

    # TODO ibid
    async def module_disconnected(
        self, module_model: HardwareModuleModel, module_serial: str | None
    ) -> bool:
        return False

    # TODO this should work, more or less, since these HardwareModuleAPIs should be proxys
    async def use_attached_modules(
        self, modules_by_id: Dict[str, HardwareModuleAPI]
    ) -> None:
        pass

    async def load(
        self,
        protocol_source: ProtocolSource,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType],
        # TODO maybe serialized CSV runtime params, def ParseMode
        run_time_param_paths: Optional[CSVRuntimeParamPaths],
        parse_mode: ParseMode,
    ) -> None:
        pass

    def get_is_okay_to_clear(self) -> bool:
        return True

    def prepare(self) -> None:
        pass

    def get_robot_type(self) -> RobotType:
        return self._robot_type

    # TODO serialize this
    def get_deck_type(self) -> DeckType:
        return self._deck_type

    # TODO this is gonna be messy to serialize, maybe? NozzleMap needs to be a pydantic model too
    def get_nozzle_maps(self) -> Mapping[str, NozzleMapInterface]:
        return {}

    def get_tip_attached(self) -> Dict[str, bool]:
        return {}

    # TODO figure out how to serialize this
    def set_error_recovery_policy(self, policy: ErrorRecoveryPolicy) -> None:
        pass

    # TODO same with nozzle maps
    def get_flex_stacker_substate(self) -> Mapping[str, FlexStackerSubState]:
        return {}

    # TODO figure this out too? Don't think it's used
    async def command_generator(self) -> AsyncGenerator[str, None]:
        pass

    def clear_command_history(self) -> None:
        pass


if __name__ == "__main__":
    # TODO hard coding this for now since it's only gonna be on Flex
    create_directed_run_process("OT-3 Standard", DeckType.OT3_STANDARD)
