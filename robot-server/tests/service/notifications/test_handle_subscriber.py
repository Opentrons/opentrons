from typing import AsyncGenerator
from dataclasses import asdict
from datetime import datetime

import pytest
from mock import MagicMock, patch
from notify_server.clients.queue_entry import QueueEntry
from notify_server.models.event import Event
from notify_server.models.sample_events import SampleTwo
from starlette.websockets import WebSocket
from robot_server.service.notifications import handle_subscriber
from robot_server.settings import get_settings


@pytest.fixture
def queue_entry() -> QueueEntry:
    return QueueEntry(topic="some_topic",
                      event=Event(
                          createdOn=datetime(2020, 1, 1),
                          publisher="some_one",
                          data=SampleTwo(val1=1, val2="2")
                      ))


@pytest.fixture
def mock_subscriber(queue_entry) -> AsyncGenerator:
    """A mock subscriber."""
    async def _f():
        yield queue_entry
    return _f()


@pytest.fixture
def mock_socket() -> MagicMock:
    """A mock websocket."""
    return MagicMock(spec=WebSocket)


async def test_create_subscriber(
        mock_socket: MagicMock) -> None:
    """Test that a subscriber is created correctly."""
    with patch.object(handle_subscriber, "create") as mock_create_sub:
        with patch.object(handle_subscriber, "route_events") as mock_route:
            await handle_subscriber.handle_socket(mock_socket, ["a", "b"])
            mock_create_sub.assert_called_once_with(
                get_settings().notification_server_subscriber_address,
                ["a", "b"]
            )
            mock_route.assert_called_once()


async def test_route_events(
        mock_socket: MagicMock,
        mock_subscriber: AsyncGenerator,
        queue_entry: QueueEntry) -> None:
    """Test that an event is read from subscriber and sent to websocket."""
    with patch.object(handle_subscriber, "send") as mock_send:
        await handle_subscriber.route_events(mock_socket,
                                             mock_subscriber)
        mock_send.assert_called_once_with(mock_socket, queue_entry)


async def test_send_entry(
        queue_entry: QueueEntry,
        mock_socket: MagicMock) -> None:
    """Test that queue entry is sent as json."""
    await handle_subscriber.send(mock_socket, queue_entry)
    mock_socket.send_json.assert_called_once_with(asdict(queue_entry))
