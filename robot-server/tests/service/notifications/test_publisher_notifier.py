import asyncio
from unittest.mock import Mock, MagicMock

from robot_server.service.notifications import (
    PublisherNotifier,
    ChangeNotifier,
)


async def test_initialize() -> None:
    """It should create a new task."""
    publisher_notifier = PublisherNotifier()

    await publisher_notifier._initialize()

    assert asyncio.get_running_loop()


def test_notify_publishers() -> None:
    """Invoke the change notifier's notify method."""
    change_notifier = MagicMock()
    publisher_notifier = PublisherNotifier(change_notifier)

    publisher_notifier._notify_publishers()

    change_notifier.notify.assert_called_once()


def test_register_publish_callbacks() -> None:
    """It should extend the list of callbacks within a given list of callbacks."""
    publisher_notifier = PublisherNotifier()
    callback1 = Mock()
    callback2 = Mock()

    publisher_notifier.register_publish_callbacks([callback1, callback2])

    assert len(publisher_notifier._callbacks) == 2
    assert publisher_notifier._callbacks[0] == callback1
    assert publisher_notifier._callbacks[1] == callback2


async def test_wait_for_event() -> None:
    """It should wait for an event to occur, then invoke each callback."""
    change_notifier = ChangeNotifier()
    publisher_notifier = PublisherNotifier(change_notifier)

    callback_called = False
    callback_2_called = False

    async def callback() -> None:
        """Mock callback."""
        nonlocal callback_called
        callback_called = True

    async def callback_2() -> None:
        """Mock callback."""
        nonlocal callback_2_called
        callback_2_called = True

    publisher_notifier.register_publish_callbacks([callback, callback_2])

    async def trigger_callbacks() -> None:
        """Mock trigger for callbacks."""
        await asyncio.sleep(0.1)
        change_notifier.notify()

    task = asyncio.create_task(publisher_notifier._initialize())

    await asyncio.gather(trigger_callbacks(), task)

    assert callback_called
    assert callback_2_called

    task.cancel()
