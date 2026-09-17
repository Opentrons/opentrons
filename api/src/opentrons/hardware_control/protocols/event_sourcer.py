from typing import Awaitable, Callable

from typing_extensions import Protocol

from ..types import HardwareEventHandler


class EventSourcer(Protocol):
    """Protocol specifying how to react to events."""

    def register_callback(self, cb: HardwareEventHandler) -> Callable[[], None]:
        """Register a callback that will be called when an event occurs.

        The events may be asynchronous, from various things that can happen
        to the hardware (for instance, the door opening or closing).

        The returned callable removes the callback.
        """
        ...

    async def register_callback_async(
        self, cb: HardwareEventHandler
    ) -> Callable[[], Awaitable[None]]:
        """As register_callback, but async to be more friendly to remote invocation."""
        ...
