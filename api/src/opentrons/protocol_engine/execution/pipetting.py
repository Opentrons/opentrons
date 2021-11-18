"""Pipetting command handling."""
from opentrons.hardware_control.api import API as HardwareAPI

from ..state import StateStore, CurrentWell
from ..types import WellLocation, WellOrigin
from .movement import MovementHandler


class PipettingHandler:
    """Implementation logic for liquid handling commands."""

    _state_store: StateStore
    _hardware_api: HardwareAPI
    _movement_handler: MovementHandler

    def __init__(
        self,
        state_store: StateStore,
        hardware_api: HardwareAPI,
        movement_handler: MovementHandler,
    ) -> None:
        """Initialize a PipettingHandler instance."""
        self._state_store = state_store
        self._hardware_api = hardware_api
        self._movement_handler = movement_handler

    async def pick_up_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
    ) -> None:
        """Pick up a tip at the specified "well"."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        # use config data to get tip geometry (length, diameter, volume)
        tip_geometry = self._state_store.geometry.get_tip_geometry(
            labware_id=labware_id,
            well_name=well_name,
            pipette_config=hw_pipette.config,
        )

        # move the pipette to the top of the tip
        await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        # perform the tip pickup routine
        await self._hardware_api.pick_up_tip(
            mount=hw_pipette.mount,
            tip_length=tip_geometry.effective_length,
            # TODO(mc, 2020-11-12): include these parameters in the request
            presses=None,
            increment=None,
        )

        # after a successful pickup, update the hardware controller state
        self._hardware_api.set_current_tiprack_diameter(
            mount=hw_pipette.mount,
            tiprack_diameter=tip_geometry.diameter,
        )
        self._hardware_api.set_working_volume(
            mount=hw_pipette.mount,
            tip_volume=tip_geometry.volume,
        )

    async def drop_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
    ) -> None:
        """Drop a tip at the specified "well"."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        # get the adjusted tip drop location
        tip_drop_location = self._state_store.geometry.get_tip_drop_location(
            pipette_config=hw_pipette.config,
            labware_id=labware_id,
            well_location=well_location,
        )

        # move the pipette to tip drop location
        await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=tip_drop_location,
        )

        # perform the tip drop routine
        await self._hardware_api.drop_tip(
            mount=hw_pipette.mount,
            # TODO(mc, 2020-11-12): include this parameter in the request
            home_after=True,
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
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        ready_to_aspirate = self._state_store.pipettes.get_is_ready_to_aspirate(
            pipette_id=pipette_id,
            pipette_config=hw_pipette.config,
        )

        current_well = None

        if not ready_to_aspirate:
            await self._movement_handler.move_to_well(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=WellLocation(origin=WellOrigin.TOP),
            )

            await self._hardware_api.prepare_for_aspirate(mount=hw_pipette.mount)

            # set our current deck location to the well now that we've made
            # an intermediate move for the "prepare for aspirate" step
            current_well = CurrentWell(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
            )

        await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            current_well=current_well,
        )

        await self._hardware_api.aspirate(mount=hw_pipette.mount, volume=volume)

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
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        await self._hardware_api.dispense(mount=hw_pipette.mount, volume=volume)

        return volume
