"""Sensor driver message scheduler."""
import asyncio
import logging
from contextlib import asynccontextmanager

from typing import Optional, Type, TypeVar, Callable, AsyncIterator, cast, List

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorOutputBinding,
    SensorId,
    SensorType,
    MessageId,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId

from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
    MultipleMessagesWaitableCallback,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ReadFromSensorRequest,
    PeripheralStatusRequest,
    SetSensorThresholdRequest,
    WriteToSensorRequest,
    BaselineSensorRequest,
    SensorThresholdResponse,
    ReadFromSensorResponse,
    PeripheralStatusResponse,
    BindSensorOutputRequest,
)
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.payloads import (
    SensorPayload,
    ReadFromSensorRequestPayload,
    SetSensorThresholdRequestPayload,
    WriteToSensorRequestPayload,
    BaselineSensorRequestPayload,
    BindSensorOutputRequestPayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorTypeField,
    SensorIdField,
    SensorOutputBindingField,
    SensorThresholdModeField,
)
from opentrons_hardware.sensors.types import SensorDataType
from opentrons_hardware.sensors.sensor_types import SensorInformation

from opentrons_hardware.sensors.utils import (
    ReadSensorInformation,
    WriteSensorInformation,
    PollSensorInformation,
    SensorThresholdInformation,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt16Field,
    UInt32Field,
)

log = logging.getLogger(__name__)
ResponseType = TypeVar("ResponseType", bound=MessageDefinition)


