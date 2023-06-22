"""Movement command handling."""
from __future__ import annotations

import logging
from typing import Optional, List

from opentrons.types import Point
from opentrons.hardware_control import HardwareControlAPI

from ..types import WellLocation, DeckPoint, MovementAxis, MotorAxis, CurrentWell
from ..state import StateStore
from ..resources import ModelUtils
from .thermocycler_movement_flagger import ThermocyclerMovementFlagger
from .heater_shaker_movement_flagger import HeaterShakerMovementFlagger

from .gantry_mover import GantryMover


log = logging.getLogger(__name__)


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
    ) -> None:
        """Initialize a MovementHandler instance."""
        self._state_store = state_store
        self._model_utils = model_utils or ModelUtils()
        self._tc_movement_flagger = (
            thermocycler_movement_flagger
            or ThermocyclerMovementFlagger(
                state_store=self._state_store, hardware_api=hardware_api
            )
        )
        self._hs_movement_flagger = (
            heater_shaker_movement_flagger
            or HeaterShakerMovementFlagger(
                state_store=self._state_store, hardware_api=hardware_api
            )
        )

        self._gantry_mover = gantry_mover

    async def move_to_well(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocation] = None,
        current_well: Optional[CurrentWell] = None,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
    ) -> Point:
        """Move to a specific well."""
        self._state_store.labware.raise_if_labware_has_labware_on_top(
            labware_id=labware_id
        )

        await self._tc_movement_flagger.raise_if_labware_in_non_open_thermocycler(
            labware_parent=self._state_store.labware.get_location(labware_id=labware_id)
        )

        # Check for presence of heater shakers on deck, and if planned
        # pipette movement is allowed
        hs_movement_restrictors = (
            self._state_store.modules.get_heater_shaker_movement_restrictors()
        )

        # TODO (spp, 2022-12-14): remove once we understand why sometimes moveLabware
        #  fails saying that h/s latch is closed even when it is not.
        log.info(f"H/S movement restrictors: {hs_movement_restrictors}")

        dest_slot_int = self._state_store.geometry.get_ancestor_slot_name(
            labware_id
        ).as_int()

        self._hs_movement_flagger.raise_if_movement_restricted(
            hs_movement_restrictors=hs_movement_restrictors,
            destination_slot=dest_slot_int,
            is_multi_channel=(
                self._state_store.tips.get_pipette_channels(pipette_id) > 1
            ),
            destination_is_tip_rack=self._state_store.labware.is_tiprack(labware_id),
        )

        # get the pipette's mount and current critical point, if applicable
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
            current_well=current_well,
        )
        origin_cp = pipette_location.critical_point

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

    async def home(self, axes: Optional[List[MotorAxis]]) -> None:
        """Send the requested axes to their "home" positions.

        If axes is `None`, will home all motors.
        """
        await self._gantry_mover.home(axes)

    async def move_to_coordinates(
        self,
        pipette_id: str,
        deck_coordinates: DeckPoint,
        direct: bool,
        additional_min_travel_z: Optional[float],
        speed: Optional[float] = None,
    ) -> Point:
        """Move pipette to a given deck coordinate."""
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
