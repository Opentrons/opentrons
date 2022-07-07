"""Environment Sensor Driver Class."""
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import SensorId, SensorType, NodeId
from opentrons_hardware.sensors.utils import (
    ReadSensorInformation,
    WriteSensorInformation,
    SensorDataType,
)
from typing import Optional
from .sensor_abc import AbstractBasicSensor


class EnvironmentSensor(AbstractBasicSensor):
    """HDC2080 Driver."""

    def __init__(
        self, sensor_type: SensorType, sensor_id: SensorId = SensorId.S0
    ) -> None:
        """Constructor."""
        super().__init__(sensor_type, sensor_id)

    async def read(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        offset: bool = False,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Single read of the environment sensor."""
        read = ReadSensorInformation(
            self._sensor_type, self._sensor_id, node_id, offset
        )
        return await self._scheduler.send_read(read, can_messenger, timeout)

    async def write(
        self, can_messenger: CanMessenger, node_id: NodeId, data: SensorDataType
    ) -> None:
        """Write to a register of the environment sensor."""
        write = WriteSensorInformation(
            self._sensor_type, self._sensor_id, node_id, data
        )
        await self._scheduler.send_write(write, can_messenger)

    async def get_device_status(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        timeout: int = 1,
    ) -> bool:
        """Send a PeripheralStatusRequest and read the response message."""
        return await self._scheduler.request_peripheral_status(
            self._sensor_type, self._sensor_id, node_id, can_messenger, timeout
        )
