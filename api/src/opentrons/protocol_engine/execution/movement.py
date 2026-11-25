"""Movement command handling."""

from __future__ import annotations

import logging
from typing import List, Optional, Union

from opentrons_shared_data.errors.exceptions import PositionUnknownError

from ..resources import ModelUtils
from ..state.state import StateStore
from ..types import (
    AddressableOffsetVector,
    CurrentWell,
    DeckPoint,
    LiquidHandlingWellLocation,
    MotorAxis,
    MovementAxis,
    WellLocation,
)
from .equipment import EquipmentHandler
from .gantry_mover import GantryMover
from .heater_shaker_movement_flagger import HeaterShakerMovementFlagger
from .thermocycler_movement_flagger import ThermocyclerMovementFlagger
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.motion_planning.adjacent_slots_getters import (
    CardinalSide,
    get_cardinal_neighbor_side,
    get_flex_slot_id,
)
from opentrons.protocol_engine.errors import (
    InvalidLabwarePositionError,
    LabwareNotOnDeckError,
    LocationIsLidDockSlotError,
    LocationIsStagingSlotError,
    LocationNotAccessibleByPipetteError,
)
from opentrons.types import (
    MountType,
    NozzleConfigurationType,
    Point,
    StagingSlotName,
)

log = logging.getLogger(__name__)

_OFF_DECK_ERRORS = (
    LabwareNotOnDeckError,
    InvalidLabwarePositionError,
    LocationIsLidDockSlotError,
)


def _primary_nozzle_faces_collar(nozzle_map: NozzleMap, side: CardinalSide) -> bool:
    """Return whether the primary nozzle is on the instrument edge facing the collar.

    The pipette aligns that primary nozzle to the well, shifting the pipette head
    to one side. In the case of the collar, certain nozzle configurations shift
    the pipette head into the collar. So lets only allow nozzle configs where the
    primary nozzle faces the collar, this way if head does have to shift, it shifts
    the opposite direction of the collar.
    """
    primary = nozzle_map.starting_nozzle
    primary_row = primary[0]
    primary_column = primary[1:]
    row_names = list(nozzle_map.full_instrument_rows)
    column_names = list(nozzle_map.full_instrument_columns)
    back_row, front_row = row_names[0], row_names[-1]
    left_column, right_column = column_names[0], column_names[-1]
    if side is CardinalSide.NORTH:
        return primary_row == back_row
    if side is CardinalSide.SOUTH:
        return primary_row == front_row
    if side is CardinalSide.WEST:
        return primary_column == left_column
    if side is CardinalSide.EAST:
        # A row whose primary is column 1 keeps the full head's left-right
        # position, so it clears an east collar on every row of the labware.
        if (
            nozzle_map.configuration == NozzleConfigurationType.ROW
            and primary_column == left_column
        ):
            return True
        return primary_column == right_column
    return False


def _suggested_configuration(nozzle_map: NozzleMap, side: CardinalSide) -> str:
    """Return a nozzle configuration that faces the collar.

    The collision error offers this configuration, or moving the collar.
    """
    row_names = list(nozzle_map.full_instrument_rows)
    column_names = list(nozzle_map.full_instrument_columns)
    back_row, front_row = row_names[0], row_names[-1]
    left_column, right_column = column_names[0], column_names[-1]
    if side is CardinalSide.NORTH:
        nozzles = [f"{back_row}{left_column}", f"{back_row}{right_column}"]
    elif side is CardinalSide.SOUTH:
        nozzles = [f"{front_row}{left_column}", f"{front_row}{right_column}"]
    elif side is CardinalSide.WEST:
        nozzles = [f"{back_row}{left_column}", f"{front_row}{left_column}"]
    elif left_column == right_column:
        nozzles = [f"{back_row}{left_column}", f"{front_row}{left_column}"]
    else:
        return (
            f"a configuration whose primary nozzle is {back_row}{right_column} "
            f"or {front_row}{right_column}, or a row starting at "
            f"{back_row}{left_column} or {front_row}{left_column}"
        )
    unique: List[str] = []
    for nozzle in nozzles:
        if nozzle not in unique:
            unique.append(nozzle)
    nozzle = f"{unique[0]}" if len(unique) == 1 else f"{unique[0]} or {unique[1]}"
    return f"a configuration whose primary nozzle is {nozzle}"


