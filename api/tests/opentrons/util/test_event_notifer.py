"""Unit tests for `opentrons.util.event_notifier`."""
import pytest
import asyncio
from typing import Optional
from unittest.mock import MagicMock

from opentrons.util.event_notifier import EventNotifier


@pytest.fixture
async def event_notifier() -> EventNotifier:
    """Mock event notifier."""
    return EventNotifier(max_queue_size=10)


@pytest.mark.asyncio
async def test_subscribe(event_notifier: EventNotifier) -> None:
    """It should add the callback to a list of callbacks."""

    async def mock_callback() -> None:
        await asyncio.sleep(0)

    unsubscribe = event_notifier.subscribe(mock_callback)
    assert mock_callback in event_notifier._callbacks

    unsubscribe()


@pytest.mark.asyncio
async def test_subscribe_many(event_notifier: EventNotifier) -> None:
    """It should subscribe a list of callbacks."""

    async def mock_callback1() -> None:
        await asyncio.sleep(0)

    async def mock_callback2() -> None:
        await asyncio.sleep(0)

    event_notifier.subscribe_many([mock_callback1, mock_callback2])
    assert mock_callback1 in event_notifier._callbacks
    assert mock_callback2 in event_notifier._callbacks


@pytest.mark.asyncio
async def test_subscribed(event_notifier: EventNotifier) -> None:
    """It should unsubscribe a callback when subscribed() as soon as the context is exited."""

    async def mock_callback() -> None:
        await asyncio.sleep(0)

    with event_notifier.subscribed(mock_callback):
        event_notifier.notify()

    assert mock_callback not in event_notifier._callbacks


@pytest.mark.asyncio
async def test_notify_with_message(event_notifier: EventNotifier) -> None:
    """It should allow callbacks to subscribe to notify(), passing a message if the callback supports one."""
    result = []

    async def mock_callback(message: Optional[str] = None) -> None:
        result.append(message)

    unsubscribe = event_notifier.subscribe(mock_callback)
    event_notifier.notify("TEST_MESSAGE")
    await asyncio.sleep(0)

    assert len(result) == 1
    assert result[0] == "TEST_MESSAGE"

    unsubscribe()


@pytest.mark.asyncio
async def test_notify_without_message(event_notifier: EventNotifier) -> None:
    """It should allow callbacks to subscribe to notify(), passing no messages if the callback does not support them."""

    async def mock_callback() -> None:
        await asyncio.sleep(0)

    mock_callback = MagicMock(wraps=mock_callback)
    unsubscribe = event_notifier.subscribe(mock_callback)

    assert mock_callback.call_count == 0

    event_notifier.notify("TEST_MESSAGE")
    await asyncio.sleep(0)

    assert mock_callback.call_count == 1

    unsubscribe()


@pytest.mark.asyncio
async def test_notify_full_queue(event_notifier: EventNotifier) -> None:
    """It should not add more messages to the notify queue if the queue is full."""

    async def mock_callback() -> None:
        await asyncio.sleep(0)

    unsubscribe = event_notifier.subscribe(mock_callback)

    for _ in range(15):
        event_notifier.notify(message="TEST_MESSAGE")

    assert event_notifier._queue.qsize() == 10

    unsubscribe()


@pytest.mark.asyncio
async def test_notify_unsubscribe(event_notifier: EventNotifier) -> None:
    """It should unsubscribe a callback from the notifier."""

    async def mock_callback() -> None:
        await asyncio.sleep(0)

    unsubscribe = event_notifier.subscribe(mock_callback)

    unsubscribe()

    assert mock_callback not in event_notifier._callbacks
