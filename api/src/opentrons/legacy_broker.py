# noqa: D100

from __future__ import annotations
import logging
from typing import Callable, Dict, List
from typing_extensions import Literal

from opentrons.legacy_commands import types


MODULE_LOG = logging.getLogger(__name__)


class LegacyBroker:
    """A pub/sub message broker.

    Deprecated:
        Use the newer, more generic `opentrons.utils.Broker` class instead.
        This class is coupled to old types from `opentrons.legacy_commands`.
        https://opentrons.atlassian.net/browse/RSS-270
    """

    def __init__(self) -> None:
        self.subscriptions: Dict[
            Literal["command"],
            List[Callable[[types.CommandMessage], None]],
        ] = {}
        self.logger = MODULE_LOG

    def subscribe(  # noqa: D102
        self,
        topic: Literal["command"],
        handler: Callable[[types.CommandMessage], None],
    ) -> Callable[[], None]:
        def unsubscribe() -> None:
            try:
                self.subscriptions[topic].remove(handler)
            except ValueError:
                # handler already removed from list
                pass

        if handler not in self.subscriptions.setdefault(topic, []):
            self.subscriptions[topic].append(handler)

        return unsubscribe

    def publish(  # noqa: D102
        self, topic: Literal["command"], message: types.CommandMessage
    ) -> None:
        [handler(message) for handler in self.subscriptions.get(topic, [])]

    def set_logger(self, logger: logging.Logger) -> None:  # noqa: D102
        self.logger = logger
