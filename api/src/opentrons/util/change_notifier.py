"""Simple state change notification interface."""
import asyncio


class ChangeNotifier:
    """An interface to emit or subscribe to state change notifications."""

    def __init__(self) -> None:
        """Initialize the ChangeNotifier with an internal Event."""
        self._event = asyncio.Event()

    def notify(self) -> None:
        """Notify all `wait`'ers that the state has changed."""
        self._event.set()

    async def wait(self) -> None:
        """Wait until the next state change notification."""
        await self._event.wait()
        self._event.clear()


class ChangeNotifier_ts(ChangeNotifier):
    """ChangeNotifier initialized with Event_ts."""

    def __init__(self) -> None:
        """Initialize the ChangeNotifier_Ts with an internal Event_ts."""
        super().__init__()
        self._event = Event_ts()


class Event_ts(asyncio.Event):
    """asyncio.Event with threadsafe methods."""

    def __init__(self) -> None:
        """Initialize Event_ts with the active event_loop or event_loop_policy if not active."""
        super().__init__()
        if self._loop is None:
            self._loop: asyncio.AbstractEventLoop = asyncio.get_event_loop()

    def set(self) -> None:
        """Primarily intended for calling from a thread not responsible for the event loop.

        Calling set() from the event loop thread will actually delay the execution of the set() until the
        calling method either yields, awaits, or exits altogether. This is usually fine but might occasionally cause
        unexpected behavior.
        """
        self._loop.call_soon_threadsafe(super().set)
