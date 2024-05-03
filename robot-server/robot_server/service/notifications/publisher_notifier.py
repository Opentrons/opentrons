"""Provides an interface for alerting notification publishers to events and related lifecycle utilities."""
from fastapi import Depends
from typing import Optional, Callable, List, Awaitable

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from opentrons.util.event_notifier import EventNotifier


class PublisherNotifier:
    """An interface that invokes notification callbacks whenever a generic notify event occurs."""

    def __init__(
        self,
        event_notifier: Optional[EventNotifier] = None,
    ):
        # Because ChangeNotifier is a generic event interface, all callbacks themselves perform a specific
        # conditional check. A max_queue_size=1 ensures that all callbacks perform their conditional check without
        # being "over"-invoked.
        self._event_notifier = event_notifier or EventNotifier()

    def register_publish_callback(self, callback: Callable[[], Awaitable[None]]):
        """Register a single callback."""
        self._event_notifier.subscribe(callback)

    def register_publish_callbacks(
        self, callbacks: List[Callable[[], Awaitable[None]]]
    ):
        """Register a list of callbacks."""
        self._event_notifier.subscribe_many(callbacks)

    def _notify_publishers(self) -> None:
        """A generic notifier, alerting all `waiters` of a change."""
        self._event_notifier.notify()


_pe_publisher_notifier_accessor: AppStateAccessor[PublisherNotifier] = AppStateAccessor[
    PublisherNotifier
]("publisher_notifier")

_hardware_publisher_notifier_accessor: AppStateAccessor[
    PublisherNotifier
] = AppStateAccessor[PublisherNotifier]("publisher_notifier")


def get_pe_notify_publishers(
    app_state: AppState = Depends(get_app_state),
) -> Callable[[], None]:
    """Provides access to the callback used to notify publishers of changes. Intended for protocol engine."""
    publisher_notifier = _pe_publisher_notifier_accessor.get_from(app_state)
    assert isinstance(publisher_notifier, PublisherNotifier)

    return publisher_notifier._notify_publishers


def get_hardware_notify_publishers(
    app_state: AppState = Depends(get_app_state),
) -> Callable[[], None]:
    """Provides access to the callback used to notify publishers of changes. Intended for hardware."""
    publisher_notifier = _hardware_publisher_notifier_accessor.get_from(app_state)
    assert isinstance(publisher_notifier, PublisherNotifier)

    return publisher_notifier._notify_publishers


def get_pe_publisher_notifier(
    app_state: AppState = Depends(get_app_state),
) -> PublisherNotifier:
    """Intended for use by various publishers only. Intended for protocol engine."""
    publisher_notifier = _pe_publisher_notifier_accessor.get_from(app_state)
    assert publisher_notifier is not None

    return publisher_notifier


def get_hardware_publisher_notifier(
    app_state: AppState = Depends(get_app_state),
) -> PublisherNotifier:
    """Intended for use by various publishers only. Intended for hardware."""
    publisher_notifier = _hardware_publisher_notifier_accessor.get_from(app_state)
    assert publisher_notifier is not None

    return publisher_notifier


def initialize_pe_publisher_notifier(app_state: AppState) -> None:
    """Create a new `NotificationClient` and store it on `app_state` intended for protocol engine.

    Intended to be called just once, when the server starts up.
    """
    publisher_notifier: PublisherNotifier = PublisherNotifier()
    _pe_publisher_notifier_accessor.set_on(app_state, publisher_notifier)


def initialize_hardware_publisher_notifier(app_state: AppState) -> None:
    """Create a new `NotificationClient` and store it on `app_state` intended for hardware.

    Intended to be called just once, when the server starts up.
    """
    publisher_notifier: PublisherNotifier = PublisherNotifier()
    _hardware_publisher_notifier_accessor.set_on(app_state, publisher_notifier)
