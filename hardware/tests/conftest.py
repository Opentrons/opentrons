"""Pytest shared fixtures."""
from typing import List

import pytest
from mock.mock import AsyncMock
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.message import CanMessage
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.can_messenger import MessageListenerCallback


class MockCanMessageNotifier:
    """A CanMessage notifier."""

    def __init__(self) -> None:
        """Constructor."""
        self._listeners: List[MessageListenerCallback] = []

    def add_listener(self, listener: MessageListenerCallback) -> None:
        """Add listener."""
        self._listeners.append(listener)

    def notify(self, message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        """Notify."""
        for listener in self._listeners:
            listener(message, arbitration_id)


class MockCanDriver(AbstractCanDriver):
    """A can driver mock.

    These definitions don't really do much
    other than taking care of giving abstract functions
    some form of definition.
    """

    def shutdown(self) -> None:
        """Stop the driver."""
        pass

    async def send(self, message: CanMessage) -> None:
        """Send a can message.

        Args:
            message: The message to send.

        Returns:
            None
        """
        pass

    async def read(self) -> CanMessage:
        """Read a message.

        Returns:
            A can message

        Raises:
            ErrorFrameCanError
        """
        return CanMessage(
            arbitration_id=ArbitrationId(id=bytes("mock_id", "utf-8")),
            data=bytes("mock_data", "utf-8"),
        )


@pytest.fixture
def can_message_notifier() -> MockCanMessageNotifier:
    """A fixture that notifies mock_messenger listeners of a new message."""
    return MockCanMessageNotifier()


@pytest.fixture
def can_driver() -> MockCanDriver:
    """A fixture."""
    return MockCanDriver()


@pytest.fixture
def mock_messenger(can_message_notifier: MockCanMessageNotifier) -> AsyncMock:
    """Mock can messenger."""
    mock = AsyncMock(spec=CanMessenger)
    mock.add_listener.side_effect = can_message_notifier.add_listener
    return mock


@pytest.fixture
def mock_driver() -> AsyncMock:
    """Mock can driver."""
    mock = AsyncMock(spec=AbstractCanDriver)
    response = message_definitions.PushToolsDetectedNotification(
        payload=payloads.ToolsDetectedNotificationPayload(
            z_motor=UInt8Field(1), a_motor=UInt8Field(1), gripper=UInt8Field(1)
        )
    )
    mock.__aiter__.return_value = [response]
    return mock
