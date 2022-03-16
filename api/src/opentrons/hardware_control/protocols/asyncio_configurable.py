from asyncio import AbstractEventLoop
from typing_extensions import Protocol


class AsyncioConfigurable(Protocol):
    """Protocol specifying controllability of asyncio behavior"""

    @property
    def loop(self) -> AbstractEventLoop:
        """The event loop used by this instance."""
        ...
