"""Test device info."""
import asyncio

import pytest
from opentrons_ot3_firmware import ArbitrationId, ArbitrationIdParts

from opentrons_hardware.drivers.can_bus import CanMessage
from opentrons_ot3_firmware.constants import NodeId, MessageId

from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver


@pytest.mark.requires_emulator
async def test_broadcast(
    loop: asyncio.BaseEventLoop, driver: AbstractCanDriver
) -> None:
    """It should receive responses from all nodes."""
    arbitration_id = ArbitrationId(
        parts=ArbitrationIdParts(
            message_id=MessageId.device_info_request,
            node_id=NodeId.broadcast,
            function_code=0,
        )
    )

    await driver.send(CanMessage(arbitration_id=arbitration_id, data=b""))

    async def _check() -> None:
        """Loop until all nodes respond."""
        nodes = {
            NodeId.head,
            NodeId.pipette,
            NodeId.gantry_x,
            NodeId.gantry_y,
        }
        while len(nodes):
            m = await driver.read()
            assert m.arbitration_id.parts.message_id == MessageId.device_info_response
            nodes.remove(m.arbitration_id.parts.originating_node_id)

    t = loop.create_task(_check())
    await asyncio.wait_for(t, 1)


@pytest.mark.requires_emulator
async def test_each_node(
    loop: asyncio.BaseEventLoop, driver: AbstractCanDriver, subsystem_node_id: NodeId
) -> None:
    """It should receive responses from each node."""
    arbitration_id = ArbitrationId(
        parts=ArbitrationIdParts(
            message_id=MessageId.device_info_request,
            node_id=subsystem_node_id,
            function_code=0,
        )
    )

    await driver.send(CanMessage(arbitration_id=arbitration_id, data=b""))

    response = await asyncio.wait_for(driver.read(), 1)
    assert response.arbitration_id.parts.message_id == MessageId.device_info_response
    assert response.arbitration_id.parts.originating_node_id == subsystem_node_id
