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
        csv_name = f"{metadata.sensor}_test.csv"
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

def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys())) + "\n"


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

async def sensor_task(can_driver: AbstractCanDriver) -> None:
    try:
        sensor_run = SensorRun(SensorType.pressure, "Alt P-Sensor", bool(0), 1.0, "left")
        print(sensor_run)
        p_thread = await handle_pressure_sensor(sensor_run, can_driver, NodeId.pipette_left)
        sensor_command, to_csv = await asyncio.get_event_loop().run_in_executor(
            None, p_thread
        )
    except KeyboardInterrupt:
        print('CANCELLED TASK')
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
            print(f'time: {curr_time}, Pressure: {data.to_float()}')
            csv.write_dict({"time": curr_time,
                            "data": data.to_float(),
                            "flow_rate": args.flow_rate,
                            "action": pipette_action,
                            "test volume": args.test_volume
                            })
    await messenger.stop()

async def _main() -> None:
    today = datetime.date.today()
    start_time = time.perf_counter()
    async with build.driver(build_settings(args)) as driver:
        loop = asyncio.get_event_loop()
        # loop.run_in_executor(None, sensor_task, driver)
        task = loop.create_task(sensor_task(driver))
        try:
            pipette_flow_rate = 20
            await task

        except KeyboardInterrupt:
            pass
        except asyncio.CancelledError:
            pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--flow_rate", type=int, default = 20)
    parser.add_argument("--test_volume", type=float, default = 1000)
    add_can_args(parser)
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    asyncio.run(_main(), debug = True)
