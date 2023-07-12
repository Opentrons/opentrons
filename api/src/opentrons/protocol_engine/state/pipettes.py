"""Basic pipette data state and store."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Mapping, Optional, Tuple

from opentrons.config.defaults_ot2 import Z_RETRACT_DISTANCE
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.types import MountType, Mount as HwMount

from .. import errors
from ..types import (
    LoadedPipette,
    MotorAxis,
    FlowRates,
    DeckPoint,
    CurrentWell,
    TipGeometry,
)
from ..commands import (
    Command,
    LoadPipetteResult,
    AspirateResult,
    DispenseResult,
    DispenseInPlaceResult,
    MoveLabwareResult,
    MoveToCoordinatesResult,
    MoveToWellResult,
    MoveRelativeResult,
    PickUpTipResult,
    DropTipResult,
    DropTipInPlaceResult,
    HomeResult,
    RetractAxisResult,
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
class CurrentDeckPoint:
    """The latest deck point and mount the robot has accessed."""

    mount: Optional[MountType]
    deck_point: Optional[DeckPoint]


@dataclass(frozen=True)
class StaticPipetteConfig:
    """Static config for a pipette."""

    model: str
    serial_number: str
    display_name: str
    min_volume: float
    max_volume: float
    channels: int
    return_tip_scale: float
    nominal_tip_overlap: Dict[str, float]
    home_position: float
    nozzle_offset_z: float


@dataclass
class PipetteState:
    """Basic pipette data state and getter methods."""

    pipettes_by_id: Dict[str, LoadedPipette]
    aspirated_volume_by_id: Dict[str, Optional[float]]
    current_well: Optional[CurrentWell]
    current_deck_point: CurrentDeckPoint
    attached_tip_by_id: Dict[str, Optional[TipGeometry]]
    movement_speed_by_id: Dict[str, Optional[float]]
    static_config_by_id: Dict[str, StaticPipetteConfig]
    flow_rates_by_id: Dict[str, FlowRates]


class PipetteStore(HasState[PipetteState], HandlesActions):
    """Pipette state container."""

    _state: PipetteState

    def __init__(self) -> None:
        """Initialize a PipetteStore and its state."""
        self._state = PipetteState(
            pipettes_by_id={},
            aspirated_volume_by_id={},
            attached_tip_by_id={},
            current_well=None,
            current_deck_point=CurrentDeckPoint(mount=None, deck_point=None),
            movement_speed_by_id={},
            static_config_by_id={},
            flow_rates_by_id={},
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)
        elif isinstance(action, SetPipetteMovementSpeedAction):
            self._state.movement_speed_by_id[action.pipette_id] = action.speed
        elif isinstance(action, AddPipetteConfigAction):
            config = action.config
            self._state.static_config_by_id[action.pipette_id] = StaticPipetteConfig(
                serial_number=action.serial_number,
                model=config.model,
                display_name=config.display_name,
                min_volume=config.min_volume,
                max_volume=config.max_volume,
                channels=config.channels,
                return_tip_scale=config.return_tip_scale,
                nominal_tip_overlap=config.nominal_tip_overlap,
                home_position=config.home_position,
                nozzle_offset_z=config.nozzle_offset_z,
            )
            self._state.flow_rates_by_id[action.pipette_id] = config.flow_rates

    def _handle_command(self, command: Command) -> None:
        self._update_current_well(command)
        self._update_deck_point(command)

        if isinstance(command.result, LoadPipetteResult):
            pipette_id = command.result.pipetteId

            self._state.pipettes_by_id[pipette_id] = LoadedPipette(
                id=pipette_id,
                pipetteName=command.params.pipetteName,
                mount=command.params.mount,
            )
            self._state.aspirated_volume_by_id[pipette_id] = None
            self._state.movement_speed_by_id[pipette_id] = None
            self._state.attached_tip_by_id[pipette_id] = None

        elif isinstance(command.result, AspirateResult):
            pipette_id = command.params.pipetteId
            previous_volume = self._state.aspirated_volume_by_id[pipette_id] or 0
            next_volume = previous_volume + command.result.volume

            self._state.aspirated_volume_by_id[pipette_id] = next_volume

        elif isinstance(command.result, (DispenseResult, DispenseInPlaceResult)):
            pipette_id = command.params.pipetteId
            previous_volume = self._state.aspirated_volume_by_id[pipette_id] or 0
            next_volume = max(0.0, previous_volume - command.result.volume)
            self._state.aspirated_volume_by_id[pipette_id] = next_volume

        elif isinstance(command.result, PickUpTipResult):
            pipette_id = command.params.pipetteId
            attached_tip = TipGeometry(
                length=command.result.tipLength,
                volume=command.result.tipVolume,
                diameter=command.result.tipDiameter,
            )

            self._state.attached_tip_by_id[pipette_id] = attached_tip
            self._state.aspirated_volume_by_id[pipette_id] = 0

        elif isinstance(command.result, (DropTipResult, DropTipInPlaceResult)):
            pipette_id = command.params.pipetteId
            self._state.aspirated_volume_by_id[pipette_id] = None
            self._state.attached_tip_by_id[pipette_id] = None

        elif isinstance(command.result, BlowOutResult):
            pipette_id = command.params.pipetteId
            self._state.aspirated_volume_by_id[pipette_id] = None

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
        # TODO(jbl 2023-02-14): Need to investigate whether move relative should clear current well
        elif isinstance(
            command.result,
            (
                HomeResult,
                RetractAxisResult,
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

    def _update_deck_point(self, command: Command) -> None:
        if isinstance(
            command.result,
            (
                MoveToWellResult,
                MoveToCoordinatesResult,
                MoveRelativeResult,
                PickUpTipResult,
                DropTipResult,
                AspirateResult,
                DispenseResult,
                BlowOutResult,
                TouchTipResult,
            ),
        ):
            pipette_id = command.params.pipetteId
            deck_point = command.result.position

            try:
                loaded_pipette = self._state.pipettes_by_id[pipette_id]
            except KeyError:
                self._clear_deck_point()
            else:
                self._state.current_deck_point = CurrentDeckPoint(
                    mount=loaded_pipette.mount, deck_point=deck_point
                )

        elif isinstance(
            command.result,
            (
                HomeResult,
                RetractAxisResult,
                thermocycler.OpenLidResult,
                thermocycler.CloseLidResult,
            ),
        ):
            self._clear_deck_point()

        elif isinstance(
            command.result,
            (
                heater_shaker.SetAndWaitForShakeSpeedResult,
                heater_shaker.OpenLabwareLatchResult,
            ),
        ):
            if command.result.pipetteRetracted:
                self._clear_deck_point()

        elif isinstance(command.result, MoveLabwareResult):
            if command.params.strategy == "usingGripper":
                # All mounts will have been retracted.
                self._clear_deck_point()

    def _clear_deck_point(self) -> None:
        """Reset last deck point to default None value for mount and point."""
        self._state.current_deck_point = CurrentDeckPoint(mount=None, deck_point=None)


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
        except KeyError as e:
            raise errors.PipetteNotLoadedError(
                f"Pipette {pipette_id} not found."
            ) from e

    def get_mount(self, pipette_id: str) -> MountType:
        """Get the pipette's mount."""
        return self.get(pipette_id).mount

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

    def get_deck_point(self, pipette_id: str) -> Optional[DeckPoint]:
        """Get the deck point of a pipette by ID, or None if it was not associated with the last move operation."""
        loaded_pipette = self.get(pipette_id)
        current_deck_point = self._state.current_deck_point
        if loaded_pipette.mount == current_deck_point.mount:
            return current_deck_point.deck_point
        return None

    def get_attached_tip(self, pipette_id: str) -> Optional[TipGeometry]:
        """Get details of the pipette's attached tip.

        Returns:
            The tip's volume and length, or None if there is no tip attached,
        """
        try:
            return self._state.attached_tip_by_id[pipette_id]
        except KeyError as e:
            raise errors.PipetteNotLoadedError(
                f"Pipette {pipette_id} no found; unable to get attached tip."
            ) from e

    def get_all_attached_tips(self) -> List[Tuple[str, TipGeometry]]:
        """Get a list of all attached tips.

        Returns:
            A list of pipette ID, tip details tuples.
        """
        return [
            (pipette_id, tip)
            for pipette_id, tip in self._state.attached_tip_by_id.items()
            if tip is not None
        ]

    def get_aspirated_volume(self, pipette_id: str) -> Optional[float]:
        """Get the currently aspirated volume of a pipette by ID.

        Returns:
            The volume the pipette has aspirated.
            None, after blow-out and the plunger is in an unsafe position or drop-tip and there is no tip attached.

        Raises:
            PipetteNotLoadedError: pipette ID does not exist.
            TipNotAttachedError: if no tip is attached to the pipette.
        """
        self.validate_tip_state(pipette_id, True)

        try:
            return self._state.aspirated_volume_by_id[pipette_id]

        except KeyError as e:
            raise errors.PipetteNotLoadedError(
                f"Pipette {pipette_id} not found; unable to get current volume."
            ) from e

    def get_working_volume(self, pipette_id: str) -> float:
        """Get the working maximum volume of a pipette by ID.

        Raises:
            PipetteNotLoadedError: pipette ID does not exist.
            TipNotAttachedError: if no tip is attached to the pipette.
        """
        max_volume = self.get_maximum_volume(pipette_id)
        attached_tip = self.get_attached_tip(pipette_id)

        if not attached_tip:
            raise errors.TipNotAttachedError(
                f"Pipette {pipette_id} has no tip attached; unable to calculate working maximum volume."
            )

        return min(attached_tip.volume, max_volume)

    def get_available_volume(self, pipette_id: str) -> Optional[float]:
        """Get the available volume of a pipette by ID."""
        working_volume = self.get_working_volume(pipette_id)
        current_volume = self.get_aspirated_volume(pipette_id)

        return max(0.0, working_volume - current_volume) if current_volume else None

    def validate_tip_state(self, pipette_id: str, expected_has_tip: bool) -> None:
        """Validate that a pipette's tip state matches expectations."""
        attached_tip = self.get_attached_tip(pipette_id)

        if expected_has_tip is True and attached_tip is None:
            raise errors.TipNotAttachedError(
                "Pipette should have a tip attached, but does not."
            )
        if expected_has_tip is False and attached_tip is not None:
            raise errors.TipAttachedError(
                "Pipette should not have a tip attached, but does."
            )

    def get_movement_speed(
        self, pipette_id: str, requested_speed: Optional[float] = None
    ) -> Optional[float]:
        """Return the given pipette's requested or current movement speed."""
        return requested_speed or self._state.movement_speed_by_id[pipette_id]

    def get_config(self, pipette_id: str) -> StaticPipetteConfig:
        """Get the static pipette configuration by pipette id."""
        try:
            return self._state.static_config_by_id[pipette_id]
        except KeyError as e:
            raise errors.PipetteNotLoadedError(
                f"Pipette {pipette_id} not found; unable to get pipette configuration."
            ) from e

    def get_model_name(self, pipette_id: str) -> str:
        """Return the given pipette's model name."""
        return self.get_config(pipette_id).model

    def get_display_name(self, pipette_id: str) -> str:
        """Return the given pipette's display name."""
        return self.get_config(pipette_id).display_name

    def get_serial_number(self, pipette_id: str) -> str:
        """Get the serial number of the pipette."""
        return self.get_config(pipette_id).serial_number

    def get_minimum_volume(self, pipette_id: str) -> float:
        """Return the given pipette's minimum volume."""
        return self.get_config(pipette_id).min_volume

    def get_maximum_volume(self, pipette_id: str) -> float:
        """Return the given pipette's maximum volume."""
        return self.get_config(pipette_id).max_volume

    def get_instrument_max_height_ot2(self, pipette_id: str) -> float:
        """Get calculated max instrument height for an OT-2."""
        config = self.get_config(pipette_id)
        return config.home_position - Z_RETRACT_DISTANCE + config.nozzle_offset_z

    def get_return_tip_scale(self, pipette_id: str) -> float:
        """Return the given pipette's return tip height scale."""
        return self.get_config(pipette_id).return_tip_scale

    def get_flow_rates(self, pipette_id: str) -> FlowRates:
        """Get the default flow rates for the pipette."""
        try:
            return self._state.flow_rates_by_id[pipette_id]
        except KeyError as e:
            raise errors.PipetteNotLoadedError(
                f"Pipette {pipette_id} not found; unable to get pipette flow rates."
            ) from e

    def get_nominal_tip_overlap(self, pipette_id: str, labware_uri: str) -> float:
        """Get the nominal tip overlap for a given labware from config."""
        tip_overlaps_by_uri = self.get_config(pipette_id).nominal_tip_overlap

        try:
            return tip_overlaps_by_uri[labware_uri]
        except KeyError:
            return tip_overlaps_by_uri.get("default", 0)

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
