"""OT3 Single Axis Movement Test."""
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
SPEED_X = 500
SPEED_Z = 200

SPEED_Y = 500
ACCEL_Y = 500


SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=SPEED_X,
        acceleration=1000,
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
        acceleration=50,
        max_start_stop_speed=1,
        max_change_dir_speed=5,
        hold_current=1.5,
        run_current=1.5,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=400,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=1.5,
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

async def _single_axis_move(api: OT3API, cycles: int = 1) -> None:
    for _ in range(cycles):
        if(AXIS == 'R'):
            MOUNT = MOUNT = OT3Mount.RIGHT
        else:
            MOUNT = MOUNT = OT3Mount.LEFT
        await api.move_rel(mount=MOUNT, delta=NEG_POINT_MAP[AXIS], speed=AXIS_SPEED)
        await api.move_rel(mount=MOUNT, delta=POINT_MAP[AXIS], speed=AXIS_SPEED)


async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    try:
        await set_gantry_load_per_axis_settings_ot3(api,
                                        SETTINGS,
                                        load=None)
        await api.home([AXIS_MAP[AXIS]])
        await _single_axis_move(api, cycles=CYCLES)
    except KeyboardInterrupt:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        # await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await api.clean_up()


if __name__ == "__main__":
    print('2')
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--axis", type=str, default='Y')
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--speed", type=int, default=100)
    parser.add_argument("--accel", type=int, default=50)
    parser.add_argument("--irun", type=float, default=1.5)
    parser.add_argument("--ihold", type=float, default=0.5)

    args = parser.parse_args()
    AXIS = args.axis
    CYCLES = args.cycles
    AXIS_SPEED = args.speed
    SETTINGS[AXIS_MAP[AXIS]].max_speed = AXIS_SPEED
    print()
    SETTINGS[AXIS_MAP[AXIS]].acceleration = args.accel
    SETTINGS[AXIS_MAP[AXIS]].run_current = args.irun
    SETTINGS[AXIS_MAP[AXIS]].hold_current = args.ihold
    asyncio.run(_main(args.simulate))
