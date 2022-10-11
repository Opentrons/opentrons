import asyncio
import logging
from abc import ABC, abstractmethod
from typing import List


log = logging.getLogger(__name__)


class Reader(ABC):
    @abstractmethod
    async def read(self) -> None:
        """Read some data from an external source."""

    def on_error(self, exception: Exception) -> None:
        """Handle an error from calling `read`."""


class Poller:
    """A poller to call a given reader on an interval.

    Args:
        reader: An interface to read data.
        interval: The poll interval, in seconds.
    """

    interval: float

    def __init__(self, reader: Reader, interval: float) -> None:
        self.interval = interval
        self._reader = reader
        self._poll_waiters: List["asyncio.Future[None]"] = []
        self._poll_forever_task = asyncio.create_task(self._poll_forever())

    async def stop(self) -> None:
        """Stop polling."""
        self._poll_forever_task.cancel()
        await asyncio.gather(self._poll_forever_task, return_exceptions=True)

    async def wait_next_poll(self) -> None:
        """Wait for the next poll to complete.

        If called in the middle of a read, it will not return until
        the next complete read. If a read raises an exception,
        it will be passed through to `wait_next_poll`.
        """
        poll_future = asyncio.get_running_loop().create_future()
        self._poll_waiters.append(poll_future)
        await poll_future

    async def _poll_forever(self) -> None:
        """Polling loop."""
        while True:
            await self._poll_once()
            await asyncio.sleep(self.interval)

    async def _poll_once(self) -> None:
        """Trigger a single read, notifying listeners of success or error."""
        previous_waiters = self._poll_waiters
        self._poll_waiters = []

        try:
            await self._reader.read()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            log.exception("Polling exception")
            self._reader.on_error(e)
            for waiter in previous_waiters:
                waiter.set_exception(e)
        else:
            for waiter in previous_waiters:
                waiter.set_result(None)