def raise_if_nozzle_configuration_hits_vacuum_collar(
    pipette_id: str,
    labware_id: str,
    state_view: StateStore,
) -> None:
    """Reject an 8/96-channel move when a vacuum collar is on a cardinal side.

    The primary nozzle has to be on the edge facing the collar. North is row A,
    south is row H, west is column 1, and east is column 12. A FULL 8/96-channel
    layout is allowed on every side, and a 8/96-channel row that starts at column
    1 is allowed when the collar is east.
    """
    channels = state_view.pipettes.get_channels(pipette_id)
    if channels not in (8, 96):
        return
    try:
        destination = state_view.geometry.get_ancestor_slot_name(labware_id)
    except _OFF_DECK_ERRORS:
        return
    nozzle_map = state_view.pipettes.get_nozzle_configuration(pipette_id)
    # Skip checks for 8/96-ch in FULL mode, since the nozzles are always directly
    # over the wells and the pipette head does not shift over.
    if channels in (8, 96) and nozzle_map.configuration == NozzleConfigurationType.FULL:
        return
    for other in state_view.labware.get_all():
        if other.id == labware_id:
            continue

        try:
            collar_slot = state_view.geometry.get_ancestor_slot_name(other.id)
        except _OFF_DECK_ERRORS:
            continue
        side = get_cardinal_neighbor_side(destination, collar_slot)
        if side is None or not state_view.labware.get_has_quirk(
            other.id, "vacuumModuleDock"
        ):
            continue
        if _primary_nozzle_faces_collar(nozzle_map, side):
            continue
        destination_labware = state_view.labware.get(labware_id)
        collar = state_view.labware.get(other.id)
        suggestion = _suggested_configuration(nozzle_map, side)
        raise LocationNotAccessibleByPipetteError(
            f"Cannot move the {channels}-channel pipette to {destination_labware.loadName} "
            f"on {get_flex_slot_id(destination)} with the {nozzle_map.valid_map_key} "
            f"nozzle configuration while {collar.loadName} is {side} of it "
            f"on {get_flex_slot_id(collar_slot)}. "
            f"Use {suggestion}, or move the collar."
        )


