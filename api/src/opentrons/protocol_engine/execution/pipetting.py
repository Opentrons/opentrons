"""Pipetting command handling."""
from opentrons.hardware_control.api import API as HardwareAPI

from ..state import StateView

from ..command_models import (
    MoveToWellRequest,
    MoveToWellResult
)


class PipettingHandler():
    """Implementation logic for liquid handling commands."""

    def __init__(
        self,
        hardware: HardwareAPI,
        state: StateView,
    ) -> None:
        """Initialize a PipettingHandler instance."""
        self._state = state
        self._hardware: HardwareAPI = hardware

    async def handle_move_to_well(
        self,
        request: MoveToWellRequest,
    ) -> MoveToWellResult:
        """Move to a specific well."""
        # get the pipette's mount and current critical point, if applicable
        pipette_location = self._state.motion.get_pipette_location(
            pipette_id=request.pipetteId,
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
            pipette_id=request.pipetteId,
            labware_id=request.labwareId,
            well_id=request.wellId,
            origin=origin,
            origin_cp=origin_cp,
            max_travel_z=max_travel_z,
        )

        # move through the waypoints
        for position, critical_point in waypoints:
            await self._hardware.move_to(
                mount=hw_mount,
                abs_position=position,
                critical_point=critical_point
            )

        return MoveToWellResult()
