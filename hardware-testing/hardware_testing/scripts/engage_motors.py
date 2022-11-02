"""OT3 Thermal Test."""
import argparse
import asyncio

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    set_gantry_load_per_axis_motion_settings_ot3,
    home_ot3,
)

MOUNT = OT3Mount.LEFT
LOAD = GantryLoad.NONE
CYCLES = 1
SPEED_X = 600
SPEED_Y = 600
SPEED_Z = 40

ACCEL_X = 1000
ACCEL_Y = 1000
ACCEL_Z = 400


SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=SPEED_X,
        acceleration=ACCEL_X,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=1.5,
        run_current=1.5,
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=SPEED_Y,
        acceleration=ACCEL_Y,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=1.5,
        run_current=1.5,
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=ACCEL_Z,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=1.5,
        run_current=1.5,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=ACCEL_Z,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=1.5,
        run_current=1.5,
    ),
    OT3Axis.P_L: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=ACCEL_Z,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=1.5,
        run_current=1.5,
    ),
    OT3Axis.P_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=ACCEL_Z,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=1.5,
        run_current=1.5,
    )
}

AXIS_MAP = {'Y': OT3Axis.Y,
                'X': OT3Axis.X,
                'L': OT3Axis.Z_L,
                'R': OT3Axis.Z_R,
                'PL': OT3Axis.P_L,
                'PR': OT3Axis.P_R}



async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    try:
        await set_gantry_load_per_axis_settings_ot3(api,
                                        SETTINGS,
                                        load=None)
        await api.engage_axes([OT3Axis.X, OT3Axis.Y,
                                  OT3Axis.Z_L, OT3Axis.Z_R,
                                  OT3Axis.P_L, OT3Axis.P_R])
        input("hit enter to end")
    except KeyboardInterrupt:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y,
                                  OT3Axis.Z_L, OT3Axis.Z_R,
                                  OT3Axis.P_L, OT3Axis.P_R])
    finally:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y,
                                  OT3Axis.Z_L, OT3Axis.Z_R,
                                  OT3Axis.P_L, OT3Axis.P_R])
        await api.clean_up()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--iholdgantry", type=float, default=0.5)
    parser.add_argument("--iholdpip", type=float, default=0.5)


    args = parser.parse_args()
    SETTINGS[AXIS_MAP['X']].hold_current = args.iholdgantry
    SETTINGS[AXIS_MAP['Y']].hold_current = args.iholdgantry
    SETTINGS[AXIS_MAP['L']].hold_current = args.iholdgantry
    SETTINGS[AXIS_MAP['R']].hold_current = args.iholdgantry
    SETTINGS[AXIS_MAP['PL']].hold_current = args.iholdpip
    SETTINGS[AXIS_MAP['PR']].hold_current = args.iholdpip
    asyncio.run(_main(args.simulate))