class MovementHandler:
    """Implementation logic for gantry movement."""

    _state_store: StateStore
    _model_utils: ModelUtils

    def __init__(
        self,
        state_store: StateStore,
        hardware_api: HardwareControlAPI,
        gantry_mover: GantryMover,
        model_utils: Optional[ModelUtils] = None,
        thermocycler_movement_flagger: Optional[ThermocyclerMovementFlagger] = None,
        heater_shaker_movement_flagger: Optional[HeaterShakerMovementFlagger] = None,
        equipment: Optional[EquipmentHandler] = None,
    ) -> None:
        """Initialize a MovementHandler instance."""
        self._state_store = state_store
        self._model_utils = model_utils or ModelUtils()
        self._tc_movement_flagger = (
            thermocycler_movement_flagger
            or ThermocyclerMovementFlagger(
                state_store=self._state_store,
                hardware_api=hardware_api,
                equipment=equipment
                or EquipmentHandler(
                    hardware_api=hardware_api,
                    state_store=state_store,
                ),
            )
        )
        self._hs_movement_flagger = (
            heater_shaker_movement_flagger
            or HeaterShakerMovementFlagger(
                state_store=self._state_store, hardware_api=hardware_api
            )
        )
        self._hardware_api = hardware_api

        self._gantry_mover = gantry_mover

    async def move_to_well(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: Optional[Union[WellLocation, LiquidHandlingWellLocation]] = None,
        current_well: Optional[CurrentWell] = None,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
        operation_volume: Optional[float] = None,
        offset_pipette_for_reservoir_subwells: bool = False,
    ) -> Point:
        """Move to a specific well."""
        self._state_store.geometry.raise_if_labware_inaccessible_by_pipette(
            labware_id=labware_id
        )

        self._state_store.labware.raise_if_labware_has_labware_on_top(
            labware_id=labware_id
        )

        # Block pipette access to labware that is physically contained inside
        # another labware (e.g. a collection plate inside a vacuum collar).
        self._state_store.labware.raise_if_labware_is_contained(labware_id=labware_id)

        await self._tc_movement_flagger.ensure_labware_in_open_thermocycler(
            labware_parent=self._state_store.labware.get_location(labware_id=labware_id)
        )

        # Check for presence of heater shakers on deck, and if planned
        # pipette movement is allowed
        hs_movement_restrictors = (
            self._state_store.modules.get_heater_shaker_movement_restrictors()
        )

        ancestor = self._state_store.geometry.get_ancestor_slot_name(labware_id)
        if isinstance(ancestor, StagingSlotName):
            raise LocationIsStagingSlotError(
                "Cannot move to well on labware in Staging Area Slot."
            )

        raise_if_nozzle_configuration_hits_vacuum_collar(
            pipette_id=pipette_id,
            labware_id=labware_id,
            state_view=self._state_store,
        )

        dest_slot_int = ancestor.as_int()

        self._hs_movement_flagger.raise_if_movement_restricted(
            hs_movement_restrictors=hs_movement_restrictors,
            destination_slot=dest_slot_int,
            is_multi_channel=(self._state_store.pipettes.get_channels(pipette_id) > 1),
            destination_is_tip_rack=self._state_store.labware.is_tiprack(labware_id),
        )

        # get the pipette's mount and current critical point, if applicable
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
            current_location=current_well,
        )
        origin_cp = pipette_location.critical_point

        await self._gantry_mover.prepare_for_mount_movement(
            pipette_location.mount.to_hw_mount()
        )
        origin = await self._gantry_mover.get_position(pipette_id=pipette_id)
        max_travel_z = self._gantry_mover.get_max_travel_z(pipette_id=pipette_id)

        # calculate the movement's waypoints
        waypoints = self._state_store.motion.get_movement_waypoints_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            origin=origin,
            origin_cp=origin_cp,
            max_travel_z=max_travel_z,
            current_well=current_well,
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
            operation_volume=operation_volume,
            offset_pipette_for_reservoir_subwells=offset_pipette_for_reservoir_subwells,
        )

        speed = self._state_store.pipettes.get_movement_speed(
            pipette_id=pipette_id, requested_speed=speed
        )

        final_point = await self._gantry_mover.move_to(
            pipette_id=pipette_id, waypoints=waypoints, speed=speed
        )

        return final_point

    async def move_mount_to(
        self, mount: MountType, destination: DeckPoint, speed: Optional[float] = None
    ) -> Point:
        """Move mount to a specific location on the deck."""
        hw_mount = mount.to_hw_mount()
        await self._gantry_mover.prepare_for_mount_movement(hw_mount)
        origin = await self._gantry_mover.get_position_from_mount(mount=hw_mount)
        max_travel_z = self._gantry_mover.get_max_travel_z_from_mount(mount=mount)

        # calculate the movement's waypoints
        waypoints = self._state_store.motion.get_movement_waypoints_to_coords(
            origin=origin,
            dest=Point(x=destination.x, y=destination.y, z=destination.z),
            max_travel_z=max_travel_z,
            direct=False,
            additional_min_travel_z=None,
        )

        # move through the waypoints
        final_point = await self._gantry_mover.move_mount_to(
            mount=hw_mount,
            waypoints=waypoints,
            speed=speed,
        )

        return final_point

    async def move_to_addressable_area(
        self,
        pipette_id: str,
        addressable_area_name: str,
        offset: AddressableOffsetVector,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
        stay_at_highest_possible_z: bool = False,
        ignore_tip_configuration: Optional[bool] = True,
        highest_possible_z_extra_offset: Optional[float] = None,
    ) -> Point:
        """Move to a specific addressable area."""
        # Check for presence of heater shakers on deck, and if planned
        # pipette movement is allowed
        hs_movement_restrictors = (
            self._state_store.modules.get_heater_shaker_movement_restrictors()
        )

        dest_slot_int = (
            self._state_store.addressable_areas.get_addressable_area_base_slot(
                addressable_area_name
            ).as_int()
        )

        self._hs_movement_flagger.raise_if_movement_restricted(
            hs_movement_restrictors=hs_movement_restrictors,
            destination_slot=dest_slot_int,
            is_multi_channel=(self._state_store.pipettes.get_channels(pipette_id) > 1),
            destination_is_tip_rack=False,
        )

        # TODO(jbl 11-28-2023) check if addressable area is a deck slot, and if it is check if there are no labware
        #   or modules on top.

        # get the pipette's mount and current critical point, if applicable
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
            current_location=None,
        )
        origin_cp = pipette_location.critical_point

        await self._gantry_mover.prepare_for_mount_movement(
            pipette_location.mount.to_hw_mount()
        )
        origin = await self._gantry_mover.get_position(pipette_id=pipette_id)
        max_travel_z = self._gantry_mover.get_max_travel_z(pipette_id=pipette_id)

        # calculate the movement's waypoints
        waypoints = self._state_store.motion.get_movement_waypoints_to_addressable_area(
            addressable_area_name=addressable_area_name,
            offset=offset,
            origin=origin,
            origin_cp=origin_cp,
            max_travel_z=max_travel_z,
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
            stay_at_max_travel_z=stay_at_highest_possible_z,
            ignore_tip_configuration=ignore_tip_configuration,
            max_travel_z_extra_margin=highest_possible_z_extra_offset,
        )

        speed = self._state_store.pipettes.get_movement_speed(
            pipette_id=pipette_id, requested_speed=speed
        )

        final_point = await self._gantry_mover.move_to(
            pipette_id=pipette_id, waypoints=waypoints, speed=speed
        )

        return final_point

    async def move_relative(
        self,
        pipette_id: str,
        axis: MovementAxis,
        distance: float,
    ) -> Point:
        """Move a given pipette a relative amount in millimeters."""
        delta = Point(
            x=distance if axis == MovementAxis.X else 0,
            y=distance if axis == MovementAxis.Y else 0,
            z=distance if axis == MovementAxis.Z else 0,
        )

        speed = self._state_store.pipettes.get_movement_speed(pipette_id=pipette_id)

        point = await self._gantry_mover.move_relative(
            pipette_id=pipette_id,
            delta=delta,
            speed=speed,
        )

        return point

    async def move_to_coordinates(
        self,
        pipette_id: str,
        deck_coordinates: DeckPoint,
        direct: bool,
        additional_min_travel_z: Optional[float],
        speed: Optional[float] = None,
    ) -> Point:
        """Move pipette to a given deck coordinate."""
        # get the pipette's mount, if applicable
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id
        )
        await self._gantry_mover.prepare_for_mount_movement(
            pipette_location.mount.to_hw_mount()
        )
        origin = await self._gantry_mover.get_position(pipette_id=pipette_id)
        max_travel_z = self._gantry_mover.get_max_travel_z(pipette_id=pipette_id)

        # calculate the movement's waypoints
        waypoints = self._state_store.motion.get_movement_waypoints_to_coords(
            origin=origin,
            dest=Point(
                x=deck_coordinates.x, y=deck_coordinates.y, z=deck_coordinates.z
            ),
            max_travel_z=max_travel_z,
            direct=direct,
            additional_min_travel_z=additional_min_travel_z,
        )

        speed = self._state_store.pipettes.get_movement_speed(
            pipette_id=pipette_id, requested_speed=speed
        )

        # move through the waypoints
        final_point = await self._gantry_mover.move_to(
            pipette_id=pipette_id,
            waypoints=waypoints,
            speed=speed,
        )

        return final_point

    async def home(self, axes: Optional[List[MotorAxis]]) -> None:
        """Send the requested axes to their "home" positions.

        If axes is `None`, will home all motors.
        """
        await self._gantry_mover.home(axes)

    async def retract_axis(self, axis: MotorAxis) -> None:
        """Retract the requested axis as close to its home positions as safely possible.

        For the OT2, the axis will retract to a safe distance from its limit switch,
        and then probe the limit switch to reach the home position.
        For the OT3, the axis will retract to its known home position.
        """
        await self._gantry_mover.retract_axis(axis)

    async def check_for_valid_position(self, mount: MountType) -> bool:
        """Check if any axes have an unknown position.

        Returns `True` if the mount position is known, or `False` if it is not known.
        """
        try:
            await self._hardware_api.gantry_position(
                mount=mount.to_hw_mount(), fail_on_not_homed=True
            )
        except PositionUnknownError:
            return False
        return True
