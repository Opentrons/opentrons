"""Basic pipette data state and store."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Mapping, Optional

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.types import MountType, Mount as HwMount

from .. import errors
from ..types import LoadedPipette, MotorAxis

from ..commands import (
    Command,
    LoadPipetteResult,
    AspirateResult,
    DispenseResult,
    DispenseInPlaceResult,
    MoveLabwareResult,
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
from ..actions import (
    Action,
    SetPipetteMovementSpeedAction,
    UpdateCommandAction,
    AddPipetteConfigAction,
)
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


@dataclass(frozen=True)
class StaticPipetteConfig:
    """Static config for a pipette."""

    model: str
    min_volume: float
    max_volume: float


@dataclass
class PipetteState:
    """Basic pipette data state and getter methods."""

    pipettes_by_id: Dict[str, LoadedPipette]
    aspirated_volume_by_id: Dict[str, float]
    current_well: Optional[CurrentWell]
    attached_tip_labware_by_id: Dict[str, str]
    movement_speed_by_id: Dict[str, Optional[float]]
    static_config_by_id: Dict[str, StaticPipetteConfig]


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
            movement_speed_by_id={},
            static_config_by_id={},
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)
        elif isinstance(action, SetPipetteMovementSpeedAction):
            self._state.movement_speed_by_id[action.pipette_id] = action.speed
        elif isinstance(action, AddPipetteConfigAction):
            self._state.static_config_by_id[action.pipette_id] = StaticPipetteConfig(
                model=action.model,
                min_volume=action.min_volume,
                max_volume=action.max_volume,
            )

    def _handle_command(self, command: Command) -> None:
        self._update_current_well(command)

        if isinstance(command.result, LoadPipetteResult):
            pipette_id = command.result.pipetteId

            self._state.pipettes_by_id[pipette_id] = LoadedPipette(
                id=pipette_id,
                pipetteName=command.params.pipetteName,
                mount=command.params.mount,
            )
            self._state.aspirated_volume_by_id[pipette_id] = 0
            self._state.movement_speed_by_id[pipette_id] = None

        elif isinstance(command.result, AspirateResult):
            pipette_id = command.params.pipetteId
            previous_volume = self._state.aspirated_volume_by_id[pipette_id]
            next_volume = previous_volume + command.result.volume

            self._state.aspirated_volume_by_id[pipette_id] = next_volume

        elif isinstance(command.result, (DispenseResult, DispenseInPlaceResult)):
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

    def _update_current_well(self, command: Command) -> None:
        # These commands leave the pipette in a new well.
        # Update current_well to reflect that.
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

        # These commands leave the pipette in a place that we can't logically associate
        # with a well. Clear current_well to reflect the fact that it's now unknown.
        #
        # TODO(mc, 2021-11-12): Wipe out current_well on movement failures, too.
        elif isinstance(
            command.result,
            (
                HomeResult,
                MoveToCoordinatesResult,
                thermocycler.OpenLidResult,
                thermocycler.CloseLidResult,
            ),
        ):
            self._state.current_well = None

        # Heater-Shaker commands may have left the pipette in a place that we can't
        # associate with a logical location, depending on their result.
        elif isinstance(
            command.result,
            (
                heater_shaker.SetAndWaitForShakeSpeedResult,
                heater_shaker.OpenLabwareLatchResult,
            ),
        ):
            if command.result.pipetteRetracted:
                self._state.current_well = None

        # A moveLabware command may have moved the labware that contains the current
        # well out from under the pipette. Clear the current well to reflect the
        # fact that the pipette is no longer over any labware.
        #
        # This is necessary for safe motion planning in case the next movement
        # goes to the same labware (now in a new place).
        elif isinstance(command.result, MoveLabwareResult):
            moved_labware_id = command.params.labwareId
            if command.params.strategy == "usingGripper":
                # All mounts will have been retracted.
                self._state.current_well = None
            elif (
                self._state.current_well is not None
                and self._state.current_well.labware_id == moved_labware_id
            ):
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

    def get_movement_speed(
        self, pipette_id: str, requested_speed: Optional[float] = None
    ) -> Optional[float]:
        """Return the given pipette's requested or current movement speed."""
        return requested_speed or self._state.movement_speed_by_id[pipette_id]

    def _get_static_config(self, pipette_id: str) -> StaticPipetteConfig:
        """Get the static pipette configuration by pipette id."""
        try:
            return self._state.static_config_by_id[pipette_id]
        except KeyError:
            raise errors.PipetteNotLoadedError(
                f"Pipette {pipette_id} not found; unable to get pipette configuration."
            )

    def get_model_name(self, pipette_id: str) -> str:
        """Return the given pipette's model name."""
        return self._get_static_config(pipette_id).model

    def get_minimum_volume(self, pipette_id: str) -> float:
        """Return the given pipette's minimum volume."""
        return self._get_static_config(pipette_id).min_volume

    def get_maximum_volume(self, pipette_id: str) -> float:
        """Return the given pipette's maximum volume."""
        return self._get_static_config(pipette_id).max_volume

    def get_z_axis(self, pipette_id: str) -> MotorAxis:
        """Get the MotorAxis representing this pipette's Z stage."""
        mount = self.get(pipette_id).mount
        return MotorAxis.LEFT_Z if mount == MountType.LEFT else MotorAxis.RIGHT_Z

    def get_plunger_axis(self, pipette_id: str) -> MotorAxis:
        """Get the MotorAxis representing this pipette's plunger."""
        mount = self.get(pipette_id).mount
        return (
            MotorAxis.LEFT_PLUNGER
            if mount == MountType.LEFT
            else MotorAxis.RIGHT_PLUNGER
        )
