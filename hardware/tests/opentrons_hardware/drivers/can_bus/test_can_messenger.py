"""Tests for the can messaging class."""
from __future__ import annotations
import asyncio
from asyncio import Queue

import pytest
from mock import AsyncMock, Mock

from opentrons_ot3_firmware.constants import (
    NodeId,

    MessageId,
)

from opentrons_ot3_firmware.message import CanMessage
from opentrons_ot3_firmware.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    MessageListener,
)
from opentrons_ot3_firmware.messages import MessageDefinition
from opentrons_ot3_firmware.messages.message_definitions import (
    HeartbeatRequest,
    MoveCompleted,
    GetMoveGroupRequest,
)
from opentrons_ot3_firmware.messages.payloads import (
    EmptyPayload,
    MoveCompletedPayload,
    MoveGroupRequestPayload,
)
from opentrons_ot3_firmware.utils import UInt8Field, UInt32Field


@pytest.fixture
async def incoming_messages(loop: asyncio.AbstractEventLoop) -> Queue[CanMessage]:
    """Incoming message queue."""
    return asyncio.Queue()


@pytest.fixture
def mock_driver(incoming_messages: Queue[CanMessage]) -> AsyncMock:
    """Mock can driver."""
    m = AsyncMock()
    m.__aiter__.side_effect = lambda: m
    m.__anext__.side_effect = incoming_messages.get
    return m


@pytest.fixture
def subject(mock_driver: AsyncMock) -> CanMessenger:
    """The test subject."""
    return CanMessenger(driver=mock_driver)


@pytest.mark.parametrize(
    "node_id,message",
    [
        [NodeId.head, HeartbeatRequest(payload=EmptyPayload())],
        [
            NodeId.gantry_x,
            MoveCompleted(
                payload=MoveCompletedPayload(
                    group_id=UInt8Field(1),
                    seq_id=UInt8Field(2),
                    current_position=UInt32Field(3),
                    ack_id=UInt8Field(4),
                    node_id=UInt8Field(5),
                )
            ),
        ],
    ],
)
async def test_send(
    subject: CanMessenger,
    mock_driver: AsyncMock,
    node_id: NodeId,
    message: MessageDefinition,
) -> None:
    """It should create a can message and use the driver to send the message."""
    await subject.send(node_id, message)
    mock_driver.send.assert_called_once_with(
        message=CanMessage(
            arbitration_id=ArbitrationId(
                parts=ArbitrationIdParts(
                    message_id=message.message_id, node_id=node_id, function_code=0
                )
            ),
            data=message.payload.serialize(),
        )
    )


async def test_listen_messages(
    subject: CanMessenger, incoming_messages: Queue[CanMessage]
) -> None:
    """It should call listener with new messages."""
    # Add a received message to the driver
    incoming_messages.put_nowait(
        CanMessage(
            arbitration_id=ArbitrationId(
                parts=ArbitrationIdParts(
                    message_id=MessageId.get_move_group_request,
                    node_id=0,
                    function_code=0,
                )
            ),
            data=b"\1",
        )
    )

    # Set up a listener
    listener = Mock(spec=MessageListener)
    subject.add_listener(listener)

    # Start the listener
    subject.start()

    # Wait for the incoming messages to be read
    while not incoming_messages.empty():
        await asyncio.sleep(0.01)

    # Clean up
    subject.remove_listener(listener)
    await subject.stop()

    # Validate message.
    listener.on_message.assert_called_once_with(
        GetMoveGroupRequest(payload=MoveGroupRequestPayload(group_id=UInt8Field(1)))
    )
