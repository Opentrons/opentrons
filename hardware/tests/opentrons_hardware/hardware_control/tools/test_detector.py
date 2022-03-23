"""Tests for Tool Detector."""
from opentrons_hardware.firmware_bindings.constants import ToolType
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
)
import pytest
from mock import AsyncMock, call

from opentrons_hardware.firmware_bindings.messages.fields import ToolField
from opentrons_hardware.hardware_control.tools import detector
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.firmware_bindings import (
    NodeId,
)
from opentrons_hardware.hardware_control.tools.types import ToolDetectionResult
from tests.conftest import CanLoopback
from typing import List, Tuple


@pytest.fixture
def subject(
    mock_messenger: AsyncMock,
) -> detector.ToolDetector:
    """The test subject."""
    return detector.ToolDetector(messenger=mock_messenger)


@pytest.mark.parametrize(
    argnames=["payload", "expected"],
    argvalues=[
        [
            payloads.ToolsDetectedNotificationPayload(
                z_motor=ToolField(ToolType.pipette_96_chan.value),
                a_motor=ToolField(ToolType.pipette_384_chan.value),
                gripper=ToolField(ToolType.gripper.value),
            ),
            ToolDetectionResult(
                left=ToolType.pipette_96_chan,
                right=ToolType.pipette_384_chan,
                gripper=ToolType.gripper,
            ),
        ],
        [
            payloads.ToolsDetectedNotificationPayload(
                z_motor=ToolField(221),
                a_motor=ToolField(ToolType.pipette_384_chan.value),
                gripper=ToolField(ToolType.gripper.value),
            ),
            ToolDetectionResult(
                left=ToolType.undefined_tool,
                right=ToolType.pipette_384_chan,
                gripper=ToolType.gripper,
            ),
        ],
    ],
)
async def test_messaging(
    subject: detector.ToolDetector,
    mock_messenger: AsyncMock,
    message_send_loopback: CanLoopback,
    payload: payloads.ToolsDetectedNotificationPayload,
    expected: ToolDetectionResult,
) -> None:
    """It should start the tool detection process.

    First a request is sent to establish initial state
    then messages are read asynchronously.
    """

    def responder(
        node_id: NodeId, message: MessageDefinition
    ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
        """Mock send method."""
        if isinstance(message, message_definitions.AttachedToolsRequest):
            return [
                (
                    NodeId.host,
                    message_definitions.PushToolsDetectedNotification(payload=payload),
                    NodeId.head,
                )
            ]
        return []

    message_send_loopback.add_responder(responder)

    tool = await subject.detect().__anext__()

    assert tool == expected

    assert mock_messenger.send.mock_calls == [
        call(
            node_id=NodeId.head,
            message=message_definitions.AttachedToolsRequest(
                payload=payloads.EmptyPayload()
            ),
        )
    ]
