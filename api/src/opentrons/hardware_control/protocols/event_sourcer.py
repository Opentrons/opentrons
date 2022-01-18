from typing import Callable
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
