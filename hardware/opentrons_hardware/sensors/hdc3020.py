"""Environment Sensor Driver Class."""
from typing import Optional, AsyncIterator, Tuple
from contextlib import asynccontextmanager

from opentrons_hardware.firmware_bindings.messages.payloads import (
    BindSensorOutputRequestPayload,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    BindSensorOutputRequest,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorOutputBindingField,
    SensorTypeField,
    SensorIdField,
)
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import SensorOutputBinding, SensorId, SensorType, NodeId
from opentrons_hardware.sensors.utils import (
    ReadSensorInformation,
    WriteSensorInformation,
    PollSensorInformation,
    SensorDataType,
)
from typing import Optional
from .sensor_abc import AbstractBasicSensor


class EnvironmentSensor(AbstractBasicSensor):
    """HDC3020 Driver."""

    def __init__(
        self, sensor_type: SensorType, sensor_id: SensorId = SensorId.S0
    ) -> None:
        """Constructor."""
        super().__init__(SensorType.environment, sensor_id)

    async def read(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        offset: bool = False,
        timeout: int = 1,
    ) -> Optional[Tuple[SensorDataType]]:
        """Single read of the environment sensor."""
        read = ReadSensorInformation(
            self._sensor_type, self._sensor_id, node_id, offset
        )
        humidity = await self._scheduler.send_read(read, can_messenger, timeout)
        temperature = await self._scheduler.read(can_messenger, node_id)
        return humidity, temperature

    async def poll(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        offset: bool = False,
        timeout: int = 1,
    ) -> Optional[Tuple[SensorDataType]]:
        """Single read of the environment sensor."""
        read = PollSensorInformation(
            self._sensor_type, self._sensor_id, node_id, offset
        )
        humidity = await self._scheduler.run_poll(read, can_messenger, timeout)
        temperature = await self._scheduler.read(can_messenger, node_id)
        return humidity, temperature


    @asynccontextmanager
    async def bind_output(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        binding: SensorOutputBinding = SensorOutputBinding.sync,
    ) -> AsyncIterator[None]:
        """Send a BindSensorOutputRequest."""
        try:
            await can_messenger.send(
                node_id=node_id,
                message=BindSensorOutputRequest(
                    payload=BindSensorOutputRequestPayload(
                        sensor=SensorTypeField(self._sensor_type),
                        sensor_id=SensorIdField(self._sensor_id),
                        binding=SensorOutputBindingField(binding),
                    )
                ),
            )
            yield
        finally:
            await can_messenger.send(
                node_id=node_id,
                message=BindSensorOutputRequest(
                    payload=BindSensorOutputRequestPayload(
                        sensor=SensorTypeField(self._sensor_type),
                        sensor_id=SensorIdField(self._sensor_id),
                        binding=SensorOutputBindingField(SensorOutputBinding.none),
                    )
                ),
            )

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
