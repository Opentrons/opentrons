"""OT3 Bowtie Test."""
import argparse
import asyncio

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    ThreadManagedHardwareAPI,
    build_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
)

MOUNT = OT3Mount.RIGHT
LOAD = GantryLoad.NONE
CYCLES = 1
SPEED_XY = 500
SPEED_Z = 180

SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=SPEED_XY,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=SPEED_XY,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
}


async def _bowtie_ot3(api: ThreadManagedHardwareAPI, cycles: int = 1) -> None:
    await api.move_rel(mount=MOUNT, delta=Point(y=-20))
    await api.move_rel(mount=MOUNT, delta=Point(x=-5))
    step_x = 440
    step_y = 370
    step_z = 200
    default_speed = 400
    for _ in range(cycles):
        await api.move_rel(mount=MOUNT, delta=Point(x=-step_x), speed=default_speed)
        await api.move_rel(mount=MOUNT, delta=Point(z=-step_z), speed=default_speed)
        await api.move_rel(
            mount=MOUNT, delta=Point(x=step_x, y=-step_y), speed=default_speed
        )
        await api.move_rel(mount=MOUNT, delta=Point(z=step_z), speed=default_speed)
        await api.move_rel(mount=MOUNT, delta=Point(x=-step_x), speed=default_speed)
        await api.move_rel(mount=MOUNT, delta=Point(z=-step_z), speed=default_speed)
        await api.move_rel(mount=MOUNT, delta=Point(x=step_x, y=step_y), speed=default_speed)
        await api.move_rel(mount=MOUNT, delta=Point(z=step_z), speed=default_speed)


async def _main(api: ThreadManagedHardwareAPI) -> None:
    set_gantry_load_per_axis_settings_ot3(api, SETTINGS, load=LOAD)
    await api.set_gantry_load(gantry_load=LOAD)
    await home_ot3(api)
    await _bowtie_ot3(api, cycles=CYCLES)
    await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--speed-xy", type=int, default=SPEED_XY)
    parser.add_argument("--speed-z", type=int, default=SPEED_Z)
    args = parser.parse_args()
    CYCLES = args.cycles
    SPEED_XY = args.speed_xy
    SPEED_Z = args.speed_z
    SETTINGS[OT3Axis.X].max_speed = SPEED_XY
    SETTINGS[OT3Axis.Y].max_speed = SPEED_XY
    SETTINGS[OT3Axis.Z_L].max_speed = SPEED_Z
    SETTINGS[OT3Axis.Z_R].max_speed = SPEED_Z
    hw_api = build_ot3_hardware_api(is_simulating=args.simulate)
    asyncio.run(_main(hw_api))
    hw_api.clean_up()
