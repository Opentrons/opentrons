"""Test rear panel integration."""
import pytest
from mock import AsyncMock

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
def mock_usb_driver() -> AsyncMock:
    """Mock communication."""
    mock = AsyncMock(SerialUsbDriver)

    # Ensure the write() function returns as normal
    async def mock_write(message: BinaryMessageDefinition) -> int:
        print(f"Sending message: {message}")
        return message.get_size()

    mock.write.side_effect = mock_write
    return mock


@pytest.fixture
def mock_binary_messenger(mock_usb_driver: AsyncMock) -> BinaryMessenger:
    """BinaryMessenger with a mock usb driver."""
    msg = BinaryMessenger(driver=mock_usb_driver)
    return msg


@pytest.mark.parametrize("set", [True, False])
async def test_set_deck_light(
    mock_binary_messenger: BinaryMessenger, mock_usb_driver: AsyncMock, set: bool
) -> None:
    """Test setting the deck light."""
    # start() MUST be called in the test, not the fixture
    mock_binary_messenger.start()

    expected = SetDeckLightRequest(setting=UInt8Field(set))

    # Correct response = good
    mock_usb_driver.__aiter__.return_value = [Ack()]
    assert await set_deck_light(set, mock_binary_messenger)
    mock_usb_driver.write.assert_called_once_with(message=expected)
    mock_usb_driver.write.reset_mock()

    # Incorrect response = bad
    mock_usb_driver.__aiter__.return_value = [AckFailed()]
    assert not await set_deck_light(set, mock_binary_messenger)
    mock_usb_driver.write.assert_called_once_with(message=expected)


@pytest.mark.parametrize("set", [True, False])
async def test_get_deck_light(
    mock_binary_messenger: BinaryMessenger, mock_usb_driver: AsyncMock, set: bool
) -> None:
    """Test getting the deck light."""
    mock_binary_messenger.start()

    # Correct response
    mock_usb_driver.__aiter__.return_value = [
        GetDeckLightResponse(setting=UInt8Field(set))
    ]

    assert await get_deck_light_state(mock_binary_messenger) == set

    mock_usb_driver.write.assert_called_once_with(message=GetDeckLightRequest())

    # Error getting a response should default to False
    mock_usb_driver.__aiter__.return_value = [AckFailed()]

    assert await get_deck_light_state(mock_binary_messenger) is False


@pytest.mark.parametrize("state", [True, False])
async def test_get_door_state(
    mock_binary_messenger: BinaryMessenger, mock_usb_driver: AsyncMock, state: bool
) -> None:
    """Test getting the deck light."""
    mock_binary_messenger.start()

    # Correct response
    mock_usb_driver.__aiter__.return_value = [
        DoorSwitchStateInfo(door_open=UInt8Field(state))
    ]

    assert await get_door_state(mock_binary_messenger) == state

    mock_usb_driver.write.assert_called_once_with(message=DoorSwitchStateRequest())

    # Error getting a response should default to False
    mock_usb_driver.__aiter__.return_value = [AckFailed()]

    assert await get_door_state(mock_binary_messenger) is False