class SensorScheduler:
    """Sensor message scheduler."""

    async def run_poll(
        self,
        sensor: PollSensorInformation,
        can_messenger: CanMessenger,
        timeout: int,
        expected_num_messages: int = 1,
    ) -> List[SensorDataType]:
        """Send poll message."""
        sensor_info = sensor.sensor
        with MultipleMessagesWaitableCallback(
            can_messenger, number_of_messages=expected_num_messages
        ) as reader:
            data_list: List[SensorDataType] = []
            await can_messenger.send(
                node_id=sensor_info.node_id,
                message=BaselineSensorRequest(
                    payload=BaselineSensorRequestPayload(
                        sensor=SensorTypeField(sensor_info.sensor_type),
                        sensor_id=SensorIdField(sensor_info.sensor_id),
                        sample_rate=UInt16Field(sensor.poll_for),
                    )
                ),
            )
            try:

                def _format(message: ReadFromSensorResponse) -> SensorDataType:
                    return SensorDataType.build(
                        message.payload.sensor_data, message.payload.sensor
                    )

                data_list = await asyncio.wait_for(
                    self._multi_wait_for_response(
                        sensor_info.node_id, reader, ReadFromSensorResponse, _format
                    ),
                    timeout,
                )
            except asyncio.TimeoutError:
                log.warning("Sensor poll timed out")
            finally:
                return data_list

    async def send_write(
        self, sensor: WriteSensorInformation, can_messenger: CanMessenger
    ) -> None:
        """Send write message."""
        sensor_info = sensor.sensor
        await can_messenger.send(
            node_id=sensor_info.node_id,
            message=WriteToSensorRequest(
                payload=WriteToSensorRequestPayload(
                    sensor=SensorTypeField(sensor_info.sensor_type),
                    sensor_id=SensorIdField(sensor_info.sensor_id),
                    data=UInt32Field(sensor.data.to_int),
                    # TODO(lc, 03-29-2022, actually pass in a register value)
                    reg_address=UInt8Field(0x0),
                )
            ),
        )

    async def send_read(
        self,
        sensor: ReadSensorInformation,
        can_messenger: CanMessenger,
        timeout: int,
        expected_num_messages: int = 1,
    ) -> List[SensorDataType]:
        """Send read message."""
        sensor_info = sensor.sensor
        with MultipleMessagesWaitableCallback(
            can_messenger, number_of_messages=expected_num_messages
        ) as reader:
            data_list: List[SensorDataType] = []
            await can_messenger.send(
                node_id=sensor_info.node_id,
                message=ReadFromSensorRequest(
                    payload=ReadFromSensorRequestPayload(
                        sensor=SensorTypeField(sensor_info.sensor_type),
                        sensor_id=SensorIdField(sensor_info.sensor_id),
                        offset_reading=UInt8Field(int(sensor.offset)),
                    )
                ),
            )
            try:

                def _format(response: ReadFromSensorResponse) -> SensorDataType:
                    return SensorDataType.build(
                        response.payload.sensor_data, response.payload.sensor
                    )

                data_list = await asyncio.wait_for(
                    self._multi_wait_for_response(
                        sensor_info.node_id, reader, ReadFromSensorResponse, _format
                    ),
                    timeout,
                )
            except asyncio.TimeoutError:
                log.warning("Sensor Read timed out")
            finally:
                return data_list

    async def read(
        self,
        can_messenger: CanMessenger,
        node_id: NodeId,
        timeout: float = 1.0,
        expected_num_messages: int = 1,
    ) -> List[SensorDataType]:
        """Helper function for the get_report sensor driver.

        This simply retrieves CAN messages without first
        sending a ReadFromSensorRequest.
        """
        data_list: List[SensorDataType] = []

        def _format(response: ReadFromSensorResponse) -> SensorDataType:
            return SensorDataType.build(
                response.payload.sensor_data, response.payload.sensor
            )

        with MultipleMessagesWaitableCallback(
            can_messenger,
            number_of_messages=expected_num_messages,
        ) as reader:
            try:
                data_list = await asyncio.wait_for(
                    self._multi_wait_for_response(
                        node_id, reader, ReadFromSensorResponse, _format
                    ),
                    timeout,
                )
            except asyncio.TimeoutError:
                log.warning("Sensor Read timed out")
            finally:
                return data_list

    async def send_threshold(
        self,
        sensor: SensorThresholdInformation,
        can_messenger: CanMessenger,
        timeout: float = 1.0,
    ) -> Optional[SensorDataType]:
        """Send threshold message."""
        sensor_info = sensor.sensor

        def _filter(arbitration_id: ArbitrationId) -> bool:
            return (
                NodeId(arbitration_id.parts.originating_node_id) == sensor_info.node_id
            ) and (
                MessageId(arbitration_id.parts.message_id)
                == MessageId.set_sensor_threshold_response
            )

        with MultipleMessagesWaitableCallback(can_messenger, _filter) as reader:
            data: Optional[SensorDataType] = None
            await can_messenger.send(
                node_id=sensor_info.node_id,
                message=SetSensorThresholdRequest(
                    payload=SetSensorThresholdRequestPayload(
                        sensor=SensorTypeField(sensor_info.sensor_type),
                        sensor_id=SensorIdField(sensor_info.sensor_id),
                        threshold=sensor.data.backing,
                        mode=SensorThresholdModeField(sensor.mode.value),
                    )
                ),
            )
            try:

                def _format(response: SensorThresholdResponse) -> SensorDataType:
                    return SensorDataType.build(
                        response.payload.threshold, response.payload.sensor
                    )

                data = await asyncio.wait_for(
                    self._wait_for_response(
                        sensor_info.node_id, reader, SensorThresholdResponse, _format
                    ),
                    timeout,
                )
            except asyncio.TimeoutError:
                log.warning("Sensor Read timed out")
            finally:
                return data

    @staticmethod
    async def _multi_wait_for_response(
        node_id: NodeId,
        reader: WaitableCallback,
        response_def: Type[ResponseType],
        response_handler: Callable[[ResponseType], SensorDataType],
    ) -> List[SensorDataType]:
        """Listener for receiving messages back."""
        # TODO we should refactor the rest of the code that relies on
        # waitable callback to specify how many messages it would like to wait
        # for. Otherwise, the code will timeout unless you return directly
        # from an async for loop.
        data: List[SensorDataType] = []
        async for response, arbitration_id in reader:
            if arbitration_id.parts.originating_node_id == node_id:
                if isinstance(response, response_def):
                    data.append(response_handler(response))
        return data

    @staticmethod
    async def _wait_for_response(
        node_id: NodeId,
        reader: WaitableCallback,
        response_def: Type[ResponseType],
        response_handler: Callable[[ResponseType], Optional[SensorDataType]],
    ) -> Optional[SensorDataType]:
        """Listener for receiving messages back."""
        async for response, arbitration_id in reader:
            if arbitration_id.parts.originating_node_id == node_id:
                if isinstance(response, response_def):
                    return response_handler(response)
        return None

    @staticmethod
    async def _read_peripheral_response(
        node_id: NodeId,
        reader: WaitableCallback,
    ) -> bool:
        """Waits for and sends back PeripheralStatusResponse."""
        async for response, arbitration_id in reader:
            if arbitration_id.parts.originating_node_id == node_id:
                if isinstance(response, PeripheralStatusResponse):
                    return bool(response.payload.status)
        return False

    async def request_peripheral_status(
        self,
        sensor: SensorType,
        sensor_id: SensorId,
        node_id: NodeId,
        can_messenger: CanMessenger,
        timeout: int,
    ) -> bool:
        """Send threshold message."""
        with MultipleMessagesWaitableCallback(can_messenger) as reader:
            status = False
            await can_messenger.send(
                node_id=node_id,
                message=PeripheralStatusRequest(
                    payload=SensorPayload(
                        sensor=SensorTypeField(sensor),
                        sensor_id=SensorIdField(sensor_id),
                    )
                ),
            )

            try:
                response = asyncio.wait_for(
                    self._read_peripheral_response(node_id, reader), timeout
                )
                status = await response
            except asyncio.TimeoutError:
                log.warning("Sensor Read timed out")
            finally:
                return status

    @staticmethod
    def _log_sensor_output(message: MessageDefinition, arb: ArbitrationId) -> None:
        if isinstance(message, ReadFromSensorResponse):
            log.info(
                f"{SensorType(message.payload.sensor.value).name}: "
                f"{SensorDataType.build(message.payload.sensor_data, message.payload.sensor).to_float()}"
            )

    @asynccontextmanager
    async def bind_sync(
        self,
        target_sensor: SensorInformation,
        can_messenger: CanMessenger,
        timeout: float = 0.5,
        log: bool = False,
    ) -> AsyncIterator[None]:
        """While acquired, bind the specified sensor to control sync."""
        flags = [SensorOutputBinding.sync]
        if log:
            flags.append(SensorOutputBinding.report)
        await can_messenger.send(
            node_id=target_sensor.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(target_sensor.sensor_type),
                    sensor_id=SensorIdField(target_sensor.sensor_id),
                    binding=SensorOutputBindingField.from_flags(flags),
                )
            ),
        )
        try:
            if log:
                can_messenger.add_listener(self._log_sensor_output)
            yield
        finally:
            if log:
                can_messenger.remove_listener(self._log_sensor_output)
            await can_messenger.send(
                node_id=target_sensor.node_id,
                message=BindSensorOutputRequest(
                    payload=BindSensorOutputRequestPayload(
                        sensor=SensorTypeField(target_sensor.sensor_type),
                        sensor_id=SensorIdField(target_sensor.sensor_id),
                        binding=SensorOutputBindingField(
                            SensorOutputBinding.none.value
                        ),
                    )
                ),
            )

    @asynccontextmanager
    async def capture_output(
        self,
        target_sensor: SensorInformation,
        can_messenger: CanMessenger,
    ) -> AsyncIterator["asyncio.Queue[float]"]:
        """While acquired, capture the sensor's logging output."""
        response_queue: "asyncio.Queue[float]" = asyncio.Queue()

        def _logging_listener(
            message: MessageDefinition, arb_id: ArbitrationId
        ) -> None:
            payload = cast(ReadFromSensorResponse, message).payload
            response_queue.put_nowait(
                SensorDataType.build(payload.sensor_data, payload.sensor).to_float()
            )

        def _filter(arbitration_id: ArbitrationId) -> bool:
            return (
                NodeId(arbitration_id.parts.originating_node_id)
                == target_sensor.node_id
            ) and (
                MessageId(arbitration_id.parts.message_id)
                == MessageId.read_sensor_response
            )

        can_messenger.add_listener(_logging_listener, _filter)
        await can_messenger.send(
            node_id=target_sensor.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(target_sensor.sensor_type),
                    sensor_id=SensorIdField(target_sensor.sensor_id),
                    binding=SensorOutputBindingField(SensorOutputBinding.report.value),
                )
            ),
        )
        try:
            yield response_queue
        finally:
            can_messenger.remove_listener(_logging_listener)
            await can_messenger.send(
                node_id=target_sensor.node_id,
                message=BindSensorOutputRequest(
                    payload=BindSensorOutputRequestPayload(
                        sensor=SensorTypeField(target_sensor.sensor_type),
                        sensor_id=SensorIdField(target_sensor.sensor_id),
                        binding=SensorOutputBindingField(
                            SensorOutputBinding.none.value
                        ),
                    )
                ),
            )
