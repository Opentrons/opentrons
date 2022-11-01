"""OT3 Bowtie Test."""
import argparse
import asyncio
<<<<<<< HEAD

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
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


async def _bowtie_ot3(api: OT3API, cycles: int = 1) -> None:
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
        await api.move_rel(
            mount=MOUNT, delta=Point(x=step_x, y=step_y), speed=default_speed
        )
        await api.move_rel(mount=MOUNT, delta=Point(z=step_z), speed=default_speed)


async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    await set_gantry_load_per_axis_settings_ot3(api, SETTINGS, load=LOAD)
    await api.set_gantry_load(gantry_load=LOAD)
    await home_ot3(api)
    await _bowtie_ot3(api, cycles=CYCLES)
    await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
=======
from typing import List

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


def _create_bowtie_points(homed_position: types.Point) -> List[types.Point]:
    pos_max = homed_position - types.Point(x=1, y=1, z=1)
    pos_min = types.Point(x=0, y=25, z=pos_max.z - 200)  # stay above deck to be safe
    bowtie_points = [
        pos_max,  # back-right-up
        pos_min._replace(z=pos_max.z),  # front-left-up
        pos_min,  # front-left-down
        pos_min._replace(y=pos_max.y),  # back-left-down
        pos_max._replace(x=pos_min.x),  # back-left-up
        pos_max._replace(y=pos_min.y),  # front-right-up
        pos_min._replace(x=pos_max.x),  # front-right-down
        pos_max._replace(z=pos_min.z),  # back-right-down
    ]
    return bowtie_points


async def _main(is_simulating: bool, cycles: int, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await helpers_ot3.home_ot3(api)
    bowtie_points = _create_bowtie_points(await api.gantry_position(mount))
    for i in range(cycles):
        print(f"Cycle {i + 1}/{cycles}")
        for p in bowtie_points:
            await api.move_to(mount, p)
    await api.move_to(mount, bowtie_points[0])
    await api.disengage_axes([types.OT3Axis.X, types.OT3Axis.Y])
>>>>>>> edge


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=1)
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    args = parser.parse_args()
    if args.mount == "left":
        mount = types.OT3Mount.LEFT
    else:
        mount = types.OT3Mount.RIGHT
    if not args.simulate:
        input("BOWTIE-OT3: Is the deck totally empty? (press ENTER to continue)")
    asyncio.run(_main(args.simulate, args.cycles, mount))
