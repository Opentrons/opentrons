"""Demo OT3 Gantry Functionality."""
import argparse
import asyncio

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    ThreadManagedHardwareAPI,
    build_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    get_endstop_position_ot3,
)

MOUNT = OT3Mount.LEFT
LOAD = GantryLoad.NONE
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


async def _find_home_switch(api: ThreadManagedHardwareAPI, axis: OT3Axis) -> None:
    tolerance_mm = 0.5
    if axis == OT3Axis.X:
        tolerance_delta = Point(x=tolerance_mm)
    elif axis == OT3Axis.Y:
        tolerance_delta = Point(y=tolerance_mm)
    elif axis == OT3Axis.Z_L or axis == OT3Axis.Z_R:
        tolerance_delta = Point(z=tolerance_mm)
    else:
        raise ValueError(f"Unexpected axis: {axis}")
    # calculate two positions: 1) before the switch, and 2) after the switch
    endstop_pos = get_endstop_position_ot3(api, mount=MOUNT)
    pos_not_touching = endstop_pos - tolerance_delta
    pos_touching = endstop_pos + tolerance_delta
    # move away from the home switch
    await api.move_rel(mount=MOUNT, delta=Point(y=-10))
    await api.move_rel(mount=MOUNT, delta=Point(x=-10))
    # now move close, but don't touch
    await api.move_to(mount=MOUNT, abs_position=pos_not_touching)
    switches = await api.get_limit_switches()
    assert (
        switches[axis] is False
    ), f"switch on axis {axis} is PRESSED when it should not be"
    # finally, move so that we definitely are touching the switch
    await api.move_to(mount=MOUNT, abs_position=pos_touching)
    switches = await api.get_limit_switches()
    assert (
        switches[axis] is False
    ), f"switch on axis {axis} is NOT pressed when it should be"


async def _main(api: ThreadManagedHardwareAPI) -> None:
    set_gantry_load_per_axis_settings_ot3(api, SETTINGS, load=LOAD)
    await api.set_gantry_load(gantry_load=LOAD)
    await home_ot3(api)
    print(await api.current_position_ot3(mount=MOUNT))
    await _find_home_switch(api, axis=OT3Axis.X)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    hw_api = build_ot3_hardware_api(is_simulating=args.simulate, use_defaults=True)
    asyncio.run(_main(hw_api))
    hw_api.clean_up()
