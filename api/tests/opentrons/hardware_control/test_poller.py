from mock import AsyncMock, MagicMock
from opentrons.hardware_control.poller import (
    Poller, Listener, Reader
)


async def test_poll_error() -> None:
    """It should call error callback on error."""
    exc = AssertionError()

    async def raiser():
        raise exc

    reader = AsyncMock(spec=Reader)
    reader.read.side_effect = raiser
    listener = MagicMock(spec=Listener)

    p: Poller[int] = Poller(interval_seconds=.01, reader=reader, listener=listener)
    await p.stop_and_wait()

    listener.on_error.assert_called_once_with(exc)
    listener.on_terminated.assert_called_once()


async def test_notify() -> None:
    """It should call on_poll with new result."""
    reader = AsyncMock(spec=Reader)
    reader.read.return_value = 23
    listener = MagicMock(spec=Listener)

    p: Poller[int] = Poller(interval_seconds=.01, reader=reader, listener=listener)
    await p.stop_and_wait()

    listener.on_poll.assert_called_once_with(23)
    listener.on_terminated.assert_called_once()
