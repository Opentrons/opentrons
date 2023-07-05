"""Helper functions for the sensor scripts."""
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

from typing import Dict, Any, List
import csv
from opentrons_hardware.sensors.types import SensorDataType, EnvironmentSensorDataType

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType, SensorId
from opentrons_hardware.sensors import sensor_driver, sensor_types

hms = "%H:%M:%S"


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
    pressure = sensor_types.PressureSensor.build(SensorId.S0, node_id)
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
    while datetime.now() < end_time:
        data = await s_driver.read(messenger, pressure, offset=False, timeout=10)
        curr_time = datetime.now().strftime(hms)
        if isinstance(data, SensorDataType):
            log.info(f"Pressure data: {data.to_float()} at: {curr_time}")
            if csv:
                csv.write_dict({"time": curr_time, "data": data.to_float()})
        else:
            log.info(f"Pressure data not found at: {curr_time}")

    end_time_log = datetime.now().strftime(hms)
    text_end_time = f"Test ended at: {end_time_log}"
    log.info(text_end_time)
    if csv:
        csv.write(text_end_time)
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
