"""Pipetting command handling."""
from opentrons.hardware_control.api import API as HardwareAPI

from ..state import StateView
from ..command_models import PickUpTipRequest, PickUpTipResult
from .movement import MovementHandler


class PipettingHandler:
    """Implementation logic for liquid handling commands."""

    _state: StateView
    _hardware: HardwareAPI
    _movement_handler: MovementHandler

    def __init__(
        self,
        state: StateView,
        hardware: HardwareAPI,
        movement_handler: MovementHandler,
    ) -> None:
        """Initialize a PipettingHandler instance."""
        self._state = state
        self._hardware = hardware
        self._movement_handler = movement_handler

    async def handle_pick_up_tip(self, request: PickUpTipRequest) -> PickUpTipResult:
        """Pick up a tip at the specified "well"."""
        pipette_id = request.pipetteId
        labware_id = request.labwareId
        well_name = request.wellName

        # get mount and config data from state and hardware controller
        hw_pipette = self._state.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware.attached_instruments
        )

        # use config data to get tip geometry (length, diameter, volume)
        tip_geometry = self._state.geometry.get_tip_geometry(
            labware_id=labware_id,
            well_name=well_name,
            pipette_config=hw_pipette.config,
        )

        # move the pipette to the top of the tip
        await self._movement_handler.handle_move_to_well(request)

        # perform the tip pickup routine
        await self._hardware.pick_up_tip(
            mount=hw_pipette.mount,
            tip_length=tip_geometry.effective_length,
            # TODO(mc, 2020-11-12): include these parameters in the request
            presses=None,
            increment=None
        )

        # after a successful pickup, update the hardware controller state
        self._hardware.set_current_tiprack_diameter(
            mount=hw_pipette.mount,
            tiprack_diameter=tip_geometry.diameter
        )
        self._hardware.set_working_volume(
            mount=hw_pipette.mount,
            tip_volume=tip_geometry.volume
        )

        return PickUpTipResult()
