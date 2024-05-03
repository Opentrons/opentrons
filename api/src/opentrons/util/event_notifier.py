"""Simple state change notification interface."""
import asyncio


class Event_Threadsafe(asyncio.Event):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self._loop is None:
            self._loop = asyncio.get_event_loop()

    def set(self):
        self._loop.call_soon_threadsafe(super().set)


class EventNotifier:
    """An interface to emit or subscribe to state change notifications."""

    def __init__(self) -> None:
        """Initialize the ChangeNotifier with an internal Event."""
        self._event = Event_Threadsafe()

    def notify(self) -> None:
        """Notify all `waiters` of a change."""
        self._event.set()

    async def wait(self) -> None:
        """Wait until the next change notification."""
        self._event.clear()
        await self._event.wait()
