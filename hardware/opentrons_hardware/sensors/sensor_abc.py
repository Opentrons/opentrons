"""Abstract base classes for the sensor drivers."""
from abc import ABC, abstractmethod

from typing import Optional

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorType
from opentrons_hardware.sensors.utils import SensorDataType


class AbstractBasicSensor(ABC):
    """Abstract base class for basic sensors."""

    @abstractmethod
    async def read(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        offset: bool,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Perform a single read to a given sensor."""
        ...

    @abstractmethod
    async def write(
        self, can_messenger: CanMessenger, node_id: NodeId, data: SensorDataType
    ) -> None:
        """Write a message to a given sensor."""
        ...


class AbstractAdvancedSensor(AbstractBasicSensor):
    """Abstract base class for advanced sensors."""

    def __init__(
        self,
        zero_threshold: float,
        stop_threshold: float,
        offset: float,
        sensor_type: SensorType,
    ) -> None:
        """Constructor."""
        self._zero_threshold: float = zero_threshold
        self._stop_threshold: float = stop_threshold
        self._offset: float = offset
        self._sensor_type: SensorType = sensor_type

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

    @property
    def offset(self) -> float:
        """Get base offset of the sensor."""
        return self._offset

    @offset.setter
    def offset(self, offset: float) -> None:
        """Set base offset of the sensor."""
        self._offset = offset

    @abstractmethod
    async def poll(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        poll_for_ms: int,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Poll the sensor for data."""
        ...

    @abstractmethod
    async def send_zero_threshold(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        threshold: SensorDataType,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Send the zero threshold to the sensor."""
        ...
