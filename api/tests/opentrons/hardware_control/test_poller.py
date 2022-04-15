import asyncio
from typing import Callable

import pytest
from mock import AsyncMock, MagicMock
from opentrons.hardware_control.poller import Poller, Listener, Reader, WaitableListener


async def test_poll_error() -> None:
    """It should call error callback on error."""
    exc = AssertionError()

    async def raiser() -> None:
        raise exc

    reader = AsyncMock(spec=Reader)
    reader.read.side_effect = raiser
    listener = MagicMock(spec=Listener)

    p: Poller[int] = Poller(interval_seconds=0.01, reader=reader, listener=listener)
    await p.stop_and_wait()

    listener.on_error.assert_called_once_with(exc)
    listener.on_terminated.assert_called_once()


async def test_notify() -> None:
    """It should call on_poll with new result."""
    reader = AsyncMock(spec=Reader)
    reader.read.return_value = 23
    listener = MagicMock(spec=Listener)

    p: Poller[int] = Poller(interval_seconds=0.01, reader=reader, listener=listener)
    await p.stop_and_wait()

    listener.on_poll.assert_called_once_with(23)
    listener.on_terminated.assert_called_once()


async def test_await_poll_error() -> None:
    """It should raise in wait_next_poll if reader raises."""
    exc = AssertionError()

    async def raiser() -> None:
        raise exc

    reader = AsyncMock(spec=Reader)
    reader.read.side_effect = raiser
    listener = WaitableListener[int]()

    p: Poller[int] = Poller(interval_seconds=0.01, reader=reader, listener=listener)
    with pytest.raises(exc.__class__):
        await listener.wait_next_poll()
    await p.stop_and_wait()


@pytest.mark.parametrize(
    argnames=["func"],
    argvalues=[
        [
            # Notifies that a poll is complete
            lambda x: x.on_poll(1)
        ],
        [
            # Notifies that an error occurred
            lambda x: x.on_error(ValueError("Hi!"))
        ],
        [
            # Notifies poller terminated
            lambda x: x.on_terminated()
        ],
    ],
)
async def test_on_poll_canceled_future(
    func: Callable[[WaitableListener[int]], None]
) -> None:
    """It should ignore canceled futures"""
    listener = WaitableListener[int]()
    # Create a task that waits for a poll
    task = asyncio.create_task(listener.wait_next_poll())
    # Let it start
    await asyncio.sleep(0.001)
    # Cancel the task
    task.cancel()
    # Notify.
    func(listener)
    # There should be no exception
