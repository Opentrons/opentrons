"""Tests for Tool Detector."""
import pytest
from mock import AsyncMock
from opentrons_hardware.firmware_bindings import (
    NodeId,
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.firmware_bindings.utils import UInt8Field

from opentrons_hardware.hardware_control.tools import detector
from opentrons_hardware.hardware_control.tools.types import Carrier
from opentrons_hardware.firmware_bindings.constants import ToolType
from tests.conftest import MockCanMessageNotifier
from tests.conftest import MockCanDriver


@pytest.fixture
def subject(mock_messenger: AsyncMock) -> detector.ToolDetector:
    """The test subject."""
    tool_dict = {
        Carrier.LEFT: ToolType(0),
        Carrier.RIGHT: ToolType(0),
    }
    return detector.ToolDetector(mock_messenger, tool_dict)


async def test_messaging(
    subject: detector.ToolDetector,
    mock_messenger: AsyncMock,
    mock_driver: MockCanDriver,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should initiate detector and prepare for tool change detection."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Mock send method."""
        if isinstance(message, message_definitions.AttachedToolsRequest):
            response = message_definitions.PushToolsDetectedNotification(
                payload=payloads.ToolsDetectedNotificationPayload(
                    z_motor=UInt8Field(1), a_motor=UInt8Field(1), gripper=UInt8Field(1)
                )
            )
            can_message_notifier.notify(
                message=response,
                arbitration_id=ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=response.message_id,
                        originating_node_id=NodeId.head,
                        node_id=NodeId.host,
                        function_code=0,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder
    await subject.run(1, 1, mock_driver)
    tool_dict = {
        Carrier.LEFT: ToolType(1),
        Carrier.RIGHT: ToolType(1),
    }
    assert subject._attached_tools == tool_dict
