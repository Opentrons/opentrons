import asyncio
from abc import abstractmethod, ABC
from collections import deque
from typing import TypeVar, Generic, Deque, Optional
import logging

DataT = TypeVar("DataT")
log = logging.getLogger(__name__)


class Reader(ABC, Generic[DataT]):
    """Interface of poller target."""

    @abstractmethod
    async def read(self) -> DataT:
        """
        Read a new poll sample.

        Returns: The next poll result.
        """
        ...


class Listener(ABC, Generic[DataT]):
    """Interface of poller listener"""

    @abstractmethod
    def on_poll(self, result: DataT) -> None:
        """
        Called by poller notifying result of new poll.

        Args:
            result: The latest poll result.

        Returns: None
        """
        ...

    @abstractmethod
    def on_error(self, exception: Exception) -> None:
        """
        Called by poller to notify of a poll error.

        Args:
            exception: The raised exception

        Returns: None
        """
        ...

    @abstractmethod
    def on_terminated(self) -> None:
        """
        Called by poller when it is terminating.

        Returns: None
        """
        ...


class WaitableListener(Listener[DataT]):
    """A listener that can be waited on."""

    def __init__(self, loop: Optional[asyncio.AbstractEventLoop] = None) -> None:
        """Constructor."""
        self._loop = loop or asyncio.get_running_loop()
        self._futures: Deque["asyncio.Future[DataT]"] = deque()

    async def wait_next_poll(self) -> DataT:
        """
        Wait for the next poll.

        Returns: The next poll result.
        """
        f: "asyncio.Future[DataT]" = self._loop.create_future()
        self._futures.append(f)
        return await f

    def on_poll(self, result: DataT) -> None:
        """Handle a new poll"""
        self._notify(result)

    def on_error(self, exc: Exception) -> None:
        """Handle a poller error."""
        self._cancel(exc)

    def on_terminated(self) -> None:
        """Handle the poller finishing up."""
        self._cancel(Exception("Poller has terminated."))

    def _notify(self, val: DataT) -> None:
        """Notify all futures of a new poll result."""
        while self._futures:
            f = self._futures.popleft()
            if not f.done():
                f.set_result(val)

    def _cancel(self, exc: Exception) -> None:
        """Notify all futures of an error."""
        while self._futures:
            f = self._futures.popleft()
            if not f.done():
                f.set_exception(exc)


class Poller(Generic[DataT]):
    """Asyncio poller."""

    def __init__(
        self,
        interval_seconds: float,
        reader: Reader[DataT],
        listener: Listener[DataT],
    ) -> None:
        """
        Constructor.

        Args:
            interval_seconds: time in between polls.
            reader: The data reader.
            listener: event listener.
        """
        self._shutdown_event = asyncio.Event()
        self._interval = interval_seconds
        self._listener = listener
        self._reader = reader
        self._task = asyncio.create_task(self._poller())

    def stop(self) -> None:
        """Signal poller to stop."""
        self._shutdown_event.set()

    async def stop_and_wait(self) -> None:
        """Stop poller and wait for it to terminate."""
        self.stop()
        await self._task

    async def _poller(self) -> None:
        """Poll task entrypoint."""
        while True:
            try:
                poll = await self._reader.read()
                self._listener.on_poll(poll)
            except Exception as e:
                log.exception("Polling exception")
                self._listener.on_error(e)

            try:
                await asyncio.wait_for(self._shutdown_event.wait(), self._interval)
            except asyncio.TimeoutError:
                pass
            else:
                break

        self._listener.on_terminated()
