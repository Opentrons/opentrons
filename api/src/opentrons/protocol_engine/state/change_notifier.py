"""Simple state change notification interface."""
import asyncio


class ChangeNotifier:
    """An interface tto emit or subscribe to state change notifications."""

    def __init__(self) -> None:
        """Initialize the ChangeNotifier with an internal Event."""
        self._event = asyncio.Event()

    def notify(self) -> None:
        """Notify all `wait`'ers that the state has changed."""
        self._event.set()

    async def wait(self) -> None:
        """Wait until the next state change notification."""
        self._event.clear()
        await self._event.wait()
