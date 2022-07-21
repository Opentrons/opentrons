"""Abstract base classes for the sensor drivers."""
from abc import ABC, abstractmethod

from typing import Optional, AsyncIterator
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
)
from opentrons_hardware.sensors.utils import SensorDataType
from opentrons_hardware.firmware_bindings.constants import SensorOutputBinding
from .scheduler import SensorScheduler
from contextlib import asynccontextmanager


class AbstractBasicSensor(ABC):
    """Abstract base class for basic sensors."""

    def __init__(self, sensor_type: SensorType, sensor_id: SensorId) -> None:
        """Constructor."""
        self._sensor_type = sensor_type
        self._sensor_id = sensor_id
        self._scheduler = SensorScheduler()

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

    @abstractmethod
    async def get_device_status(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        timeout: int = 1,
    ) -> bool:
        """Send a PeripheralStatusRequest and read the response message."""
        ...


class AbstractAdvancedSensor(AbstractBasicSensor):
    """Abstract base class for advanced sensors."""

    def __init__(
        self,
        zero_threshold: float,
        stop_threshold: float,
        offset: float,
        sensor_type: SensorType,
        sensor_id: SensorId,
    ) -> None:
        """Constructor."""
        super().__init__(sensor_type, sensor_id)
        self._zero_threshold: float = zero_threshold
        self._stop_threshold: float = stop_threshold
        self._offset: float = offset

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
    async def get_baseline(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        poll_for_ms: int,
        sample_rate: int,
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

    async def get_report(
        self,
        node_id: NodeId,
        can_messenger: CanMessenger,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """This function retrieves ReadFromResponse messages.

        This is meant to be called after a bind_to_sync call,
        with the sensor being bound to "report".
        """
        ...

    @abstractmethod
    @asynccontextmanager
    async def bind_output(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        binding: SensorOutputBinding = SensorOutputBinding.sync,
    ) -> AsyncIterator[None]:
        """Send a BindSensorOutputRequest."""
        yield
