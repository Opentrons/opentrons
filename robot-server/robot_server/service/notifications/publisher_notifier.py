import asyncio
from fastapi import Depends
from typing import Optional, Callable

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .change_notifier import ChangeNotifier

import logging

log: logging.Logger = logging.getLogger(__name__)


class PublisherNotifier:
    def __init__(
        self,
        change_notifier: Optional[ChangeNotifier] = None,
    ):
        self._change_notifier = change_notifier or ChangeNotifier()
        self._pe_notifier: Optional[asyncio.Task[None]] = None

    def protocol_engine_callback_rename_this(self) -> None:
        """Rename this"""
        self._change_notifier.notify()

    async def initialize(self):
        self._pe_notifier = asyncio.create_task(self._wait_for_pe_event())

    async def _wait_for_pe_event(self):
        while True:
            log.info("4HITTING PE EVENT")
            await self._change_notifier.wait()
            # TOME: I think the list of callbacks goes here.
            self._check_current_command_change()


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


# TOME: It might be possible to be more specific on the type here. I'd also change the naming to be more specific to PE at this layer of the stack.
# I think a better name might be "notify notification_client". Still, naming needs to be more PE focused here.
def get_notify_robot_server(
    app_state: AppState = Depends(get_app_state),
) -> Callable:
    """Return the singleton notification_client's protocol_engine_callback method."""
    publisher_notifier: Optional[
        PublisherNotifier
    ] = _publisher_notifier_accessor.get_from(app_state)
    return publisher_notifier.protocol_engine_callback_rename_this
