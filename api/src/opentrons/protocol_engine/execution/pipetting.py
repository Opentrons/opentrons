"""Pipetting command handling."""
from typing import NamedTuple, Optional

from opentrons.types import Mount as HardwareMount
from opentrons.hardware_control import HardwareControlAPI

from ..state import StateStore, CurrentWell
from ..resources import LabwareDataProvider
from ..types import WellLocation, WellOrigin
from .movement import MovementHandler


class _TipPickupData(NamedTuple):
    hw_mount: HardwareMount
    tip_length: float
    tip_diameter: float
    tip_volume: int


class PipettingHandler:
    """Implementation logic for liquid handling commands."""

    _state_store: StateStore
    _hardware_api: HardwareControlAPI
    _movement_handler: MovementHandler

    def __init__(
        self,
        state_store: StateStore,
        hardware_api: HardwareControlAPI,
        movement_handler: MovementHandler,
        labware_data_provider: Optional[LabwareDataProvider] = None,
    ) -> None:
        """Initialize a PipettingHandler instance."""
        self._state_store = state_store
        self._hardware_api = hardware_api
        self._movement_handler = movement_handler
        self._labware_data_provider = labware_data_provider or LabwareDataProvider()

    async def _get_tip_details(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: Optional[str] = None,
    ) -> _TipPickupData:
        """Retrieve data needed by the HardwareAPI for a tip pickup."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        # get the requested tip rack's definition for pulling calibrated tip length
        tip_rack_def = self._state_store.labware.get_definition(labware_id)

        # use config data to get tip geometry (length, diameter, volume)
        nominal_tip_geometry = self._state_store.geometry.get_nominal_tip_geometry(
            labware_id=labware_id,
            well_name=well_name,
            pipette_config=hw_pipette.config,
        )

        # TODO(mc, 2022-01-12): this call hits the filesystem, which has performance
        # implications over the course of a protocol since most calls will be redundant
        tip_length = await self._labware_data_provider.get_calibrated_tip_length(
            pipette_serial=hw_pipette.config["pipette_id"],
            labware_definition=tip_rack_def,
        )

        if tip_length is None:
            tip_length = nominal_tip_geometry.effective_length

        return _TipPickupData(
            hw_mount=hw_pipette.mount,
            tip_length=tip_length,
            tip_diameter=nominal_tip_geometry.diameter,
            tip_volume=nominal_tip_geometry.volume,
        )

    async def pick_up_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
    ) -> None:
        """Pick up a tip at the specified "well"."""
        hw_mount, tip_length, tip_diameter, tip_volume = await self._get_tip_details(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
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
            mount=hw_mount,
            tip_length=tip_length,
            # TODO(mc, 2020-11-12): include these parameters in the request
            presses=None,
            increment=None,
        )

        # after a successful pickup, update the hardware controller state
        self._hardware_api.set_current_tiprack_diameter(
            mount=hw_mount,
            tiprack_diameter=tip_diameter,
        )
        self._hardware_api.set_working_volume(
            mount=hw_mount,
            tip_volume=tip_volume,
        )

    async def add_tip(self, pipette_id: str, labware_id: str) -> None:
        """Manually add a tip to a pipette in the hardware API.

        Used to enable a drop tip even if the HW API thinks no tip is attached.
        """
        hw_mount, tip_length, tip_diameter, tip_volume = await self._get_tip_details(
            pipette_id=pipette_id,
            labware_id=labware_id,
        )

        await self._hardware_api.add_tip(mount=hw_mount, tip_length=tip_length)
        self._hardware_api.set_current_tiprack_diameter(
            mount=hw_mount,
            tiprack_diameter=tip_diameter,
        )
        self._hardware_api.set_working_volume(mount=hw_mount, tip_volume=tip_volume)

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

    async def touch_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        radius: float = 1.0,
        v_offset: float = -1.0,
        speed: float = 60.0,
    ) -> None:
        """Touch the pipette tip to the sides of a well."""
        # get mount and config data from state and hardware controller
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

        # TODO can we make this assumption?
        current_well = CurrentWell(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
        )

        await self._movement_handler.move_to_edges(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            current_well=current_well,
        )
