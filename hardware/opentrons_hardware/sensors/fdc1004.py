"""Capacitve Sensor Driver Class."""

from typing import Optional

import logging

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
)
from opentrons_hardware.firmware_bindings.constants import SensorType, NodeId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    BindSensorOutputRequest,
    BaselineSensorRequest,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorOutputBindingField,
    SensorTypeField,
)
from opentrons_hardware.sensors.utils import (
    ReadSensorInformation,
    PollSensorInformation,
    WriteSensorInformation,
    SensorDataType,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    BindSensorOutputRequestPayload,
    BaselineSensorRequestPayload,
)
from opentrons_hardware.firmware_bindings.utils import UInt16Field
from .sensor_abc import AbstractAdvancedSensor
from .scheduler import SensorScheduler
from opentrons_hardware.firmware_bindings.constants import SensorOutputBinding

log = logging.getLogger(__name__)


class CapacitiveSensor(AbstractAdvancedSensor):
    """FDC1004 Driver."""

    def __init__(
        self,
        zero_threshold: float = 0.0,
        stop_threshold: float = 0.0,
        offset: float = 0.0,
    ) -> None:
        """Constructor."""
        super().__init__(zero_threshold, stop_threshold, offset, SensorType.capacitive)
        self._scheduler = SensorScheduler()

    async def bind_to_sync(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        binding: SensorOutputBinding = SensorOutputBinding.sync,
        timeout: int = 1,
    ) -> None:
        """Send a BindSensorOutputRequest."""
        await can_messenger.send(
            node_id=node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(self._sensor_type),
                    binding=SensorOutputBindingField(binding),
                )
            ),
        )

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
        return await self._scheduler.read(can_messenger, node_id)

    async def get_baseline(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        poll_for_ms: int,
        sample_rate: int,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Poll the capacitive sensor."""
        poll = PollSensorInformation(self._sensor_type, node_id, poll_for_ms)
        scheduler = SensorScheduler()
        return await scheduler.run_poll(poll, can_messenger, timeout)

    async def read(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        offset: bool,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Single read of the capacitive sensor."""
        read = ReadSensorInformation(self._sensor_type, node_id, offset)
        scheduler = SensorScheduler()
        return await scheduler.send_read(read, can_messenger, timeout)

    async def write(
        self, can_messenger: CanMessenger, node_id: NodeId, data: SensorDataType
    ) -> None:
        """Write to a register of the capacitive sensor."""
        write = WriteSensorInformation(self._sensor_type, node_id, data)
        scheduler = SensorScheduler()
        await scheduler.send_write(write, can_messenger)

    async def send_zero_threshold(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        threshold: SensorDataType,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Send the zero threshold which the offset value is compared to."""
        write = WriteSensorInformation(self._sensor_type, node_id, threshold)
        scheduler = SensorScheduler()
        threshold_data = await scheduler.send_threshold(write, can_messenger, timeout)
        if threshold_data:
            self.zero_threshold = threshold_data.to_float()
        return threshold_data
