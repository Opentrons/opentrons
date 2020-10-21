"""Pub sub integration tests."""
from typing import AsyncGenerator

import pytest

from notify_server.clients import publisher, subscriber
from notify_server.models.event import Event
from notify_server.settings import Settings

pytestmark = pytest.mark.asyncio


@pytest.mark.skip
async def test_one_pub_one_sub(
        server_fixture: AsyncGenerator,
        event: Event) -> None:
    """Test that one publisher reaches one subscriber."""
    settings = Settings()
    pub = publisher.create(settings.publisher_address.connection_string())
    sub = subscriber.create(settings.subscriber_address.connection_string(),
                            ['topic1'])

    await pub.send("topic1", event)
    e = await sub.next_event()
    assert e.topic == "topic1"
    assert e.event == event

    await pub.stop()
    await sub.stop()


@pytest.mark.skip
async def test_one_pub_two_sub(
        server_fixture: AsyncGenerator,
        event: Event) -> None:
    """Test that one pub reaches two subscribers."""
    settings = Settings()
    pub = publisher.create(settings.publisher_address.connection_string())
    sub1 = subscriber.create(settings.subscriber_address.connection_string(),
                             ['topic1'])
    sub2 = subscriber.create(settings.subscriber_address.connection_string(),
                             ['topic1'])

    await pub.send("topic1", event)
    e = await sub1.next_event()
    assert e.topic == "topic1"
    assert e.event == event
    e = await sub2.next_event()
    assert e.topic == "topic1"
    assert e.event == event

    await pub.stop()
    await sub1.stop()
    await sub2.stop()


# @pytest.mark.skip
async def test_one_pub_two_sub_two_topics(
        server_fixture: AsyncGenerator,
        event: Event) -> None:
    """Test that one pub reaches two subscribers of different topics."""
    settings = Settings()
    pub1 = publisher.create(settings.publisher_address.connection_string())
    pub2 = publisher.create(settings.publisher_address.connection_string())
    sub1 = subscriber.create(settings.subscriber_address.connection_string(),
                             ['topic1'])
    sub2 = subscriber.create(settings.subscriber_address.connection_string(),
                             ['topic2'])

    await pub1.send("topic1", event)
    await pub2.send("topic2", event)
    e = await sub1.next_event()
    assert e.topic == "topic1"
    assert e.event == event
    e = await sub2.next_event()
    assert e.topic == "topic2"
    assert e.event == event

    await pub1.stop()
    await pub2.stop()
    await sub1.stop()
    await sub2.stop()
