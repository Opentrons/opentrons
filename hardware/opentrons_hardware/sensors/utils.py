"""Sensor helper classes."""
from dataclasses import dataclass
from typing import List, overload, Union
from typing_extensions import Final, Literal

from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorOutputBindingField,
)
from opentrons_hardware.firmware_bindings.utils.binary_serializable import (
    Int32Field,
)

sensor_fixed_point_conversion: Final[float] = 2**16


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

    @overload
    @classmethod
    def build(cls, data: SensorOutputBindingField) -> "SensorDataType":
        ...

    @classmethod
    def build(cls, data):  # type: ignore[no-untyped-def]
        """Build function for sensor data type."""
        if isinstance(data, list):
            backing = Int32Field(cls._convert_to_int(data))
        elif isinstance(data, Int32Field):
            backing = data
        else:
            backing = Int32Field(data)
        as_int = int(backing.value)
        return cls(backing, as_int)

    def to_float(self) -> float:
        """Convert data to float."""
        return (1.0 * self.as_int) / sensor_fixed_point_conversion

    @property
    def to_int(self) -> int:
        """Get data as int."""
        return self.as_int

    @staticmethod
    def _convert_to_int(backing: List[int]) -> int:
        """Convert data to int."""
        return int.from_bytes(backing, byteorder="little", signed=True)


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
class SensorThresholdInformation(SensorInformation):
    """Set a sensor threshold or request an autoset."""

    data: Union[SensorDataType, Literal["auto"]]


@dataclass
class ReadSensorInformation(SensorInformation):
    """Read sensor information."""

    offset: bool


@dataclass
class PollSensorInformation(SensorInformation):
    """Poll sensor information."""

    poll_for: int
    offset: bool = False
