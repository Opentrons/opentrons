from datetime import datetime
from typing import AsyncIterator

import pytest
from notify_server.clients.serdes import TopicEvent
from notify_server.models.event import Event
from notify_server.models.payload_type import UserData


@pytest.fixture
def topic_event() -> TopicEvent:
    return TopicEvent(
        topic="some_topic",
        event=Event(
            createdOn=datetime(2020, 1, 1),
            publisher="some_one",
            data=UserData(data={"val1": 1, "val2": "2"}),
        ),
    )


@pytest.fixture
def mock_subscriber(topic_event: TopicEvent) -> AsyncIterator[TopicEvent]:
    """A mock subscriber."""

    async def _f() -> AsyncIterator[TopicEvent]:
        yield topic_event

    return _f()
