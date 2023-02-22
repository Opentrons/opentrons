"""Pipetting command handling."""
from typing import Optional, Iterator
from contextlib import contextmanager
from dataclasses import dataclass

from opentrons.hardware_control import HardwareControlAPI

from ..state import StateStore, CurrentWell, HardwarePipette
from ..resources import LabwareDataProvider
from ..types import WellLocation, WellOrigin, DeckPoint
from .movement import MovementHandler


@dataclass(frozen=True)
class VolumePointResult:
    """The returned values of an aspirate or pick up tip operation."""

    volume: float
    position: DeckPoint


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

    async def aspirate(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
        flow_rate: float,
    ) -> VolumePointResult:
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

        position = await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            current_well=current_well,
        )

        with self.set_flow_rate(pipette=hw_pipette, aspirate_flow_rate=flow_rate):
            await self._hardware_api.aspirate(mount=hw_pipette.mount, volume=volume)

        return VolumePointResult(volume=volume, position=position)

    async def dispense_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Dispense liquid without moving the pipette."""
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )

        with self.set_flow_rate(pipette=hw_pipette, dispense_flow_rate=flow_rate):
            await self._hardware_api.dispense(mount=hw_pipette.mount, volume=volume)

        return volume

    async def touch_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        radius: float,
        speed: Optional[float],
    ) -> DeckPoint:
        """Touch the pipette tip to the sides of a well."""
        target_well = CurrentWell(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
        )

        # get pipette mount and critical point for our touch tip moves
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
            current_well=target_well,
        )

        touch_points = self._state_store.geometry.get_touch_points(
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            mount=pipette_location.mount,
            radius=radius,
        )

        speed = self._state_store.pipettes.get_movement_speed(
            pipette_id=pipette_id, requested_speed=speed
        )

        # this will handle raising if the thermocycler lid is in a bad state
        # so we don't need to put that logic elsewhere
        well_position = await self._movement_handler.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        for touch_point in touch_points:
            await self._hardware_api.move_to(
                mount=pipette_location.mount.to_hw_mount(),
                critical_point=pipette_location.critical_point,
                abs_position=touch_point,
                speed=speed,
            )
        try:
            final_point = touch_points[-1]
            position = DeckPoint(x=final_point.x, y=final_point.y, z=final_point.z)
        except IndexError:
            position = well_position

        return position

    @contextmanager
    def set_flow_rate(
        self,
        pipette: HardwarePipette,
        aspirate_flow_rate: Optional[float] = None,
        dispense_flow_rate: Optional[float] = None,
        blow_out_flow_rate: Optional[float] = None,
    ) -> Iterator[None]:
        """Context manager for setting flow rate before calling aspirate, dispense, or blowout."""
        original_aspirate_rate = pipette.config["aspirate_flow_rate"]
        original_dispense_rate = pipette.config["dispense_flow_rate"]
        original_blow_out_rate = pipette.config["blow_out_flow_rate"]
        self._hardware_api.set_flow_rate(
            pipette.mount,
            aspirate=aspirate_flow_rate,
            dispense=dispense_flow_rate,
            blow_out=blow_out_flow_rate,
        )
        try:
            yield
        finally:
            self._hardware_api.set_flow_rate(
                pipette.mount,
                aspirate=original_aspirate_rate,
                dispense=original_dispense_rate,
                blow_out=original_blow_out_rate,
            )
