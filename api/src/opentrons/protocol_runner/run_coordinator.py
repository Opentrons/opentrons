"""Defines an abstract base class for interfacing with a run from the robot server."""

import enum
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Mapping, Optional, Tuple

from opentrons_shared_data.errors import GeneralError
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.labware.types import LabwareUri
from opentrons_shared_data.robot.types import RobotType

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
    StateSummary,
)
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
from opentrons.types import NozzleMapInterface


class NoProtocolRunAvailable(RuntimeError):
    """An error raised if there is no protocol run available."""


class UnknownProtocolParseMode(RuntimeError):
    """An error raised if given an unknown protocol parse mode."""


class RunNotFound(GeneralError):
    """An error raised if there is no run associated."""


class ParseMode(enum.Enum):
    """Configure optional rules for when `opentrons.protocols.parse.parse()` parses protocols."""

    NORMAL = enum.auto()
    ALLOW_LEGACY_METADATA_AND_REQUIREMENTS = enum.auto()


class AbstractRunCoordinator(ABC):
    """The abstract base class for interfacing with a run from the robot server."""

    @property
    @abstractmethod
    def run_id(self) -> Optional[str]:
        """Get the "current" persisted run_id."""
        ...

    @abstractmethod
    def play(self, deck_configuration: Optional[DeckConfigurationType] = None) -> None:
        """Start or resume the run."""
        ...

    @abstractmethod
    async def run(
        self,
        deck_configuration: DeckConfigurationType,
        protocol_source: Optional[ProtocolSource] = None,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType] = None,
    ) -> RunResult:
        """Start the run."""
        ...

    @abstractmethod
    def pause(self) -> None:
        """Pause the run."""
        ...

    @abstractmethod
    async def stop(self) -> None:
        """Stop the run."""
        ...

    @abstractmethod
    def resume_from_recovery(self, reconcile_false_positive: bool) -> None:
        """Resume the run from recovery."""
        ...

    @abstractmethod
    async def finish(
        self,
        error: Optional[Exception] = None,
        drop_tips_after_run: bool = True,
        set_run_status: bool = True,
        post_run_hardware_state: PostRunHardwareState = PostRunHardwareState.HOME_AND_STAY_ENGAGED,
    ) -> None:
        """Finish the run."""
        ...

    @abstractmethod
    def get_state_summary(self) -> StateSummary:
        """Get protocol run data."""
        ...

    @abstractmethod
    def get_preconditions(self) -> CommandPreconditions:
        """Get the preconditions of a protocol run."""
        ...

    @abstractmethod
    def get_loaded_labware_definitions(self) -> List[LabwareDefinition]:
        """Get loaded labware definitions."""
        ...

    @abstractmethod
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
        ...

    @abstractmethod
    def get_all_command_annotations(self) -> List[CommandAnnotation]:
        """Get the list of command annotations defined in the protocol, if any."""
        ...

    @abstractmethod
    def get_total_command_annotations_count(self) -> int:
        """Get the total number of command annotations defined in the protocol, if any."""
        ...

    @abstractmethod
    def get_command_annotation(self, annotation_id: str) -> CommandAnnotation:
        """Get the command annotation by ID."""
        ...

    @abstractmethod
    def get_current_command(self) -> Optional[CommandPointer]:
        """Get the "current" command, if any."""
        ...

    @abstractmethod
    def get_most_recently_finalized_command(self) -> Optional[CommandPointer]:
        """Get the most recently finalized command, if any."""
        ...

    @abstractmethod
    def get_command_slice(
        self, cursor: Optional[int], length: int, include_fixit_commands: bool
    ) -> CommandSlice:
        """Get a slice of run commands.

        Args:
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.
            include_fixit_commands: Get all command intents.
        """
        ...

    @abstractmethod
    def get_command_annotations_slice(
        self, cursor: int, length: int
    ) -> CommandAnnotationsSlice:
        """Get a slice of command annotations in the run."""
        ...

    @abstractmethod
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
        ...

    @abstractmethod
    def get_command_recovery_target(self) -> Optional[CommandPointer]:
        """Get the current error recovery target."""
        ...

    @abstractmethod
    def get_command(self, command_id: str) -> Command:
        """Get a run's command by ID."""
        ...

    @abstractmethod
    def get_all_commands(self) -> List[Command]:
        """Get all run commands."""
        ...

    @abstractmethod
    def get_command_errors(self) -> List[ErrorOccurrence]:
        """Get all run command errors."""
        ...

    @abstractmethod
    def get_run_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        ...

    @abstractmethod
    def get_is_run_terminal(self) -> bool:
        """Get whether engine is in a terminal state."""
        ...

    @abstractmethod
    def get_camera_capture_image_settings(
        self,
    ) -> Dict[str, Any]:
        """Get camera capture image settings."""
        ...

    @abstractmethod
    def run_has_started(self) -> bool:
        """Get whether the run has started."""
        ...

    @abstractmethod
    def run_has_stopped(self) -> bool:
        """Get whether the run has stopped."""
        ...

    @abstractmethod
    def add_labware_offset(
        self, request: LabwareOffsetCreate | LegacyLabwareOffsetCreate
    ) -> LabwareOffset:
        """Add a new labware offset to state."""
        ...

    @abstractmethod
    def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        """Add a new labware definition to state."""
        ...

    @abstractmethod
    def add_camera_enablement_settings(
        self,
        enablement_settings: CameraSettings,
    ) -> CameraSettings:
        """Add new camera enablement settings."""
        ...

    @abstractmethod
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
        ...

    @abstractmethod
    async def add_command_and_wait_for_interval(
        self,
        command: CommandCreate,
        wait_until_complete: bool = False,
        timeout: Optional[int] = None,
        failed_command_id: Optional[str] = None,
    ) -> Command:
        """Add a new command to execute and wait for it to complete if needed."""
        ...

    @abstractmethod
    def estop(self) -> None:
        """Handle an E-stop event from the hardware API."""
        ...

    @abstractmethod
    async def asynchronous_module_error(
        self, module_model: HardwareModuleModel, module_serial: str | None
    ) -> bool:
        """Handle an asynchronous module error reported by hardware.

        If this function returns true, the caller should call finish() immediately; if it returns
        False, the caller should not call finish() until it otherwise would.
        """
        ...

    @abstractmethod
    async def module_disconnected(
        self, module_model: HardwareModuleModel, module_serial: str | None
    ) -> bool:
        """Handle an unexpected module disconnection.

        If this function returns true, the caller should call finish() immediately; if it returns
        False, the caller should not call finish() until it otherwise would.
        """
        ...

    @abstractmethod
    async def use_attached_modules(
        self, modules_by_id: Dict[str, HardwareModuleAPI]
    ) -> None:
        """Load attached modules directly into state, without locations."""
        ...

    @abstractmethod
    async def load(
        self,
        protocol_source: ProtocolSource,
        run_time_param_values: Optional[PrimitiveRunTimeParamValuesType],
        # TODO maybe serialized CSV runtime params, def ParseMode
        run_time_param_paths: Optional[CSVRuntimeParamPaths],
        parse_mode: ParseMode,
    ) -> None:
        """Load a json/python protocol."""
        ...

    @abstractmethod
    def get_is_okay_to_clear(self) -> bool:
        """Get whether the engine is stopped or sitting idly, so it could be removed."""
        ...

    @abstractmethod
    def prepare(self) -> None:
        """Prepare live runner for a run."""
        ...

    @abstractmethod
    def get_robot_type(self) -> RobotType:
        """Get engine robot type."""
        ...

    @abstractmethod
    def get_deck_type(self) -> DeckType:
        """Get engine deck type."""
        ...

    @abstractmethod
    def get_nozzle_maps(self) -> Mapping[str, NozzleMapInterface]:
        """Get current nozzle maps keyed by pipette id."""
        ...

    @abstractmethod
    def get_tip_attached(self) -> Dict[str, bool]:
        """Get current tip state keyed by pipette id."""
        ...

    @abstractmethod
    def get_flex_stacker_substate(self) -> Mapping[str, FlexStackerSubState]:
        """Get current (if any) Flex Stacker Substates keyed by module id."""
        ...

    @abstractmethod
    def clear_command_history(self) -> None:
        """Force cleanup of command history."""
        ...
