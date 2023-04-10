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

MOUNT = OT3Mount.RIGHT
AXIS = OT3Axis.Z_R
TRIALS = 5

def force_record(stop_event, api, mount) -> int:

    top_pos, bottom_pos, _, _ = helpers_ot3.get_plunger_positions_ot3(api, mount)

    plunger_cycles = 0

    for i in range(TRIALS):#while True:
        print("Move to bottom plunger position\n")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)
        print("Move to top plunger position\n")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, top_pos)
        print("Move to bottom plunger position\n")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)
        plunger_cycles += 1
        if stop_event.is_set():
            break
    await api.home_plunger(mount)

    return plunger_cycles

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    for current in current_list:
        for i in range(TRIALS):
            print(f"Trial {i+1}, Current: {current}\n")
            stop_event = Event()
            # final_position = await helpers_ot3.jog_mount_ot3(api, mount)
            # print(f"Jogged the mount to deck coordinate: {final_position}")

            await api.move_to(mount, Point(final_position[OT3Axis.X],
                                final_position[OT3Axis.Y], final_position[AXIS]))
            await helpers_ot3.update_pick_up_current(api, mount, current)
            force_thread = Thread(target=force_record, args=(stop_event, current,
                                                             i+1, test_robot, test_name, file_name))
            force_thread.start()
            tip_len = 57 # 50uL Tip
            # tip_len = 85 # 1K tip
            print("pick up tip in main\n")
            await api.pick_up_tip(mount, tip_length=tip_len)
            print("sleep...\n")
            await asyncio.sleep(1)
            stop_event.set()
            force_thread.join()
            await api.remove_tip(mount)

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
