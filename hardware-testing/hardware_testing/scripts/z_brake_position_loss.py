"""Holding Current Test."""
import argparse
import asyncio
import time
import numpy as np
from typing import Tuple, Dict


from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.errors import MustHomeError

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    move_to_arched_ot3,
    get_slot_calibration_square_position_ot3
)

GANTRY_LOAD_MAP = {"LOW": GantryLoad.LOW_THROUGHPUT,
                   "HIGH": GantryLoad.HIGH_THROUGHPUT}

SETTINGS = {
    Axis.X: GantryLoadSettings(
        max_speed=350,
        acceleration=800,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.25
    ),
    Axis.Y: GantryLoadSettings(
        max_speed=300,
        acceleration=600,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.2
    ),
    Axis.Z: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.8,
        run_current=1.5
    )
}

async def cycle_brake(api: OT3API, mount: OT3Mount) -> Tuple[bool, float]:
    # Record encoder position before disabling axes
    inital_pos = await api.encoder_current_position_ot3(mount=mount,
                                                        refresh=True)
    # print(f"\tInital position: {inital_pos[Axis.Z]}")

    # disenage_axes enables the brake and then disables the z motor driver
    await api.disengage_axes([Axis.Z_L])
    time.sleep(0.5)

    # Record encoder position after disengaging
    disengaged_pos = await api.encoder_current_position_ot3(mount=mount,
                                                        refresh=True)
    # print(f"\tDisengaged position: {disengaged_pos[Axis.Z]}")

    # enage_axes enables the z motor driver and then disables the brake
    await api.engage_axes([Axis.Z_L])
    time.sleep(0.5)

    # Record encoder position after re-engaging
    engaged_pos = await api.encoder_current_position_ot3(mount=mount,
                                                        refresh=True)
    # print(f"\tEngaged position: {engaged_pos[Axis.Z]}")

    # Find difference and check if passing
    difference = engaged_pos[Axis.Z] - inital_pos[Axis.Z]
    print(f"\tDifference: {difference}")

    if abs(difference) < 0.0029296875:
        # print("PASS\n")
        return (True, difference)
    else:
        # print("FAIL\n")
        return (False, difference)


async def _main(arguments: argparse.Namespace) -> None:
    api = await build_async_ot3_hardware_api(
        is_simulating=arguments.simulate, stall_detection_enable=False
    )

    try:
        await api.home()
        home_pos = await api.gantry_position(OT3Mount.LEFT)
        # test_pos = get_slot_calibration_square_position_ot3(5)
        test_pos = home_pos._replace(z=100)
        mount = OT3Mount.LEFT

        # await move_to_arched_ot3(api, mount, test_pos)
        await set_gantry_load_per_axis_settings_ot3(
            api, SETTINGS, load=GANTRY_LOAD_MAP[arguments.load]
        )

        pass_count = 0
        fail_count = 0
        pass_avg = []
        fail_avg = []
        for d in range(10):
            for i in range(10):
                    print(f"Cycle: {i}")
                    result = await cycle_brake(api, mount)
                    if result[0]:
                        pass_count += 1
                        pass_avg.append(result[1])
                    else:
                        fail_count += 1
                        fail_avg.append(result[1])

                    print(f"\tPass: {pass_count} - Avg: {np.mean(pass_avg)}")
                    print(f"\tFail: {fail_count} - Avg: {np.mean(fail_avg)}")
            await api.move_to(mount, test_pos)
            await api.home()

    except KeyboardInterrupt:
        print("Cancelled")
    finally:
        await api.disengage_axes([Axis.X, Axis.Y,
               Axis.by_mount(OT3Mount.LEFT), Axis.by_mount(OT3Mount.RIGHT)])
        await api.clean_up()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--load", type=str, default="LOW")

    args = parser.parse_args()

    asyncio.run(_main(args))
