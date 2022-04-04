"""Post-protocol hardware stopper."""
import logging
from typing import Optional

from opentrons.hardware_control import HardwareControlAPI
from ..state import StateStore
from ..types import MotorAxis, WellLocation
from ..errors import PipetteNotAttachedError

from .movement import MovementHandler
from .pipetting import PipettingHandler


log = logging.getLogger(__name__)

# TODO(mc, 2022-03-07): this constant dup'd from opentrons.protocols.geometry.deck
# to avoid a circular dependency that needs to be figured out.
FIXED_TRASH_ID = "fixedTrash"


class HardwareStopper:
    """Class to implement hardware stopping."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
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

        for pipette_id, tiprack_id in attached_tip_racks.items():
            try:
                await self._pipetting_handler.add_tip(
                    pipette_id=pipette_id,
                    labware_id=tiprack_id,
                )
                # TODO: Add ability to drop tip onto custom trash as well.
                await self._pipetting_handler.drop_tip(
                    pipette_id=pipette_id,
                    labware_id=FIXED_TRASH_ID,
                    well_name="A1",
                    well_location=WellLocation(),
                )

            except PipetteNotAttachedError:
                # this will happen normally during protocol analysis, but
                # should not happen during an actual run
                log.debug(f"Pipette ID {pipette_id} no longer attached.")

    async def do_halt(self) -> None:
        """Issue a halt signal to the hardware API.

        After issuing a halt, you must call do_stop_and_recover after
        anything using the HardwareAPI has settled.
        """
        await self._hardware_api.halt()

    async def do_stop_and_recover(self, drop_tips_and_home: bool = False) -> None:
        """Stop and reset the HardwareAPI, optionally dropping tips and homing."""
        if drop_tips_and_home:
            await self._drop_tip()

        await self._hardware_api.stop(home_after=drop_tips_and_home)
