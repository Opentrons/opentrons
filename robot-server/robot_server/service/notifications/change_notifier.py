"""Simple state change notification interface."""
import asyncio


class ChangeNotifier:
    """An interface to emit or subscribe to state change notifications."""

    def __init__(self) -> None:
        """Initialize the ChangeNotifier with an internal Event."""
        self._event = asyncio.Event()

    def notify(self) -> None:
        """Notify all `waiters` of a change."""
        self._event.set()

    async def wait(self) -> None:
        """Wait until the next change notification."""
        self._event.clear()
        await self._event.wait()

    def clear(self) -> None:
        """Reset the internal event flag."""
        self._event.clear()
