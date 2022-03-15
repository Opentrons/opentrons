from dataclasses import dataclass
from datetime import datetime, timedelta

from typing import Optional, Dict, Any, List
import csv

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType
from opentrons_hardware.sensors import fdc1004, hdc2080, mmr920C04

@dataclass
class SensorRun:
    sensor_type: SensorType
    device_id: str
    auto_zero: bool
    minutes: int
    pipette_mount: str
    positions: Optional[Dict[str, Any]]


@dataclass
class CSVMetaData:
    pipette_serial: str
    sensor: SensorType
    repeats: int
    auto_zero: bool
    start_time: str

    def to_dict(self) -> Dict[str, Any]:
        return self.__dict__


class CSVFormatter:
    def __init__(self, csv_name: str):
        self._csv_name = csv_name

    @classmethod
    def build(cls, metadata: CSVMetaData, header: List[str]) -> "CSVFormatter":
        date = datetime.now().date()
        csv_name = f"{metadata.sensor}_test_{date}.csv"
        with open(csv_name, 'w') as cv:
            writer = csv.DictWriter(cv, fieldnames=header)
            writer.writeheader()
            writer.writerow(metadata.to_dict())
        return cls(csv_name)
    
    def write_dict(self, data: Dict[str, Any]) -> None:
        with open(self._csv_name, 'a') as cv:
            writer = csv.DictWriter(cv, fieldnames=list(data.keys()))
            writer.writerow(data)

    def write(self, data: str) -> None:
        with open(self._csv_name, 'a') as cv:
            writer = csv.writer(cv, delimiter=' ')
            writer.writerow(data)

async def handle_pressure_sensor(
        command: SensorRun, driver: AbstractCanDriver, pipette_mount: NodeId, include_csv: bool, log) -> None:
    start_time = datetime.now()
    pressure = mmr920C04.PressureSensor()
    if include_csv:
        metadata = CSVMetaData(
            command.device_id, command.sensor_type,
            command.minutes, command.auto_zero, start_time.strftime("%H:%M:%S"))
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    delta = timedelta(minutes=command.minutes)
    while datetime.now() - start_time < delta:
        messenger = CanMessenger(driver=driver)
        messenger.start()
        data = await pressure.read(messenger, pipette_mount, offset=False, timeout=3)

        curr_time = datetime.now().strftime("%H:%M:%S")
        log.info(f"Pressure data: {data} at: {curr_time}")
        if csv:
            csv.write_dict(data.__dict__)
    end_time = datetime.now().strftime("%H:%M:%S")
    log.info(f"Test ended at: {end_time}")
    if csv:
        csv.write(end_time)

async def handle_capacitive_sensor(
        command: SensorRun, driver: AbstractCanDriver, pipette_mount: NodeId, include_csv: bool, log) -> None:
    start_time = datetime.now()
    capacitive = fdc1004.CapacitiveSensor()
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if include_csv:
        metadata = CSVMetaData(
            command.device_id, command.sensor_type,
            command.minutes, command.auto_zero, start_time.strftime("%H:%M:%S"))
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    # autozero
    capacitive.poll(messenger, pipette_mount, 10, timeout=10)
    delta = timedelta(minutes=command.minutes)
    while datetime.now() - start_time < delta:
        data = await capacitive.read(messenger, pipette_mount, offset=False, timeout=3)
        if csv:
            csv.write_dict(data.__dict__)
    end_time = datetime.now().strftime("%H:%M:%S")
    log.info(f"Test ended at: {end_time}")
    if csv:
        csv.write(end_time)


async def handle_environment_sensor(
        command: SensorRun, driver: AbstractCanDriver, pipette_mount: NodeId, include_csv: bool, log) -> None:
    start_time = datetime.now()
    environment = hdc2080.EnvironmentSensor(command.sensor_type)
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if include_csv:
        metadata = CSVMetaData(
            command.device_id, command.sensor_type,
            command.minutes, command.auto_zero, start_time.strftime("%H:%M:%S"))
        csv = CSVFormatter.build(metadata, list(metadata.to_dict().keys()))
    delta = timedelta(minutes=command.minutes)
    while datetime.now() - start_time < delta:
        data = await environment.read(messenger, pipette_mount, timeout=3)
        if csv:
            csv.write_dict(data.__dict__)
    end_time = datetime.now().strftime("%H:%M:%S")
    log.info(f"Test ended at: {end_time}")
    if csv:
        csv.write(end_time)
