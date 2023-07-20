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

from opentrons.config.types import LiquidProbeSettings

from hardware_testing import data
from hardware_testing.drivers.mark10 import Mark10
from hardware_testing.drivers import mitutoyo_digimatic_indicator

aspirate_depth = 10
dispense_depth = 3
liquid_retract_dist = 12
liquid_retract_speed = 5
retract_dist = 100
retract_speed = 60

leak_test_time = 30
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


def dial_indicator_setup(port):
    gauge = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=port)
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
        is_simulating=args.simulate, use_defaults=True
    )
    pipette_model = hw_api.get_all_attached_instr()[OT3Mount.LEFT]["pipette_id"]

    dial_data = {"Column_1": None, "Column_2": None, "Column_3": None, "Column_4": None, "Column_5": None, "Column_6": None,
                "Column_7": None, "Column_8": None, "Column_9": None, "Column_10": None, "Column_11": None, "Column_12": None}
    m_current = float(input("motor_current in amps: "))
    # pick_up_speed = float(input("pick up tip speed in mm/s: "))
    details = [pipette_model, m_current]
    test_n, test_f = file_setup(dial_data, details)
    file_name = "/home/root/.opentrons/testing_data/pickup_tip_test/pu_96_pipette_%s-%s.csv" % (
        m_current,
        datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
    )
    # print(file_name)
    # print(test_n)
    # print(test_f)
    lp_file_name = '/var/{}-P-{}_Z-{}-{}.csv'.format( pipette_model,
                                                args.plunger_speed,
                                                args.mount_speed,
                                                today.strftime("%b-%d-%Y"))
    liquid_probe_settings = LiquidProbeSettings(
                                                starting_mount_height = 10,
                                                max_z_distance = args.max_z_distance,
                                                min_z_distance = args.min_z_distance,
                                                mount_speed = args.mount_speed,
                                                plunger_speed = args.plunger_speed,
                                                sensor_threshold_pascals = args.sensor_threshold,
                                                expected_liquid_height = args.expected_liquid_height,
                                                log_pressure = args.log_pressure,
                                                aspirate_while_sensing = False,
                                                auto_zero_sensor = False,
                                                num_baseline_reads = 10,
                                                data_file = lp_file_name,
                                                )
    await hw_api.home()
    await asyncio.sleep(1)
    await hw_api.home_plunger(mount)
    await hw_api.set_lights(rails=True)
    plunger_pos = get_plunger_positions_ot3(hw_api, mount)
    print(plunger_pos)
    home_position = await hw_api.current_position_ot3(mount)
    start_time = time.perf_counter()
    m_current = float(input("motor_current in amps: "))
    pick_up_speed = float(input("pick up tip speed in mm/s: "))
    await update_pick_up_current(hw_api, mount, m_current)
    await update_pick_up_speed(hw_api, mount, pick_up_speed)
    await update_pick_up_distance(hw_api, mount, 16.5)
    # Calibrate to tiprack
    if args.tiprack:
        pickup_loc, droptip_loc = await calibrate_tiprack(hw_api, home_position, mount)
    await hw_api.home_z(mount)
    cp = CriticalPoint.TIP
    home_w_tip = await hw_api.current_position_ot3(mount, cp)
    # Calibrate Dial Indicator with single tip
    if args.dial_indicator:
        cp = CriticalPoint.TIP
        dial_loc = Point(
                        slot_loc[args.dial_slot][0],
                        slot_loc[args.dial_slot][1],
                        home_w_tip[Axis.by_mount(mount)])
        print("Move to Dial Indicator")
        await move_to_point(hw_api, mount, dial_loc, cp)
        current_position = await hw_api.current_position_ot3(mount, cp)
        dial_loc = await jog(hw_api, current_position, cp)
        dial_loc = Point(dial_loc[Axis.X],
                            dial_loc[Axis.Y],
                            dial_loc[Axis.by_mount(mount)])
    if args.trough:
        cp = CriticalPoint.TIP
        trough_loc = Point(slot_loc[args.trough_slot][0],
                            slot_loc[args.trough_slot][1],
                            home_w_tip[Axis.by_mount(mount)])
        print("Move to Trough")
        await move_to_point(hw_api, mount, trough_loc, cp)
        current_position = await hw_api.current_position_ot3(mount, cp)
        trough_loc = await jog(hw_api, current_position, cp)
        trough_loc = Point(trough_loc[Axis.X],
                            trough_loc[Axis.Y],
                            trough_loc[Axis.by_mount(mount)])

    try:
        tip_count = 0
        x_offset = 0
        y_offset = 0
        while True:
            measurements = []
            tip_count = 0
            cp = CriticalPoint.TIP
            for tip in range(1, tips_to_use + 1):
                cp = CriticalPoint.TIP
                tip_count += 1
                x_offset -= 9
                if tip_count % 12 == 0:
                    y_offset += 9
                if tip_count % 12 == 0:
                    x_offset = 0
                await asyncio.sleep(1)
                if args.dial_indicator:
                    tip_measurement = gauge.read()
                    print("tip-",tip_count, "(mm): " ,tip_measurement, end="")
                    print("\r", end="")
                    tip_position = Point(dial_loc[0] + x_offset,
                                            dial_loc[1] + y_offset,
                                            dial_loc[2])
                    measurements.append(tip_measurement)
                    if tip_count % 12 == 0:
                        d_str = ''
                        for m in measurements:
                            d_str += str(m) + ','
                        d_str = d_str[:-1] + '\n'
                        print(f"{d_str}")
                        data.append_data_to_file(test_n, test_f, d_str)
                        # Reset Measurements list
                        measurements = []
                        print("\r\n")
                await move_to_point(hw_api, mount, tip_position, cp)
            await move_to_point(hw_api, mount, trough_loc, cp)
            await hw_api.liquid_probe(mount = mount, probe_settings = liquid_probe_settings)
            await move_to_point(hw_api, mount, droptip_loc, cp)
            await hw_api.drop_tip(mount)
            await hw_api.home_z(mount)
            # Default is 1.4mm
            m_current = float(input("motor_current in amps: "))
            pick_up_speed = float(input("pick up tip speed in mm/s: "))
            # Pick up distance i originally used was 16.5
            pick_up_distance = float(input("pick up distance in mm: "))
            await update_pick_up_current(hw_api, mount, m_current)
            await update_pick_up_speed(hw_api, mount, pick_up_speed)
            await update_pick_up_distance(hw_api, mount, pick_up_distance)
            cp = CriticalPoint.NOZZLE
            await move_to_point(hw_api, mount, pickup_loc, cp)
            await hw_api.pick_up_tip(mount, tip_length=tip_length[args.tip_size])

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
    parser.add_argument("--trough", action="store_true")
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C1")
    parser.add_argument("--trough_slot", type=str, choices=slot_locs, default="B3")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--tip_size", type=str, default="T1K", help="Tip Size")
    parser.add_argument("--max_z_distance", type=float, default=40)
    parser.add_argument("--min_z_distance", type=float, default=5)
    parser.add_argument("--mount_speed", type=float, default=5)
    parser.add_argument("--plunger_speed", type=float, default=10)
    parser.add_argument(
        "--sensor_threshold", type=float, default=100, help="Threshold in Pascals"
    )
    parser.add_argument("--expected_liquid_height", type=int, default=0)
    parser.add_argument("--log_pressure", action="store_true")
    parser.add_argument(
        "--dial_port", type=str, default="/dev/ttyUSB0", help="Dial indicator Port"
    )
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

    if args.dial_indicator:
        gauge = dial_indicator_setup(port=args.dial_port)
    asyncio.run(_main())
