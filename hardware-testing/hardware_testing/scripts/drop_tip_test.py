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

    file_name = (
        "/home/root/.opentrons/testing_data/drop_tip_test/enc_drop_tip_test_%s-%s-%s.csv"
        % (
            m_current,
            datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
            pipette_model,
        )
    )
    print(file_name)
    if args.tip_size == "T1K":
        home_with_tip_position = 164.3  # T1K
    elif args.tip_size == "T50":
        home_with_tip_position = 192.1  # T50
    start_time = time.perf_counter()
    if args.tiprack:
        await hw_api.move_to(
            mount,
            Point(
                slot_loc["B2"][0],
                slot_loc["B2"][1],
                home_position[OT3Axis.by_mount(mount)],
            ),
        )
        cp = CriticalPoint.NOZZLE
        print("Move to Tiprack")
        current_position = await hw_api.current_position_ot3(mount)
        tiprack_loc = await jog(hw_api, current_position, cp)
        # Start recording the encoder
        init_tip_loc = await hw_api.encoder_current_position_ot3(
            mount, CriticalPoint.NOZZLE
        )
        print(f"Start encoder: {init_tip_loc}")
        init_tip_loc = init_tip_loc[OT3Axis.by_mount(mount)]
        encoder_position = init_tip_loc
        init_tip_loc = await hw_api.encoder_current_position_ot3(
            mount, CriticalPoint.NOZZLE
        )
        await update_pick_up_current(hw_api, mount, m_current)
        # Move pipette to Force Gauge press location
        final_tip_loc = await hw_api.pick_up_tip(
            mount, tip_length=tip_length[args.tip_size]
        )
        await home_ot3(hw_api, [OT3Axis.by_mount(mount)])
        home_with_tip = await hw_api.current_position_ot3(
            mount, critical_point=CriticalPoint.TIP
        )
        print(f"home position with tip:{home_with_tip}")
        await hw_api.move_to(
            mount,
            Point(
                current_position[OT3Axis.X],
                current_position[OT3Axis.Y],
                home_with_tip_position,
            ),
            critical_point=CriticalPoint.TIP,
        )

        encoder_end = final_tip_loc[OT3Axis.by_mount(mount)]
        # final_tip_loc = await hw_api.encoder_current_position_ot3(mount, CriticalPoint.NOZZLE)
        print(f"End Encoder: {final_tip_loc}")
        final_tip_loc = final_tip_loc[OT3Axis.by_mount(mount)]
        location = "Calibration"
        details = [
            start_time,
            pipette_model,
            m_current,
            location,
            init_tip_loc,
            final_tip_loc,
            None,
        ]
        enc_record(file_name, details, True)
        tiprack_loc = [
            tiprack_loc[OT3Axis.X],
            tiprack_loc[OT3Axis.Y],
            tiprack_loc[OT3Axis.by_mount(mount)],
        ]
        # --------------------Drop Tip--------------------------------------
        # Move to trash slot
        await hw_api.move_to(
            mount,
            Point(
                slot_loc["A3"][0] + 50,
                slot_loc["A3"][1] - 20,
                home_with_tip[OT3Axis.by_mount(mount)],
            ),
            critical_point=CriticalPoint.TIP,
        )
        # await update_drop_tip_current(hw_api, mount, d_current)
        # obtain the encoder position
        init_drop_tip_position = await hw_api.encoder_current_position_ot3(mount)
        # obtain the encoder position
        final_drop_tip_position = await hw_api.drop_tip(mount)
        location = "Trash"
        details = [
            start_time,
            pipette_model,
            m_current,
            location,
            init_tip_loc,
            final_tip_loc,
            None,
        ]
        enc_record(file_name, details, False)
        print(f"drop tip current: {pipette._drop_configurations.current}")

    tip_count = 0
    x_offset = 0
    y_offset = 0

    try:
        for tip in range(2, tips_to_use + 1):
            d_current = 0.3
            # d_current = float(input("Enter Drop Tip Current: "))
            tip_count += 1
            y_offset -= 9
            if tip_count % 8 == 0:
                y_offset = 0
            if tip_count % 8 == 0:
                x_offset += 9
            await hw_api.home_z(mount, allow_home_other=False)
            # -----------------------Tiprack------------------------------------
            # Move over to the TipRack location and
            await hw_api.move_to(
                mount,
                Point(
                    tiprack_loc[0] + x_offset,
                    tiprack_loc[1] + y_offset,
                    home_position[OT3Axis.by_mount(mount)],
                ),
            )

            # Move Pipette to top of Tip Rack Location
            await hw_api.move_to(
                mount,
                Point(
                    tiprack_loc[0] + x_offset, tiprack_loc[1] + y_offset, tiprack_loc[2]
                ),
            )

            # Start recording the encoder
            init_tip_loc = await hw_api.encoder_current_position_ot3(
                mount, CriticalPoint.NOZZLE
            )
            print(f"Start encoder: {init_tip_loc[OT3Axis.by_mount(mount)]}")
            init_tip_loc = init_tip_loc[OT3Axis.by_mount(mount)]
            encoder_position = init_tip_loc
            # Press Pipette into the tip
            await update_pick_up_current(hw_api, mount, m_current)
            # Move pipette to Force Gauge press location
            final_tip_loc = await hw_api.pick_up_tip(
                mount, tip_length=tip_length[args.tip_size]
            )
            await hw_api.move_to(
                mount,
                Point(
                    tiprack_loc[0] + x_offset,
                    tiprack_loc[1] + y_offset,
                    home_with_tip[OT3Axis.by_mount(mount)],
                ),
                critical_point=CriticalPoint.TIP,
            )
            final_tip_loc = final_tip_loc[OT3Axis.by_mount(mount)]
            print(f"End Encoder: {final_tip_loc}")
            location = "Tiprack"
            details = [
                start_time,
                pipette_model,
                m_current,
                location,
                init_tip_loc,
                final_tip_loc,
                d_current,
            ]
            enc_record(file_name, details, False)
            # Home Z
            await hw_api.home([OT3Axis.by_mount(mount)])

            # --------------------Drop Tip--------------------------------------
            # Move to trash slot
            await hw_api.move_to(
                mount,
                Point(
                    slot_loc["A3"][0] + 50,
                    slot_loc["A3"][1] - 20,
                    home_with_tip[OT3Axis.by_mount(mount)],
                ),
                critical_point=CriticalPoint.TIP,
            )
            # Move the plunger to the top position
            await move_plunger_absolute_ot3(hw_api, mount, plunger_pos[1])
            # update the drop tip current
            await update_drop_tip_current(hw_api, mount, d_current)
            # obtain the encoder position
            init_drop_tip_position = await hw_api.encoder_current_position_ot3(mount)
            # obtain the encoder position
            final_drop_tip_position = await hw_api.drop_tip(mount, home_after=False)
            location = "Trash"
            details = [
                start_time,
                pipette_model,
                m_current,
                location,
                init_drop_tip_position[OT3Axis.of_main_tool_actuator(mount)],
                final_drop_tip_position[OT3Axis.of_main_tool_actuator(mount)],
                d_current,
            ]
            enc_record(file_name, details, False)
            await hw_api.home_plunger(mount)
            safety_margin = 1
            drop_tip_distance_target = 19 - safety_margin
            delta = (
                final_drop_tip_position[OT3Axis.of_main_tool_actuator(mount)]
                - init_drop_tip_position[OT3Axis.of_main_tool_actuator(mount)]
            )
            if delta < drop_tip_distance_target:
                print("Test Fail")
                break
            print(f"drop tip current: {pipette._drop_configurations.current}")

        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await hw_api.clean_up()


