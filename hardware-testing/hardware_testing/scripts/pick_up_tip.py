"""Demo OT3 Gantry Functionality."""
import argparse
import ast
import asyncio
from typing import Tuple, Dict

from opentrons.hardware_control.motion_utilities import target_position_from_plunger
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    ThreadManagedHardwareAPI,
    build_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    home_pipette,
    get_endstop_position_ot3,
    move_plunger_absolute_ot3,
    update_pick_up_current,
    update_pick_up_distance
)

from hardware_testing import data

MOUNT = OT3Mount.LEFT
LOAD = GantryLoad.NONE
PIPETTE_SPEED = 10

SPEED_XY = 500
SPEED_Z = 250

pick_up_speed = 10
pick_up_current = 0.01
default_run_settings = {
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
        run_current=1.0,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=1500,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.0,
    ),
}

def _create_relative_point(axis: OT3Axis, distance: float) -> Point:
    if axis == OT3Axis.X:
        return Point(x=distance)
    elif axis == OT3Axis.Y:
        return Point(y=distance)
    elif axis == OT3Axis.Z_L or axis == OT3Axis.Z_R:
        return Point(z=distance)
    raise ValueError(f"Unexpected axis: {axis}")

async def get_encoder_position(
    api: ThreadManagedHardwareAPI, mount: OT3Mount) -> Dict[Axis, Float]:
    enc_position = await api.encoder_current_position(mount=MOUNT, refresh=True)
    return enc_position

async def jog(api: ThreadManagedHardwareAPI)-> Dict[OT3Axis, float]:
    jog = True
    cur_pos = await api.current_position_ot3(MOUNT)
    print(f"X: {cur_pos[0]}, Y: {cur_pos[1]}, Z: {cur_pos[2]}")
    while jog:
        print(f"Enter coordinates as example: 100,10,3")
        coord = ast.literal_eval(input('Enter Coordinates as: '))
        if isinstance(coord, tuple):
            api.move_to(MOUNT, Point(coord[0], coord[1], coord[2]))
            cur_pos = await api.current_position_ot3(MOUNT)
            print(f"X: {cur_pos[0]}, Y: {cur_pos[1]}, Z: {cur_pos[2]}")
        else:
            jog = False
    return  await api.current_position_ot3(MOUNT)

async def set_default_current_settings(api: ThreadManagedHardwareAPI):
    set_gantry_load_per_axis_settings_ot3(api, default_run_settings, load=LOAD)
    await api.set_gantry_load(gantry_load=LOAD)

async def set_current_settings(api: ThreadManagedHardwareAPI):
    set_gantry_load_per_axis_settings_ot3(api, z_pickup_run_settings, load=LOAD)
    await api.set_gantry_load(gantry_load=LOAD)

async def pick_up_function(api: ThreadManagedHardwareAPI,
                            loc, speed, press_distance):
    # Pick up tip function
    await api.move_to(MOUNT,
                        Point(loc[0], loc[1], loc_[2]-press_distance),
                        speed = speed)

async def _main(api: ThreadManagedHardwareAPI) -> None:
    await set_default_current_settings(api)
    await home_ot3(api, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    await api.cache_instruments()
    await api.home_plunger(MOUNT)
    if options.fg_jog:
        fg_loc = await jog(api)
    if options.tiprack:
        tiprack_loc = await jog(api)
    if options.trough:
        trough_loc = await jog(api)
    cur_pos = await api.current_position_ot3(MOUNT)
    z_pos = cur_pos[OT3Axis.by_mount(MOUNT)]
    # Move Gantry to Force Gauge Location
    await api.move_to(MOUNT, Point(fg_loc[0], fg_loc[1], fg_loc[2]))
    # -365 is for the other robot
    # Move Z to Tip Rack Location
    await api.move_to(MOUNT, Point(tiprack_loc[0], tiprack_loc, tip_rack_loc))
    cur_pos = await api.current_position_ot3(MOUNT)
    z_pos = cur_pos[OT3Axis.by_mount(MOUNT)]
    await set_current_settings(api)


    await api.move_to(MOUNT, Point(302, 58.5, z_pos))
    # await update_pick_up_current(api, MOUNT, 0.01)
    # await update_pick_up_distance(api, MOUNT, 100)
    # await api.pick_up_tip(MOUNT, 78.3)
    # await api.drop_tip(MOUNT, home_after = False)
    await api.disengage_axes([OT3Axis.of_main_tool_actuator(MOUNT)])

def force_record():
    pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--fg_jog", action="store_true")
    parser.add_argument("--trough", action="store_true")
    parser.add_argument("--tiprack", action="store_true")
    args = parser.parse_args()
    hw_api = build_ot3_hardware_api(is_simulating=args.simulate,
                                    use_defaults=True)

    asyncio.run(_main(hw_api))
    hw_api.clean_up()
