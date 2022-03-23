"""Test device info."""
import asyncio

import pytest
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoRequest,
)
from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, MessageId


@pytest.mark.requires_emulator
async def test_broadcast(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
) -> None:
    """It should receive responses from all nodes."""
    await can_messenger.send(node_id=NodeId.broadcast, message=DeviceInfoRequest())

    async def _check() -> None:
        """Loop until all nodes respond."""
        nodes = {
            NodeId.head,
            NodeId.pipette_left,
            NodeId.gantry_x,
            NodeId.gantry_y,
        }
        while len(nodes):
            message, arbitration_id = await can_messenger_queue.read()
            assert arbitration_id.parts.message_id == MessageId.device_info_response
            if arbitration_id.parts.originating_node_id in nodes:
                nodes.remove(arbitration_id.parts.originating_node_id)

    t = loop.create_task(_check())
    await asyncio.wait_for(t, 1)


@pytest.mark.requires_emulator
async def test_each_node(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    subsystem_node_id: NodeId,
) -> None:
    """It should receive responses from each node."""
    await can_messenger.send(node_id=subsystem_node_id, message=DeviceInfoRequest())

    message, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)
    assert arbitration_id.parts.message_id == MessageId.device_info_response
    assert arbitration_id.parts.originating_node_id == subsystem_node_id
