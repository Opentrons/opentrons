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
SPEED_Z = 60

ACCEL_X = 1000
ACCEL_Y = 1000
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
        hold_current=1,
        run_current=1.5,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=ACCEL_Z,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.5,
    ),
}

AXIS_MAP = {'Y': OT3Axis.Y,
                'X': OT3Axis.X,
                'L': OT3Axis.Z_L,
                'R': OT3Axis.Z_R}

step_x = 400
step_y = 300
step_z = 200
POINT_MAP = {'Y': Point(y=step_y),
             'X': Point(x=step_x),
             'L': Point(z=step_z),
             'R': Point(z=step_z)}

NEG_POINT_MAP = {'Y': Point(y=-step_y),
             'X': Point(x=-step_x),
             'L': Point(z=-step_z),
             'R': Point(z=-step_z)}

async def _thermal_test(api: OT3API, cycles: int = 1) -> None:
    await api.move_rel(mount=OT3Mount.LEFT,
                       delta=Point(x=-30,
                                   y=-30),
                       speed=SPEED_X)

    home_pos_left = await api.current_position_ot3(mount=OT3Mount.LEFT)
    print(home_pos_left)
    home_pos_right = await api.current_position_ot3(mount=OT3Mount.RIGHT)
    print(home_pos_right)

    for _ in range(cycles):
        print(_)
        if (AXIS == 'g'):
            await api.move_rel(mount=OT3Mount.LEFT,
                               delta=Point(x=-step_x,
                                           y=-step_y),
                               speed=SPEED_X)
            await api.move_rel(mount=OT3Mount.LEFT,
                               delta=Point(x=step_x,
                                           y=step_y),
                               speed=SPEED_X)
        elif (AXIS == 'z'):
            print('z axis')
            # need to fix - want Z and A to move up and down max travel distance
            # await api.move_to(mount=OT3Mount.LEFT,
            #                   abs_position=Point(x=home_pos_left[OT3Axis.X],
            #                                      y=home_pos_left[OT3Axis.Y],
            #                                      z=0),
            #                    speed=SPEED_Z)
            await api.move_rel(mount=OT3Mount.LEFT,
                               delta=Point(z=-step_z),
                               speed=SPEED_Z)
            # await api.move_to(mount=OT3Mount.RIGHT,
            #                   abs_position=Point(x=home_pos_right[OT3Axis.X],
            #                                      y=home_pos_right[OT3Axis.Y],
            #                                      z=0),
            #                    speed=SPEED_Z)
            # await api.move_to(mount=OT3Mount.LEFT,
            #                   abs_position=Point(x=home_pos_left[OT3Axis.X],
            #                                      y=home_pos_left[OT3Axis.Y],
            #                                      z=200),
            #                    speed=SPEED_Z)
            await api.move_rel(mount=OT3Mount.LEFT,
                               delta=Point(z=step_z),
                               speed=SPEED_Z)
            # await api.move_to(mount=OT3Mount.RIGHT,
            #                   abs_position=Point(x=home_pos_right[OT3Axis.X],
            #                                      y=home_pos_right[OT3Axis.Y],
            #                                      z=200),
            #                    speed=SPEED_Z)


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
