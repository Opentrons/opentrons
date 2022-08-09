from dataclasses import dataclass
from typing import List, Union, overload, Optional
from typing_extensions import Final

from opentrons_hardware.firmware_bindings.constants import SensorType
from opentrons_hardware.firmware_bindings.utils.binary_serializable import (
    Int32Field,
)
from opentrons_hardware.firmware_bindings.messages.fields import SensorTypeField

sensor_fixed_point_conversion: Final[float] = 2**16


@dataclass
class SensorDataType:
    """Storage class for sensor data."""

    backing: Int32Field
    as_int: int
    sensor_type: SensorType

    @overload
    @classmethod
    def build(cls, data: int, _type: SensorTypeField) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: float, _type: SensorTypeField) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: Int32Field, _type: SensorTypeField) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: List[int], _type: SensorTypeField) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: int, _type: SensorType) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: float, _type: SensorType) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: Int32Field, _type: SensorType) -> "SensorDataType":
        ...

    @overload
    @classmethod
    def build(cls, data: List[int], _type: SensorType) -> "SensorDataType":
        ...

    @classmethod
    def build(cls, data, _type):  # type: ignore[no-untyped-def]
        """Build function for sensor data type."""
        if isinstance(data, list):
            backing = Int32Field(cls._convert_to_int(data))
        elif isinstance(data, Int32Field):
            backing = data
        elif isinstance(data, float):
            backing = Int32Field(int(data * sensor_fixed_point_conversion))
        else:
            backing = Int32Field(data)
        as_int = int(backing.value)
        if isinstance(_type, SensorTypeField):
            _converted_type = SensorType(_type.value)
        else:
            _converted_type = _type
        return cls(backing, as_int, _converted_type)

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
class EnvironmentSensorDataType:
    humidity: SensorDataType
    temperature: SensorDataType

    @classmethod
    def build(cls, data_list: List[SensorDataType]) -> "EnvironmentSensorDataType":
        humidity = SensorDataType.build(0, SensorType.humidity)
        temperature = SensorDataType.build(0, SensorType.temperature)
        for item in data_list:
            if item.sensor_type == SensorType.humidity:
                humidity = item
            else:
                temperature = item
        return cls(humidity, temperature)


SensorReturnType = Union[SensorDataType, EnvironmentSensorDataType]
