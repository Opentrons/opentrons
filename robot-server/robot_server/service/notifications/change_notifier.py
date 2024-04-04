"""Simple state change notification interface."""
import asyncio
from typing import AsyncIterable


class ChangeNotifier:
    """An interface to emit or subscribe to state change notifications."""

    def __init__(self, max_queue_size: int):
        self._queue = asyncio.Queue(maxsize=max_queue_size)

    def notify(self) -> None:
        """Notify all `waiters` of a change."""
        try:
            self._queue.put_nowait(None)
        except asyncio.QueueFull:
            pass

    async def wait(self) -> AsyncIterable[None]:
        """Wait until the next change notification."""
        while True:
            try:
                yield await self._queue.get()
            except asyncio.CancelledError:
                raise StopAsyncIteration
