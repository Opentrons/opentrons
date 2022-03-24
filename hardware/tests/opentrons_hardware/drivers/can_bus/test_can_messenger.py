"""Tests for the can messaging class."""
from __future__ import annotations
import asyncio
from asyncio import Queue

import pytest
from mock import AsyncMock, Mock

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    MessageId,
)

from opentrons_hardware.firmware_bindings.message import CanMessage
from opentrons_hardware.firmware_bindings.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    MessageListenerCallback,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    HeartbeatRequest,
    MoveCompleted,
    GetMoveGroupRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    MoveCompletedPayload,
    MoveGroupRequestPayload,
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field, UInt32Field


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
        [NodeId.head, HeartbeatRequest()],
        [
            NodeId.gantry_x,
            MoveCompleted(
                payload=MoveCompletedPayload(
                    group_id=UInt8Field(1),
                    seq_id=UInt8Field(2),
                    current_position=UInt32Field(3),
                    ack_id=UInt8Field(4),
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
                    message_id=message.message_id,
                    node_id=node_id,
                    function_code=0,
                    originating_node_id=NodeId.host,
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
                    originating_node_id=NodeId.gantry_x,
                )
            ),
            data=b"\1",
        )
    )

    # Set up a listener
    listener = Mock(spec=MessageListenerCallback)
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
    listener.assert_called_once_with(
        GetMoveGroupRequest(payload=MoveGroupRequestPayload(group_id=UInt8Field(1))),
        ArbitrationId(
            parts=ArbitrationIdParts(
                node_id=NodeId.broadcast,
                message_id=MessageId.get_move_group_request,
                function_code=0,
                originating_node_id=NodeId.gantry_x,
            )
        ),
    )


async def test_filter_messages(
    subject: CanMessenger, incoming_messages: Queue[CanMessage]
) -> None:
    """It should not call listener if matches filter."""
    # Add a received message to the driver
    incoming_messages.put_nowait(
        CanMessage(
            arbitration_id=ArbitrationId(
                parts=ArbitrationIdParts(
                    message_id=MessageId.get_move_group_request,
                    node_id=0,
                    function_code=0,
                    originating_node_id=NodeId.gantry_x,
                )
            ),
            data=b"\1",
        )
    )

    # Set up a listener
    listener = Mock(spec=MessageListenerCallback)
    # Add a filter that rejects all but the message in there queue
    subject.add_listener(listener, lambda arbitration_id: arbitration_id.parts.message_id != MessageId.get_move_group_request)

    # Start the listener
    subject.start()

    # Wait for the incoming messages to be read
    while not incoming_messages.empty():
        await asyncio.sleep(0.01)

    # Clean up
    subject.remove_listener(listener)
    await subject.stop()

    # Listener should not be called
    listener.assert_not_called()


async def test_waitable_callback_context() -> None:
    """It should add itself and remove itself using context manager."""
    mock_messenger = Mock(spec=CanMessenger)
    with WaitableCallback(mock_messenger) as callback:
        mock_messenger.add_listener.assert_called_once_with(callback, None)
    mock_messenger.remove_listener.assert_called_once_with(callback)


async def test_waitable_callback_context_with_filter() -> None:
    """It should add itself and remove itself using context manager."""
    mock_messenger = Mock(spec=CanMessenger)
    some_func = lambda x: True
    with WaitableCallback(mock_messenger, some_func) as callback:
        mock_messenger.add_listener.assert_called_once_with(callback, some_func)
    mock_messenger.remove_listener.assert_called_once_with(callback)
