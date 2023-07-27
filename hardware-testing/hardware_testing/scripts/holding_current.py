"""Holding Current Test."""
import argparse
import asyncio


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

AXIS_MAP = {
    "Y": Axis.Y,
    "X": Axis.X,
    "Z": Axis.Z
}
GANTRY_LOAD_MAP = {"LOW": GantryLoad.LOW_THROUGHPUT,
                   "HIGH": GantryLoad.HIGH_THROUGHPUT}

SETTINGS = {
    Axis.X: GantryLoadSettings(
        max_speed=350,
        acceleration=800,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.25,
    ),
    Axis.Y: GantryLoadSettings(
        max_speed=300,
        acceleration=600,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.2,
    ),
    Axis.Z: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.8,
        run_current=1.5,
    )
}

async def check_current(api: OT3API,
                        mount: OT3Mount,
                        load: GantryLoad,
                        axis: Axis,
                        test_current: float) -> bool:
    print(f"\nTesting {str(axis)} at {test_current}A...")
    # Record encoder position before test
    inital_pos = await api.encoder_current_position_ot3(mount=mount,
                                                        refresh=True)
    print(f"\tInital {str(axis)} position: {inital_pos[axis]}")
    # Set the test holding current
    SETTINGS[axis].hold_current = test_current
    await set_gantry_load_per_axis_settings_ot3(
        api, SETTINGS, load=GANTRY_LOAD_MAP[load]
    )

    input(f"Apply Force to the {str(axis)} axis.")

    # Record encoder position after test
    final_pos = await api.encoder_current_position_ot3(mount=mount,
                                                        refresh=True)
    print(f"\tFinal {str(axis)} position: {final_pos[axis]}")

    # Find difference and check if passing
    difference = final_pos[axis] - inital_pos[axis]
    print(f"\tDifference {str(axis)} position: {difference}")

    if abs(difference) < 0.1:
        print("PASS\n")
        return True
    else:
        print("FAIL\n")
        return False


async def _main(arguments: argparse.Namespace) -> None:
    api = await build_async_ot3_hardware_api(
        is_simulating=arguments.simulate, stall_detection_enable=False
    )

    try:
        for _axis in arguments.axis:
            await api.home()
            test_pos = get_slot_calibration_square_position_ot3(5)
            test_pos = test_pos._replace(z=100)
            axis = AXIS_MAP[_axis]
            mount = OT3Mount.LEFT

            await move_to_arched_ot3(api, mount, test_pos)

            test_current = 1.5
            default_current = SETTINGS[axis].hold_current
            while test_current >= 0:
                current_pass = await check_current(api, mount,
                                                   arguments.load, axis,
                                                   test_current)
                if current_pass:
                    test_current -= 0.1
                else:
                    break
            SETTINGS[axis].hold_current = default_current
            await set_gantry_load_per_axis_settings_ot3(
                api, SETTINGS, load=GANTRY_LOAD_MAP[arguments.load]
            )

    except KeyboardInterrupt:
        print("Cancelled")
    finally:
        await api.disengage_axes([Axis.X, Axis.Y,
               Axis.by_mount(OT3Mount.LEFT), Axis.by_mount(OT3Mount.RIGHT)])
        await api.clean_up()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--axis", type=str, default="Y")
    parser.add_argument("--load", type=str, default="LOW")

    args = parser.parse_args()

    asyncio.run(_main(args))
