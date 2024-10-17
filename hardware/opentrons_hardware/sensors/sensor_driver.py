"""Capacitve Sensor Driver Class."""
import time
import asyncio

from typing import Optional, AsyncIterator, Any, Sequence, List, Union
from contextlib import asynccontextmanager, suppress
from logging import getLogger

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
)
from opentrons_hardware.sensors.types import (
    SensorDataType,
    SensorReturnType,
)
from opentrons_hardware.sensors.utils import (
    ReadSensorInformation,
    BaselineSensorInformation,
    WriteSensorInformation,
    SensorThresholdInformation,
)

from opentrons_hardware.sensors.sensor_types import (
    BaseSensorType,
    ThresholdSensorType,
    PressureSensor,
    CapacitiveSensor,
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
from .sensor_abc import AbstractSensorDriver
from .scheduler import SensorScheduler
from . import SENSOR_LOG_NAME

LOG = getLogger(__name__)
SENSOR_LOG = getLogger(SENSOR_LOG_NAME)


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
        number_of_reads: int,
        timeout: int = 1,
    ) -> Optional[SensorReturnType]:
        """Poll the given sensor."""
        poll = BaselineSensorInformation(sensor.sensor, number_of_reads)
        sensor_data = await self._scheduler.run_baseline(
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
        mode: SensorThresholdMode = SensorThresholdMode.absolute,
        timeout: int = 1,
    ) -> Optional[SensorDataType]:
        """Send threshold for stopping a move."""
        write = SensorThresholdInformation(
            sensor.sensor,
            SensorDataType.build(sensor.stop_threshold, sensor.sensor.sensor_type),
            mode,
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
    ) -> Optional[SensorDataType]:
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
        binding: Optional[Sequence[SensorOutputBinding]] = None,
    ) -> AsyncIterator[None]:
        """Send a BindSensorOutputRequest."""
        sensor_info = sensor.sensor

        if binding is not None:
            binding_field = SensorOutputBindingField.from_flags(binding)
        else:
            binding_field = SensorOutputBindingField(SensorOutputBinding.none)

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
        messenger: CanMessenger,
        sensor: Union[PressureSensor, CapacitiveSensor],
    ) -> None:
        """Build the capturer."""
        self.response_queue: asyncio.Queue[SensorDataType] = asyncio.Queue()
        self.tool = sensor.sensor.node_id
        self.start_time = 0.0
        self.event: Any = None
        self.messenger = messenger
        self.sensor = sensor
        self.type = sensor.sensor.sensor_type
        self.id = sensor.sensor.sensor_id

    def get_data(self) -> Optional[List[SensorDataType]]:
        """Return the sensor data captured by this listener."""
        if self.response_queue.empty():
            return None
        data: List[SensorDataType] = []
        while not self.response_queue.empty():
            data.append(self.response_queue.get_nowait())
        return data

    async def __aenter__(self) -> None:
        """Start logging sensor readings."""
        self.messenger.add_listener(self, None)
        self.start_time = time.time()
        SENSOR_LOG.info(f"Data capture for {self.tool.name} started {self.start_time}")

    async def __aexit__(self, *args: Any) -> None:
        """Finish the capture."""
        self.messenger.remove_listener(self)
        SENSOR_LOG.info(f"Data capture for {self.tool.name} ended {time.time()}")

    def set_stop_ack(self, message_index: int = 0) -> None:
        """Tell the Listener which message index to wait for."""
        self.event = asyncio.Event()
        self.expected_ack = message_index

    async def wait_for_complete(self, wait_time: float = 10) -> None:
        """Wait for the data to stop."""
        with suppress(asyncio.TimeoutError):
            await asyncio.wait_for(self.event.wait(), wait_time)
        if not self.event.is_set():
            SENSOR_LOG.error("Did not receive the full data set from the sensor")
        self.event = None

    def __call__(
        self,
        message: MessageDefinition,
        arbitration_id: ArbitrationId,
    ) -> None:
        """Callback entry point for capturing messages."""
        if arbitration_id.parts.originating_node_id != self.tool:
            # check that this is from the node we care about
            return
        if isinstance(message, message_definitions.ReadFromSensorResponse):
            if (
                message.payload.sensor_id.value is not self.id
                or message.payload.sensor is not self.type
            ):
                # ignore sensor responses from other sensors
                return
            data = sensor_types.SensorDataType.build(
                message.payload.sensor_data, message.payload.sensor
            )
            self.response_queue.put_nowait(data)
            SENSOR_LOG.info(
                f"Revieved from {arbitration_id}: {message.payload.sensor_id}:{message.payload.sensor}: {data}"
            )
        if isinstance(message, message_definitions.BatchReadFromSensorResponse):
            data_length = message.payload.data_length.value
            data_bytes = message.payload.sensor_data.value
            data_ints = [
                int.from_bytes(data_bytes[i * 4 : i * 4 + 4], byteorder="little")
                for i in range(data_length)
            ]
            data_floats = [
                sensor_types.SensorDataType.build(d, message.payload.sensor)
                for d in data_ints
            ]

            for d in data_floats:
                self.response_queue.put_nowait(d)
            SENSOR_LOG.info(
                f"Revieved from {arbitration_id}: {message.payload.sensor_id}:{message.payload.sensor}: {data_floats}"
            )
        if isinstance(message, message_definitions.Acknowledgement):
            if (
                self.event is not None
                and message.payload.message_index.value == self.expected_ack
            ):
                SENSOR_LOG.info("Finished receiving sensor data")
                self.event.set()
