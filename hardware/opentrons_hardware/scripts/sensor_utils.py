"""Helper functions for the sensor scripts."""
from asyncio import sleep
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from time import time

from typing import Dict, Any, List, Tuple
import csv
from opentrons_hardware.sensors.types import SensorDataType, EnvironmentSensorDataType

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType, SensorId
from opentrons_hardware.sensors import sensor_driver, sensor_types

hms = "%H:%M:%S.%f"


@dataclass
class SensorRun:
    """User input for the sensor script."""

    sensor_type: SensorType
    serial_number: str
    auto_zero: bool
    minutes: float
    mount: str


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
        date = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        csv_name = f"{metadata.sensor}_test_{date}.csv"
        with open(csv_name, "w") as cv:
            writer = csv.DictWriter(cv, fieldnames=header)
            writer.writeheader()
            writer.writerow(metadata.to_dict())
        with open(csv_name, "a") as cv:
            writer = csv.DictWriter(cv, fieldnames=["time", "data"])
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


async def handle_pressure_sensor(
    command: SensorRun,
    driver: AbstractCanDriver,
    node_id: NodeId,
    include_csv: bool,
    log: logging.Logger,
) -> None:
    """Function to read data from the pressure sensor."""
    start_time = datetime.now()
    csv = None
    if "y" in input("is this an 8ch or 96ch? (y/n): ").lower():
        sensor_ids = [SensorId.S0, SensorId.S1]
    else:
        sensor_ids = [SensorId.S0]
    sensors = {
        s: sensor_types.PressureSensor.build(s, node_id)
        for s in sensor_ids
    }
    s_driver = sensor_driver.SensorDriver()
    if include_csv:
        metadata = CSVMetaData(
            command.serial_number,
            command.sensor_type.name,
            command.minutes,
            command.auto_zero,
            start_time.strftime(hms),
        )
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    end_time = start_time + timedelta(minutes=command.minutes)
    messenger = CanMessenger(driver=driver)
    messenger.start()
    prev_1_second: Dict[SensorId, List[Tuple[float, float]]] = {
        sid: []
        for sid in sensor_ids
    }
    stable_per_ch = {sid: False for sid in sensor_ids}
    all_stable = False
    stable_seconds = 1.0
    stable_pascals = 5.0
    _print_timestamp = time()

    async def _read(_s: sensor_types.PressureSensor) -> Tuple[float, float]:
        try:
            d = await s_driver.read(messenger, _s, offset=False, timeout=10)
            t = time()
        except Exception as exc:
            print(exc)
            await sleep(0.1)
            return await _read(_s)
        if not isinstance(d, SensorDataType):
            print(f"got no data: {curr_time}")
            await sleep(0.1)
            return await _read(_s)
        await sleep(0.05)
        return t, d.to_float()

    while datetime.now() < end_time:
        datas: Dict[SensorId, Tuple[float, float]] = {
            sid: await _read(sensor) for sid, sensor in sensors.items()
        }
        curr_time = datas[SensorId.S0][0]
        if curr_time - _print_timestamp > 1.0:
            print([data[1] for data in datas.values()])
            _print_timestamp = curr_time
        # check for stability
        for sid in sensor_ids:
            prev_1_second[sid].append(datas[sid])
            while prev_1_second[sid][0][0] < curr_time - stable_seconds:
                prev_1_second[sid].pop(0)
                pascals = [d[1] for d in prev_1_second[sid]]
                stable_per_ch[sid] = bool(max(pascals) - min(pascals) <= stable_pascals)
                all_stable = sum([1 for s in stable_per_ch.values() if s]) == len(sensor_ids)
        if csv:
            all_pa = [d[1] for d in datas.values()]
            csv.write_dict({
                "time": curr_time,
                "data": sum(all_pa) / len(all_pa),
                "stable": int(all_stable)
            })

    await messenger.stop()


async def handle_capacitive_sensor(
    command: SensorRun,
    driver: AbstractCanDriver,
    node_id: NodeId,
    include_csv: bool,
    log: logging.Logger,
) -> None:
    """Function to read data from the capacitive sensor."""
    start_time = datetime.now()
    csv = None
    capacitive = sensor_types.CapacitiveSensor.build(SensorId.S0, node_id)
    s_driver = sensor_driver.SensorDriver()
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if include_csv:
        metadata = CSVMetaData(
            command.serial_number,
            command.sensor_type.name,
            command.minutes,
            command.auto_zero,
            start_time.strftime(hms),
        )
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    # autozero
    await s_driver.get_baseline(messenger, capacitive, 10, timeout=10)
    end_time = start_time + timedelta(minutes=command.minutes)
    while datetime.now() < end_time:
        data = await s_driver.read(messenger, capacitive, offset=False, timeout=10)
        curr_time = datetime.now().strftime(hms)

        if isinstance(data, SensorDataType):
            log.info(f"Capacitive data: {data.to_float()} at: {curr_time}")
            if csv:
                csv.write_dict({"time": curr_time, "data": data.to_float()})
        else:
            log.info(f"Capacitive data not found at: {curr_time}")

    end_time_log = datetime.now().strftime(hms)
    text_end_time = f"Test ended at: {end_time_log}"
    log.info(text_end_time)
    if csv:
        csv.write(text_end_time)
    await messenger.stop()


async def handle_environment_sensor(
    command: SensorRun,
    driver: AbstractCanDriver,
    node_id: NodeId,
    include_csv: bool,
    log: logging.Logger,
) -> None:
    """Function to read data from the environment sensor."""
    start_time = datetime.now()
    csv = None
    environment = sensor_types.EnvironmentSensor.build(SensorId.S0, node_id)
    s_driver = sensor_driver.SensorDriver()
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if include_csv:
        metadata = CSVMetaData(
            command.serial_number,
            command.sensor_type.name,
            command.minutes,
            command.auto_zero,
            start_time.strftime(hms),
        )
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    end_time = start_time + timedelta(minutes=command.minutes)
    while datetime.now() < end_time:
        data = await s_driver.read(messenger, environment, offset=False, timeout=10)
        curr_time = datetime.now().strftime(hms)
        if isinstance(data, EnvironmentSensorDataType):
            log.info(f"Humidity data: {data.humidity.to_float()} at: {curr_time}")
            log.info(f"Temperature data: {data.temperature.to_float()} at: {curr_time}")
            if csv:
                csv.write_dict(
                    {
                        "time": curr_time,
                        "humidity": data.humidity.to_float(),
                        "temperature": data.temperature.to_float(),
                    }
                )
        else:
            log.info(f"Capacitive data not found at: {curr_time}")
    end_time_log = datetime.now().strftime(hms)
    text_end_time = f"Test ended at: {end_time_log}"
    log.info(text_end_time)
    if csv:
        csv.write(text_end_time)
    await messenger.stop()
