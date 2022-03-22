"""Test for attached tool request."""
import asyncio
import pytest

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_bindings.constants import ToolType
from opentrons_hardware.firmware_bindings.messages.fields import ToolField
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    AttachedToolsRequest,
    PushToolsDetectedNotification,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    ToolsDetectedNotificationPayload,
)


@pytest.mark.requires_emulator
async def test_attached_tools_request(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
) -> None:
    """It should respond with a push tools detectioned notification."""
    msg = AttachedToolsRequest()

    await can_messenger.send(node_id=NodeId.head, message=msg)

    message, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    expected_payload = ToolsDetectedNotificationPayload(
        z_motor=ToolField(ToolType.undefined_tool),
        a_motor=ToolField(ToolType.undefined_tool),
        gripper=ToolField(ToolType.undefined_tool),
    )

    assert arbitration_id.parts.message_id == PushToolsDetectedNotification.message_id
    assert arbitration_id.parts.originating_node_id == NodeId.head
    assert arbitration_id.parts.node_id == NodeId.host
    assert message.payload == expected_payload
