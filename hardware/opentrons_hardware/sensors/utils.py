"""Sensor helper classes."""
from dataclasses import dataclass


from opentrons_hardware.firmware_bindings.constants import (
    SensorThresholdMode,
)
from opentrons_hardware.sensors.types import SensorDataType
from opentrons_hardware.sensors.sensor_types import SensorInformation


@dataclass
class WriteSensorInformation:
    """Write sensor information."""

    sensor: SensorInformation
    data: SensorDataType


@dataclass
class SensorThresholdInformation:
    """Set a sensor threshold or request an autoset."""

    sensor: SensorInformation
    data: SensorDataType
    mode: SensorThresholdMode


@dataclass
class ReadSensorInformation:
    """Read sensor information."""

    sensor: SensorInformation
    offset: bool


@dataclass
class BaselineSensorInformation:
    """Poll sensor information."""

    sensor: SensorInformation
    number_of_reads: int
    offset: bool = False
