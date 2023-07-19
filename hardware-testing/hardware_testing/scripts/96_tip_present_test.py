"""Demo OT3 Gantry Functionality."""
import argparse
import ast
import asyncio
import csv
import time
from typing import Tuple, Dict, Optional
import datetime
import os
import sys
import termios
import tty
import json

from opentrons.hardware_control.motion_utilities import target_position_from_plunger
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
    _get_pipette_from_mount,
)

from hardware_testing import data

volume_test = 1000

def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys())) + "\n"

def file_setup(test_data, details):
    today = datetime.date.today()
    test_name = "{}-pick_up-up-test-{}Amps".format(
        details[0],  # Pipette model
        details[1],  # Motor Current
    )
    test_header = dict_keys_to_line(test_data)
    test_tag = "-{}".format(today.strftime("%b-%d-%Y"))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file

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


async def jog(api, mount):
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    pickup_motor_speed = 1
    position = 0
    tip_state = 0
    motor_current = {Axis.Q: 1.5}
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
        if input == "i":
            sys.stdout.flush()
            await api._motor_pickup_move(
                mount, motor_current, step_size[step_length_index], speed=-pickup_motor_speed
            )
            position -= step_size[step_length_index]

        elif input == "k":
            sys.stdout.flush()
            await api._motor_pickup_move(
                mount, motor_current, step_size[step_length_index], speed=pickup_motor_speed
            )
            position += step_size[step_length_index]

        elif input == "t":
            sys.stdout.flush()
            tip_state = await api.get_tip_presence(mount)
            print(tip_state)

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
            print("\r\n")
            return position
        print(
            "Coordinates: ",
            round(position, 2),
            ",",
            " Motor Step: ",
            step_size[step_length_index],
            ",",
            " Tip State: ",
            tip_state,
            end="",
        )
        print("\r", end="")

async def update_pickup_tip_speed(api, mount, speed) -> None:
    """Update drop-tip current."""
    pipette = _get_pipette_from_mount(api, mount)
    config_model = pipette.pick_up_configurations
    config_model.speed = speed
    pipette.pick_up_configurations = config_model
    print(pipette.pick_up_configurations)

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
                    slot_loc["B2"][0],
                    slot_loc["B2"][1],
                    home_position[Axis.by_mount(mount)])
    print("Move to Tiprack")
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
    drop_tip_loc = await jog(api, home_with_tip, cp)
    drop_tip_loc = Point(drop_tip_loc[Axis.X],
                        drop_tip_loc[Axis.Y],
                        drop_tip_loc[Axis.by_mount(mount)])
    #await api.drop_tip(mount)
    return tiprack_loc, drop_tip_loc

async def _main() -> None:
    today = datetime.date.today()
    tips_to_use = 96
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True,
        stall_detection_enable = False
    )
    await hw_api.cache_instruments()
    pipette_model = hw_api.get_all_attached_instr()[OT3Mount.LEFT]["pipette_id"]
    dial_data = {"Column_1": None, "Column_2": None, "Column_3": None, "Column_4": None, "Column_5": None, "Column_6": None,
                "Column_7": None, "Column_8": None, "Column_9": None, "Column_10": None, "Column_11": None, "Column_12": None}
    # m_current = float(input("motor_current in amps: "))
    # details = [pipette_model, m_current]
    # test_n, test_f = file_setup(dial_data, details)
    # file_name = "/home/root/.opentrons/testing_data/pickup_tip_test/pu_96_pipette_%s-%s.csv" % (
    #     m_current,
    #     datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
    # )
    # print(file_name)
    # print(test_n)
    # print(test_f)
    await hw_api.home()
    await asyncio.sleep(1)
    await hw_api.home_plunger(mount)
    await hw_api.set_lights(rails=True)
    plunger_pos = get_plunger_positions_ot3(hw_api, mount)
    print(plunger_pos)
    home_pos = await hw_api.current_position_ot3(mount)
    start_time = time.perf_counter()
    # m_current = float(input("motor_current in amps: "))
    # pick_up_speed = float(input("pick up tip speed in mm/s: "))
    # await update_pick_up_current(hw_api, mount, m_current)
    # await update_pick_up_speed(hw_api, mount, pick_up_speed)
    # await update_pick_up_distance(hw_api, mount, 16.5)
    input("Press enter to pick up tips")
    await hw_api.pick_up_tip(mount, 85.5)
    home_pos = await hw_api.current_position_ot3(mount)
    try:
        await hw_api.move_to(mount, Point(
                                150,
                                150,
                                home_pos[Axis.by_mount(mount)]))
        await jog(hw_api, mount)
        await hw_api.drop_tip(mount)

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
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--tip_size", type=str, default="T1K", help="Tip Size")
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
    tip_length = {"T1K": 95.7, "T200": 58.35, "T50": 57.5}
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT
    asyncio.run(_main())
