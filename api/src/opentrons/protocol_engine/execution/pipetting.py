"""Pipetting command handling."""
from typing import Optional, Iterator
from typing_extensions import Protocol as TypingProtocol
from contextlib import contextmanager
from dataclasses import dataclass

from opentrons.types import Mount as HardwareMount
from opentrons.hardware_control import HardwareControlAPI

from ..state import StateStore, HardwarePipette
from ..resources import LabwareDataProvider
from ..types import WellLocation, DeckPoint, CurrentWell
from .movement import MovementHandler


@dataclass(frozen=True)
class VolumePointResult:
    """The returned values of an aspirate or pick up tip operation."""

    volume: float
    position: DeckPoint


class PipettingHandler(TypingProtocol):
    """Liquid handling commands."""

    async def aspirate_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Set flow-rate and aspirate."""

    def get_is_ready_to_aspirate(self, pipette_id: str) -> bool:
        """Get whether a pipette is ready to aspirate."""

    async def prepare_for_aspirate(self, mount: HardwareMount) -> None:
        """Prepare for pipette aspiration."""

    async def dispense_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Dispense liquid without moving the pipette."""

    async def blow_out_in_place(
        self,
        pipette_id: str,
        flow_rate: float,
    ) -> None:
        """Set flow rate and blow-out."""

    @contextmanager
    def set_flow_rate(
        self,
        pipette: HardwarePipette,
        aspirate_flow_rate: Optional[float] = None,
        dispense_flow_rate: Optional[float] = None,
        blow_out_flow_rate: Optional[float] = None,
    ) -> Iterator[None]:
        """Context manager for setting flow rate before calling aspirate, dispense, or blowout."""

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


class HardwarePipettingHandler(PipettingHandler):
    """Liquid handling, using the Hardware API.""" ""

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

    async def aspirate_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Aspirate liquid from a well."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )
        with self.set_flow_rate(pipette=hw_pipette, aspirate_flow_rate=flow_rate):
            await self._hardware_api.aspirate(mount=hw_pipette.mount, volume=volume)

        return volume

    def get_is_ready_to_aspirate(self, pipette_id: str) -> bool:
        """Get whether a pipette is ready to aspirate."""
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )
        return (
            self._state_store.pipettes.get_aspirated_volume(pipette_id) is not None
            or hw_pipette.config["ready_to_aspirate"]
        )

    async def prepare_for_aspirate(self, mount: HardwareMount) -> None:
        """Prepare for pipette aspiration."""
        await self._hardware_api.prepare_for_aspirate(mount=mount)

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

    async def blow_out_in_place(
        self,
        pipette_id: str,
        flow_rate: float,
    ) -> None:
        """Set flow rate and blow-out."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state_store.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )
        with self.set_flow_rate(pipette=hw_pipette, blow_out_flow_rate=flow_rate):
            await self._hardware_api.blow_out(mount=hw_pipette.mount)

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


class VirtualPipettingHandler(PipettingHandler):
    """Liquid handling, using the virtual pipettes.""" ""

    _state_store: StateStore

    def __init__(
        self,
        state_store: StateStore,
    ) -> None:
        """Initialize a PipettingHandler instance."""
        self._state_store = state_store

    async def aspirate_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Aspirate liquid from a well."""
        # get mount and config data from state and hardware controller
        return volume

    def get_is_ready_to_aspirate(self, pipette_id: str) -> bool:
        """Get whether a pipette is ready to aspirate."""
        return self._state_store.pipettes.get_aspirated_volume(pipette_id) is not None

    async def prepare_for_aspirate(self, mount: HardwareMount) -> None:
        """Prepare for pipette aspiration."""
        pass

    async def dispense_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Dispense liquid without moving the pipette."""
        return volume

    async def blow_out_in_place(
        self,
        pipette_id: str,
        flow_rate: float,
    ) -> None:
        """Set flow rate and blow-out."""
        # get mount and config data from state and hardware controller
        pass

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
        # target_well = CurrentWell(
        #     pipette_id=pipette_id,
        #     labware_id=labware_id,
        #     well_name=well_name,
        # )
        #
        # # get pipette mount and critical point for our touch tip moves
        # pipette_location = self._state_store.motion.get_pipette_location(
        #     pipette_id=pipette_id,
        #     current_well=target_well,
        # )
        #
        # touch_points = self._state_store.geometry.get_touch_points(
        #     labware_id=labware_id,
        #     well_name=well_name,
        #     well_location=well_location,
        #     mount=pipette_location.mount,
        #     radius=radius,
        # )
        #
        # speed = self._state_store.pipettes.get_movement_speed(
        #     pipette_id=pipette_id, requested_speed=speed
        # )
        #
        # # this will handle raising if the thermocycler lid is in a bad state
        # # so we don't need to put that logic elsewhere
        # well_position = await self._movement_handler.move_to_well(
        #     pipette_id=pipette_id,
        #     labware_id=labware_id,
        #     well_name=well_name,
        #     well_location=well_location,
        # )
        #
        # for touch_point in touch_points:
        #     await self._hardware_api.move_to(
        #         mount=pipette_location.mount.to_hw_mount(),
        #         critical_point=pipette_location.critical_point,
        #         abs_position=touch_point,
        #         speed=speed,
        #     )
        # try:
        #     final_point = touch_points[-1]
        #     position = DeckPoint(x=final_point.x, y=final_point.y, z=final_point.z)
        # except IndexError:
        #     position = well_position
        #
        # return position
        pass

    @contextmanager
    def set_flow_rate(
        self,
        pipette: HardwarePipette,
        aspirate_flow_rate: Optional[float] = None,
        dispense_flow_rate: Optional[float] = None,
        blow_out_flow_rate: Optional[float] = None,
    ) -> Iterator[None]:
        """Context manager for setting flow rate before calling aspirate, dispense, or blowout."""
        pass


def create_pipette_handler(
    state_store: StateStore,
    hardware_api: HardwareControlAPI,
    movement_handler: MovementHandler,
) -> PipettingHandler:
    """Create a tip handler."""
    return (
        HardwarePipettingHandler(
            state_store=state_store,
            hardware_api=hardware_api,
            movement_handler=movement_handler,
        )
        if state_store.config.use_virtual_pipettes is False
        else VirtualPipettingHandler(state_store=state_store)
    )
