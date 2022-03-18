"""Sensor helper classes."""
from dataclasses import dataclass
from typing import List, overload

from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType
from opentrons_hardware.firmware_bindings.utils.binary_serializable import Int32Field


@dataclass
class SensorDataType:
    """Storage class for sensor data."""

    backing: Int32Field
    as_int: int

    @overload
    @classmethod
    def build(cls, data: int) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: Int32Field) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: List[int]) -> "SensorDataType":
        ...

    @classmethod
    def build(cls, data):  # type: ignore[no-untyped-def]
        """Build function for sensor data type."""
        if isinstance(data, list):
            cls.backing = Int32Field(cls._convert_to_int(data))
        elif isinstance(data, Int32Field):
            cls.backing = data
        else:
            cls.backing = Int32Field(data)
        cls.as_int = int(cls.backing.value)
        return cls

    @property
    def to_float(self) -> float:
        """Convert data to float."""
        return (1.0 * self.as_int) / 2**15

    @property
    def to_int(self) -> int:
        """Get data as int."""
        return self.as_int

    @staticmethod
    def _convert_to_int(backing: List[int]) -> int:
        """Convert data to int."""
        store = 0
        for i in backing:
            store |= i << 8
        return int(store)


@dataclass
class SensorInformation:
    """Basic sensor information."""

    sensor_type: SensorType
    node_id: NodeId


@dataclass
class WriteSensorInformation(SensorInformation):
    """Write sensor information."""

    data: SensorDataType


@dataclass
class ReadSensorInformation(SensorInformation):
    """Read sensor information."""

    offset: bool


@dataclass
class PollSensorInformation(SensorInformation):
    """Poll sensor information."""

    poll_for: int
    offset: bool = False
