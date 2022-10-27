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
SPEED_Z = 200

ACCEL_X = 1500
ACCEL_Y = 1500
ACCEL_Z = 400


SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=SPEED_X,
        acceleration=ACCEL_X,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.5,
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=SPEED_Y,
        acceleration=ACCEL_Y,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.5,
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=ACCEL_Z,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.5,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=ACCEL_Z,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.5,
    ),
}

AXIS_MAP = {'Y': OT3Axis.Y,
                'X': OT3Axis.X,
                'L': OT3Axis.Z_L,
                'R': OT3Axis.Z_R}

step_x = 530
step_y = 400
step_z = 210
POINT_MAP = {'Y': Point(y=step_y),
             'X': Point(x=step_x),
             'L': Point(z=step_z),
             'R': Point(z=step_z)}

NEG_POINT_MAP = {'Y': Point(y=-step_y),
             'X': Point(x=-step_x),
             'L': Point(z=-step_z),
             'R': Point(z=-step_z)}

async def _thermal_test(api: OT3API, cycles: int = 1) -> None:
    for _ in range(cycles):
        if (AXIS == 'g'):
            await api.move_rel(mount=OT3Mount.LEFT,
                               delta=Point(x=NEG_POINT_MAP[X],
                                           y=NEG_POINT_MAP[Y]),
                               speed=SPEED_X)
            await api.move_rel(mount=OT3Mount.LEFT,
                               delta=Point(x=POINT_MAP[X],
                                           y=POINT_MAP[Y]),
                               speed=SPEED_X)
        else:
            await api.move_rel(mount=OT3Mount.LEFT, delta=NEG_POINT_MAP[Z_L],
                               speed=SPEED_Z)
            await api.move_rel(mount=OT3Mount.RIGHT, delta=NEG_POINT_MAP[Z_R],
                               speed=SPEED_Z)
            await api.move_rel(mount=OT3Mount.LEFT, delta=POINT_MAP[Z_L],
                               speed=SPEED_Z)
            await api.move_rel(mount=OT3Mount.RIGHT, delta=POINT_MAP[Z_R],
                               speed=SPEED_Z)


async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    try:
        await set_gantry_load_per_axis_settings_ot3(api,
                                        SETTINGS,
                                        load=None)
        await api.home()
        await _thermal_test(api, cycles=CYCLES)
    except KeyboardInterrupt:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        # await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await api.clean_up()


if __name__ == "__main__":
    print('1')
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--axis", type=str, default='g') #g for gantry, z for z

    args = parser.parse_args()
    CYCLES = args.cycles
    AXIS = args.axis
    asyncio.run(_main(args.simulate))
