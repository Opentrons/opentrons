"""Tests for Tool Detector."""
from opentrons_hardware.firmware_bindings.constants import ToolType
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
)
import pytest
from mock import AsyncMock, call, MagicMock
from opentrons_hardware.hardware_control.tools import detector
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.firmware_bindings import (
    NodeId,
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.hardware_control.tools.types import ToolDetectionResult
from tests.conftest import MockCanMessageNotifier


@pytest.fixture
def subject(
    mock_messenger: AsyncMock,
) -> detector.ToolDetector:
    """The test subject."""
    return detector.ToolDetector(messenger=mock_messenger)


async def test_messaging(
    subject: detector.ToolDetector,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should start the tool detection process.

    First a request is sent to establish initial state
    then messages are read asyncronously.
    """

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Mock send method."""
        if isinstance(message, message_definitions.AttachedToolsRequest):
            response = message_definitions.PushToolsDetectedNotification(
                payload=payloads.ToolsDetectedNotificationPayload(
                    z_motor=UInt8Field(1), a_motor=UInt8Field(2), gripper=UInt8Field(5)
                )
            )
            can_message_notifier.notify(
                message=response,
                arbitration_id=ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=response.message_id,
                        originating_node_id=node_id,
                        node_id=NodeId.host,
                        function_code=0,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder

    tool = await subject.detect().__anext__()

    assert tool == ToolDetectionResult(
        left=ToolType.pipette_96_chan,
        right=ToolType.pipette_384_chan,
        gripper=ToolType.gripper,
    )

    assert mock_messenger.send.mock_calls == [
        call(
            node_id=NodeId.host,
            message=message_definitions.AttachedToolsRequest(
                payload=payloads.EmptyPayload()
            ),
        )
    ]
