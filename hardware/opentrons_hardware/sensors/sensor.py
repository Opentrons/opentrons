"""Capacitve Sensor Driver Class."""

from typing import Optional, AsyncIterator
from contextlib import asynccontextmanager

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
)
from opentrons_hardware.firmware_bindings.constants import (
    SensorOutputBinding,
    SensorThresholdMode,
)
from opentrons_hardware.firmware_bindings.constants import SensorId, SensorType, NodeId
from opentrons_hardware.sensors.utils import (
    ReadSensorInformation,
    PollSensorInformation,
    WriteSensorInformation,
    SensorThresholdInformation,
    SensorDataType,
    EnvironmentSensorData
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    BindSensorOutputRequestPayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorOutputBindingField,
    SensorTypeField,
    SensorIdField,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    BindSensorOutputRequest,
)
from .sensor_abc import AbstractAdvancedSensor, SensorReturnType


class Sensor(AbstractAdvancedSensor):
    """Generic Sensor Driver."""

    # probably should remove sensor type so that only one object
    # needs to be created.
    # have data classes that hold respective state info about
    # each sensor.
    def __init__(
        self,
        sensor_type: SensorType,
        zero_threshold: float = 0.0,
        stop_threshold: float = 0.0,
        offset: float = 0.0,
        sensor_id: SensorId = SensorId.S0,
    ) -> None:
        """Constructor."""
        super().__init__(
            zero_threshold, stop_threshold, offset, sensor_type, sensor_id
        )

    def __repr__(self) -> str:
        return f"<{self._sensor_type} sensor: {self._sensor_id}>"

    async def get_report(
        self,
        node_id: NodeId,
        can_messenger: CanMessenger,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """This function retrieves ReadFromResponse messages.

        This is meant to be called after a bind_to_sync call,
        with the sensor being bound to "report".
        """
        sensor_data = await self._scheduler.read(can_messenger, timeout)
        if not sensor_data:
            return sensor_data
        if len(sensor_data) > 1 and self._sensor_type == SensorType.environment:
            return EnvironmentSensorData.build(sensor_data) 
        else:
            return sensor_data[0]

    async def get_baseline(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        poll_for_ms: int,
        sample_rate: int,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Poll the capacitive sensor."""
        poll = PollSensorInformation(
            self._sensor_type, self._sensor_id, node_id, poll_for_ms
        )
        if self._sensor_type == SensorType.environment:
            expected_responses = 2
        else:
            expected_responses = 1
        sensor_data = await self._scheduler.run_poll(poll, can_messenger, timeout, expected_responses)
        if not sensor_data:
            return sensor_data
        if len(sensor_data) > 1 and self._sensor_type == SensorType.environment:
            return EnvironmentSensorData.build(sensor_data)
        else:
            return sensor_data[0]

    async def read(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        offset: bool,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Single read of the capacitive sensor."""
        read = ReadSensorInformation(
            self._sensor_type, self._sensor_id, node_id, offset
        )
        sensor_data = await self._scheduler.send_read(read, can_messenger, timeout)
        if not sensor_data:
            return sensor_data
        if len(sensor_data) > 1 and self._sensor_type == SensorType.environment:
            return EnvironmentSensorData.build(sensor_data)
        else:
            return sensor_data[0]

    async def write(
        self, can_messenger: CanMessenger, node_id: NodeId, data: SensorDataType
    ) -> None:
        """Write to a register of the capacitive sensor."""
        write = WriteSensorInformation(
            self._sensor_type, self._sensor_id, node_id, data
        )
        await self._scheduler.send_write(write, can_messenger)

    async def send_zero_threshold(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        threshold: SensorDataType,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Send the zero threshold which the offset value is compared to."""
        write = SensorThresholdInformation(
            self._sensor_type,
            self._sensor_id,
            node_id,
            threshold,
            SensorThresholdMode.absolute,
        )
        threshold_data = await self._scheduler.send_threshold(
            write, can_messenger, timeout
        )
        if threshold_data:
            self.zero_threshold = threshold_data.to_float()
        return threshold_data

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
