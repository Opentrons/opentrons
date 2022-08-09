"""Capacitve Sensor Driver Class."""

import re
from typing import Optional, AsyncIterator
from contextlib import asynccontextmanager

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
)
from opentrons_hardware.firmware_bindings.constants import (
    SensorOutputBinding,
    SensorThresholdMode,
)
from opentrons_hardware.firmware_bindings.constants import SensorType
from opentrons_hardware.sensors.types import (
    SensorDataType,
    EnvironmentSensorDataType,
    SensorReturnType,
)
from opentrons_hardware.sensors.utils import (
    ReadSensorInformation,
    PollSensorInformation,
    WriteSensorInformation,
    SensorThresholdInformation,
)

from opentrons_hardware.sensors.sensor_types import BaseSensorType, ThresholdSensorType
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
from .sensor_abc import AbstractSensorDriver
from .scheduler import SensorScheduler


class SensorDriver(AbstractSensorDriver):
    """Generic Sensor Driver."""

    # probably should remove sensor type so that only one object
    # needs to be created.
    # have data classes that hold respective state info about
    # each sensor.
    def __init__(self) -> None:
        """Constructor."""
        super().__init__()
        self._scheduler = SensorScheduler()

    def __repr__(self) -> str:
        return "<Sensor Driver>"

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
        sensor_data = await self._scheduler.read(
            can_messenger, sensor.sensor.node_id, timeout, sensor.expected_responses
        )
        if not sensor_data:
            return None
        return sensor.set_sensor_data(sensor_data)

    async def get_baseline(
        self,
        can_messenger: CanMessenger,
        sensor: BaseSensorType,
        poll_for_ms: int,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Poll the given sensor."""
        poll = PollSensorInformation(sensor.sensor, poll_for_ms)
        sensor_data = await self._scheduler.run_poll(
            poll, can_messenger, timeout, sensor.expected_responses
        )
        if not sensor_data:
            return None
        return sensor.set_sensor_data(sensor_data)

    async def read(
        self,
        can_messenger: CanMessenger,
        sensor: BaseSensorType,
        offset: bool,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Single read of the given sensor."""
        read = ReadSensorInformation(sensor.sensor, offset)
        sensor_data = await self._scheduler.send_read(
            read, can_messenger, timeout, sensor.expected_responses
        )
        if not sensor_data:
            return None
        return sensor.set_sensor_data(sensor_data)

    async def write(
        self,
        can_messenger: CanMessenger,
        sensor: ThresholdSensorType,
        data: SensorDataType,
    ) -> None:
        """Write to a register of the given sensor."""
        write = WriteSensorInformation(sensor.sensor, data)
        await self._scheduler.send_write(write, can_messenger)

    async def send_zero_threshold(
        self,
        can_messenger: CanMessenger,
        sensor: ThresholdSensorType,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Send the zero threshold which the offset value is compared to."""
        write = SensorThresholdInformation(
            sensor.sensor,
            SensorDataType.build(sensor.zero_threshold, sensor.sensor.sensor_type),
            SensorThresholdMode.absolute,
        )
        threshold_data = await self._scheduler.send_threshold(
            write, can_messenger, timeout
        )
        if not threshold_data:
            return threshold_data
        sensor.zero_threshold = threshold_data.to_float()
        return threshold_data

    @asynccontextmanager
    async def bind_output(
        self,
        can_messenger: CanMessenger,
        sensor: BaseSensorType,
        binding: SensorOutputBinding = SensorOutputBinding.sync,
    ) -> AsyncIterator[None]:
        """Send a BindSensorOutputRequest."""
        sensor_info = sensor.sensor
        try:
            await can_messenger.send(
                node_id=sensor_info.node_id,
                message=BindSensorOutputRequest(
                    payload=BindSensorOutputRequestPayload(
                        sensor=SensorTypeField(sensor_info.sensor_type),
                        sensor_id=SensorIdField(sensor_info.sensor_id),
                        binding=SensorOutputBindingField(binding),
                    )
                ),
            )
            yield
        finally:
            await can_messenger.send(
                node_id=sensor_info.node_id,
                message=BindSensorOutputRequest(
                    payload=BindSensorOutputRequestPayload(
                        sensor=SensorTypeField(sensor_info.sensor_type),
                        sensor_id=SensorIdField(sensor_info.sensor_id),
                        binding=SensorOutputBindingField(SensorOutputBinding.none),
                    )
                ),
            )

    async def get_device_status(
        self,
        can_messenger: CanMessenger,
        sensor: BaseSensorType,
        timeout: int = 1,
    ) -> bool:
        """Send a PeripheralStatusRequest and read the response message."""
        sensor_info = sensor.sensor
        return await self._scheduler.request_peripheral_status(
            sensor_info.sensor_type,
            sensor_info.sensor_id,
            sensor_info.node_id,
            can_messenger,
            timeout,
        )
