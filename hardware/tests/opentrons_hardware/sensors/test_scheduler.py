"""Tests for the sensor scheduler."""

import pytest
import mock
import asyncio
from typing import Iterator
from opentrons_hardware.sensors import scheduler, sensor_types
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
    SensorOutputBinding,
    ErrorSeverity,
    ErrorCode,
)
from opentrons_hardware.firmware_bindings.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)

from opentrons_hardware.firmware_bindings.utils import Int32Field

from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorIdField,
    SensorTypeField,
    SensorOutputBindingField,
    ErrorSeverityField,
    ErrorCodeField,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ReadFromSensorResponse,
    BindSensorOutputRequest,
    ErrorMessage,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    BindSensorOutputRequestPayload,
    ReadFromSensorResponsePayload,
    ErrorMessagePayload,
)

from tests.conftest import MockCanMessageNotifier


async def test_capture_output(
    mock_messenger: mock.AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """Test that data is received from the polling function."""
    subject = scheduler.SensorScheduler()
    stim_message = BindSensorOutputRequest(
        payload=BindSensorOutputRequestPayload(
            sensor=SensorTypeField(SensorType.capacitive),
            sensor_id=SensorIdField(SensorId.S0),
            binding=SensorOutputBindingField(SensorOutputBinding.report.value),
        )
    )
    reset_message = BindSensorOutputRequest(
        payload=BindSensorOutputRequestPayload(
            sensor=SensorTypeField(SensorType.capacitive),
            sensor_id=SensorIdField(SensorId.S0),
            binding=SensorOutputBindingField(SensorOutputBinding.none.value),
        )
    )
    async with subject.capture_output(
        sensor_types.SensorInformation(
            sensor_type=SensorType.capacitive,
            sensor_id=SensorId.S0,
            node_id=NodeId.pipette_left,
        ),
        mock_messenger,
    ) as output_queue:
        mock_messenger.ensure_send.assert_called_with(
            node_id=NodeId.pipette_left,
            message=stim_message,
            expected_nodes=[NodeId.pipette_left],
        )
        for i in range(10):
            can_message_notifier.notify(
                ReadFromSensorResponse(
                    payload=ReadFromSensorResponsePayload(
                        sensor=SensorTypeField(SensorType.capacitive.value),
                        sensor_id=SensorIdField(SensorId.S0),
                        sensor_data=Int32Field(i << 16),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=ReadFromSensorResponse.message_id,
                        node_id=NodeId.host,
                        originating_node_id=NodeId.pipette_left,
                        function_code=0,
                    )
                ),
            )
    mock_messenger.ensure_send.assert_called_with(
        node_id=NodeId.pipette_left,
        message=reset_message,
        expected_nodes=[NodeId.pipette_left],
    )

    def _drain() -> Iterator[float]:
        while True:
            try:
                yield output_queue.get_nowait()
            except asyncio.QueueEmpty:
                break

    for index, value in enumerate(_drain()):
        assert value == index


async def test_capture_error_max_threshold(
    mock_messenger: mock.AsyncMock, can_message_notifier: MockCanMessageNotifier
) -> None:
    """Test that we can receive errors while monitoring for exceeded ratings."""
    subject = scheduler.SensorScheduler()
    stim_message = BindSensorOutputRequest(
        payload=BindSensorOutputRequestPayload(
            sensor=SensorTypeField(SensorType.pressure),
            sensor_id=SensorIdField(SensorId.S0),
            binding=SensorOutputBindingField(
                SensorOutputBinding.max_threshold_sync.value
            ),
        )
    )
    reset_message = BindSensorOutputRequest(
        payload=BindSensorOutputRequestPayload(
            sensor=SensorTypeField(SensorType.pressure),
            sensor_id=SensorIdField(SensorId.S0),
            binding=SensorOutputBindingField(SensorOutputBinding.none.value),
        )
    )

    # an error message is received
    async with subject.monitor_exceed_max_threshold(
        sensor_types.SensorInformation(
            sensor_type=SensorType.pressure,
            sensor_id=SensorId.S0,
            node_id=NodeId.pipette_left,
        ),
        mock_messenger,
    ) as output_queue:
        mock_messenger.ensure_send.assert_called_with(
            node_id=NodeId.pipette_left,
            message=stim_message,
            expected_nodes=[NodeId.pipette_left],
        )
        can_message_notifier.notify(
            ErrorMessage(
                payload=ErrorMessagePayload(
                    severity=ErrorSeverityField(ErrorSeverity.unrecoverable),
                    error_code=ErrorCodeField(ErrorCode.over_pressure),
                )
            ),
            ArbitrationId(
                parts=ArbitrationIdParts(
                    message_id=ErrorMessage.message_id,
                    node_id=NodeId.host,
                    originating_node_id=NodeId.pipette_left,
                    function_code=0,
                )
            ),
        )
    mock_messenger.ensure_send.assert_called_with(
        node_id=NodeId.pipette_left,
        message=reset_message,
        expected_nodes=[NodeId.pipette_left],
    )

    def _drain() -> Iterator[ErrorCode]:
        while True:
            try:
                yield output_queue.get_nowait()
            except asyncio.QueueEmpty:
                break

    for value in _drain():
        assert value == ErrorCode.over_pressure

    mock_messenger.reset_mock()
    # no error message is received, the queue should be empty
    async with subject.monitor_exceed_max_threshold(
        sensor_types.SensorInformation(
            sensor_type=SensorType.pressure,
            sensor_id=SensorId.S0,
            node_id=NodeId.pipette_left,
        ),
        mock_messenger,
    ) as output_queue:
        mock_messenger.ensure_send.assert_called_with(
            node_id=NodeId.pipette_left,
            message=stim_message,
            expected_nodes=[NodeId.pipette_left],
        )
    mock_messenger.ensure_send.assert_called_with(
        node_id=NodeId.pipette_left,
        message=reset_message,
        expected_nodes=[NodeId.pipette_left],
    )

    with pytest.raises(asyncio.QueueEmpty):
        output_queue.get_nowait()
