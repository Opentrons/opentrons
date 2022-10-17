"""Test OT3 Pipette."""
import argparse
import asyncio

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    home_ot3,
)

MOUNT = OT3Mount.LEFT
if MOUNT == OT3Mount.LEFT:
    Z_AXIS = OT3Axis.Z_L
    PLUNGER_AXIS = OT3Axis.P_L
else:
    Z_AXIS = OT3Axis.Z_R
    PLUNGER_AXIS = OT3Axis.P_R
LOAD = GantryLoad.LOW_THROUGHPUT
MAX_SPEED_XY = 5000
MAX_SPEED_Z = 200
MAX_SPEED_PIP = 20


async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.3",
        pipette_right="p50_single_v4.3",
    )
    assert api.hardware_pipettes[OT3Mount.LEFT.to_mount()], "No pipette on the left!"
    assert api.hardware_pipettes[OT3Mount.RIGHT.to_mount()], "No pipette on the right!"

    await home_ot3(api, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    await api.home_plunger(mount=MOUNT)

    input("Press ENTER to move the plunger:")
    await api.add_tip(mount=MOUNT, tip_length=0.1)
    await api.prepare_for_aspirate(mount=MOUNT)
    for vol in [50, 25, 1]:
        print(vol)
        await api.aspirate(mount=MOUNT, volume=vol)
        await api.dispense(mount=MOUNT, volume=vol)
    # TODO:
    #       ** 1) move plunger
    #       ** 2) enable/disable plunger
    #       ** 3) set plunger acceleration
    #       4) set plunger current
    #       5) read limit switch
    #       6) read encoder
    #       7) read capacitive sensor
    #       8) read air-pressure sensor
    #       9) read temp/humidity sensor
    await api.disengage_axes(
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R, PLUNGER_AXIS]
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
    input("Done. Press ENTER to exit:")
    print("###########################################")
    print("###########################################")
    print("###########################################")
