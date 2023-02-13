"""Capacitve Sensor Driver Class."""
import time
import asyncio
import csv
import os

from typing import Optional, AsyncIterator, Union, List, Any
from contextlib import asynccontextmanager

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
)
import opentrons_hardware.sensors.types as sensor_types
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    MessageDefinition,
)
from opentrons_hardware.firmware_bindings.constants import (
    SensorOutputBinding,
    SensorThresholdMode,
    NodeId,
)
from opentrons_hardware.sensors.types import (
    SensorDataType,
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
        """String representation of class."""
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

    async def send_stop_threshold(
        self,
        can_messenger: CanMessenger,
        sensor: ThresholdSensorType,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Send threshold for stopping a move."""
        write = SensorThresholdInformation(
            sensor.sensor,
            SensorDataType.build(sensor.stop_threshold, sensor.sensor.sensor_type),
            SensorThresholdMode.absolute,
        )
        threshold_data = await self._scheduler.send_threshold(write, can_messenger)
        if not threshold_data:
            return threshold_data
        sensor.stop_threshold = threshold_data.to_float()
        return threshold_data

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
        binding: Union[
            SensorOutputBinding, List[SensorOutputBinding]
        ] = SensorOutputBinding.sync,
    ) -> AsyncIterator[None]:
        """Send a BindSensorOutputRequest."""
        breakpoint()
        sensor_info = sensor.sensor
        if type(binding) == list:
            binding_field = SensorOutputBindingField.from_flags(binding)
        elif type(binding) == SensorOutputBinding:
            binding_field = SensorOutputBindingField(binding)

        try:
            await can_messenger.send(
                node_id=sensor_info.node_id,
                message=BindSensorOutputRequest(
                    payload=BindSensorOutputRequestPayload(
                        sensor=SensorTypeField(sensor_info.sensor_type),
                        sensor_id=SensorIdField(sensor_info.sensor_id),
                        binding=binding_field,
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


class LogListener:
    """Capture incoming sensor messages."""

    def __init__(
        self,
        mount: NodeId,
        z_velocity: float,
        plunger_velocity: float,
        threshold_pascals: float,
    ) -> None:  # add args here to set mount, threshold, stuff to log
        """Build the capturer."""
        self.csv_writer = Any
        self.data_file = Any
        self.response_queue: asyncio.Queue[float] = asyncio.Queue()
        self.mount = mount
        self.new_file_created = not os.path.isfile("/var/pressure_sensor_data.csv")
        self.start_time = 0.0
        self.z_velocity = z_velocity
        self.plunger_velocity = plunger_velocity
        self.threshold_pascals = threshold_pascals

    async def __aenter__(self) -> None:
        """Create a csv heading for logging pressure readings."""
        heading = [
            "Pressure(pascals)",
            "time(s)",
            "z_velocity(mm/s)",
            "plunger_velocity(mm/s)",
            "threshold(pascals)",
        ]
        first_row = [
            0,
            self.start_time,
            self.z_velocity,
            self.plunger_velocity,
            self.threshold_pascals,
        ]

        self.data_file = open("/var/pressure_sensor_data.csv", "a")
        self.csv_writer = csv.writer(self.data_file)
        if self.new_file_created:
            self.csv_writer.writerows([heading, first_row])

        self.start_time = time.time()

    async def __aexit__(self, *args: Any) -> None:
        """Close csv file."""
        self.data_file.close()  # type: ignore

    def __call__(
        self,
        message: MessageDefinition,
        arbitration_id: ArbitrationId,
    ) -> None:
        """Callback entry point for capturing messages."""
        if isinstance(message, message_definitions.ReadFromSensorResponse):
            data = sensor_types.SensorDataType.build(
                message.payload.sensor_data, message.payload.sensor
            ).to_float()
            self.response_queue.put_nowait(data)
            current_time = round((time.time() - self.start_time), 3)
            self.csv_writer.writerow([data, current_time])  # type: ignore
