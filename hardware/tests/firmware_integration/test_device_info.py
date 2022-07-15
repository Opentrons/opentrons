"""Test device info."""
import asyncio

import pytest

from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoRequest,
    DeviceInfoResponse,
)
from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, MessageId


def filter_func(arb: ArbitrationId) -> bool:
    """Filtering function for device info tests."""
    return bool(
        arb.parts.message_id == MessageId.device_info_response
        and arb.parts.node_id == NodeId.host
    )


@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_broadcast(
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
            NodeId.pipette_left_bootloader,
        }
        # The simulator loads up a bootloader simulator using the
        # left pipette bootloader node id. Since we send a broadcast message
        # out, we need to make sure we read all of the device info request
        # messages so that `test_each_node` does not fail.
        while len(nodes):
            message, arbitration_id = await can_messenger_queue.read()
            assert arbitration_id.parts.message_id == MessageId.device_info_response
            if arbitration_id.parts.originating_node_id in nodes:
                nodes.remove(arbitration_id.parts.originating_node_id)

    t = asyncio.get_running_loop().create_task(_check())
    await asyncio.wait_for(t, 1)


@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_each_node(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    subsystem_node_id: NodeId,
) -> None:
    """It should receive responses from each node."""
    await can_messenger.send(node_id=subsystem_node_id, message=DeviceInfoRequest())

    message, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)
    assert arbitration_id.parts.message_id == MessageId.device_info_response
    assert arbitration_id.parts.originating_node_id == subsystem_node_id
    assert isinstance(message, DeviceInfoResponse)
