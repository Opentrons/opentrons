import pytest
from unittest.mock import Mock, MagicMock

from opentrons.util.event_notifier import EventNotifier

from robot_server.service.notifications import PublisherNotifier


@pytest.fixture
async def event_notifier() -> EventNotifier[None]:
    """Mock event notifier."""
    return EventNotifier(max_queue_size=10)


def test_notify_publishers() -> None:
    """Invoke the change notifier's notify method."""
    event_notifier = MagicMock()
    publisher_notifier = PublisherNotifier(event_notifier=event_notifier)

    publisher_notifier._notify_publishers()

    event_notifier.notify_lossy.assert_called_once()


@pytest.mark.asyncio
async def test_register_publish_callback(event_notifier: EventNotifier[None]) -> None:
    """It should append the list of callbacks within a given callback."""
    publisher_notifier = PublisherNotifier(event_notifier=event_notifier)
    callback = Mock()

    publisher_notifier.register_publish_callback(callback)

    assert len(publisher_notifier._event_notifier._callbacks) == 1
    assert publisher_notifier._event_notifier._callbacks[0] == callback


@pytest.mark.asyncio
def test_register_publish_callbacks(event_notifier: EventNotifier[None]) -> None:
    """It should extend the list of callbacks within a given list of callbacks."""
    publisher_notifier = PublisherNotifier(event_notifier=event_notifier)
    callback1 = Mock()
    callback2 = Mock()

    publisher_notifier.register_publish_callbacks([callback1, callback2])

    assert len(publisher_notifier._event_notifier._callbacks) == 2
    assert publisher_notifier._event_notifier._callbacks[0] == callback1
    assert publisher_notifier._event_notifier._callbacks[1] == callback2
