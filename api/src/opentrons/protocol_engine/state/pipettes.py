"""Basic pipette data state and store."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Mapping, Optional, Union

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.types import MountType, Mount as HwMount

from .. import errors
from ..types import LoadedPipette

from ..commands import (
    Command,
    LoadPipetteResult,
    AspirateResult,
    DispenseResult,
    MoveToCoordinatesResult,
    MoveToWellResult,
    PickUpTipResult,
    DropTipResult,
    HomeResult,
    BlowOutResult,
    TouchTipResult,
    thermocycler,
    heater_shaker,
)
from ..actions import Action, UpdateCommandAction
from .abstract_store import HasState, HandlesActions


@dataclass(frozen=True)
class HardwarePipette:
    """Hardware pipette data."""

    mount: HwMount
    config: PipetteDict


@dataclass(frozen=True)
class CurrentWell:
    """The latest well that the robot has accessed."""

    pipette_id: str
    labware_id: str
    well_name: str


@dataclass
class PipetteState:
    """Basic pipette data state and getter methods."""

    pipettes_by_id: Dict[str, LoadedPipette]
    aspirated_volume_by_id: Dict[str, float]
    current_well: Optional[CurrentWell]
    attached_tip_labware_by_id: Dict[str, str]


class PipetteStore(HasState[PipetteState], HandlesActions):
    """Pipette state container."""

    _state: PipetteState

    def __init__(self) -> None:
        """Initialize a PipetteStore and its state."""
        self._state = PipetteState(
            pipettes_by_id={},
            aspirated_volume_by_id={},
            current_well=None,
            attached_tip_labware_by_id={},
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)

    def _handle_command(self, command: Command) -> None:
        if isinstance(
            command.result,
            (
                MoveToWellResult,
                PickUpTipResult,
                DropTipResult,
                AspirateResult,
                DispenseResult,
                BlowOutResult,
                TouchTipResult,
            ),
        ):
            self._state.current_well = CurrentWell(
                pipette_id=command.params.pipetteId,
                labware_id=command.params.labwareId,
                well_name=command.params.wellName,
            )

        # TODO(mc, 2021-11-12): wipe out current_well on movement failures, too
        elif isinstance(
            command.result,
            (
                HomeResult,
                MoveToCoordinatesResult,
                thermocycler.OpenLidResult,
                thermocycler.CloseLidResult,
                heater_shaker.SetAndWaitForShakeSpeedResult,
                heater_shaker.OpenLabwareLatchResult,
            ),
        ):
            # A command left the pipette in a place that we can't associate
            # with a logical well location. Set the current well to None
            # to reflect the fact that it's now unknown.
            self._handle_current_well_clearing_commands(command_result=command.result)

        if isinstance(command.result, LoadPipetteResult):
            pipette_id = command.result.pipetteId

            self._state.pipettes_by_id[pipette_id] = LoadedPipette(
                id=pipette_id,
                pipetteName=command.params.pipetteName,
                mount=command.params.mount,
            )
            self._state.aspirated_volume_by_id[pipette_id] = 0

        elif isinstance(command.result, AspirateResult):
            pipette_id = command.params.pipetteId
            previous_volume = self._state.aspirated_volume_by_id[pipette_id]
            next_volume = previous_volume + command.result.volume

            self._state.aspirated_volume_by_id[pipette_id] = next_volume

        elif isinstance(command.result, DispenseResult):
            pipette_id = command.params.pipetteId
            previous_volume = self._state.aspirated_volume_by_id[pipette_id]
            next_volume = max(0.0, previous_volume - command.result.volume)
            self._state.aspirated_volume_by_id[pipette_id] = next_volume

        elif isinstance(command.result, PickUpTipResult):
            pipette_id = command.params.pipetteId
            tiprack_id = command.params.labwareId
            self._state.attached_tip_labware_by_id[pipette_id] = tiprack_id

        elif isinstance(command.result, DropTipResult):
            pipette_id = command.params.pipetteId
            # No-op if pipette_id not found; makes unit testing easier.
            # That should never happen outside of tests. But if it somehow does,
            # it won't harm the state.
            self._state.attached_tip_labware_by_id.pop(pipette_id, None)

        elif isinstance(command.result, BlowOutResult):
            pipette_id = command.params.pipetteId
            self._state.aspirated_volume_by_id[pipette_id] = 0

    def _handle_current_well_clearing_commands(
        self,
        command_result: Union[
            HomeResult,
            MoveToCoordinatesResult,
            thermocycler.OpenLidResult,
            thermocycler.CloseLidResult,
            heater_shaker.SetAndWaitForShakeSpeedResult,
            heater_shaker.OpenLabwareLatchResult,
        ],
    ) -> None:
        if (
            not isinstance(
                command_result,
                (
                    heater_shaker.SetAndWaitForShakeSpeedResult,
                    heater_shaker.OpenLabwareLatchResult,
                ),
            )
            or command_result.pipetteRetracted
        ):
            # Clear current_well for all above commands except h/s commands.
            # For h/s commands, clear current_well only if pipettes were moved before
            # command execution for safety.
            self._state.current_well = None


class PipetteView(HasState[PipetteState]):
    """Read-only view of computed pipettes state."""

    _state: PipetteState

    def __init__(self, state: PipetteState) -> None:
        """Initialize the view with its backing state value."""
        self._state = state

    def get(self, pipette_id: str) -> LoadedPipette:
        """Get pipette data by the pipette's unique identifier."""
        try:
            return self._state.pipettes_by_id[pipette_id]
        except KeyError:
            raise errors.PipetteNotLoadedError(f"Pipette {pipette_id} not found.")

    def get_all(self) -> List[LoadedPipette]:
        """Get a list of all pipette entries in state."""
        return list(self._state.pipettes_by_id.values())

    def get_by_mount(self, mount: MountType) -> Optional[LoadedPipette]:
        """Get pipette data by the pipette's mount."""
        for pipette in self._state.pipettes_by_id.values():
            if pipette.mount == mount:
                return pipette
        return None

    def get_hardware_pipette(
        self,
        pipette_id: str,
        attached_pipettes: Mapping[HwMount, Optional[PipetteDict]],
    ) -> HardwarePipette:
        """Get a pipette's hardware configuration and state by ID."""
        pipette_data = self.get(pipette_id)
        pipette_name = pipette_data.pipetteName
        mount = pipette_data.mount

        hw_mount = mount.to_hw_mount()
        hw_config = attached_pipettes[hw_mount]

        # TODO(mc, 2022-01-11): HW controller may return an empty dict for
        # no pipette attached instead of `None`. Update when fixed in HWAPI
        if not hw_config:
            raise errors.PipetteNotAttachedError(f"No pipette attached on {mount}")

        elif (
            hw_config["name"] != pipette_name
            and pipette_name not in hw_config["back_compat_names"]
        ):
            raise errors.PipetteNotAttachedError(
                f"Found {hw_config['name']} on {mount}, "
                f"but {pipette_id} is a {pipette_name}"
            )

        return HardwarePipette(mount=hw_mount, config=hw_config)

    def get_current_well(self) -> Optional[CurrentWell]:
        """Get the last accessed well and which pipette accessed it."""
        return self._state.current_well

    def get_aspirated_volume(self, pipette_id: str) -> float:
        """Get the currently aspirated volume of a pipette by ID."""
        try:
            return self._state.aspirated_volume_by_id[pipette_id]
        except KeyError:
            raise errors.PipetteNotLoadedError(
                f"Pipette {pipette_id} not found; unable to get current volume."
            )

    def get_is_ready_to_aspirate(
        self,
        pipette_id: str,
        pipette_config: PipetteDict,
    ) -> bool:
        """Get whether a pipette is ready to aspirate."""
        return (
            self.get_aspirated_volume(pipette_id) > 0
            or pipette_config["ready_to_aspirate"]
        )

    def get_attached_tip_labware_by_id(self) -> Dict[str, str]:
        """Get the tiprack ids of attached tip by pipette ids."""
        return self._state.attached_tip_labware_by_id
