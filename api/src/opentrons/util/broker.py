"""A simple pub/sub message broker."""


from abc import ABC, abstractmethod
from contextlib import contextmanager
from typing import Callable, ContextManager, Generator, Generic, Set, TypeVar


_MessageT = TypeVar("_MessageT")
_CallbackT = Callable[[_MessageT], None]


class ReadOnlyBroker(ABC, Generic[_MessageT]):
    """The read-only subset of `Broker`.

    Useful for typing if you want people to be able to subscribe to your `Broker`,
    but don't want them to be able to publish their own messages to it.
    """

    @abstractmethod
    def subscribed(self, callback: _CallbackT[_MessageT]) -> ContextManager[None]:
        """See `Broker.subscribed()`."""  # noqa: D402
        pass

    @abstractmethod
    def subscribe(self, callback: _CallbackT[_MessageT]) -> Callable[[], None]:
        """See `Broker.subscribe()`."""  # noqa: D402
        pass


class Broker(Generic[_MessageT], ReadOnlyBroker[_MessageT]):
    """A simple pub/sub message broker.

    Subscribers can listen to events. Publishers can push events to all subscribers.
    """

    def __init__(self) -> None:
        self._callbacks: Set[_CallbackT[_MessageT]] = set()

    @contextmanager
    def subscribed(
        self, callback: _CallbackT[_MessageT]
    ) -> Generator[None, None, None]:
        """Register a callback to be called on each message.

        The callback is subscribed when this context manager is entered,
        and unsubscribed when it's exited.

        You must not subscribe the same callback again unless you first usubscribe it.
        """
        unsubscribe = self.subscribe(callback)
        try:
            yield
        finally:
            unsubscribe()

    def subscribe(self, callback: _CallbackT[_MessageT]) -> Callable[[], None]:
        """Register a callback to be called on each message.

        You must not subscribe the same callback again unless you first unsubscribe it.

        Returns:
            A function that you can call to unsubscribe ``callback``.
            You must not call it more than once.
        """

        def unsubscribe() -> None:
            self._callbacks.remove(callback)

        self._callbacks.add(callback)
        return unsubscribe

    def publish(self, message: _MessageT) -> None:
        """Call every subscribed callback, with ``message`` as the argument.

        The order in which the callbacks are called is undefined.

        If any callback raises an exception, it's propagated,
        and any remaining callbacks will be left uncalled.
        """
        # Callback order is undefined because
        # Python sets don't preserve insertion order.
        for callback in self._callbacks:
            callback(message)
