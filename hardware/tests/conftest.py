"""Pytest shared fixtures."""
from typing import List, Tuple
from typing_extensions import Protocol

import pytest
from mock.mock import AsyncMock
from opentrons_hardware.firmware_bindings import ArbitrationId, ArbitrationIdParts
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings import NodeId

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


class CanLoopback:
    """A class for capturing a mocked canbus and providing responses to messages.

    When built on a mocked CanMessenger, hooks the messenger's send mocked method
    and inserts provided responders.
    """

    class LoopbackResponder(Protocol):
        """The provided callback function. Returned values will be sent."""

        def __call__(
            self,
            node_id: NodeId,
            message: MessageDefinition,
        ) -> List[Tuple[NodeId, MessageDefinition, NodeId]]:
            """Main call method that will usually be a function.

            Args:
                node_id: Destination node id
                message: Message

            Return value:
                A tuple of (destination, message, source).
            """
            ...

    def __init__(
        self, mock_messenger: AsyncMock, mock_notifier: MockCanMessageNotifier
    ) -> None:
        """Build the loopback.

        Args:
            mock_messenger: The messenger to wrap
            mock_notifier: A notifier to wrap
        """
        self._mock_messenger = mock_messenger
        self._mock_notifier = mock_notifier
        self._responders: List[CanLoopback.LoopbackResponder] = []
        self._mock_messenger.send.side_effect = self._listener

    def _listener(self, node_id: NodeId, message: MessageDefinition) -> None:
        for responder in self._responders:
            for response in responder(node_id, message):
                self._mock_notifier.notify(
                    message=response[1],
                    arbitration_id=ArbitrationId(
                        parts=ArbitrationIdParts(
                            message_id=response[1].message_id,
                            originating_node_id=response[2],
                            node_id=response[0],
                            function_code=0,
                        )
                    ),
                )

    def add_responder(self, responder: "CanLoopback.LoopbackResponder") -> None:
        """Add a responder."""
        self._responders.append(responder)

    def remove_responder(self, responder: "CanLoopback.LoopbackResponder") -> None:
        """Remove a responder."""
        self._responders.remove(responder)


@pytest.fixture
def message_send_loopback(
    mock_messenger: AsyncMock, can_message_notifier: MockCanMessageNotifier
) -> CanLoopback:
    """Provide a loopback object for injecting responses."""
    return CanLoopback(mock_messenger, can_message_notifier)
