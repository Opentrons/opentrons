"""Movement command handling."""
from typing import Optional
from dataclasses import dataclass
from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.hardware_control.types import CriticalPoint

from ..types import WellLocation, DeckPoint
from ..state import StateStore, CurrentWell
from ..resources import ModelUtils


@dataclass(frozen=True)
class SavedPositionData:
    """The result of a save position procedure."""

    positionId: str
    position: DeckPoint


class MovementHandler:
    """Implementation logic for gantry movement."""

    _state_store: StateStore
    _hardware_api: HardwareAPI
    _model_utils: ModelUtils

    def __init__(
        self,
        state_store: StateStore,
        hardware_api: HardwareAPI,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize a MovementHandler instance."""
        self._state_store = state_store
        self._hardware_api = hardware_api
        self._model_utils = model_utils or ModelUtils()

    async def move_to_well(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocation] = None,
        current_well: Optional[CurrentWell] = None,
    ) -> None:
        """Move to a specific well."""
        # get the pipette's mount and current critical point, if applicable
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
            current_well=current_well,
        )

        hw_mount = pipette_location.mount.to_hw_mount()
        origin_cp = pipette_location.critical_point

        # get the origin of the movement from the hardware controller
        origin = await self._hardware_api.gantry_position(
            mount=hw_mount,
            critical_point=origin_cp,
        )
        max_travel_z = self._hardware_api.get_instrument_max_height(mount=hw_mount)

        # calculate the movement's waypoints
        waypoints = self._state_store.motion.get_movement_waypoints(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            origin=origin,
            origin_cp=origin_cp,
            max_travel_z=max_travel_z,
            current_well=current_well,
        )

        # move through the waypoints
        for wp in waypoints:
            await self._hardware_api.move_to(
                mount=hw_mount,
                abs_position=wp.position,
                critical_point=wp.critical_point,
            )

    async def save_position(
        self, pipette_id: str, position_id: Optional[str]
    ) -> SavedPositionData:
        """Get the pipette position and save to state."""
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
        )

        hw_mount = pipette_location.mount.to_hw_mount()
        pip_cp = pipette_location.critical_point
        if pip_cp is None:
            hw_pipette = self._state_store.pipettes.get_hardware_pipette(
                pipette_id=pipette_id,
                attached_pipettes=self._hardware_api.attached_instruments,
            )
            if hw_pipette.config.get("tip_length"):
                pip_cp = CriticalPoint.TIP
            else:
                pip_cp = CriticalPoint.NOZZLE

        # TODO (spp, 2021-11-3): Handle MustHomeError case
        point = await self._hardware_api.gantry_position(
            mount=hw_mount,
            critical_point=pip_cp,
        )

        position_id = position_id or self._model_utils.generate_id()

        return SavedPositionData(
            positionId=position_id,
            position=DeckPoint(x=point.x, y=point.y, z=point.z),
        )
