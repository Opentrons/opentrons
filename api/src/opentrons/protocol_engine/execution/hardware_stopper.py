"""Post-protocol hardware stopper."""
import logging
from typing import Optional

from opentrons.hardware_control import HardwareControlAPI
from opentrons.types import PipetteNotAttachedError as HwPipetteNotAttachedError

from ..resources.ot3_validation import ensure_ot3_hardware
from ..state import StateStore
from ..types import MotorAxis, PostRunHardwareState
from ..errors import HardwareNotSupportedError

from .movement import MovementHandler
from .gantry_mover import HardwareGantryMover
from .tip_handler import TipHandler, HardwareTipHandler
from ...hardware_control.types import OT3Mount

from opentrons.protocol_engine.types import AddressableOffsetVector

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

    async def _drop_tip(self) -> None:
        """Drop currently attached tip, if any, into trash after a run cancel."""
        attached_tips = self._state_store.pipettes.get_all_attached_tips()

        if attached_tips:
            await self._hardware_api.stop(home_after=False)
            # TODO: Update this once gripper MotorAxis is available in engine.
            try:
                ot3api = ensure_ot3_hardware(hardware_api=self._hardware_api)
                if (
                    not self._state_store.config.use_virtual_gripper
                    and ot3api.has_gripper()
                ):
                    await ot3api.home_z(mount=OT3Mount.GRIPPER)
            except HardwareNotSupportedError:
                pass
            await self._movement_handler.home(
                axes=[MotorAxis.X, MotorAxis.Y, MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
            )

            # OT-2 Will only ever use the Fixed Trash Addressable Area
            if self._state_store.config.robot_type == "OT-2 Standard":
                for pipette_id, tip in attached_tips:
                    try:
                        await self._tip_handler.add_tip(pipette_id=pipette_id, tip=tip)
                        # TODO: Add ability to drop tip onto custom trash as well.
                        # if API is 2.15 and below aka is should_have_fixed_trash

                        await self._movement_handler.move_to_addressable_area(
                            pipette_id=pipette_id,
                            addressable_area_name="fixedTrash",
                            offset=AddressableOffsetVector(x=0, y=0, z=0),
                            force_direct=False,
                            speed=None,
                            minimum_z_height=None,
                        )

                        await self._tip_handler.drop_tip(
                            pipette_id=pipette_id,
                            home_after=False,
                        )

                    except HwPipetteNotAttachedError:
                        # this will happen normally during protocol analysis, but
                        # should not happen during an actual run
                        log.debug(f"Pipette ID {pipette_id} no longer attached.")

            else:
                log.debug(
                    "Flex protocols do not support automatic tip dropping at this time."
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
        self,
        post_run_hardware_state: PostRunHardwareState,
        drop_tips_after_run: bool = False,
    ) -> None:
        """Stop and reset the HardwareAPI, homing and dropping tips independently if specified."""
        home_after_stop = post_run_hardware_state in (
            PostRunHardwareState.HOME_AND_STAY_ENGAGED,
            PostRunHardwareState.HOME_THEN_DISENGAGE,
        )
        if drop_tips_after_run:
            await self._drop_tip()
            await self._hardware_api.stop(home_after=home_after_stop)

        elif home_after_stop:
            if len(self._state_store.pipettes.get_all_attached_tips()) == 0:
                await self._hardware_api.stop(home_after=home_after_stop)
            else:
                try:
                    ot3api = ensure_ot3_hardware(hardware_api=self._hardware_api)
                    if (
                        not self._state_store.config.use_virtual_gripper
                        and ot3api.has_gripper()
                    ):
                        await ot3api.home_z(mount=OT3Mount.GRIPPER)
                except HardwareNotSupportedError:
                    pass

                await self._movement_handler.home(
                    axes=[
                        MotorAxis.X,
                        MotorAxis.Y,
                        MotorAxis.LEFT_Z,
                        MotorAxis.RIGHT_Z,
                    ]
                )
        else:
            await self._hardware_api.stop(home_after=home_after_stop)
