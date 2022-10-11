"""Pick-Up-Tip OT3."""
import argparse
import asyncio
from typing import Tuple

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point, CriticalPoint
from hardware_testing.opentrons_api.helpers_ot3 import (
    ThreadManagedHardwareAPI,
    build_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    get_endstop_position_ot3,
)

MOUNT = OT3Mount.LEFT
LOAD = GantryLoad.LOW_THROUGHPUT
SPEED_XY = 500
SPEED_Z = 250

SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=SPEED_XY,
        acceleration=2000,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=SPEED_XY,
        acceleration=2000,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=1500,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=1500,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
}


async def _safe_home(api: ThreadManagedHardwareAPI, offset: Point) -> None:
    await home_ot3(api)
    await api.move_rel(mount=MOUNT, delta=Point(y=offset.y))
    await api.move_rel(mount=MOUNT, delta=Point(x=offset.x))


async def _main(api: ThreadManagedHardwareAPI) -> None:
    safe_home_offset = Point(x=-10, y=-10)
    set_gantry_load_per_axis_settings_ot3(api, SETTINGS, load=LOAD)

    tip_position = Point(x=100, y=100, z=100)

    await _safe_home(api, safe_home_offset)
    input('ENTER to move Nozzle to tip rack: ')
    await api.move_to(mount=MOUNT, abs_position=tip_position,
                      critical_point=CriticalPoint.NOZZLE)
    input('ENTER to pick up tip(s): ')
    await api.pick_up_tip(mount=MOUNT, tip_length=40, presses=3)
    input('ENTER to drop tip(s): ')
    await api.drop_tip(mount=MOUNT)
    input('ENTER to exit script: ')
    await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    hw_api = build_ot3_hardware_api(is_simulating=args.simulate, use_defaults=True)
    asyncio.run(_main(hw_api))
    hw_api.clean_up()
