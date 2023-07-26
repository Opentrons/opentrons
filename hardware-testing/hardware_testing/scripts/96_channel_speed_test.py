"""Demo OT3 Gantry Functionality."""
import argparse
import ast
import asyncio
import csv
import time
from typing import Tuple, Dict, Optional
from threading import Thread
import datetime
import os
import sys
import termios
import tty
import json

from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Axis,
    Point,
    CriticalPoint,
)
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    home_ot3,
    move_plunger_absolute_ot3,
    get_plunger_positions_ot3,
    update_pick_up_current,
    update_pick_up_speed,
    update_pick_up_distance,
    update_drop_tip_current,
    update_drop_tip_speed,
    _get_pipette_from_mount,
    GantryLoadSettings,
    move_tip_motor_relative_ot3,
    set_gantry_load_per_axis_settings_ot3,
)

def getch():
    """
    fd: file descriptor stdout, stdin, stderr
    This functions gets a single input keyboard character from the user
    """

    def _getch():
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch

    return _getch()


async def jog(api, position, cp) -> Dict[Axis, float]:
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    xy_speed = 60
    za_speed = 65
    information_str = """
        Click  >>   i   << to move up
        Click  >>   k   << to move down
        Click  >>   a  << to move left
        Click  >>   d  << to move right
        Click  >>   w  << to move forward
        Click  >>   s  << to move back
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    while True:
        input = getch()
        if input == "a":
            # minus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(-step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "d":
            # plus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "w":
            # minus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "s":
            # plus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, -step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "i":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, step_size[step_length_index]), speed=za_speed
            )

        elif input == "k":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, -step_size[step_length_index]), speed=za_speed
            )

        elif input == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == "+":
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 7:
                step_length_index = 7
            step = step_size[step_length_index]

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == "\r":
            sys.stdout.flush()
            position = await api.current_position_ot3(
                mount, refresh=True, critical_point=cp
            )
            print("\r\n")
            return position
        position = await api.current_position_ot3(
            mount, refresh=True, critical_point=cp
        )

        print(
            "Coordinates: ",
            round(position[Axis.X], 2),
            ",",
            round(position[Axis.Y], 2),
            ",",
            round(position[Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")

async def move_to_point(api, mount, point, cp):
    home_pos = api.get_instrument_max_height(mount, cp)
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        home_pos))
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos))
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z))

async def calibrate_tiprack(api, home_position, mount):
    cp = CriticalPoint.NOZZLE
    tiprack_loc = Point(
                    slot_loc[args.tiprack_slot][0],
                    slot_loc[args.tiprack_slot][1],
                    home_position[Axis.by_mount(mount)])
    print("Calibrate for Pick up tip")
    await move_to_point(api, mount, tiprack_loc, cp)
    current_position = await api.current_position_ot3(mount, cp)
    tiprack_loc = await jog(api, current_position, cp)
    tiprack_loc = Point(tiprack_loc[Axis.X],
                        tiprack_loc[Axis.Y],
                        tiprack_loc[Axis.by_mount(mount)])
    await api.pick_up_tip(
        mount, tip_length=tip_length[args.tip_size]
    )
    await api.home_z(mount)
    cp = CriticalPoint.TIP
    home_with_tip = await api.current_position(mount, cp)
    print("Calibrate Drop Tip Position")
    drop_tip_loc = await jog(api, home_with_tip, cp)
    drop_tip_loc = Point(drop_tip_loc[Axis.X],
                        drop_tip_loc[Axis.Y],
                        drop_tip_loc[Axis.by_mount(mount)])
    await update_drop_tip_current(api, mount, 1.5)
    await update_drop_tip_speed(api, mount, 5.5)
    input("Press Enter to drop tip")
    await api.drop_tip(mount)
    input(" Press enter ")
    return tiprack_loc, drop_tip_loc

async def _main() -> None:
    today = datetime.date.today()
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    pipette_model = hw_api.get_all_attached_instr()[OT3Mount.LEFT]["pipette_id"]

    await hw_api.home([Axis.Q])
    await asyncio.sleep(1)
    # await hw_api.home_plunger(mount)
    await hw_api.set_lights(rails=True)
    # plunger_pos = get_plunger_positions_ot3(hw_api, mount)
    # print(plunger_pos)
    # home_position = await hw_api.current_position_ot3(mount)
    start_time = time.perf_counter()
    run_current = float(input("motor_current in amps: "))
    # max_speed = float(input("pick up tip speed in mm/s: "))

    # await update_pick_up_current(hw_api, mount, m_current)
    # await update_pick_up_speed(hw_api, mount, pick_up_speed)
    # Some of these are hard coded for now
    # axis_motion_settings = GantryLoadSettings(max_speed = max_speed,
    #                                                     acceleration = acceleration,
    #                                                     max_start_stop_speed = 5,
    #                                                     max_change_dir_speed = 1,
    #                                                     hold_current = 0.3,
    #                                                     run_current = run_current)
    # await update_pick_up_distance(hw_api, mount, 19.0)
    # Calibrate to tiprack

    # pickup_loc, droptip_loc = await calibrate_tiprack(hw_api, home_position, mount)
    # # await hw_api.home_z(mount)
    # cp = CriticalPoint.TIP
    # home_w_tip = await hw_api.current_position_ot3(mount, cp)
    #speed_list = [5,6,8,9,10,12,14,16,18,20,22,24,26,28,30]
    # speed_list = [20,22,24,26,28,30]
    speed_list = [15]
    acceleration_list = [80]
    # acceleration_list = [100,110,120,130,140,150,160,170,180]
    #acceleration_list = [70,80,90,100,110,120,130,140,150,160,170,180]
    distance = 10
    try:
        for m_speed in speed_list:
            for accel in acceleration_list:
                print("accel: ", accel)
                print("Speed: ", m_speed)
                axis_motion_settings = GantryLoadSettings(max_speed = m_speed,
                                                    acceleration = accel,
                                                    max_start_stop_speed = 5,
                                                    max_change_dir_speed = 5,
                                                    hold_current = 0.3,
                                                    run_current = run_current)
                await set_gantry_load_per_axis_settings_ot3(hw_api, {Axis.Q: axis_motion_settings})
                for cycle in range(1, 20):
                    gear_origin_dict = {Axis.Q: 0}
                    gear_target_dict = {Axis.Q: distance}
                    clamp_moves = hw_api._build_moves(
                        gear_origin_dict, gear_target_dict, speed=m_speed
                    )
                    await hw_api._backend.tip_action(moves=clamp_moves[0], tip_action="clamp")
                    # await move_tip_motor_relative_ot3(hw_api,
                    #                                 distance,
                    #                                 run_current,
                    #                                 m_speed,
                    #                                 axis_motion_settings)
                    gear_origin_dict = {Axis.Q: distance}
                    gear_target_dict = {Axis.Q: 1}
                    clamp_moves = hw_api._build_moves(
                        gear_origin_dict, gear_target_dict, speed=m_speed
                    )
                    await hw_api._backend.tip_action(moves=clamp_moves[0], tip_action="clamp")
                    await hw_api.home([Axis.Q])

            # # Default is 1.4mm
            # m_current = float(input("motor_current in amps: "))
            # pick_up_speed = float(input("pick up tip speed in mm/s: "))
            # # Pick up distance i originally used was 16.5
            # pick_up_distance = float(input("pick up distance in mm: "))
            # await update_pick_up_current(hw_api, mount, m_current)
            # await update_pick_up_speed(hw_api, mount, pick_up_speed)
            # await update_pick_up_distance(hw_api, mount, pick_up_distance)
            # cp = CriticalPoint.NOZZLE
            # await move_to_point(hw_api, mount, pickup_loc, cp)
            # await hw_api.pick_up_tip(mount, tip_length=tip_length[args.tip_size])
            # await hw_api.home([Axis.Z_L])
            # input("Press Enter to continue: ")
            # cp = CriticalPoint.TIP
            # await move_to_point(hw_api, mount, droptip_loc, cp)
            # await hw_api.drop_tip(mount)
            # await hw_api.home_z(mount)

    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y])
    finally:
        await hw_api.disengage_axes([Axis.X, Axis.Y])
        await hw_api.clean_up()


if __name__ == "__main__":
    slot_locs = [
        "A1",
        "A2",
        "A3",
        "B1",
        "B2",
        "B3:",
        "C1",
        "C2",
        "C3",
        "D1",
        "D2",
        "D3",
    ]
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C1")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--tip_size", type=str, default="T1K", help="Tip Size")
    parser.add_argument("--mount_speed", type=float, default=5)
    parser.add_argument("--plunger_speed", type=float, default=10)
    args = parser.parse_args()
    slot_loc = {
        "A1": (13.42, 394.92, 110),
        "A2": (177.32, 394.92, 110),
        "A3": (341.03, 394.0, 110),
        "B1": (13.42, 288.42, 110),
        "B2": (177.32, 288.92, 110),
        "B3": (341.03, 288.92, 110),
        "C1": (13.42, 181.92, 110),
        "C2": (177.32, 181.92, 110),
        "C3": (341.03, 181.92, 110),
        "D1": (13.42, 75.5, 110),
        "D2": (177.32, 75.5, 110),
        "D3": (341.03, 75.5, 110),
    }
    tip_length = {"T1K": 95.7, "T200": 58.35, "T50": 57.9}
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT
    asyncio.run(_main())
