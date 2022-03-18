"""Helper functions for the sensor scripts."""
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

from typing import Dict, Any, List
import csv
from opentrons_hardware.sensors.utils import SensorDataType

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType
from opentrons_hardware.sensors import fdc1004, hdc2080, mmr920C04


@dataclass
class SensorRun:
    """User input for the sensor script."""

    sensor_type: SensorType
    pipette_serial_number: str
    auto_zero: bool
    minutes: int
    pipette_mount: str


@dataclass
class CSVMetaData:
    """Sensor metadata."""

    pipette_serial: str
    sensor: str
    repeats: int
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
        date = datetime.now().date()
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
    pipette_mount: NodeId,
    include_csv: bool,
    log: logging.Logger,
) -> None:
    """Function to read data from the pressure sensor."""
    start_time = datetime.now()
    csv = None
    pressure = mmr920C04.PressureSensor()
    if include_csv:
        metadata = CSVMetaData(
            command.pipette_serial_number,
            command.sensor_type.name,
            command.minutes,
            command.auto_zero,
            start_time.strftime("%H:%M:%S"),
        )
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    delta = timedelta(minutes=command.minutes)
    while datetime.now() - start_time < delta:
        messenger = CanMessenger(driver=driver)
        messenger.start()
        data = await pressure.read(messenger, pipette_mount, offset=False, timeout=10)
        curr_time = datetime.now().strftime("%H:%M:%S")
        if isinstance(data, SensorDataType):
            log.info(f"Pressure data: {data.to_float()} at: {curr_time}")
            if csv:
                csv.write_dict({"time": curr_time, "data": data.to_float()})
        else:
            log.info(f"Pressure data not found at: {curr_time}")

    end_time = datetime.now().strftime("%H:%M:%S")
    text_end_time = f"Test ended at: {end_time}"
    log.info(text_end_time)
    if csv:
        csv.write(text_end_time)


async def handle_capacitive_sensor(
    command: SensorRun,
    driver: AbstractCanDriver,
    pipette_mount: NodeId,
    include_csv: bool,
    log: logging.Logger,
) -> None:
    """Function to read data from the capacitive sensor."""
    start_time = datetime.now()
    csv = None
    capacitive = fdc1004.CapacitiveSensor()
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if include_csv:
        metadata = CSVMetaData(
            command.pipette_serial_number,
            command.sensor_type.name,
            command.minutes,
            command.auto_zero,
            start_time.strftime("%H:%M:%S"),
        )
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    # autozero
    await capacitive.poll(messenger, pipette_mount, 10, timeout=10)
    delta = timedelta(minutes=command.minutes)
    while datetime.now() - start_time < delta:
        data = await capacitive.read(messenger, pipette_mount, offset=False, timeout=10)
        curr_time = datetime.now().strftime("%H:%M:%S")

        log.info(f"Capacitive data: {data.to_float() if data else 'None'} at: {curr_time}")
        if isinstance(data, SensorDataType):
            log.info(f"Capacitive data: {data.to_float()} at: {curr_time}")
            if csv:
                csv.write_dict({"time": curr_time, "data": data.to_float()})
        else:
            log.info(f"Capacitive data not found at: {curr_time}")

    end_time = datetime.now().strftime("%H:%M:%S")
    text_end_time = f"Test ended at: {end_time}"
    log.info(text_end_time)
    if csv:
        csv.write(text_end_time)


async def handle_environment_sensor(
    command: SensorRun,
    driver: AbstractCanDriver,
    pipette_mount: NodeId,
    include_csv: bool,
    log: logging.Logger,
) -> None:
    """Function to read data from the environment sensor."""
    start_time = datetime.now()
    csv = None
    environment = hdc2080.EnvironmentSensor(command.sensor_type)
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if include_csv:
        metadata = CSVMetaData(
            command.pipette_serial_number,
            command.sensor_type.name,
            command.minutes,
            command.auto_zero,
            start_time.strftime("%H:%M:%S"),
        )
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    delta = timedelta(minutes=command.minutes)
    while datetime.now() - start_time < delta:
        data = await environment.read(messenger, pipette_mount, timeout=10)
        curr_time = datetime.now().strftime("%H:%M:%S")
        if isinstance(data, SensorDataType):
            log.info(f"Capacitive data: {data.to_float()} at: {curr_time}")
            if csv:
                csv.write_dict({"time": curr_time, "data": data.to_float()})
        else:
            log.info(f"Capacitive data not found at: {curr_time}")
    end_time = datetime.now().strftime("%H:%M:%S")
    text_end_time = f"Test ended at: {end_time}"
    log.info(text_end_time)
    if csv:
        csv.write(text_end_time)
