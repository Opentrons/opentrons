"""Unit tests for subscriber module."""
import asyncio
from asyncio import Queue
from typing import Tuple
from unittest.mock import MagicMock, call

import pytest
import zmq
from mock import AsyncMock

from notify_server.clients import subscriber
from notify_server.clients.queue_entry import QueueEntry
from notify_server.models.event import Event


@pytest.mark.asyncio
async def test_connect_subscribe(
        zmq_context: MagicMock,
        mock_zmq_socket: AsyncMock) -> None:
    """Test that subscriber task connects and subscribes."""
    async def mock_recv_multipart() -> None:
        await asyncio.sleep(1)

    mock_zmq_socket.recv_multipart.side_effect = mock_recv_multipart

    s = subscriber.create("1234", ["a", "b"])
    await asyncio.sleep(0)
    s.stop()
    mock_zmq_socket.connect.assert_called_once_with("1234")
    assert mock_zmq_socket.setsockopt_string.call_args_list == [
        call(zmq.SUBSCRIBE, "a"),
        call(zmq.SUBSCRIBE, "b")]


@pytest.mark.asyncio
@pytest.fixture
async def mock_recv_multipart(mock_zmq_socket: AsyncMock,
                              event: Event) -> AsyncMock:
    """Attach a mock_recv_multipart to mock_zmq_socket."""
    out_q: Queue = Queue()
    await out_q.put([])
    await out_q.put([b"a", b"{"])
    await out_q.put([b"topic", event.json().encode('utf-8')])

    async def mock_recv_multipart() -> Tuple[bytes, bytes]:
        """Fake recv_multipart that simply pulls from the out_q."""
        return await out_q.get()

    mock_zmq_socket.recv_multipart.side_effect = mock_recv_multipart
    return mock_zmq_socket


@pytest.mark.asyncio
async def test_process_frames(
        zmq_context: MagicMock,
        mock_recv_multipart: AsyncMock,
        event: Event) -> None:
    """Test that _handle_event is called for each event."""
    s = subscriber.create("1234", ["a", "b"])
    s._process_frames = AsyncMock()
    await asyncio.sleep(0)
    s.stop()
    assert s._process_frames.call_args_list == [
        call([]),
        call([b"a", b"{"]),
        call([b"topic", event.json().encode('utf-8')])
    ]


@pytest.mark.asyncio
async def test_integration(
        zmq_context: MagicMock,
        mock_recv_multipart: AsyncMock,
        event: Event) -> None:
    """Test that only a well formed event reaches the callback."""
    s = subscriber.create("1234", ["a", "b"])
    result = await s.next_event()
    s.stop()
    assert result == QueueEntry("topic", event)
