"""Test rear panel integration."""
from __future__ import annotations
from asyncio import Queue
import pytest
from mock import AsyncMock
import asyncio
from typing import AsyncGenerator

from opentrons_hardware.drivers.binary_usb.bin_serial import SerialUsbDriver
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.utils import UInt8Field

from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    Ack,
    AckFailed,
    GetDeckLightResponse,
    SetDeckLightRequest,
    GetDeckLightRequest,
    DoorSwitchStateInfo,
    DoorSwitchStateRequest,
)

from opentrons_hardware.hardware_control.rear_panel_settings import (
    get_deck_light_state,
    get_door_state,
    set_deck_light,
)


@pytest.fixture
async def incoming_messages() -> Queue[BinaryMessageDefinition]:
    """Incoming message queue.

    To emulate sending a message to a messenger, add to this queue.
    """
    return asyncio.Queue()


@pytest.fixture
async def read_queue() -> Queue[BinaryMessageDefinition]:
    """Incoming message queue.

    This queue is just used internally by the mock driver to
    move messages into the read queue only when appropriate.
    """
    return asyncio.Queue()


@pytest.fixture
async def mock_usb_driver(
    incoming_messages: Queue[BinaryMessageDefinition],
    read_queue: Queue[BinaryMessageDefinition],
) -> AsyncMock:
    """Mock communication."""
    mock = AsyncMock(SerialUsbDriver)

    # Ensure the write() function returns as normal
    async def mock_write(message: BinaryMessageDefinition) -> int:
        if not incoming_messages.empty():
            read_queue.put_nowait(await incoming_messages.get())
        return message.get_size()

    mock.write.side_effect = mock_write
    mock.__aiter__.side_effect = lambda: mock
    mock.__anext__.side_effect = read_queue.get
    return mock


@pytest.fixture
async def mock_binary_messenger(
    mock_usb_driver: AsyncMock,
) -> AsyncGenerator[BinaryMessenger, None]:
    """BinaryMessenger with a mock usb driver."""
    msg = BinaryMessenger(driver=mock_usb_driver)
    msg.start()
    yield msg
    await msg.stop()


@pytest.mark.parametrize("set", [True, False])
async def test_set_deck_light(
    mock_binary_messenger: BinaryMessenger,
    mock_usb_driver: AsyncMock,
    incoming_messages: Queue[BinaryMessageDefinition],
    set: bool,
) -> None:
    """Test setting the deck light."""
    expected = SetDeckLightRequest(setting=UInt8Field(set))

    # Correct response = good
    incoming_messages.put_nowait(Ack())
    assert await set_deck_light(set, mock_binary_messenger)
    mock_usb_driver.write.assert_called_once_with(message=expected)
    mock_usb_driver.write.reset_mock()

    # Incorrect response = bad
    incoming_messages.put_nowait(AckFailed())
    assert not await set_deck_light(set, mock_binary_messenger)
    mock_usb_driver.write.assert_called_once_with(message=expected)


@pytest.mark.parametrize("set", [True, False])
async def test_get_deck_light(
    mock_binary_messenger: BinaryMessenger,
    mock_usb_driver: AsyncMock,
    incoming_messages: Queue[BinaryMessageDefinition],
    set: bool,
) -> None:
    """Test getting the deck light."""
    # Correct response
    incoming_messages.put_nowait(GetDeckLightResponse(setting=UInt8Field(set)))
    assert await get_deck_light_state(mock_binary_messenger) == set

    mock_usb_driver.write.assert_called_once_with(message=GetDeckLightRequest())

    # Error getting a response should default to False
    incoming_messages.put_nowait(AckFailed())
    assert await get_deck_light_state(mock_binary_messenger) is False


@pytest.mark.parametrize("state", [True, False])
async def test_get_door_state(
    mock_binary_messenger: BinaryMessenger,
    mock_usb_driver: AsyncMock,
    incoming_messages: Queue[BinaryMessageDefinition],
    state: bool,
) -> None:
    """Test getting the door state."""
    # Correct response
    incoming_messages.put_nowait(DoorSwitchStateInfo(door_open=UInt8Field(state)))

    assert await get_door_state(mock_binary_messenger) == state
    mock_usb_driver.write.assert_called_once_with(message=DoorSwitchStateRequest())

    # Error getting a response should default to False
    incoming_messages.put_nowait(AckFailed())
    assert await get_door_state(mock_binary_messenger) is False

    await mock_binary_messenger.stop()
