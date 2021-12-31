"""Post-protocol hardware stopper."""
from typing import Optional
from opentrons.hardware_control import (
    API as HardwareAPI
)
from ..state import StateStore
from ..types import MotorAxis, WellLocation

from .movement import MovementHandler
from .pipetting import PipettingHandler


class HardwareStopper:
    def __init__(self,
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
        if not attached_tip_racks:
            return

        for pip_id, tiprack_id in attached_tip_racks.items():
            mount = self._state_store.pipettes.get(pip_id).mount
            await self._hardware_api.add_tip(
                mount=mount.to_hw_mount(),
                tip_length=self._state_store.labware.get_tip_length(tiprack_id)
            )
            # TODO: Add ability to drop tip onto custom trash as well.
            await self._pipetting_handler.drop_tip(pipette_id=pip_id,
                                                   labware_id="fixedTrash",
                                                   well_name="A1",
                                                   well_location=WellLocation())

    async def execute_complete_stop(self) -> None:
        """Run the sequence to stop hardware, drop tip and home."""
        await self._hardware_api.halt()
        await self._hardware_api.stop(home_after=False)
        await self._movement_handler.home(axes=[MotorAxis.X, MotorAxis.Y,
                                                MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z])
        # TODO: This will also do a drop tip after a normal protocol run ends.
        #  Check with UX if this is acceptable. It allows us to home the plunger axes
        #  safely.
        await self._drop_tip()
        await self._hardware_api.stop(home_after=True)

    async def simple_stop(self) -> None:
        """Only issue hardware api stop."""
        await self._hardware_api.stop(home_after=True)
