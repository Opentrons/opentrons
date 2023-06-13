"""Test Jogging."""
import argparse
import asyncio
import time
from threading import Thread, Event, currentThread

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from opentrons.config.types import CapacitivePassSettings
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from hardware_testing.drivers.mark10 import Mark10

CAP_SETTINGS = CapacitivePassSettings(prep_distance_mm=0,
max_overrun_distance_mm=10,
speed_mm_per_s=1,
sensor_threshold_pf=1.0)

# MOUNT = OT3Mount.RIGHT
# AXIS = OT3Axis.Z_L
TRIALS = 5

# def between_callback(stop_event, api):
#     loop = asyncio.new_event_loop()
#     asyncio.set_event_loop(loop)
#
#     loop.run_until_complete(plunger_move(stop_event, api))
#     loop.close()

async def plunger_move(stop_event, api): # -> int:

    top_pos, bottom_pos, _, _ = helpers_ot3.get_plunger_positions_ot3(api, OT3Mount.RIGHT)

    # plunger_cycles = 0

    # for i in range(TRIALS):#while True:
    print("Move to bottom plunger position\n")
    await helpers_ot3.move_plunger_absolute_ot3(api, OT3Mount.RIGHT, bottom_pos)
    print("Move to top plunger position\n")
    await helpers_ot3.move_plunger_absolute_ot3(api, OT3Mount.RIGHT, top_pos)
    print("Move to bottom plunger position\n")
    await helpers_ot3.move_plunger_absolute_ot3(api, OT3Mount.RIGHT, bottom_pos)
    # plunger_cycles += 1
        # if stop_event.is_set():
        #     break
    await api.home_plunger(mount)

    # return plunger_cycles

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    if mount == OT3Mount.LEFT:
        AXIS = OT3Axis.Z_L
    else:
        AXIS = OT3Axis.Z_R

    final_position = await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
    print(f"Jogged the mount to deck coordinate: {final_position}")

    stop_event = Event()

    # await asyncio.gather(plunger_move(stop_event, api))

    # plunger_thread = Thread(target=between_callback, args=(stop_event, api))
    # plunger_thread.start()

    for i in range(TRIALS):
        print(f"Trial {i+1}\n")

        asyncio.create_task(plunger_move(stop_event, api))
        # await asyncio.gather(plunger_move(stop_event, api))

        await api.move_to(OT3Mount.LEFT, Point(final_position[OT3Axis.X],
                            final_position[OT3Axis.Y], final_position[OT3Axis.Z_L]))
        tip_len = 57 # 50uL Tip
        # tip_len = 85 # 1K tip
        print("pick up tip in main\n")
        await api.pick_up_tip(OT3Mount.LEFT, tip_length=tip_len)
        print("sleep...\n")
        await asyncio.sleep(1)
        await api.remove_tip(OT3Mount.LEFT)

    stop_event.set()
    # plunger_thread.join()

if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
        "gripper": types.OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, mount))
