"""Post-protocol hardware stopper."""
import logging
from typing import Optional

from opentrons.hardware_control import HardwareControlAPI

from ..state import StateStore
from ..types import PostRunHardwareState
from ..types import MotorAxis

from .movement import MovementHandler
from .gantry_mover import HardwareGantryMover
from .tip_handler import TipHandler, HardwareTipHandler

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
        tip_handler: Optional[TipHandler] = None,
    ) -> None:
        """Hardware stopper initializer."""
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._movement_handler = movement or MovementHandler(
            hardware_api=hardware_api,
            state_store=state_store,
            gantry_mover=HardwareGantryMover(
                hardware_api=hardware_api,
                state_view=state_store,
            ),
        )
        self._tip_handler = tip_handler or HardwareTipHandler(
            hardware_api=hardware_api,
            state_view=state_store,
        )

    async def do_halt(self, disengage_before_stopping: bool = False) -> None:
        """Issue a halt signal to the hardware API.

        After issuing a halt, you must call do_stop_and_recover after
        anything using the HardwareAPI has settled.
        """
        await self._hardware_api.halt(
            disengage_before_stopping=disengage_before_stopping
        )

    async def do_stop_and_recover(
        self, post_run_hardware_state: PostRunHardwareState
    ) -> None:
        """Stop and reset the HardwareAPI, perform homing if the pipette is empty."""
        attached_tips = self._state_store.pipettes.get_all_attached_tips()
        if attached_tips:
            await self._hardware_api.stop(home_after=False)
            await self._movement_handler.home(
                axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
            )
        else:
            home_after_stop = post_run_hardware_state in (
                PostRunHardwareState.HOME_AND_STAY_ENGAGED,
                PostRunHardwareState.HOME_THEN_DISENGAGE,
            )
            await self._hardware_api.stop(home_after=home_after_stop)
