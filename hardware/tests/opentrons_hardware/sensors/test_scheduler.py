"""Tests for the sensor scheduler."""

import mock
import asyncio
from typing import Iterator
from opentrons_hardware.sensors import scheduler, utils
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
    SensorOutputBinding,
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
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ReadFromSensorResponse,
    BindSensorOutputRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    BindSensorOutputRequestPayload,
    ReadFromSensorResponsePayload,
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
        utils.SensorInformation(
            sensor_type=SensorType.capacitive,
            sensor_id=SensorId.S0,
            node_id=NodeId.pipette_left,
        ),
        mock_messenger,
    ) as output_queue:
        mock_messenger.send.assert_called_with(
            node_id=NodeId.pipette_left, message=stim_message
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
    mock_messenger.send.assert_called_with(
        node_id=NodeId.pipette_left, message=reset_message
    )

    def _drain() -> Iterator[float]:
        while True:
            try:
                yield output_queue.get_nowait()
            except asyncio.QueueEmpty:
                break

    for index, value in enumerate(_drain()):
        assert value == index
