"""Test device info."""
import asyncio
from typing import Tuple

import pytest
from opentrons_ot3_firmware import ArbitrationId
from opentrons_ot3_firmware.messages import MessageDefinition
from opentrons_ot3_firmware.messages.message_definitions import (
    SetMotionConstraints,
    GetMotionConstraintsRequest,
    GetMotionConstraintsResponse,
)

from opentrons_ot3_firmware.constants import NodeId
from opentrons_ot3_firmware.messages.payloads import (
    MotionConstraintsPayload,
    EmptyPayload,
)
from opentrons_ot3_firmware.utils import Int32Field

from opentrons_hardware.drivers.can_bus import CanMessenger


@pytest.mark.requires_emulator
async def test_each_node(
    loop: asyncio.BaseEventLoop, can_messenger: CanMessenger, motor_node_id: NodeId
) -> None:
    """It should write new constraints to each node and validate that it was written."""
    queue: asyncio.Queue[Tuple[MessageDefinition, ArbitrationId]] = asyncio.Queue()
    can_messenger.add_listener(lambda m, arb: queue.put_nowait((m, arb)))

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
        message=GetMotionConstraintsRequest(payload=EmptyPayload()),
    )

    response, arbitration_id = await asyncio.wait_for(queue.get(), 1)

    assert arbitration_id.parts.originating_node_id == motor_node_id
    assert arbitration_id.parts.message_id == GetMotionConstraintsResponse.message_id
    assert response.payload == payload
