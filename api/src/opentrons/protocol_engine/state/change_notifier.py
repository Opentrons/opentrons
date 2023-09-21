"""Simple state change notification interface."""
import asyncio
from contextlib import contextmanager
from typing import Callable, Generator

from opentrons.util.broker import Broker


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

    @contextmanager
    def on_change(self, callback: Callable[[], None]) -> Generator[None, None, None]:
        def wrapped_callback(_: None) -> None:
            # TODO: Exception safety?
            # TODO: Is this a good approach or is there a way to use async generators?
            # What does Seth's subsystem thing do?
            # Maybe add a CM to EquipmentBroker?
            # Maybe give EquipmentBroker a read-only interface?
            callback()

        unsubscribe = self._broker.subscribe(wrapped_callback)
        try:
            yield
        finally:
            unsubscribe()
