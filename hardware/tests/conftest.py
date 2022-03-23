"""Pytest shared fixtures."""
from typing import List

import pytest
from mock.mock import AsyncMock
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition

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


@pytest.fixture
def can_message_notifier() -> MockCanMessageNotifier:
    """A fixture that notifies mock_messenger listeners of a new message."""
    return MockCanMessageNotifier()


@pytest.fixture
def mock_messenger(can_message_notifier: MockCanMessageNotifier) -> AsyncMock:
    """Mock can messenger."""
    mock = AsyncMock(spec=CanMessenger)
    mock.add_listener.side_effect = can_message_notifier.add_listener
    return mock
