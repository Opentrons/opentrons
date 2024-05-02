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


@pytest.mark.parametrize("_test_repetition", range(10))
async def test_multiple_subscribers(_test_repetition: int) -> None:
    """Test that multiple subscribers can wait for a notification.

    This test checks that the subscribers are awoken in the order they
    subscribed. This may or may not be guarenteed according to the
    implementations of both ChangeNotifier and the event loop.
    This test functions as a canary, given that our code may relies
    on this ordering for determinism.

    This test runs multiple times to check for flakyness.
    """
    subject = ChangeNotifier()
    results = []

    async def _do_task_1() -> None:
        await subject.wait()
        results.append(1)

    async def _do_task_2() -> None:
        await subject.wait()
        results.append(2)

    async def _do_task_3() -> None:
        await subject.wait()
        results.append(3)

    task_1 = asyncio.create_task(_do_task_1())
    task_2 = asyncio.create_task(_do_task_2())
    task_3 = asyncio.create_task(_do_task_3())

    asyncio.get_running_loop().call_soon(subject.notify)
    await asyncio.gather(task_1, task_2, task_3)

    assert results == [1, 2, 3]
