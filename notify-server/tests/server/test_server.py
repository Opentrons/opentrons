"""Server module unit tests."""
import asyncio
from typing import Any
from unittest.mock import MagicMock

import zmq
from mock import patch, AsyncMock

import pytest

from notify_server.server import server
from notify_server.settings import Settings


@pytest.mark.asyncio
async def test_run() -> None:
    """Test that run starts both server tasks."""
    with patch.object(server, "_publisher_server_task") as mock_pub:
        with patch.object(server, "_subscriber_server_task") as mock_sub:
            settings = Settings()
            await server.run(settings)

            mock_pub.assert_called_once()
            mock_sub.assert_called_once()
            assert mock_pub.call_args[0][0] ==\
                   settings.publisher_address.connection_string()
            assert mock_sub.call_args[0][0] ==\
                   settings.subscriber_address.connection_string()


@pytest.mark.asyncio
async def test_publisher_server_task(
        mock_zmq_socket: AsyncMock,
        zmq_context: MagicMock) -> None:
    """Test publisher server task."""
    # Create the recv_multipart fixture
    out_q: asyncio.Queue = asyncio.Queue()
    await out_q.put((1, 2,))

    async def mock_recv_multipart() -> Any:
        v1, v2 = await out_q.get()
        return v2, v1

    mock_zmq_socket.recv_multipart.side_effect = mock_recv_multipart

    # Create the _publisher_server_task task
    in_q: asyncio.Queue = asyncio.Queue()
    task = asyncio.create_task(server._publisher_server_task("1234", in_q))
    # Wait on response
    res = await in_q.get()
    task.cancel()

    zmq_context.assert_called_once_with(zmq.PULL)
    mock_zmq_socket.bind.assert_called_once_with("1234")
    assert res == (2, 1)


@pytest.mark.asyncio
async def test_subscriber_server_task(
        mock_zmq_socket: AsyncMock,
        zmq_context: MagicMock) -> None:
    """Test subscriber server task."""
    in_q: asyncio.Queue = asyncio.Queue()
    await in_q.put((1, 2,))
    await in_q.put((3, 4,))

    # Create the _subscriber_server_task task
    task = asyncio.create_task(server._subscriber_server_task("1234", in_q))

    await asyncio.sleep(0)
    task.cancel()

    zmq_context.assert_called_once_with(zmq.PUB)
    mock_zmq_socket.bind.assert_called_once_with("1234")
    assert mock_zmq_socket.send_multipart.call_count == 2
    assert mock_zmq_socket.send_multipart.call_args_list[0][0][0] == (1, 2)
    assert mock_zmq_socket.send_multipart.call_args_list[1][0][0] == (3, 4)
