"""Simple state change notification interface."""
import asyncio

from opentrons.util.broker import Broker, ReadOnlyBroker


class ChangeNotifier:
    """An interface tto emit or subscribe to state change notifications."""

    def __init__(self) -> None:
        """Initialize the ChangeNotifier with an internal Event."""
        self._event = asyncio.Event()
        self._broker = Broker[None]()

    def notify(self) -> None:
        """Notify all `wait`'ers that the state has changed."""
        self._event.set()
        self._broker.publish(None)

    async def wait(self) -> None:
        """Wait until the next state change notification."""
        self._event.clear()
        await self._event.wait()

    @property
    def broker(self) -> ReadOnlyBroker[None]:
        """Return a broker that you can use to get notified of all changes.

        This is an alternative interface to `wait()`.
        """
        return self._broker
