"""Abstract base classes for the sensor drivers."""
from abc import ABC, abstractmethod

from typing import Optional, AsyncIterator, Sequence
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger

from opentrons_hardware.sensors.sensor_types import BaseSensorType, ThresholdSensorType
from opentrons_hardware.sensors.types import SensorDataType, SensorReturnType
from opentrons_hardware.firmware_bindings.constants import SensorOutputBinding
from .scheduler import SensorScheduler
from contextlib import asynccontextmanager


class AbstractSensorDriver(ABC):
    """Abstract base class for basic sensors."""

    _scheduler: SensorScheduler

    @abstractmethod
    async def read(
        self,
        can_messenger: CanMessenger,
        sensor: BaseSensorType,
        offset: bool,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Perform a single read to a given sensor."""
        ...

    @abstractmethod
    async def write(
        self,
        can_messenger: CanMessenger,
        sensor: ThresholdSensorType,
        data: SensorDataType,
    ) -> None:
        """Write a message to a given sensor."""
        ...

    @abstractmethod
    async def get_device_status(
        self,
        can_messenger: CanMessenger,
        sensor: BaseSensorType,
        timeout: int = 1,
    ) -> bool:
        """Send a PeripheralStatusRequest and read the response message."""
        ...

    @abstractmethod
    async def get_baseline(
        self,
        can_messenger: CanMessenger,
        sensor: BaseSensorType,
        number_of_reads: int,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Poll the sensor for data."""
        ...

    @abstractmethod
    async def send_zero_threshold(
        self,
        can_messenger: CanMessenger,
        sensor: ThresholdSensorType,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Send the zero threshold to the sensor."""
        ...

    @abstractmethod
    async def get_report(
        self,
        sensor: BaseSensorType,
        can_messenger: CanMessenger,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
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
        sensor: BaseSensorType,
        binding: Optional[Sequence[SensorOutputBinding]],
    ) -> AsyncIterator[None]:
        """Send a BindSensorOutputRequest."""
        yield
