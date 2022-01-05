"""Post-protocol hardware stopper."""
from typing import Optional
from opentrons.hardware_control import API as HardwareAPI
from ..state import StateStore
from ..types import MotorAxis, WellLocation

from .movement import MovementHandler
from .pipetting import PipettingHandler


class HardwareStopper:
    """Class to implement hardware stopping."""

    def __init__(
        self,
        hardware_api: HardwareAPI,
        state_store: StateStore,
        movement: Optional[MovementHandler] = None,
        pipetting: Optional[PipettingHandler] = None,
    ) -> None:
        """Hardware stopper initializer."""
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._movement_handler = movement or MovementHandler(
            hardware_api=hardware_api,
            state_store=state_store,
        )

        self._pipetting_handler = pipetting or PipettingHandler(
            hardware_api=hardware_api,
            state_store=state_store,
            movement_handler=self._movement_handler,
        )

    async def _drop_tip(self) -> None:
        """Drop currently attached tip, if any, into trash after a run cancel."""
        attached_tip_racks = self._state_store.pipettes.get_attached_tip_labware_by_id()

        if attached_tip_racks:
            await self._hardware_api.stop(home_after=False)
            await self._movement_handler.home(
                axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
            )
        for pip_id, tiprack_id in attached_tip_racks.items():
            hw_pipette = self._state_store.pipettes.get_hardware_pipette(
                pipette_id=pip_id,
                attached_pipettes=self._hardware_api.attached_instruments,
            )
            tip_geometry = self._state_store.geometry.get_tip_geometry(
                labware_id=tiprack_id,
                well_name="A1",
                pipette_config=hw_pipette.config,
            )
            await self._hardware_api.add_tip(
                mount=hw_pipette.mount,
                tip_length=tip_geometry.effective_length,
            )
            # TODO: Add ability to drop tip onto custom trash as well.
            await self._pipetting_handler.drop_tip(
                pipette_id=pip_id,
                labware_id="fixedTrash",
                well_name="A1",
                well_location=WellLocation(),
            )

    async def do_halt_and_recover(self) -> None:
        """Run the sequence to stop hardware, drop tip and home."""
        await self._hardware_api.halt()
        await self._drop_tip()
        await self._hardware_api.stop(home_after=True)

    async def do_stop(self) -> None:
        """Only issue hardware api stop."""
        # TODO: Don't home after once the stop/ drop tip initiation is moved to client
        await self._hardware_api.stop(home_after=True)
