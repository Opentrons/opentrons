"""Tests for Tip Detector."""
from typing import AsyncGenerator, List, Tuple

from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
    payloads,
    message_definitions,
)
from opentrons_hardware.firmware_bindings.messages.fields import SensorIdField
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.firmware_bindings.constants import SensorId
from tests.conftest import CanLoopback

import pytest
from mock import AsyncMock

from opentrons_hardware.hardware_control.tip_presence.detector import TipDetector
from opentrons_hardware.hardware_control.tip_presence.types import TipNotification
from opentrons_shared_data.errors.exceptions import CommandTimedOutError


@pytest.fixture
async def subject(mock_messenger: AsyncMock) -> AsyncGenerator[TipDetector, None]:
    """A tip detector subject."""
    detector = TipDetector(mock_messenger, NodeId.pipette_left)
    try:
        yield detector
    finally:
        detector.cleanup()


def create_push_tip_response(
    ejector_value: int,
    sensor_id: int,
) -> MessageDefinition:
    """Create a PushTipPresenceNotification."""
    return message_definitions.PushTipPresenceNotification(
        payload=payloads.PushTipPresenceNotificationPayload(
            ejector_flag_status=UInt8Field(ejector_value),
            sensor_id=SensorIdField(sensor_id),
        )
    )


async def test_tip_request_listens_to_only_one_node(
    subject: TipDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
) -> None:
    """Test that the tip status request receives the correct response."""

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.TipStatusQueryRequest):
            return [
                # responds with push tip notifications from different nodes
                (NodeId.host, create_push_tip_response(1, 1), NodeId.pipette_left),
                (NodeId.host, create_push_tip_response(30, 30), NodeId.pipette_right),
                (NodeId.host, create_push_tip_response(20, 20), NodeId.gantry_x),
            ]
        return []

    message_send_loopback.add_responder(responder)

    update = await subject.request_tip_status()
    # ensure a tip status request was sent via CAN
    mock_messenger.send.assert_called_once_with(
        node_id=NodeId.pipette_left, message=message_definitions.TipStatusQueryRequest()
    )
    assert len(update) == 1
    assert update[0] == TipNotification(
        sensor=SensorId.S1,
        presence=True,
    )


@pytest.mark.parametrize(
    "responses",
    [
        [  # only from one message
            (NodeId.host, create_push_tip_response(0, 0), NodeId.pipette_left)
        ],
        [  # two messages but from only one sensor
            (NodeId.host, create_push_tip_response(0, 0), NodeId.pipette_left),
            (NodeId.host, create_push_tip_response(1, 0), NodeId.pipette_left),
        ],
    ],
)
async def test_high_throughput_tip_detector_timeout(
    subject: TipDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
    responses: List[Tuple[NodeId, MessageDefinition, NodeId]],
) -> None:
    """Test that a timeout is handled."""

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.TipStatusQueryRequest):
            return responses
        return []

    message_send_loopback.add_responder(responder)

    # subject expects two responses for high throughput pipettes
    subject._number_of_responses = 2
    with pytest.raises(CommandTimedOutError):
        await subject.request_tip_status()
        # ensure a tip status request was sent via CAN
        mock_messenger.send.assert_called_once_with(
            node_id=NodeId.pipette_left,
            message=message_definitions.TipStatusQueryRequest(),
        )


@pytest.mark.parametrize(
    "responses",
    [
        [  # messages from both sensors
            (NodeId.host, create_push_tip_response(0, 0), NodeId.pipette_left),
            (NodeId.host, create_push_tip_response(0, 1), NodeId.pipette_left),
        ],
        [  # two messages from one sensor, and one from the other
            (NodeId.host, create_push_tip_response(1, 0), NodeId.pipette_left),
            (NodeId.host, create_push_tip_response(0, 0), NodeId.pipette_left),
            (NodeId.host, create_push_tip_response(0, 1), NodeId.pipette_left),
        ],
    ],
)
async def test_high_throughput_tip_detector_success(
    subject: TipDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
    responses: List[Tuple[NodeId, MessageDefinition, NodeId]],
) -> None:
    """Test that only the latest message from each sensor is read."""

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        if isinstance(message, message_definitions.TipStatusQueryRequest):
            return responses
        return []

    message_send_loopback.add_responder(responder)

    # subject expects two responses for high throughput pipettes
    subject._number_of_responses = 2
    update = await subject.request_tip_status(3.0)
    # ensure a tip status request was sent via CAN
    mock_messenger.send.assert_called_once_with(
        node_id=NodeId.pipette_left, message=message_definitions.TipStatusQueryRequest()
    )

    assert len(update) == 2
    assert TipNotification(SensorId.S0, False) in update
    assert TipNotification(SensorId.S1, False) in update
