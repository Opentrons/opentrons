"""Test device info."""
import asyncio
import pytest
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetMotionConstraints,
    GetMotionConstraintsRequest,
    GetMotionConstraintsResponse,
)

from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.firmware_bindings.messages.payloads import (
    MotionConstraintsPayload,
)
from opentrons_hardware.firmware_bindings.utils import Int32Field

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback


@pytest.mark.requires_emulator
async def test_each_node(
    loop: asyncio.BaseEventLoop,
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    motor_node_id: NodeId,
) -> None:
    """It should write new constraints to each node and validate that it was written."""
    payload = MotionConstraintsPayload(
        min_velocity=Int32Field(100),
        max_velocity=Int32Field(101),
        min_acceleration=Int32Field(-100),
        max_acceleration=Int32Field(101),
    )

    await can_messenger.send(
        node_id=motor_node_id, message=SetMotionConstraints(payload=payload)
    )
    await can_messenger.send(
        node_id=motor_node_id,
        message=GetMotionConstraintsRequest(),
    )

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert arbitration_id.parts.originating_node_id == motor_node_id
    assert arbitration_id.parts.message_id == GetMotionConstraintsResponse.message_id
    assert response.payload == payload
