"""Unit tests for publisher module."""
import asyncio
from asyncio import AbstractEventLoop
from datetime import datetime
from unittest.mock import patch, MagicMock
from mock import AsyncMock
import pytest
from zmq.asyncio import Context  # type: ignore

from notify_server.clients import publisher
from notify_server.models.event import Event
from notify_server.models.sample_events import SampleTwo


@pytest.fixture
def mock_zmq_socket() -> AsyncMock:
    """Mock zmq socket."""
    mock_sock = AsyncMock()
    return mock_sock


@pytest.fixture
def zmq_context(mock_zmq_socket: AsyncMock) -> MagicMock:
    """Mock zmq Context."""
    with patch.object(Context, "socket") as p:
        p.return_value = mock_zmq_socket
        yield p


@pytest.fixture
def event() -> Event:
    """Event fixture."""
    return Event(
        createdOn=datetime(2000, 1, 1),
        publisher="pub",
        data=SampleTwo(val1=1, val2="2")
    )


@pytest.mark.asyncio
async def test_send_integration(event_loop: AbstractEventLoop,
                                event: Event,
                                zmq_context: MagicMock,
                                mock_zmq_socket: AsyncMock) -> None:
    """Integration test."""
    pub = publisher.create("someaddress")
    await pub.send(topic="topic", event=event)
    await asyncio.sleep(0)
    mock_zmq_socket.connect.assert_called_once_with("someaddress")
    mock_zmq_socket.send_multipart.assert_called_once_with(
        [b"topic",
         event.json().encode('utf-8')]
    )
    pub.stop()


def test_entry_to_frames(event: Event) -> None:
    """Test that to frames method creates a list of byte frames."""
    entry = publisher._Entry("topic",
                             event)
    assert entry.to_frames() == [
        b'topic', event.json().encode('utf-8')
    ]
