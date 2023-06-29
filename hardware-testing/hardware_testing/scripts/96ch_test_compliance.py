import asyncio
import argparse

from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    get_slot_calibration_square_position_ot3)
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

import logging

logging.basicConfig(level=logging.INFO)

async def _main() -> None:
    api = await build_async_ot3_hardware_api(
        pipette_left="p1000_96_v3.4",
        stall_detection_enable=False,
        gripper="GRPV1120230323A01"
    )
    await api.reset()

    try:
        #home and record home positions
        await api.home()
        home_pos = await api.gantry_position(OT3Mount.LEFT)
        home_pos_grip = await api.gantry_position(OT3Mount.GRIPPER)

        for i in range(CYCLES):
            #move to slot 5
            slot_5 = get_slot_calibration_square_position_ot3(5)
            await api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
            slot_5_pos = await api.gantry_position(OT3Mount.LEFT)
            slot_5_pos_g = await api.gantry_position(OT3Mount.GRIPPER)
            await api.move_to(OT3Mount.LEFT, slot_5._replace(z=100))
            await api.move_to(OT3Mount.GRIPPER, slot_5_pos_g._replace(z=50))

            #pickup tip and aspirate
            await api.pick_up_tip(mount = OT3Mount.LEFT, tip_length = 10)
            await api.aspirate(mount = OT3Mount.LEFT, volume = 10)
            await api.dispense(mount = OT3Mount.LEFT, volume = 10)
            await api.drop_tip(mount = OT3Mount.LEFT, home_after = False)

            #grip plate
            await api.home_gripper_jaw()

            #move up
            await api.move_to(OT3Mount.LEFT, slot_5_pos)
            await api.move_to(OT3Mount.GRIPPER, slot_5_pos_g)

            #move to slot 12
            slot_10 = get_slot_calibration_square_position_ot3(10)
            await api.move_to(OT3Mount.LEFT, slot_10._replace(z=home_pos.z))
            slot_10_pos = await api.gantry_position(OT3Mount.LEFT)
            slot_10_pos_g = await api.gantry_position(OT3Mount.GRIPPER)

            await api.move_to(OT3Mount.LEFT, slot_10_pos._replace(z=100))
            await api.move_to(OT3Mount.GRIPPER, slot_10_pos._replace(z=50))

            await api.pick_up_tip(mount = OT3Mount.LEFT, tip_length = 10)
            await api.aspirate(mount = OT3Mount.LEFT, volume = 10)
            await api.dispense(mount = OT3Mount.LEFT, volume = 10)
            await api.drop_tip(mount = OT3Mount.LEFT, home_after = False)

            #grip plate
            await api.home_gripper_jaw()
    except KeyboardInterrupt:
        pass
    finally:
        # await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await api.clean_up()


CYCLES = 1000
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cycles", type=int, default=CYCLES)

    args = parser.parse_args()
    CYCLES = args.cycles

    asyncio.run(_main())
