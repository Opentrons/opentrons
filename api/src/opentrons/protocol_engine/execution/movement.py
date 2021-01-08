"""Movement command handling."""
from typing import Optional
from opentrons.hardware_control.api import API as HardwareAPI

from ..types import DeckLocation, WellLocation
from ..state import StateView


class MovementHandler:
    """Implementation logic for gantry movement."""

    _state: StateView
    _hardware: HardwareAPI

    def __init__(
        self,
        state: StateView,
        hardware: HardwareAPI,
    ) -> None:
        """Initialize a MovementHandler instance."""
        self._state = state
        self._hardware = hardware

    async def move_to_well(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocation] = None,
        current_location: Optional[DeckLocation] = None,
    ) -> None:
        """Move to a specific well."""
        # get the pipette's mount and current critical point, if applicable
        pipette_location = self._state.motion.get_pipette_location(
            pipette_id=pipette_id,
            current_location=current_location,
        )

        hw_mount = pipette_location.mount.to_hw_mount()
        origin_cp = pipette_location.critical_point

        # get the origin of the movement from the hardware controller
        origin = await self._hardware.gantry_position(
            mount=hw_mount,
            critical_point=origin_cp,
        )
        max_travel_z = self._hardware.get_instrument_max_height(mount=hw_mount)

        # calculate the movement's waypoints
        waypoints = self._state.motion.get_movement_waypoints(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            origin=origin,
            origin_cp=origin_cp,
            max_travel_z=max_travel_z,
            current_location=current_location,
        )

        # move through the waypoints
        for wp in waypoints:
            await self._hardware.move_to(
                mount=hw_mount,
                abs_position=wp.position,
                critical_point=wp.critical_point
            )
