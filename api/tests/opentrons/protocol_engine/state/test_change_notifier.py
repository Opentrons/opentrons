"""Tests for the ChangeNotifier interface."""
import asyncio
import pytest
from opentrons.protocol_engine.state.change_notifier import ChangeNotifier


async def test_single_subscriber() -> None:
    """Test that a single subscriber can wait for a notification."""
    subject = ChangeNotifier()
    result = asyncio.create_task(subject.wait())

    # ensure that the wait actually waits by delaying and
    # checking that the task has not resolved
    await asyncio.sleep(0.1)
    assert result.done() is False

    asyncio.get_running_loop().call_soon(subject.notify)

    await result


@pytest.mark.parametrize("count", range(10))
async def test_multiple_subscribers(count: int) -> None:
    """Test that multiple subscribers can wait for a notification.

    This test checks that the subscribers are awoken in the order they
    subscribed. This may or may not be guarenteed according to the
    implementations of both ChangeNotifier and the event loop.
    This test functions as a canary, given that our code may relies
    on this ordering for determinism.

    This test runs multiple times to check for flakyness.
    """
    subject = ChangeNotifier()

    result_1 = asyncio.create_task(subject.wait())
    result_2 = asyncio.create_task(subject.wait())
    result_3 = asyncio.create_task(subject.wait())

    asyncio.get_running_loop().call_soon(subject.notify)

    await result_1
    await result_2
    await result_3
