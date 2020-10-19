"""Pytest conf."""
from datetime import datetime
from unittest.mock import patch, MagicMock

import pytest
from mock import AsyncMock

from zmq.asyncio import Context

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
