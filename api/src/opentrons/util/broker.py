"""A simple pub/sub message broker."""


from contextlib import contextmanager
from typing import Callable, Generator, Generic, Set, TypeVar


_MessageT = TypeVar("_MessageT")


class Broker(Generic[_MessageT]):
    """A simple pub/sub message broker.

    Subscribers can listen to events. Publishers can push events to all subscribers.
    """

    def __init__(self) -> None:
        self._callbacks: Set[Callable[[_MessageT], None]] = set()

    @contextmanager
    def subscribed(
        self, callback: Callable[[_MessageT], None]
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

    def subscribe(self, callback: Callable[[_MessageT], None]) -> Callable[[], None]:
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
