"""An async state change notification interface."""
import asyncio
from abc import ABC, abstractmethod
from contextlib import contextmanager
from typing import (
    AsyncIterable,
    List,
    Callable,
    Awaitable,
    Optional,
    Generator,
    TypeVar,
    Union,
    Generic,
)

_MessageT = TypeVar("_MessageT")
_CallbackT = Union[
    Callable[[_MessageT], Awaitable[None]], Callable[[], Awaitable[None]]
]


class ReadOnlyEventNotifier(ABC, Generic[_MessageT]):
    """The read-only subset of `EventNotifier`.

    Only allow registering callbacks for an instantiated `EventNotifier`.
    """

    @abstractmethod
    @contextmanager
    def subscribed(
        self, callback: _CallbackT[_MessageT]
    ) -> Generator[None, None, None]:
        """See `Broker.subscribed()`."""
        pass

    @abstractmethod
    def subscribe(self, callback: _CallbackT[_MessageT]) -> Callable[[], None]:
        """See `Broker.subscribe()`."""
        pass

    @abstractmethod
    def subscribe_many(
        self, callbacks: List[_CallbackT[_MessageT]]
    ) -> Callable[[], None]:
        """See `Broker.subscribe_many()`."""
        pass


class EventNotifier(Generic[_MessageT], ReadOnlyEventNotifier[_MessageT]):
    """Asynchronously manages a queue of events and notifying subscribed callbacks when a change occurs.

    It is safe to use an `EventNotifier` for communication between two threads if:
     Thread #1 acts as the sole notifier via notify().
     Thread #2 acts as the sole callback registrar via subscribe() or subscribe_many().
    """

    def __init__(self, max_queue_size: int) -> None:
        self._task: Optional[asyncio.Task[None]] = None
        self._queue: asyncio.Queue[Optional[_MessageT]] = asyncio.Queue(
            maxsize=max_queue_size
        )
        self._callbacks: List[_CallbackT[_MessageT]] = []

        self._initialize()

    def notify_lossy(self, message: Optional[_MessageT] = None) -> None:
        """Notify all `subscribers` of a change.

        Silently drop the message if the notify queue is full.
        """
        if self._task is None:
            raise NotInitializedError()

        try:
            self._queue.put_nowait(message)
        except asyncio.QueueFull:
            pass

    async def notify_reliable(self, message: Optional[_MessageT] = None) -> None:
        """Notify all `subscribers` of a change.

        Wait to put the message in the notify queue if the queue is full.
        """
        if self._task is None:
            raise NotInitializedError()

        await self._queue.put(message)

    @contextmanager
    def subscribed(
        self, callback: _CallbackT[_MessageT]
    ) -> Generator[None, None, None]:
        """Register a callback to be called on each message.

        The callback is subscribed when this context manager is entered,
        and unsubscribed when it's exited.

        You must not subscribe the same callback again unless you first unsubscribe from it.
        """
        unsubscribe = self.subscribe(callback)
        try:
            yield
        finally:
            unsubscribe()

    def subscribe(self, callback: _CallbackT[_MessageT]) -> Callable[[], None]:
        """Register a callback to be called on each notify().

        Returns:
            A function that you can call to unsubscribe ``callback``.
            Raises a ValueError if the callback is not present.
        """
        if self._task is None:
            raise NotInitializedError()

        self._callbacks.append(callback)

        def unsubscribe() -> None:
            self._callbacks.remove(callback)

        return unsubscribe

    def subscribe_many(
        self,
        callbacks: List[_CallbackT[_MessageT]],
    ) -> Callable[[], None]:
        """Register a list of callbacks to be called on each notify().

        Returns:
            A function that you can call to unsubscribe all ``callbacks``.
            Raises a ValueError if any of the callbacks are not present.
        """
        if self._task is None:
            raise NotInitializedError()

        self._callbacks.extend(callbacks)

        def unsubscribe() -> None:
            for callback in callbacks:
                self._callbacks.remove(callback)

        return unsubscribe

    def _initialize(self) -> None:
        """Creates an asyncio task that indefinitely waits for an event to be notified.

        The task will continue running until it is explicitly cancelled or the program exits.
        """
        self._task = asyncio.create_task(self._wait_for_event())

    async def _wait(self) -> AsyncIterable[Optional[_MessageT]]:
        """Wait until the next change notification."""
        while True:
            try:
                yield await self._queue.get()
            except asyncio.CancelledError:
                raise StopAsyncIteration

    async def _wait_for_event(self) -> None:
        """Indefinitely wait for an event to occur, then invoke each callback."""
        async for message in self._wait():
            for callback in self._callbacks:
                try:
                    await callback(message)  # type: ignore
                except TypeError:
                    await callback()  # type: ignore


class NotInitializedError(Exception):
    """Raised when EventNotifier has not been initialized."""

    def __init__(self) -> None:
        super().__init__("EventNotifier must be initialized before use.")
