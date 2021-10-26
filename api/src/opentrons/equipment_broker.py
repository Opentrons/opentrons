"""A simple pub/sub message broker for monitoring equipment loads."""


from typing import Callable, Generic, Set, TypeVar


_MessageT = TypeVar("_MessageT")


class EquipmentBroker(Generic[_MessageT]):
    """A simple pub/sub message broker.

    This is currently meant for monitoring equipment loads
    (pipette, labware, and module loads)
    on an APIv2 `ProtocolContext`.

    This duplicates much of `opentrons.broker.Broker`,
    which covers most other APIv2 events, like aspirates and moves,
    but doesn't cover equipment loads.
    To cover equipment loads, we felt more comfortable
    duplicating `opentrons.broker.Broker`'s responsibilities here
    than attempting to extend it without breaking anything.
    """

    def __init__(self) -> None:  # noqa: D107
        self._callbacks: Set[Callable[[_MessageT], None]] = set()

    def subscribe(self, callback: Callable[[_MessageT], None]) -> Callable[[], None]:
        """Register ``callback`` to be called by a subsequent `publish`.

        You must not subscribe the same callback again
        unless you first unsubscribe it.

        Returns:
            A function that you can call to unsubscribe ``callback``.
            You must not call it more than once.
        """

        def unsubscribe() -> None:
            self._callbacks.remove(callback)

        self._callbacks.add(callback)
        return unsubscribe

    def publish(self, message: _MessageT) -> None:
        """Call every subscribed callback, with ``message`` as the argument.

        The order in which the callbacks are called is undefined.

        If any callback raises an exception, it's propagated,
        and any remaining callbacks will be left uncalled.
        """
        # Callback order is undefined because
        # Python sets don't preserve insertion order.
        for callback in self._callbacks:
            callback(message)
