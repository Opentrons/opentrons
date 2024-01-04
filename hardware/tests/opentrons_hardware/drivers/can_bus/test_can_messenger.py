"""Tests for the can messaging class."""
from __future__ import annotations
import asyncio
from asyncio import Queue

import pytest
from mock import AsyncMock, Mock

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    MessageId,
    ErrorCode,
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
    SetBrushedMotorPwmRequest,
    ExecuteMoveGroupRequest,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    MotorPositionFlagsField,
    ErrorCodeField,
    ErrorSeverityField,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    MoveCompletedPayload,
    MoveGroupRequestPayload,
    BrushedMotorPwmPayload,
    ExecuteMoveGroupRequestPayload,
    ErrorMessagePayload,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
    Int32Field,
)

from typing import List


@pytest.fixture
async def incoming_messages() -> Queue[CanMessage]:
    """Incoming message queue."""
    return asyncio.Queue()


@pytest.fixture
async def mock_driver(incoming_messages: Queue[CanMessage]) -> AsyncMock:
    """Mock can driver."""
    m = AsyncMock()
    m.__aiter__.side_effect = lambda: m
    m.__anext__.side_effect = incoming_messages.get
    return m


@pytest.fixture
async def subject(mock_driver: AsyncMock) -> CanMessenger:
    """The test subject."""
    return CanMessenger(driver=mock_driver)


async def test_context(mock_driver: AsyncMock) -> None:
    """It should start and stop."""
    async with CanMessenger(mock_driver) as m:
        assert m._task
        assert not m._task.done()
    assert m._task.done()


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
                    current_position_um=UInt32Field(3),
                    encoder_position_um=Int32Field(3),
                    position_flags=MotorPositionFlagsField(0),
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
    async with subject:
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


@pytest.mark.parametrize(
    "node_id,message",
    [
        [
            NodeId.gripper_g,
            SetBrushedMotorPwmRequest(
                payload=BrushedMotorPwmPayload(
                    duty_cycle=UInt32Field(50),
                )
            ),
        ],
    ],
)
async def test_ensure_send(
    subject: CanMessenger,
    mock_driver: AsyncMock,
    node_id: NodeId,
    message: MessageDefinition,
    incoming_messages: Queue[CanMessage],
) -> None:
    """It should create a can message and use the driver to send the message."""
    incoming_messages.put_nowait(
        CanMessage(
            arbitration_id=ArbitrationId(
                parts=ArbitrationIdParts(
                    message_id=MessageId.acknowledgement,
                    node_id=NodeId.host,
                    function_code=0,
                    originating_node_id=NodeId.gripper_g,
                )
            ),
            data=message.payload.message_index.value.to_bytes(4, "big"),
        )
    )

    async with subject:
        error = await subject.ensure_send(node_id, message, expected_nodes=[node_id])
    assert error == ErrorCode.ok
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


@pytest.mark.parametrize(
    "node_id,message",
    [
        [
            NodeId.gripper_g,
            SetBrushedMotorPwmRequest(
                payload=BrushedMotorPwmPayload(
                    duty_cycle=UInt32Field(50),
                )
            ),
        ],
    ],
)
async def test_ensure_send_error(
    subject: CanMessenger,
    mock_driver: AsyncMock,
    node_id: NodeId,
    message: MessageDefinition,
    incoming_messages: Queue[CanMessage],
) -> None:
    """It should create a can message and use the driver to send the message."""
    error_payload = ErrorMessagePayload(
        severity=ErrorSeverityField(1),
        error_code=ErrorCodeField(5),
    )
    error_payload.message_index = message.payload.message_index

    incoming_messages.put_nowait(
        CanMessage(
            arbitration_id=ArbitrationId(
                parts=ArbitrationIdParts(
                    message_id=MessageId.error_message,
                    node_id=NodeId.host,
                    function_code=2,
                    originating_node_id=NodeId.gripper_g,
                )
            ),
            data=error_payload.serialize(),
        )
    )

    async with subject:
        error = await subject.ensure_send(node_id, message, expected_nodes=[node_id])
    assert error == 5
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


@pytest.mark.parametrize(
    "node_id,message,response_subnodes",
    [
        (
            NodeId.gripper,
            ExecuteMoveGroupRequest(
                payload=ExecuteMoveGroupRequestPayload(
                    group_id=UInt8Field(0),
                    start_trigger=UInt8Field(0),
                    cancel_trigger=UInt8Field(0),
                )
            ),
            [NodeId.gripper_g, NodeId.gripper_z],
        ),
        (
            NodeId.head,
            ExecuteMoveGroupRequest(
                payload=ExecuteMoveGroupRequestPayload(
                    group_id=UInt8Field(0),
                    start_trigger=UInt8Field(0),
                    cancel_trigger=UInt8Field(0),
                )
            ),
            [NodeId.head_l, NodeId.head_r],
        ),
    ],
)
async def test_ensure_send_subnodes(
    subject: CanMessenger,
    mock_driver: AsyncMock,
    node_id: NodeId,
    message: MessageDefinition,
    response_subnodes: List[NodeId],
    incoming_messages: Queue[CanMessage],
) -> None:
    """If we send messages to a supernode we should return from ensure_send when all the subnodes respond."""
    for resp_node in response_subnodes:
        incoming_messages.put_nowait(
            CanMessage(
                arbitration_id=ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=MessageId.acknowledgement,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=resp_node,
                    )
                ),
                data=message.payload.message_index.value.to_bytes(4, "big"),
            )
        )
    async with subject:
        error = await subject.ensure_send(node_id, message, expected_nodes=[node_id])
    assert error == ErrorCode.ok
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


@pytest.mark.parametrize(
    "node_id,message",
    [
        [
            NodeId.gripper_g,
            SetBrushedMotorPwmRequest(
                payload=BrushedMotorPwmPayload(
                    duty_cycle=UInt32Field(50),
                )
            ),
        ],
    ],
)
async def test_ensure_send_timeout(
    subject: CanMessenger,
    mock_driver: AsyncMock,
    node_id: NodeId,
    message: MessageDefinition,
) -> None:
    """It should create a can message and use the driver to send the message but raise an TimeoutError."""
    async with subject:
        error = await subject.ensure_send(
            node_id, message, timeout=0.1, expected_nodes=[node_id]
        )

    assert error == ErrorCode.timeout
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
            data=b"\x00\x00\x00\x01\1",
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
    subject.add_listener(
        listener,
        lambda arbitration_id: bool(
            arbitration_id.parts.message_id != MessageId.get_move_group_request
        ),
    )

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

    def some_func(a: ArbitrationId) -> bool:
        return False

    with WaitableCallback(mock_messenger, some_func) as callback:
        mock_messenger.add_listener.assert_called_once_with(callback, some_func)
    mock_messenger.remove_listener.assert_called_once_with(callback)
