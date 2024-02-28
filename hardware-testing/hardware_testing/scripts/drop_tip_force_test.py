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

from opentrons.hardware_control.motion_utilities import target_position_from_plunger
from hardware_testing.opentrons_api.types import (
    OT3Mount,
    OT3Axis,
    Point,
    CriticalPoint,
)
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    home_ot3,
    move_plunger_absolute_ot3,
    move_plunger_relative_ot3,
    get_plunger_positions_ot3,
    update_pick_up_current,
    update_pick_up_distance,
    update_drop_tip_current,
    _get_pipette_from_mount,
)

from hardware_testing import data
from hardware_testing.drivers.mark10 import Mark10


def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys())) + "\n"


def file_setup(test_data, details):
    today = datetime.date.today()
    test_name = "{}-drop_tip-force-test-{}Amps".format(
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


async def jog(api, position, cp) -> Dict[OT3Axis, float]:
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
            round(position[OT3Axis.X], 2),
            ",",
            round(position[OT3Axis.Y], 2),
            ",",
            round(position[OT3Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")


async def update_drop_tip_distance(api, mount, position) -> None:
    pipette = _get_pipette_from_mount(api, mount)
    pipette.plunger_positions.drop_tip = position
    print(pipette.plunger_positions)


async def update_drop_tip_speed(api, mount, speed) -> None:
    """Update drop-tip current."""
    pipette = _get_pipette_from_mount(api, mount)
    config_model = pipette._drop_configurations
    config_model.speed = speed
    pipette._drop_configurations = config_model
    print(pipette._drop_configurations)


async def _main() -> None:
    today = datetime.date.today()
    tips_to_use = 96
    slot_loc = {
        "A1": (13.42, 394.92, 110),
        "A2": (177.32, 394.92, 110),
        "A3": (341.03, 394.92, 110),
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
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    tip_length = {"T1K": 85.7, "T50": 57.9}
    pipette_model = hw_api._pipette_handler.hardware_instruments[mount].name
    pipette = _get_pipette_from_mount(hw_api, mount)
    dial_data = {"Tip": None, "Tip Height": None, "Motor Current": None}
    m_current = 0.2
    await home_ot3(hw_api, [OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.X, OT3Axis.Y])
    await hw_api.home_plunger(mount)
    plunger_pos = get_plunger_positions_ot3(hw_api, mount)
    home_position = await hw_api.current_position_ot3(mount)
    global motion
    tip_length = {"T1K": 85.7, "T50": 57.9}
    if args.tip_size == "T1K":
        home_with_tip_position = 164.3  # T1K
    elif args.tip_size == "T50":
        home_with_tip_position = 192.1  # T50
    start_time = time.perf_counter()
    if args.fg_jog:
        cp = CriticalPoint.NOZZLE
        await hw_api.move_to(
            mount,
            Point(
                slot_loc["D2"][0],
                slot_loc["D2"][1],
                home_position[OT3Axis.by_mount(mount)],
            ),
        )
        current_position = await hw_api.current_position_ot3(mount)
        print("Move to Force Gauge")
        fg_loc = await jog(hw_api, current_position, cp)
        fg_loc = [fg_loc[OT3Axis.X], fg_loc[OT3Axis.Y], fg_loc[OT3Axis.by_mount(mount)]]

    try:
        cycle = 1
        drop_tip_distance = pipette.plunger_positions.drop_tip + 12
        await update_drop_tip_distance(hw_api, mount, drop_tip_distance)
        await update_drop_tip_speed(hw_api, mount, 10)
        await hw_api._backend.set_hold_current(
            {OT3Axis.X: 1.0, OT3Axis.Y: 1.0, OT3Axis.Z_L: 1.0, OT3Axis.Z_R: 1.0}
        )

        while True:
            d_current = float(input("Enter Drop Tip Current: "))
            await hw_api.add_tip(mount, tip_length[args.tip_size])
            # --------------------Drop Tip--------------------------------------
            details = [pipette_model, d_current]
            # Move the plunger to the bottom position
            await move_plunger_absolute_ot3(hw_api, mount, plunger_pos[1])
            if cycle == 1:
                headers = True
            else:
                header = False
            force_thread = Thread(
                target=force_record,
                args=(
                    details,
                    headers,
                ),
            )
            force_thread.start()
            # update the drop tip current
            await update_drop_tip_current(hw_api, mount, d_current)

            # obtain the encoder position
            final_drop_tip_position = await hw_api.drop_tip(mount, home_after=False)
            details = [pipette_model, d_current]
            await asyncio.sleep(1)
            motion = False
            await hw_api.home_plunger(mount)
            await asyncio.sleep(1)
            force_thread.join()  # Thread Finished
            print(f"drop tip current: {pipette._drop_configurations.current}")
            cycle += 1

        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await hw_api.clean_up()


def force_record(t_data, header):
    global motion
    file_name = (
        "/home/root/.opentrons/testing_data/drop_tip_force_data/dt_force_test_%s_%s-%s-amps.csv"
        % (
            datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
            t_data[0],
            t_data[1],
        )
    )
    print(file_name)
    with open(file_name, "w", newline="") as f:
        test_data = {
            "Time(s)": None,
            "Pipette Model": None,
            "Plunger Force(N)": None,
            "Dropt Current(Amps)": None,
        }
        log_file = csv.DictWriter(f, test_data)
        if header == True:
            log_file.writeheader()
        start_time = time.perf_counter()
        try:
            force_data = []
            motion = True
            while motion:
                reading = float(fg.read_force())
                time_elasped = time.perf_counter() - start_time
                force_data.append((reading, time_elasped))
                print(f"time(s): {time_elasped}, Force: {reading}")

            for force, t in force_data:
                test_data["Time(s)"] = t
                test_data["Pipette Model"] = t_data[0]
                test_data["Plunger Force(N)"] = force
                test_data["Dropt Current(Amps)"] = t_data[1]
                log_file.writerow(test_data)
                print(test_data)
                f.flush()
            print(f"Peak Force: {max(force_data)}")

        except KeyboardInterrupt:
            print("Test Cancelled")
            test_data["Errors"] = "Test Cancelled"
            f.flush()
        except Exception as e:
            print("ERROR OCCURED")
            test_data["Errors"] = e
            f.flush()
            raise e
        print("Test done")
        f.flush()
        f.close()


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
    parser.add_argument("--tiprack", action="store_true", default=True)
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--fg", action="store_true", default=True)
    parser.add_argument("--fg_jog", action="store_true", default=True)
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--tip_size", type=str, default="T1K", help="Tip Size")
    parser.add_argument(
        "--port", type=str, default="/dev/ttyUSB0", help="Force Gauge Port"
    )
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT
    if args.fg:
        fg = Mark10.create(port=args.port)
        fg.connect()
    asyncio.run(_main())
