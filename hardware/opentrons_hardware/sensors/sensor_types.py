"""The types of sensors supported by the system"""
from abc import abstractmethod
from dataclasses import dataclass
from typing import List, Union, Optional
from opentrons_hardware.firmware_bindings.messages.fields import SensorTypeField

from opentrons_hardware.firmware_bindings.constants import NodeId, SensorId, SensorType
from opentrons_hardware.sensors.types import SensorDataType, EnvironmentSensorDataType


@dataclass
class SensorInformation:
    """Basic sensor information."""

    sensor_type: SensorType
    sensor_id: SensorId
    node_id: NodeId


@dataclass
class BaseSensorType:
    """A base sensor type."""

    sensor: SensorInformation
    _offset: float
    _expected_can_messages: int

    @property
    def offset(self) -> float:
        """Get base offset of the sensor."""
        return self._offset

    @offset.setter
    def offset(self, offset: float) -> None:
        """Set base offset of the sensor."""
        self._offset = offset

    @property
    def expected_responses(self) -> int:
        """The number of values returned from a sensor at a given time."""
        return self._expected_can_messages

    def set_sensor_data(
        self, sensor_data: List[SensorDataType]
    ) -> Union[SensorDataType, EnvironmentSensorDataType]:
        return SensorDataType.build(0.0, SensorType.environment)


@dataclass
class ThresholdSensorType(BaseSensorType):
    """A sensor type that utilizes thresholds."""

    _zero_threshold: float
    _stop_threshold: float

    @property
    def zero_threshold(self) -> float:
        """Get the threshold that the offset value is compared to."""
        return self._zero_threshold

    @zero_threshold.setter
    def zero_threshold(self, zero_threshold: float) -> None:
        """Set the threshold that the offset value is compared to."""
        self._zero_threshold = zero_threshold

    @property
    def stop_threshold(self) -> float:
        """Get the threshold to stop the robot for."""
        return self._stop_threshold

    @stop_threshold.setter
    def stop_threshold(self, stop_threshold: float) -> None:
        """Set threshold to stop the robot for."""
        self._stop_threshold = stop_threshold


@dataclass
class PressureSensor(ThresholdSensorType):
    # unsure if this should be manipulated or
    # stored after the fact
    data: SensorDataType

    @classmethod
    def build(
        cls,
        sensor_id: SensorId,
        node_id: NodeId,
        offset: float = 0.0,
        zero_threshold: float = 0.0,
        stop_threshold: float = 0.0,
    ) -> "PressureSensor":
        info = SensorInformation(SensorType.pressure, sensor_id, node_id)
        sensor_data = SensorDataType.build(0, SensorTypeField(SensorType.pressure))
        return cls(info, offset, 1, zero_threshold, stop_threshold, sensor_data)

    def set_sensor_data(self, sensor_data: List[SensorDataType]) -> SensorDataType:
        self.data = sensor_data[0]
        return self.data


@dataclass
class CapacitiveSensor(ThresholdSensorType):
    data: SensorDataType

    @classmethod
    def build(
        cls,
        sensor_id: SensorId,
        node_id: NodeId,
        offset: float = 0.0,
        zero_threshold: float = 0.0,
        stop_threshold: float = 0.0,
    ) -> "CapacitiveSensor":
        info = SensorInformation(SensorType.capacitive, sensor_id, node_id)
        sensor_data = SensorDataType.build(0, SensorTypeField(SensorType.capacitive))
        return cls(info, offset, 1, zero_threshold, stop_threshold, sensor_data)

    def set_sensor_data(self, sensor_data: List[SensorDataType]) -> SensorDataType:
        self.data = sensor_data[0]
        return self.data


@dataclass
class EnvironmentSensor(BaseSensorType):
    data: EnvironmentSensorDataType

    @classmethod
    def build(
        cls, sensor_id: SensorId, node_id: NodeId, offset: float = 0.0
    ) -> "EnvironmentSensor":
        info = SensorInformation(SensorType.environment, sensor_id, node_id)
        empty_list = [
            SensorDataType.build(0, SensorTypeField(SensorType.temperature)),
            SensorDataType.build(0, SensorTypeField(SensorType.humidity)),
        ]
        data = EnvironmentSensorDataType.build(empty_list)
        return cls(info, offset, 2, data)

    def set_sensor_data(
        self, sensor_data: List[SensorDataType]
    ) -> EnvironmentSensorDataType:
        self.data = EnvironmentSensorDataType.build(sensor_data)
        return self.data
