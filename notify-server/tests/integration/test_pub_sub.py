"""Pub sub integration tests."""
from asyncio import Task, sleep
from typing import AsyncGenerator, Tuple

import pytest

from notify_server.clients import publisher, subscriber
from notify_server.models.event import Event
from notify_server.settings import Settings

pytestmark = pytest.mark.asyncio

TOPICS = "topic1", "topic2"


@pytest.fixture
async def two_publishers(
    settings: Settings,
) -> AsyncGenerator[Tuple[publisher.Publisher, publisher.Publisher], None]:
    """Create two publishers."""
    pub1 = publisher.create(settings.publisher_address.connection_string())
    pub2 = publisher.create(settings.publisher_address.connection_string())
    yield pub1, pub2
    pub1.close()
    pub2.close()


@pytest.fixture
async def subscriber_all_topics(
    settings: Settings,
) -> AsyncGenerator[subscriber.Subscriber, None]:
    """Create subscriber for all topics."""
    sub = subscriber.create(settings.subscriber_address.connection_string(), TOPICS)
    yield sub
    sub.close()


@pytest.fixture
async def subscriber_first_topic(
    settings: Settings,
) -> AsyncGenerator[subscriber.Subscriber, None]:
    """Create subscriber for first topic."""
    sub = subscriber.create(
        settings.subscriber_address.connection_string(), (TOPICS[0],)
    )
    yield sub
    sub.close()


async def test_two_pub_two_sub_two_topics(
    server_fixture: Task,
    two_publishers: Tuple[publisher.Publisher, publisher.Publisher],
    subscriber_all_topics: subscriber.Subscriber,
    subscriber_first_topic: subscriber.Subscriber,
    event: Event,
) -> None:
    """Test that two publishers reaches two subscribers of different topics."""
    # TODO AL 2020-10-29: Super hacky sleep to wait for server task to get
    #  started.
    #  This test freezes in CI only. My theory is that there is a race
    #  condition. The server is not ready in time to get the first events.
    await sleep(0.1)

    pub1, pub2 = two_publishers

    await pub1.send("topic1", event)
    await pub2.send("topic2", event)

    e = await subscriber_first_topic.next_event()
    assert e.topic == "topic1"
    assert e.event == event

    e = await subscriber_all_topics.next_event()
    assert e.topic == "topic1"
    assert e.event == event

    e = await subscriber_all_topics.next_event()
    assert e.topic == "topic2"
    assert e.event == event
