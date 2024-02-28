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
    _get_pipette_from_mount,
)

from hardware_testing import data
from hardware_testing.drivers import mitutoyo_digimatic_indicator


def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys())) + "\n"


def file_setup(test_data, details):
    today = datetime.date.today()
    test_name = "{}-tip_length-test-{}Amps".format(
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


def dial_indicator_setup():
    gauge = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(
        port="/dev/ttyUSB0"
    )
    gauge.connect()
    return gauge


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

async def move_to_point(api, mount, point, cp):
    home_pos = api.get_instrument_max_height(mount, cp)
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    await api.move_to(mount,
                    Point(pos[OT3Axis.X],
                        pos[OT3Axis.Y],
                        home_pos))
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos))
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z))


async def countdown(count_time: float):
    """
    This function loops through a countdown before checking the leak visually
    """
    time_suspend = 0
    while time_suspend < count_time:
        await asyncio.sleep(1)
        time_suspend += 1
        print(f"Remaining: {count_time-time_suspend} (s)", end="")
        print("\r", end="")
    print("")


async def update_pickup_tip_speed(api, mount, speed) -> None:
    """Update drop-tip current."""
    pipette = _get_pipette_from_mount(api, mount)
    config_model = pipette.pick_up_configurations
    config_model.speed = speed
    pipette.pick_up_configurations = config_model
    print(pipette.pick_up_configurations)


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
    tip_length = {"T1K": 95.7, "T200": 58.35, "T50": 57.9}
    pipette_model = hw_api._pipette_handler.hardware_instruments[mount].name
    dial_data = {"M_current(Amps)": None,
                "Pipette Model": None,
                "Tip_Height(mm)": None,
                "Nozzle_Height": None,
                "Tip_Overlap(mm)": None}
    # d_str = f"{m_current}, {pipette_model}, {tip_measurement}, {tip_loc}, {noz_loc}, {tip_overlap}, Tip \n"
    m_current = float(input("motor_current in amps: "))
    pick_up_speed = float(input("pick up tip speed in mm/s: "))
    details = [pipette_model, m_current]
    test_n, test_f = file_setup(dial_data, details)
    file_name = "/home/root/.opentrons/testing_data/data/tip_length_test_%s-%s.csv" % (
        m_current,
        datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
    )
    print(file_name)
    print(test_n)
    print(test_f)
    await home_ot3(hw_api, [OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.X, OT3Axis.Y])
    await hw_api.home_plunger(mount)
    plunger_pos = get_plunger_positions_ot3(hw_api, mount)
    home_position = await hw_api.current_position_ot3(mount)
    start_time = time.time()
    nozzle_home_pos = hw_api.get_instrument_max_height(mount, CriticalPoint.NOZZLE)
    tip_home_pos = hw_api.get_instrument_max_height(mount, CriticalPoint.TIP)

    if args.dial_indicator:
        cp = CriticalPoint.NOZZLE
        dial_point = Point(slot_loc["D2"][0],
                            slot_loc["D2"][1],
                            nozzle_home_pos - 100)
        await move_to_point(hw_api, mount, dial_point, cp)
        print("Moved to Dial Indicator")
        current_position = await hw_api.current_position_ot3(mount)
        nozzle_dial_loc = await jog(hw_api, current_position, cp)
        await asyncio.sleep(1)
        nozzle_measurement = gauge.read()
        noz_loc = await hw_api.encoder_current_position_ot3(mount = mount, critical_point = cp)
        noz_loc = noz_loc[OT3Axis.by_mount(mount)]
        await asyncio.sleep(2)
        d_str = f"{m_current}, {pipette_model}, {nozzle_measurement}, {noz_loc}, Nozzle \n"
        data.append_data_to_file(test_n, test_f, d_str)
        nozzle_dial_point = Point(nozzle_dial_loc[OT3Axis.X],
                            nozzle_dial_loc[OT3Axis.Y],
                            nozzle_dial_loc[OT3Axis.by_mount(mount)])

    if args.tiprack:
        cp = CriticalPoint.NOZZLE
        tiprack_point = Point(slot_loc["C2"][0],
                                slot_loc["C2"][1],
                                nozzle_home_pos-100)
        await move_to_point(hw_api, mount, tiprack_point, cp)
        print("Move to Tiprack")
        current_position = await hw_api.current_position_ot3(mount)
        tiprack_loc = await jog(hw_api, current_position, cp)
        init_noz_loc = await hw_api.encoder_current_position_ot3(
            mount, CriticalPoint.NOZZLE
        )
        init_noz_loc = init_noz_loc[OT3Axis.by_mount(mount)]
        await update_pick_up_current(hw_api, mount, m_current)
        await update_pickup_tip_speed(hw_api, mount, pick_up_speed)
        # Move pipette to Force Gauge press location
        final_noz_loc = await hw_api.pick_up_tip(
            mount, tip_length=tip_length[args.tip_size]
        )
        final_noz_loc = final_noz_loc[OT3Axis.by_mount(mount)]
        print(f"Nozzle Pos: {init_noz_loc}")
        print(f"Press Pos: {final_noz_loc}")
        tip_overlap = init_noz_loc - final_noz_loc
        print(f"tip_overlap: {tip_overlap}")
        location = "Tiprack"
        tip_count = 1
        test_details = [
            start_time,
            m_current,
            location,
            init_noz_loc,
            final_noz_loc,
            tip_count,
        ]
        enc_record(file_name, test_details)
        tiprack_loc = Point(
                        tiprack_loc[OT3Axis.X],
                        tiprack_loc[OT3Axis.Y],
                        tiprack_loc[OT3Axis.by_mount(mount)])

    if args.dial_indicator:
        cp = CriticalPoint.TIP
        tip_count = 1
        dial_point = Point(slot_loc["D2"][0],
                            slot_loc["D2"][1],
                            tip_home_pos - tip_length[args.tip_size])
        await move_to_point(hw_api, mount, dial_point, cp)
        print("Moved to Dial Indicator")
        current_position = await hw_api.current_position_ot3(mount, cp)
        dial_loc = await jog(hw_api, current_position, cp)
        await asyncio.sleep(1)
        tip_measurement = gauge.read()
        await asyncio.sleep(2)
        tip_loc = await hw_api.encoder_current_position_ot3(mount = mount, critical_point = CriticalPoint.NOZZLE)
        tip_loc = tip_loc[OT3Axis.by_mount(mount)]
        measured_tip_length = (tip_loc - noz_loc)
        d_str = f"{m_current}, {pipette_model}, {tip_measurement}, {tip_loc}, {tip_overlap}, {tip_count}, Tip \n"
        data.append_data_to_file(test_n, test_f, d_str)
        dial_point = Point(dial_loc[OT3Axis.X],
                            dial_loc[OT3Axis.Y],
                            dial_loc[OT3Axis.by_mount(mount)])

    print(f"Tip Length: {measured_tip_length}")
    # Move to trash slot
    cp = CriticalPoint.TIP
    trash = Point(slot_loc["A3"][0]+50, slot_loc["A3"][1]-20, tip_home_pos - 150)
    await move_to_point(hw_api, mount, trash, cp)
    await hw_api.drop_tip(mount)

    tip_count = 1
    x_offset = 0
    y_offset = 0
    try:

        for tip in range(2, tips_to_use + 1):
            tip_count += 1
            # y_offset -= 9
            # if tip_count % 8 == 0:
            #     y_offset = 0
            # if tip_count % 8 == 0:
            #     x_offset += 9
            # -----------------------Tiprack------------------------------------
            # Move the Nozzle to the Dial Indicator
            cp = CriticalPoint.NOZZLE
            await move_to_point(hw_api, mount, nozzle_dial_point, cp)
            noz_loc = await hw_api.encoder_current_position_ot3(mount, cp)
            noz_loc = noz_loc[OT3Axis.by_mount(mount)]
            await asyncio.sleep(3)
            nozzle_measurement = gauge.read()
            await asyncio.sleep(1)
            d_str = f"{m_current}, {pipette_model}, {nozzle_measurement}, {noz_loc},{None},{tip_count}, Nozzle \n"
            data.append_data_to_file(test_n, test_f, d_str)
            # # Move over to the TipRack location and
            tiprack_loc = Point(tiprack_loc.x, tiprack_loc.y, tiprack_loc.z)
            await move_to_point(hw_api, mount, tiprack_loc, cp)
            location = "Tiprack"

            # Start recording the encoder
            init_noz_loc = await hw_api.encoder_current_position_ot3(
                mount, CriticalPoint.NOZZLE
            )

            init_noz_loc = init_noz_loc[OT3Axis.by_mount(mount)]
            # Press Pipette into the tip
            await update_pick_up_current(hw_api, mount, m_current)
            # Move pipette to Force Gauge press location
            final_noz_loc = await hw_api.pick_up_tip(
                mount, tip_length=tip_length[args.tip_size]
            )
            final_noz_loc = final_noz_loc[OT3Axis.by_mount(mount)]
            print(f"Start encoder: {init_noz_loc}")
            print(f"End Encoder: {final_noz_loc}")
            tip_overlap = init_noz_loc - final_noz_loc
            print(f"tip_overlap: {tip_overlap}")
            elasped_time = (time.time() - start_time) / 60
            test_details = [
                elasped_time,
                m_current,
                location,
                init_noz_loc,
                final_noz_loc,
                tip_count,
            ]
            enc_record(file_name, test_details)
            cp = CriticalPoint.TIP
            await move_to_point(hw_api, mount, dial_point, cp)
            await asyncio.sleep(3)
            tip_measurement = gauge.read()
            await asyncio.sleep(1)
            tip_loc = await hw_api.encoder_current_position_ot3(mount = mount, critical_point = CriticalPoint.NOZZLE)
            tip_loc = tip_loc[OT3Axis.by_mount(mount)]
            measured_tip_length = (tip_loc - noz_loc)
            d_str = f"{m_current}, {pipette_model}, {tip_measurement}, {tip_loc}, {tip_overlap}, {tip_count}, Tip \n"
            print(f"{d_str}")
            data.append_data_to_file(test_n, test_f, d_str)
            await asyncio.sleep(1)
            print(f"Tip Length: {measured_tip_length}")
            # --------------------Drop Tip--------------------------------------
            current_position = await hw_api.current_position_ot3(
                mount, critical_point=CriticalPoint.TIP
            )
            await move_to_point(hw_api, mount, trash, cp)
            await hw_api.drop_tip(mount)
            input("Press Enter to Continue")

        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await hw_api.clean_up()

