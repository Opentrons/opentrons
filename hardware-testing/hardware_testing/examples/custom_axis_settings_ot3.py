"""Custom axis settings."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

CUSTOM_AXIS_SETTINGS = {
    types.Axis.X: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.Axis.Y: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.Axis.Z_L: helpers_ot3.GantryLoadSettings(
        max_speed=60,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.Axis.Z_R: helpers_ot3.GantryLoadSettings(
        max_speed=60,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
}


async def _main(is_simulating: bool) -> None:
    # create the OT3API instance
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    # set the custom settings, per-axis
    # NOTE: these settings will automatically apply to whichever
    #       gantry load is current installed on the robot
    await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, CUSTOM_AXIS_SETTINGS)
    # home, and do whatever you want
    await helpers_ot3.home_ot3(api)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
