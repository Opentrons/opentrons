from datetime import datetime
from typing import AsyncGenerator

import pytest
from notify_server.clients.serdes import TopicEvent
from notify_server.models.event import Event
from notify_server.models.sample_events import SampleTwo


@pytest.fixture
def topic_event() -> TopicEvent:
    return TopicEvent(
        topic="some_topic",
        event=Event(
            createdOn=datetime(2020, 1, 1),
            publisher="some_one",
            data=SampleTwo(val1=1, val2="2"),
        ),
    )


@pytest.fixture
def mock_subscriber(topic_event) -> AsyncGenerator:
    """A mock subscriber."""

    async def _f():
        yield topic_event

    return _f()
