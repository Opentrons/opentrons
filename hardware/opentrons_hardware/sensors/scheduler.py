"""Sensor driver message scheduler."""
import asyncio
import logging
from contextlib import asynccontextmanager

from typing import Optional, TypeVar, Callable, AsyncIterator, List

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorOutputBinding,
    SensorId,
    SensorType,
    MessageId,
    ErrorCode,
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
    BaselineSensorResponse,
    PeripheralStatusResponse,
    BindSensorOutputRequest,
    ErrorMessage,
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
    BaselineSensorInformation,
    SensorThresholdInformation,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt16Field,
    UInt32Field,
)

log = logging.getLogger(__name__)
ResponseType = TypeVar("ResponseType", bound=MessageDefinition)


def _format_sensor_response(response: MessageDefinition) -> SensorDataType:
    if isinstance(response, BaselineSensorResponse):
        return SensorDataType.build(
            response.payload.offset_average, response.payload.sensor
        )
    else:
        assert isinstance(response, ReadFromSensorResponse)
        return SensorDataType.build(
            response.payload.sensor_data, response.payload.sensor
        )


class SensorScheduler:
    """Sensor message scheduler."""

    @staticmethod
    def _create_filter(
        node_id: Optional[NodeId] = None, message_id: Optional[MessageId] = None
    ) -> Optional[Callable[[ArbitrationId], bool]]:
        """Create listener filter by NodeId and MessageId."""
        if not node_id and not message_id:
            return None

        def _filter(arbitration_id: ArbitrationId) -> bool:
            return (
                NodeId(arbitration_id.parts.originating_node_id) == node_id
                if node_id
                else True
            ) and (
                MessageId(arbitration_id.parts.message_id) == message_id
                if message_id
                else True
            )

        return _filter

    async def run_baseline(
        self,
        sensor: BaselineSensorInformation,
        can_messenger: CanMessenger,
        timeout: int,
        expected_num_messages: int = 1,
    ) -> List[SensorDataType]:
        """Send poll message."""
        sensor_info = sensor.sensor
        with MultipleMessagesWaitableCallback(
            can_messenger,
            self._create_filter(sensor_info.node_id, BaselineSensorResponse.message_id),
            number_of_messages=expected_num_messages,
        ) as reader:
            data_list: List[SensorDataType] = []
            await can_messenger.send(
                node_id=sensor_info.node_id,
                message=BaselineSensorRequest(
                    payload=BaselineSensorRequestPayload(
                        sensor=SensorTypeField(sensor_info.sensor_type),
                        sensor_id=SensorIdField(sensor_info.sensor_id),
                        number_of_reads=UInt16Field(sensor.number_of_reads),
                    )
                ),
            )
            try:

                data_list = await asyncio.wait_for(
                    self._multi_wait_for_response(reader, _format_sensor_response),
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
        error = await can_messenger.ensure_send(
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
            expected_nodes=[sensor_info.node_id],
        )
        if error != ErrorCode.ok:
            log.error(
                f"recieved error {str(error)} trying to write sensor info to {str(sensor_info.node_id)}"
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
            can_messenger,
            self._create_filter(sensor_info.node_id, MessageId.read_sensor_response),
            number_of_messages=expected_num_messages,
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

                data_list = await asyncio.wait_for(
                    self._multi_wait_for_response(reader, _format_sensor_response),
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

        with MultipleMessagesWaitableCallback(
            can_messenger,
            self._create_filter(node_id, MessageId.read_sensor_response),
            number_of_messages=expected_num_messages,
        ) as reader:
            try:

                data_list = await asyncio.wait_for(
                    self._multi_wait_for_response(reader, _format_sensor_response),
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
    ) -> SensorDataType:
        """Send threshold message."""
        sensor_info = sensor.sensor

        with WaitableCallback(
            can_messenger,
            self._create_filter(
                sensor_info.node_id, SensorThresholdResponse.message_id
            ),
        ) as reader:
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

                def _format(response: MessageDefinition) -> SensorDataType:
                    assert isinstance(response, SensorThresholdResponse)
                    return SensorDataType.build(
                        response.payload.threshold, response.payload.sensor
                    )

                return await asyncio.wait_for(
                    self._wait_for_response(reader, _format),
                    timeout,
                )
            except asyncio.TimeoutError:
                log.error(f"Sensor Threshold Read from {sensor_info.node_id} timed out")
                raise

    @staticmethod
    async def _multi_wait_for_response(
        reader: WaitableCallback,
        response_handler: Callable[[MessageDefinition], SensorDataType],
    ) -> List[SensorDataType]:
        """Listener for receiving messages back."""
        # TODO we should refactor the rest of the code that relies on
        # waitable callback to specify how many messages it would like to wait
        # for. Otherwise, the code will timeout unless you return directly
        # from an async for loop.
        data: List[SensorDataType] = []
        async for response, _ in reader:
            data.append(response_handler(response))
        return data

    @staticmethod
    async def _wait_for_response(
        reader: WaitableCallback,
        response_handler: Callable[[MessageDefinition], SensorDataType],
    ) -> SensorDataType:
        """Listener for receiving messages back."""
        async for response, _ in reader:
            return response_handler(response)
        raise StopAsyncIteration

    @staticmethod
    async def _read_peripheral_response(
        reader: WaitableCallback,
    ) -> bool:
        """Waits for and sends back PeripheralStatusResponse."""
        async for response, _ in reader:
            assert isinstance(response, PeripheralStatusResponse)
            return bool(response.payload.status)
        raise StopAsyncIteration

    async def request_peripheral_status(
        self,
        sensor: SensorType,
        sensor_id: SensorId,
        node_id: NodeId,
        can_messenger: CanMessenger,
        timeout: int,
    ) -> bool:
        """Send threshold message."""
        with MultipleMessagesWaitableCallback(
            can_messenger,
            self._create_filter(node_id, PeripheralStatusResponse.message_id),
        ) as reader:
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
                return await asyncio.wait_for(
                    self._read_peripheral_response(reader), timeout
                )
            except asyncio.TimeoutError:
                log.warning(f"No PeripheralStatusResponse from node {node_id}")
                return False

    @staticmethod
    def _log_sensor_output(message: MessageDefinition, arb: ArbitrationId) -> None:
        if isinstance(message, ReadFromSensorResponse):
            log.info(
                f"{SensorType(message.payload.sensor.value).name}: "
                f"{SensorDataType.build(message.payload.sensor_data, message.payload.sensor).to_float()}"
            )
        if isinstance(message, ErrorMessage):
            log.error(f"recieved error message {str(message)}")

    @asynccontextmanager
    async def bind_sync(
        self,
        target_sensor: SensorInformation,
        can_messenger: CanMessenger,
        timeout: float = 0.5,
        do_log: bool = False,
    ) -> AsyncIterator[None]:
        """While acquired, bind the specified sensor to control sync."""
        flags = [SensorOutputBinding.sync]
        if do_log:
            flags.append(SensorOutputBinding.report)
        error = await can_messenger.ensure_send(
            node_id=target_sensor.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(target_sensor.sensor_type),
                    sensor_id=SensorIdField(target_sensor.sensor_id),
                    binding=SensorOutputBindingField.from_flags(flags),
                )
            ),
            expected_nodes=[target_sensor.node_id],
        )
        if error != ErrorCode.ok:
            log.error(
                f"recieved error {str(error)} trying to bind sensor output on {str(target_sensor.node_id)}"
            )

        try:
            if do_log:
                can_messenger.add_listener(self._log_sensor_output)
            yield
        finally:
            if do_log:
                can_messenger.remove_listener(self._log_sensor_output)
            error = await can_messenger.ensure_send(
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
                expected_nodes=[target_sensor.node_id],
            )
            if error != ErrorCode.ok:
                log.error(
                    f"recieved error {str(error)} trying to write unbind sensor output on {str(target_sensor.node_id)}"
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
            if isinstance(message, ReadFromSensorResponse):
                payload = message.payload
                response_queue.put_nowait(
                    SensorDataType.build(payload.sensor_data, payload.sensor).to_float()
                )
            if isinstance(message, ErrorMessage):
                log.error(f"Recieved error message {str(message)}")

        def _filter(arbitration_id: ArbitrationId) -> bool:
            return (
                NodeId(arbitration_id.parts.originating_node_id)
                == target_sensor.node_id
            ) and (
                MessageId(arbitration_id.parts.message_id)
                == MessageId.read_sensor_response
                or MessageId(arbitration_id.parts.message_id) == MessageId.error_message
            )

        can_messenger.add_listener(_logging_listener, _filter)
        error = await can_messenger.ensure_send(
            node_id=target_sensor.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(target_sensor.sensor_type),
                    sensor_id=SensorIdField(target_sensor.sensor_id),
                    binding=SensorOutputBindingField(SensorOutputBinding.report.value),
                )
            ),
            expected_nodes=[target_sensor.node_id],
        )
        if error != ErrorCode.ok:
            log.error(
                f"recieved error {str(error)} trying to bind sensor output on {str(target_sensor.node_id)}"
            )

        try:
            yield response_queue
        finally:
            can_messenger.remove_listener(_logging_listener)
            error = await can_messenger.ensure_send(
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
                expected_nodes=[target_sensor.node_id],
            )
            if error != ErrorCode.ok:
                log.error(
                    f"recieved error {str(error)} trying to write unbind sensor output on {str(target_sensor.node_id)}"
                )

    @asynccontextmanager
    async def monitor_exceed_max_threshold(
        self,
        target_sensor: SensorInformation,
        can_messenger: CanMessenger,
    ) -> AsyncIterator["asyncio.Queue[ErrorCode]"]:
        """While acquired, monitor that a sensor does not exceed its rated."""
        error_response_queue: "asyncio.Queue[ErrorCode]" = asyncio.Queue()

        def _async_error_listener(
            message: MessageDefinition, arb_id: ArbitrationId
        ) -> None:
            # FIXME could possibly make this error more generalized for other
            # sensors in the future
            if (
                isinstance(message, ErrorMessage)
                and message.payload.error_code.value == ErrorCode.over_pressure.value
            ):
                error_response_queue.put_nowait(
                    ErrorCode(message.payload.error_code.value)
                )

        def _filter(arbitration_id: ArbitrationId) -> bool:
            return (
                NodeId(arbitration_id.parts.originating_node_id)
                == target_sensor.node_id
            ) and (
                MessageId(arbitration_id.parts.message_id) == MessageId.error_message
            )

        error = await can_messenger.ensure_send(
            node_id=target_sensor.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(target_sensor.sensor_type),
                    sensor_id=SensorIdField(target_sensor.sensor_id),
                    binding=SensorOutputBindingField(
                        SensorOutputBinding.max_threshold_sync.value
                    ),
                )
            ),
            expected_nodes=[target_sensor.node_id],
        )
        if error != ErrorCode.ok:
            log.error(
                f"recieved error {str(error)} trying to bind sensor output on {str(target_sensor.node_id)}"
            )

        try:
            can_messenger.add_listener(_async_error_listener, _filter)
            yield error_response_queue
        finally:
            can_messenger.remove_listener(_async_error_listener)
            error = await can_messenger.ensure_send(
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
                expected_nodes=[target_sensor.node_id],
            )
            if error != ErrorCode.ok:
                log.error(
                    f"recieved error {str(error)} trying to write unbind sensor output on {str(target_sensor.node_id)}"
                )
