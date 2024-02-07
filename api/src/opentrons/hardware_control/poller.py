import asyncio
import contextlib
import logging
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Optional
from opentrons_shared_data.errors.exceptions import ModuleCommunicationError


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
        self._read_lock: Optional["asyncio.Lock"] = None
        self._poll_waiters: List["asyncio.Future[None]"] = []
        self._poll_forever_task: Optional["asyncio.Task[None]"] = None

    async def start(self) -> None:
        assert self._poll_forever_task is None, "Poller already started"
        self._poll_forever_task = asyncio.create_task(self._poll_forever())
        await self.wait_next_poll()

    async def stop(self) -> None:
        """Stop polling."""
        task = self._poll_forever_task

        assert task is not None, "Poller never started"

        async with self._use_read_lock():
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
        for waiter in self._poll_waiters:
            waiter.cancel(msg="Module was removed")

    async def wait_next_poll(self) -> None:
        """Wait for the next poll to complete.

        If called in the middle of a read, it will not return until
        the next complete read. If a read raises an exception,
        it will be passed through to `wait_next_poll`.
        """
        if not self._poll_forever_task or self._poll_forever_task.done():
            raise ModuleCommunicationError(message="Module was removed")

        poll_future = asyncio.get_running_loop().create_future()
        self._poll_waiters.append(poll_future)
        await poll_future

    @contextlib.asynccontextmanager
    async def _use_read_lock(self) -> AsyncGenerator[None, None]:
        self._read_lock = self._read_lock or asyncio.Lock()

        async with self._read_lock:
            yield

    async def _poll_forever(self) -> None:
        """Polling loop."""
        while True:
            await self._poll_once()
            await asyncio.sleep(self.interval)

    @staticmethod
    def _set_waiter_complete(
        waiter: "asyncio.Future[None]", e: Optional[Exception] = None
    ) -> None:
        try:
            waiter.set_result(None) if e is None else waiter.set_exception(e)
        except asyncio.InvalidStateError:
            log.warning("Poller waiter was already cancelled")

    async def _poll_once(self) -> None:
        """Trigger a single read, notifying listeners of success or error."""
        previous_waiters = self._poll_waiters
        self._poll_waiters = []

        try:
            async with self._use_read_lock():
                await self._reader.read()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            log.exception("Polling exception")
            self._reader.on_error(e)
            for waiter in previous_waiters:
                Poller._set_waiter_complete(waiter, e)
        else:
            for waiter in previous_waiters:
                Poller._set_waiter_complete(waiter)
