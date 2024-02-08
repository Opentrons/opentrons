"""Partial Tip Pick up For the 96 Channel."""
import argparse
# import ast
import asyncio
import csv
import time
from typing import Tuple, Dict, Optional
from threading import Thread
import datetime
import os, sys
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
    # update_drop_tip_speed,
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
test_volume = 1000

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

def load_config_(filename: str) -> Dict:
    """This function loads a given config file"""
    try:
        with open(filename, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        print('Warning: {0} not found'.format(filename))
        data = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt'.format(filename))
        data = {}
    return data

def save_config_(filename: str, data: str) -> Dict:
    """This function saves a given config file with data"""
    try:
        with open(filename, 'w') as file:
            json.dump(
                data, file, sort_keys=True, indent=4, separators=(',', ': ')
                    )
    except FileNotFoundError:
        print('Warning: {0} not found'.format(filename))
        data = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt'.format(filename))
        data = {}
    return data

async def calibrate_tiprack(api, home_position, mount):
    cp = CriticalPoint.NOZZLE

    tiprack_loc = Point(
                    deck_slot['deck_slot'][args.tiprack_slot]['X'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Y'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Z'])
    print(tiprack_loc)
    print("Calibrate for Pick up tip")
    await move_to_point(api, mount, tiprack_loc, cp)
    current_position = await api.current_position_ot3(mount, cp)
    tiprack_loc = await jog(api, current_position, cp)
    tiprack_loc = Point(tiprack_loc[Axis.X],
                        tiprack_loc[Axis.Y],
                        tiprack_loc[Axis.by_mount(mount)])
    await api.pick_up_tip(
        mount, tip_length=tip_length[args.tip_size],
        presses = 1,
        increment = 0,
        motor_pick_up = False)
    await api.home([Axis.Z_L])
    cp = CriticalPoint.TIP
    await asyncio.sleep(1)
    home_with_tip = await api.current_position(mount, cp)
    print("Calibrate Drop Tip Position")
    drop_tip_loc = await jog(api, home_with_tip, cp)
    drop_tip_loc = Point(drop_tip_loc[Axis.X],
                        drop_tip_loc[Axis.Y],
                        drop_tip_loc[Axis.by_mount(mount)])
    return tiprack_loc, drop_tip_loc

async def _main() -> None:
    today = datetime.date.today()
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    await asyncio.sleep(1)
    await hw_api.cache_instruments()
    pipette_model = hw_api.get_all_attached_instr()[OT3Mount.LEFT]["pipette_id"]
    dial_data = {"Column_1": None, "Column_2": None, "Column_3": None,
                    "Column_4": None, "Column_5": None, "Column_6": None,
                "Column_7": None, "Column_8": None, "Column_9": None,
                    "Column_10": None, "Column_11": None, "Column_12": None}
    m_current = float(input("motor_current in amps: "))
    # pick_up_speed = float(input("pick up tip speed in mm/s: "))
    details = [pipette_model, m_current]
    test_n, test_f = file_setup(dial_data, details)
    file_name = "/home/root/.opentrons/testing_data/pickup_tip_test/pu_96_pipette_%s-%s.csv" % (
        m_current,
        datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
    )
    lp_file_name = '/var/{}-P-{}_Z-{}-{}.csv'.format( pipette_model,
                                                args.plunger_speed,
                                                args.mount_speed,
                                                today.strftime("%b-%d-%Y"))
    liquid_probe_settings = LiquidProbeSettings(
                                                # starting_mount_height = 100,
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
    try:
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
        hw_api.clamp_tip_speed = float(input("clamp pick up Speed: "))
        pick_up_distance = float(input("pick up distance in mm: "))
        await update_pick_up_current(hw_api, mount, m_current)
        await update_pick_up_speed(hw_api, mount, pick_up_speed)
        await update_pick_up_distance(hw_api, mount, pick_up_distance)
        if (args.calibrate):
            cp = CriticalPoint.NOZZLE
            home_w_tip = await hw_api.current_position_ot3(mount, cp)
            initial_dial_loc = Point(
                                deck_slot['deck_slot'][args.dial_slot]['X'],
                                deck_slot['deck_slot'][args.dial_slot]['Y'],
                                home_w_tip[Axis.by_mount(mount)]
            )
            print("Move Nozzle to Dial Indicator")
            await move_to_point(hw_api, mount, initial_dial_loc, cp)
            current_position = await hw_api.current_position_ot3(mount, cp)
            nozzle_loc = await jog(hw_api, current_position_ot3(mount, cp))
            number_of_channels = 96
            for tip in range(1, number_of_channels + 1):
                cp = CriticalPoint.NOZZLE
                nozzle_count += 1
                nozzle_position = Point(nozzle_loc[0] + x_offset,
                                        nozzle_loc[1] + y_offset,
                                        nozzle_loc[2])
                await move_to_point(hw_api, mount, nozzle_position, cp)
                await asyncio.sleep(1)
                nozzle_measurement = gauge.read()
                print("nozzle-",nozzle_count, "(mm): " , nozzle_measurement, end="")
                print("\r", end="")
                measurements.append(nozzle_measurement)
                if tip_count % num_of_columns == 0:
                    d_str = ''
                    for m in measurements:
                        d_str += str(m) + ','
                    d_str = d_str[:-1] + '\n'
                    print(f"{d_str}")
                    data.append_data_to_file(test_n, test_f, d_str)
                    # Reset Measurements list
                    measurements = []
                    print("\r\n")
                x_offset -= 9
                if tip_count % num_of_columns == 0:
                    y_offset += 9
                if tip_count % num_of_columns == 0:
                    x_offset = 0
        # Calibrate to tiprack
        if (args.calibrate):
            pickup_loc, droptip_loc = await calibrate_tiprack(hw_api, home_position, mount)
            print(pickup_loc)
            deck_slot['deck_slot'][args.tiprack_slot][Axis.X.name] = pickup_loc.x
            deck_slot['deck_slot'][args.tiprack_slot][Axis.Y.name] = pickup_loc.y
            deck_slot['deck_slot'][args.tiprack_slot]['Z'] = pickup_loc.z
            save_config_(path+cal_fn, deck_slot)

        await hw_api.home_z(mount)
        cp = CriticalPoint.TIP
        home_w_tip = await hw_api.current_position_ot3(mount, cp)
        # Calibrate Dial Indicator with single tip
        if (args.calibrate):
            # cp = CriticalPoint.TIP
            initial_dial_loc = Point(
                            deck_slot['deck_slot'][args.dial_slot]['X'],
                            deck_slot['deck_slot'][args.dial_slot]['Y'],
                            home_w_tip[Axis.by_mount(mount)])
            print("Move to Dial Indicator")
            await move_to_point(hw_api, mount, initial_dial_loc, cp)
            current_position = await hw_api.current_position_ot3(mount, cp)
            dial_loc = await jog(hw_api, current_position, cp)
            dial_loc = Point(dial_loc[Axis.X],
                                dial_loc[Axis.Y],
                                dial_loc[Axis.by_mount(mount)])
            deck_slot['deck_slot'][args.dial_slot][Axis.X.name] = dial_loc.x
            deck_slot['deck_slot'][args.dial_slot][Axis.Y.name] = dial_loc.y
            deck_slot['deck_slot'][args.dial_slot]['Z'] = dial_loc.z
            save_config_(path+cal_fn, deck_slot)
        if (args.trough):
            cp = CriticalPoint.TIP
            trough_loc = Point(deck_slot['deck_slot'][args.trough_slot]['X'],
                                deck_slot['deck_slot'][args.trough_slot]['Y'],
                                home_w_tip[Axis.by_mount(mount)])
            print("Move to Trough")
            await move_to_point(hw_api, mount, trough_loc, cp)
            current_position = await hw_api.current_position_ot3(mount, cp)
            trough_loc = await jog(hw_api, current_position, cp)
            trough_loc = Point(trough_loc[Axis.X],
                                trough_loc[Axis.Y],
                                trough_loc[Axis.by_mount(mount)])
            deck_slot['deck_slot'][args.trough_slot][Axis.X.name] = dial_loc.x
            deck_slot['deck_slot'][args.trough_slot][Axis.Y.name] = dial_loc.y
            deck_slot['deck_slot'][args.trough_slot]['Z'] = dial_loc.z
            save_config_(path+cal_fn, deck_slot)

        num_of_columns = int(input("How many Columns: "))
        num_of_rows = int(input("Number of Rows: "))
        tips_to_use = (num_of_rows * num_of_columns)
        # tips_to_use = (num_of_columns * 8)
        while True:
            measurements = []
            tip_count = 0
            x_offset = 0
            y_offset = 0
            cp = CriticalPoint.TIP
            if args.dial_indicator:
                for tip in range(1, tips_to_use + 1):
                    cp = CriticalPoint.TIP
                    tip_count += 1
                    tip_position = Point(dial_loc[0] + x_offset,
                                            dial_loc[1] + y_offset,
                                            dial_loc[2])
                    await move_to_point(hw_api, mount, tip_position, cp)
                    await asyncio.sleep(1)
                    tip_measurement = gauge.read()
                    print("tip-",tip_count, "(mm): " ,tip_measurement, end="")
                    print("\r", end="")
                    measurements.append(tip_measurement)
                    if tip_count % num_of_columns == 0:
                        d_str = ''
                        for m in measurements:
                            d_str += str(m) + ','
                        d_str = d_str[:-1] + '\n'
                        print(f"{d_str}")
                        data.append_data_to_file(test_n, test_f, d_str)
                        # Reset Measurements list
                        measurements = []
                        print("\r\n")
                    x_offset -= 9
                    # if tip_count % num_of_column == 0:
                    if tip_count % num_of_columns == 0:
                        y_offset += 9
                    if tip_count % num_of_columns == 0:
                        x_offset = 0

            if args.trough:
                await hw_api.prepare_for_aspirate(mount)
                await move_to_point(hw_api, mount, trough_loc, cp)
                await hw_api.aspirate(mount, test_volume)
                await hw_api.home_z(mount)
                await countdown(leak_test_time)
                await move_to_point(hw_api, mount, trough_loc, cp)
                await hw_api.dispense(mount)
                # await hw_api.home_z(mount)
            # hw_api.clamp_drop_tip_speed = float(input("Drop tip speed: "))
            # await update_drop_tip_speed(hw_api, mount, hw_api.clamp_drop_tip_speed )
            cp = CriticalPoint.TIP
            await move_to_point(hw_api, mount, droptip_loc, cp)
            input("Feel the Tip!")
            await hw_api.drop_tip(mount)
            await hw_api.home_z(mount)

            m_current = float(input("motor_current in amps: "))
            pick_up_speed = float(input("prep pick up tip speed in mm/s: "))
            # Pick up distance i originally used was 16.5
            pick_up_distance = float(input("pick up distance in mm: "))
            hw_api.clamp_tip_speed = float(input("clamp pick up Speed: "))
            num_of_columns = int(input("How many Columns: "))
            num_of_rows = int(input("Number of Rows: "))
            tips_to_use = (num_of_rows * num_of_columns)
            # tips_to_use = num_of_columns * 8
            await update_pick_up_current(hw_api, mount, m_current)
            await update_pick_up_speed(hw_api, mount, pick_up_speed)
            await update_pick_up_distance(hw_api, mount, pick_up_distance)
            cp = CriticalPoint.NOZZLE
            if args.columns:
                column = float(input("How many Columns to Move: "))
                column = column*9
                pickup_loc = Point(pickup_loc[0] - column,
                                    pickup_loc[1],
                                    pickup_loc[2])
            else:
                row = float(input("How many Row to Move: "))
                row = row*9
                pickup_loc = Point(pickup_loc[0],
                                    pickup_loc[1] + row,
                                    pickup_loc[2])
            await move_to_point(hw_api, mount, pickup_loc, cp)
            await hw_api.pick_up_tip(mount,
                                    tip_length=tip_length[args.tip_size],
                                    presses = 1,
                                    increment = 0,
                                    motor_pick_up = False)
            await hw_api.home_z(mount.LEFT)
            cp = CriticalPoint.TIP
            current_position = await hw_api.current_position_ot3(mount, cp)
            this_position = await jog(hw_api, current_position, cp)
            input("Press Enter to continue")

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
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--trough_slot", type=str, choices=slot_locs, default="B3")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--calibrate", action="store_true")
    parser.add_argument("--columns", action="store_true")
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
    path = '/data/testing_data/'
    cal_fn = 'calibrations.json'
    if args.calibrate:
        with open(path + cal_fn, 'r') as openfile:
            deck_slot = json.load(openfile)
            print(deck_slot)
    else:
        with open(path + cal_fn, 'r') as openfile:
            deck_slot = json.load(openfile)
    tip_length = {"T1K": 95.7, "T200": 58.35, "T50": 57.9}
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    if args.dial_indicator:
        gauge = dial_indicator_setup(port=args.dial_port)
    asyncio.run(_main())
