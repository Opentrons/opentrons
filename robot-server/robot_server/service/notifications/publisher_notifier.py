import asyncio
from fastapi import Depends
from typing import Optional, Callable, List

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .change_notifier import ChangeNotifier


class PublisherNotifier:
    def __init__(
        self,
        change_notifier: Optional[ChangeNotifier] = None,
    ):
        self._change_notifier = change_notifier or ChangeNotifier()
        self._pe_notifier: Optional[asyncio.Task[None]] = None
        self._callbacks: Optional[List[Callable]] = None

    async def initialize(self):
        self._pe_notifier = asyncio.create_task(self._wait_for_pe_event())

    def protocol_engine_callback_rename_this(self) -> None:
        """Rename this"""
        self._change_notifier.notify()

    def register_publish_callbacks(self, callbacks: List[Callable]) -> None:
        self._callbacks.extend(callbacks)

    async def _wait_for_pe_event(self):
        while True:
            await self._change_notifier.wait()
            for callback in self._callbacks:
                await callback()


_publisher_notifier_accessor: AppStateAccessor[PublisherNotifier] = AppStateAccessor[
    PublisherNotifier
]("publisher_notifier")


async def initialize_publisher_notifier(app_state: AppState) -> None:
    """Create a new `NotificationClient` and store it on `app_state`.

    Intended to be called just once, when the server starts up.
    """
    publisher_notifier: PublisherNotifier = PublisherNotifier()
    _publisher_notifier_accessor.set_on(app_state, publisher_notifier)

    await publisher_notifier.initialize()


def get_notify_publishers(
    app_state: AppState = Depends(get_app_state),
) -> Callable:
    publisher_notifier = _publisher_notifier_accessor.get_from(app_state)
    return publisher_notifier.protocol_engine_callback_rename_this


# TOME: Left to do. 1) Verify this works conceptually for the runs_publisher route. 2) Add testing.
