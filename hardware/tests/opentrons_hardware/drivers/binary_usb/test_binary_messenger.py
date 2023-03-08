"""Tests for the can messaging class."""
from __future__ import annotations
import asyncio
from asyncio import Queue

import pytest
from mock import AsyncMock, Mock

from opentrons_hardware.firmware_bindings.binary_constants import (
    BinaryMessageId,
)

from opentrons_hardware.drivers.binary_usb.binary_messenger import (
    BinaryMessenger,
    BinaryMessageListenerCallback,
    BinaryWaitableCallback,
)

from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    DeviceInfoRequest,
    BinaryMessageDefinition,
)


@pytest.fixture
async def incoming_messages() -> Queue[BinaryMessageDefinition]:
    """Incoming message queue."""
    return asyncio.Queue()


@pytest.fixture
def mock_driver(incoming_messages: Queue[BinaryMessageDefinition]) -> AsyncMock:
    """Mock can driver."""
    m = AsyncMock()
    m.__aiter__.side_effect = lambda: m
    m.__anext__.side_effect = incoming_messages.get
    return m


@pytest.fixture
def subject(mock_driver: AsyncMock) -> BinaryMessenger:
    """The test subject."""
    return BinaryMessenger(driver=mock_driver)


async def test_context(mock_driver: AsyncMock) -> None:
    """It should start and stop."""
    async with BinaryMessenger(mock_driver) as m:
        assert m._task
        assert not m._task.done()
    assert m._task.done()


async def test_star_stop(mock_driver: AsyncMock) -> None:
    """It should start and stop."""
    messenger = BinaryMessenger(mock_driver)
    messenger.start()
    assert messenger._task
    assert not messenger._task.done()
    await messenger.stop()
    assert messenger._task.done()
    messenger.start()
    assert not messenger._task.done()
    # clean up
    await messenger.stop()


@pytest.mark.parametrize(
    "message",
    [
        DeviceInfoRequest(),
    ],
)
async def test_send(
    subject: BinaryMessenger,
    mock_driver: AsyncMock,
    message: BinaryMessageDefinition,
) -> None:
    """It should create a can message and use the driver to send the message."""
    await subject.send(message)
    mock_driver.write.assert_called_once()


async def test_listen_messages(
    subject: BinaryMessenger, incoming_messages: Queue[BinaryMessageDefinition]
) -> None:
    """It should call listener with new messages."""
    # Add a received message to the driver
    incoming_messages.put_nowait(DeviceInfoRequest())

    # Set up a listener
    listener = Mock(spec=BinaryMessageListenerCallback)
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
    listener.assert_called_once_with(DeviceInfoRequest())


async def test_filter_messages(
    subject: BinaryMessenger, incoming_messages: Queue[BinaryMessageDefinition]
) -> None:
    """It should not call listener if matches filter."""
    # Add a received message to the driver
    incoming_messages.put_nowait(DeviceInfoRequest())

    # Set up a listener
    listener = Mock(spec=BinaryMessageListenerCallback)
    # Add a filter that rejects all but the message in there queue
    subject.add_listener(
        listener,
        lambda message_id: bool(message_id != BinaryMessageId.device_info_request),
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
    mock_messenger = Mock(spec=BinaryMessenger)
    with BinaryWaitableCallback(mock_messenger) as callback:
        mock_messenger.add_listener.assert_called_once_with(callback, None)
    mock_messenger.remove_listener.assert_called_once_with(callback)


async def test_waitable_callback_context_with_filter() -> None:
    """It should add itself and remove itself using context manager."""
    mock_messenger = Mock(spec=BinaryMessenger)

    def some_func(a: BinaryMessageId) -> bool:
        return False

    with BinaryWaitableCallback(mock_messenger, some_func) as callback:
        mock_messenger.add_listener.assert_called_once_with(callback, some_func)
    mock_messenger.remove_listener.assert_called_once_with(callback)
