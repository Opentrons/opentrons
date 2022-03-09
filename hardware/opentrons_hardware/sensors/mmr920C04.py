"""Pressure Sensor Driver Class."""
from typing import Optional

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import SensorType, NodeId
from opentrons_hardware.sensors.utils import (
    ReadSensorInformation,
    PollSensorInformation,
    WriteSensorInformation,
    SensorDataType,
)

from .scheduler import SensorScheduler
from .sensor_abc import AbstractAdvancedSensor


class PressureSensor(AbstractAdvancedSensor):
    """MMR820C04 Driver."""

    def __init__(
        self,
        zero_threshold: float = 0.0,
        stop_threshold: float = 0.0,
        offset: float = 0.0,
    ) -> None:
        """Constructor."""
        super().__init__(zero_threshold, stop_threshold, offset, SensorType.pressure)

    async def poll(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        poll_for_ms: int,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Poll the pressure sensor."""
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
        """Poll the read sensor."""
        read = ReadSensorInformation(self._sensor_type, node_id, offset)
        scheduler = SensorScheduler()
        return await scheduler.send_read(read, can_messenger, timeout)

    async def write(
        self, can_messenger: CanMessenger, node_id: NodeId, data: SensorDataType
    ) -> None:
        """Write to a register of the pressure sensor."""
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
            self.zero_threshold = threshold_data.to_float
        return threshold_data
