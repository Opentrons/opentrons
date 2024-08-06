"""EVO Tip Testing."""
import argparse
import ast
import asyncio
import csv
import time
from typing import Tuple, Dict, Optional, Any, List
from dataclasses import dataclass
from threading import Thread
import datetime
import os
import sys
import termios
import tty
import json
import logging
import subprocess

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
    _get_pipette_from_mount,
)
from opentrons_hardware.sensors.types import SensorDataType
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType, SensorId
from opentrons_hardware.drivers.can_bus import build
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.scripts.sensor_utils import (
    # handle_pressure_sensor,
    SensorRun,
)
from opentrons_hardware.sensors import sensor_driver, sensor_types

from opentrons_hardware.scripts.can_args import add_can_args, build_settings


from hardware_testing import data
from hardware_testing.drivers import mitutoyo_digimatic_indicator

global pipette_flow_rate
global pipette_action
test_volume = 1000
hms = "%H:%M:%S"

@dataclass
class CSVMetaData:
    """Sensor metadata."""

    serial: str
    sensor: str
    minutes: float
    auto_zero: bool
    start_time: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary."""
        return self.__dict__

class CSVFormatter:
    """CSV helper class to build a csv with sensor data."""

    def __init__(self, csv_name: str) -> None:
        """Constructor."""
        self._csv_name = csv_name

    @classmethod
    def build(cls, metadata: CSVMetaData, header: List[str]) -> "CSVFormatter":
        """Build a csv formatter object."""
        # datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
        date = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        csv_name = f"{metadata.sensor}_test_{date}.csv"
        with open(csv_name, "w") as cv:
            writer = csv.DictWriter(cv, fieldnames=header)
            writer.writeheader()
            writer.writerow(metadata.to_dict())
        with open(csv_name, "a") as cv:
            writer = csv.DictWriter(cv, fieldnames=["time",
                                                    "data",
                                                    "flow_rate",
                                                    "action",
                                                    "test_volume"])
            writer.writeheader()

        return cls(csv_name)

    def write_dict(self, data: Dict[str, Any]) -> None:
        """Write a dictionary of data to the csv."""
        with open(self._csv_name, "a") as cv:
            writer = csv.DictWriter(cv, fieldnames=list(data.keys()))
            writer.writerow(data)

    def write(self, data: str) -> None:
        """Write a line of text to the CSV."""
        with open(self._csv_name, "a") as cv:
            writer = csv.writer(cv, delimiter=" ")
            writer.writerow(data)

class InvalidInput(Exception):
    """Invalid input exception."""

    pass

async def update_pick_up_distance(api,
    mount: OT3Mount, prep_distance: float = 5,  distance: float = 3.0
) -> None:
    """Update pick-up-tip distance."""
    pipette = _get_pipette_from_mount(api, mount)
    config_model = pipette.pick_up_configurations.cam_action
    config_model.configuration_by_nozzle_map['Full']['default'].distance = distance
    config_model.prep_move_distance = prep_distance
    config_model.connect_tiprack_distance_mm = 6
    pipette.cam_action = config_model
    print(f'{pipette.cam_action}')

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
    data.append_data_to_file(test_name, test_id, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file, test_id


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
    global pipette_action
    # pipette_action = "Move Plunger to Top"
    # await api._move_to_plunger_top(mount, test_volume, rate=1.0)
    pipette_action = "Move Plunger to Bottom"
    await api._move_to_plunger_bottom(mount, rate=1.0)
    print("Move to Tiprack")
    pipette_action = "Moving"
    await move_to_point(api, mount, tiprack_loc, cp)
    current_position = await api.current_position_ot3(mount, cp)
    tiprack_loc = await jog(api, current_position, cp)
    tiprack_loc = Point(tiprack_loc[Axis.X],
                        tiprack_loc[Axis.Y],
                        tiprack_loc[Axis.by_mount(mount)])
    initial_press_dist = await api.encoder_current_position_ot3(mount, cp)
    print(f'Initial Press Position: {initial_press_dist[Axis.by_mount(mount)]}')
    pipette_action = "Picking up"
    await api.evo_pick_up_tip(
        mount, tip_length=(tip_length[args.tip_size]-tip_overlap),
        presses = None,
        increment = None,
        volume = test_volume)
    # await api._high_throughput_evo_push()
    pipette_action = "Finished Picking up"
    return tiprack_loc

async def sensor_task(can_driver: AbstractCanDriver) -> None:
    try:
        sensor_run = SensorRun(SensorType.pressure, "Alt P-Sensor", bool(0), 1.0, "left")
        print(sensor_run)
        p_thread = await handle_pressure_sensor(sensor_run, can_driver, NodeId.pipette_left)
        sensor_command, to_csv = await asyncio.get_event_loop().run_in_executor(
            None, p_thread
        )
    except KeyboardInterrupt:
        print(str(e))
    except Exception as e:
        print(str(e))

async def handle_pressure_sensor(
    command: SensorRun,
    driver: AbstractCanDriver,
    node_id: NodeId,
) -> None:
    """Function to read data from the pressure sensor."""
    start_time = time.perf_counter()
    csv = None
    pressure = sensor_types.PressureSensor.build(SensorId.S0, node_id)
    s_driver = sensor_driver.SensorDriver()
    metadata = CSVMetaData(
        command.serial_number,
        command.sensor_type.name,
        command.minutes,
        command.auto_zero,
        start_time,
    )
    csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    global pipette_action
    global pipette_flow_rate
    pipette_action = "making csv"
    pipette_flow_rate = 20
    while True:
        data = await s_driver.read(messenger, pressure, offset=False, timeout=10)
        curr_time = time.perf_counter() - start_time
        if isinstance(data, SensorDataType):
            # print(f'time: {curr_time}, Pressure: {data.to_float()}')
            csv.write_dict({"time": curr_time,
                            "data": data.to_float(),
                            "flow_rate": pipette_flow_rate,
                            "action": pipette_action,
                            "test volume": test_volume
                            })
    await messenger.stop()

async def _main() -> None:
    today = datetime.date.today()
    tips_to_use = 96
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    pipette_model = hw_api.get_all_attached_instr()[OT3Mount.LEFT]["pipette_id"]
    await hw_api.cache_instruments()
    await hw_api.home()
    await asyncio.sleep(1)
    await hw_api.home_plunger(mount)
    await hw_api.set_lights(rails=True)
    plunger_pos = get_plunger_positions_ot3(hw_api, mount)
    print(plunger_pos)
    home_position = await hw_api.current_position_ot3(mount)
    start_time = time.perf_counter()
    # async with build.driver(build_settings(args)) as driver:
        # loop = asyncio.get_event_loop()
        # loop.run_in_executor(None, sensor_task, driver)
        # loop.create_task(sensor_task(driver))
    ans =subprocess.Popen(["python3",
                            "-m",
                            "hardware_testing.scripts.pressure_sensor_script",
                            "--mount",
                            "left"],
                            stdout=subprocess.DEVNULL)
    try:
        # m_current = 1.5
        pipette_flow_rate = 20
        hw_api.set_flow_rate(mount,
                    pipette_flow_rate, pipette_flow_rate, pipette_flow_rate)
        # pick_up_speed = float(input("pick up tip speed in mm/s: "))
        # await update_pick_up_current(hw_api, mount, m_current)
        # await update_pick_up_speed(hw_api, mount, pick_up_speed)
        # await update_pick_up_distance(hw_api, mount, 3, 2.8)

        if (args.measure_nozzles):
            cp = CriticalPoint.NOZZLE
            home_wo_tip = await hw_api.current_position_ot3(mount, cp)
            initial_dial_loc = Point(
                                deck_slot['deck_slot'][args.dial_slot]['X'],
                                deck_slot['deck_slot'][args.dial_slot]['Y'],
                                home_wo_tip[Axis.by_mount(mount)]
            )
            # initial_dial_loc = Point(
            #                     236.65,
            #                     44.54,
            #                     145.45
            # )
            print("Move Nozzle to Dial Indicator")
            await move_to_point(hw_api, mount, initial_dial_loc, cp)
            current_position = await hw_api.current_position_ot3(mount, cp)
            nozzle_loc = await jog(hw_api, current_position, cp)
            number_of_channels = 1
            nozzle_count = 0
            x_offset = 0
            y_offset = 0
            measurements = []
            measurement_map = {}
            num_of_columns = 12
            num_of_rows = 8 * num_of_columns
            for tip in range(1, number_of_channels + 1):
                cp = CriticalPoint.NOZZLE
                nozzle_count += 1
                nozzle_position = Point(nozzle_loc[Axis.X] + x_offset,
                                        nozzle_loc[Axis.Y] + y_offset,
                                        nozzle_loc[Axis.by_mount(mount)])
                await move_to_point(hw_api, mount, nozzle_position, cp)
                await asyncio.sleep(1)
                nozzle_measurement = gauge.read()
                measurement_map.update({nozzle_count: nozzle_measurement})
                print("nozzle-",nozzle_count, "(mm): " , nozzle_measurement, end="")
                print("\r", end="")
                measurements.append(nozzle_measurement)
                if nozzle_count % num_of_columns == 0:
                    d_str = ''
                    for m in measurements:
                        d_str += str(m) + ','
                    d_str = d_str[:-1] + '\n'
                    print(f"{d_str}")
                    data.append_data_to_file(test_n, test_id, test_f, d_str)
                    # Reset Measurements list
                    measurements = []
                    print("\r\n")
                x_offset -= 9
                if nozzle_count % num_of_columns == 0:
                    y_offset += 9
                if nozzle_count % num_of_columns == 0:
                    x_offset = 0
            print(f'Nozzle Measurements: {measurement_map}')
            # num_of_columns = 12
        # Calibrate to tiprack
        if args.calibrate:
            print("Calibrate Tiprack")
            pickup_loc = await calibrate_tiprack(hw_api, home_position, mount)
            deck_slot['deck_slot'][args.tiprack_slot][Axis.X.name] = pickup_loc.x
            deck_slot['deck_slot'][args.tiprack_slot][Axis.Y.name] = pickup_loc.y
            deck_slot['deck_slot'][args.tiprack_slot]['Z'] = pickup_loc.z
            save_config_(path+cal_fn, deck_slot)
        cp = CriticalPoint.TIP
        home_pos = hw_api.get_instrument_max_height(mount, cp)
        pos = await hw_api.current_position_ot3(mount, refresh=True, critical_point = cp)
        await hw_api.move_to(mount,
                        Point(pos[Axis.X],
                            pos[Axis.Y],
                            home_pos))
        input("Press Enter to continue")
        await hw_api.move_to(mount,
                            Point(pickup_loc.x,
                                    pickup_loc.y,
                                    pickup_loc.z - 50))
        input("Press Enter to continue")
        print("dispense")
        global pipette_action
        pipette_action = "Dispense"
        await hw_api.dispense(mount, test_volume)
        # global pipette_action
        for x in range(1, 10+1):
            print("dispense")

            pipette_action = "Dispense"
            await hw_api.aspirate(mount, test_volume)

            print("dispense")
            pipette_action = "Dispense"
            await hw_api.dispense(mount, test_volume)

        # while True:
        #     pipette_flow_rate = float(input("input flow rate"))
        #     hw_api.set_flow_rate(mount, pipette_flow_rate, pipette_flow_rate, pipette_flow_rate)
        #     pipette_action = "Prepare for Aspirate"
        #     await hw_api.prepare_for_aspirate(mount)
        #     pipette_action = "Aspirate"
        #     await hw_api.aspirate(mount, test_volume)
        #     pipette_action = "Pause for 3 seconds"
        #     time.sleep(3)
        #     pipette_action = "Dispense"
        #     await hw_api.dispense(mount, test_volume)

        print("homing z stage")
        await hw_api.home_z(mount)
    except KeyboardInterrupt:
        task.cancel()
    except asyncio.CancelledError:
            pass

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
    parser.add_argument("--calibrate", action="store_true")
    parser.add_argument("--measure_nozzles", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--trough_slot", type=str, choices=slot_locs, default="D1")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--tip_size", type=str, default="T1K", help="Tip Size")
    parser.add_argument(
        "--dial_port", type=str, default="/dev/ttyUSB0", help="Dial indicator Port"
    )
    add_can_args(parser)
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
    tip_length = {"T1K": 95.6, "T200": 58.35, "T50": 57.9, "EvoT200": 51.0}
    tip_overlap = 5.9
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    if args.dial_indicator:
        gauge = dial_indicator_setup(port=args.dial_port)
    asyncio.run(_main(), debug = False)
