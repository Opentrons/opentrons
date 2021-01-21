"""Pipetting command handling."""
from opentrons.hardware_control.api import API as HardwareAPI

from ..state import StateView
from ..types import DeckLocation, WellLocation, WellOrigin
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

    async def pick_up_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
    ) -> None:
        """Pick up a tip at the specified "well"."""
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
        await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
        )

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

    async def drop_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
    ) -> None:
        """Drop a tip at the specified "well"."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware.attached_instruments
        )

        # get the tip drop location
        well_location = self._state.geometry.get_tip_drop_location(
            labware_id=labware_id,
            pipette_config=hw_pipette.config,
        )

        # move the pipette to tip drop location
        await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        # perform the tip drop routine
        await self._hardware.drop_tip(
            mount=hw_pipette.mount,
            # TODO(mc, 2020-11-12): include this parameter in the request
            home_after=True
        )

    async def aspirate(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
    ) -> float:
        """Aspirate liquid from a well."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware.attached_instruments
        )

        ready_to_aspirate = self._state.pipettes.get_is_ready_to_aspirate(
            pipette_id=pipette_id,
            pipette_config=hw_pipette.config,
        )

        current_location = None

        if not ready_to_aspirate:
            await self._movement_handler.move_to_well(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=WellLocation(origin=WellOrigin.TOP, offset=(0, 0, 0)),
            )

            await self._hardware.prepare_for_aspirate(mount=hw_pipette.mount)

            # set our current deck location to the well now that we've made
            # an intermediate move for the "prepare for aspirate" step
            current_location = DeckLocation(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name)

        await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            current_location=current_location,
        )

        await self._hardware.aspirate(mount=hw_pipette.mount, volume=volume)

        return volume

    async def dispense(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
    ) -> float:
        """Dispense liquid to a well."""
        hw_pipette = self._state.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware.attached_instruments
        )

        await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        await self._hardware.dispense(mount=hw_pipette.mount, volume=volume)

        return volume