def enc_record(file_name, t_data, header):

    with open(file_name, "a", newline="") as f:
        test_data = {
            "Time(s)": None,
            "Pipette Model": None,
            "Location": None,
            "Motor Current(Amps)": +None,
            "Initial Enc Pos(mm)": None,
            "Final Enc Pos(mm)": None,
            "Dropt Current(Amps)": None,
            "Remaining Distance(mm)": None,
            "Pass/Fail": None,
        }
        log_file = csv.DictWriter(f, test_data)
        if header == True:
            log_file.writeheader()
        try:
            test_data["Time(s)"] = time.perf_counter() - t_data[0]
            test_data["Pipette Model"] = t_data[1]
            test_data["Motor Current(Amps)"] = t_data[2]
            test_data["Location"] = t_data[3]
            test_data["Initial Enc Pos(mm)"] = t_data[4]
            test_data["Final Enc Pos(mm)"] = t_data[5]
            test_data["Dropt Current(Amps)"] = t_data[6]
            test_data["Remaining Distance(mm)"] = t_data[5] - t_data[4]

            if t_data[3] == "Trash":
                print(f"initial P: {t_data[4]}, final P: {t_data[5]}")
                delta = t_data[5] - t_data[4]
                if delta < 0.1:
                    test_data["Pass/Fail"] = "PASS"
                else:
                    test_data["Pass/Fail"] = "FAIL"
            else:
                print(f"initial Z: {t_data[4]}, final Z: {t_data[5]}")
                test_data["Pass/Fail"] = None
            log_file.writerow(test_data)
            f.flush()
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
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--tip_size", type=str, default="T1K", help="Tip Size")
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    asyncio.run(_main())