def enc_record(f_name, t_data):
    # test_details = [start_time, m_current, location, init_tip_loc, final_tip_loc, tip_count]
    with open(f_name, "a", newline="") as f:
        test_data = {
            "time(s)": None,
            "motor_current": None,
            "location": None,
            "start_enc_pos(mm)": None,
            "end_enc_pos(mm)": None,
        }
        log_file = csv.DictWriter(f, test_data)
        if t_data[5] < 1:
            log_file.writeheader()
        try:
            test_data["time(s)"] = time.perf_counter() - t_data[0]
            test_data["motor_current"] = t_data[1]
            test_data["location"] = t_data[2]
            test_data["start_enc_pos(mm)"] = t_data[3]
            test_data["end_enc_pos(mm)"] = t_data[4]
            log_file.writerow(test_data)
            print(test_data)
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
    parser.add_argument("--fg_jog", action="store_true")
    parser.add_argument("--trough", action="store_true")
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C1")
    parser.add_argument("--trough_slot", type=str, choices=slot_locs, default="B3")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--tip_size", type=str, default="T50", help="Tip Size")
    parser.add_argument(
        "--port", type=str, default="/dev/ttyUSB0", help="Force Gauge Port"
    )
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    if args.dial_indicator:
        gauge = dial_indicator_setup()
    asyncio.run(_main())
