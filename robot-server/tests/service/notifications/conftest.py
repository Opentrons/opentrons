from datetime import datetime
from typing import AsyncGenerator

import pytest
from notify_server.clients.queue_entry import QueueEntry
from notify_server.models.event import Event
from notify_server.models.sample_events import SampleTwo


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
