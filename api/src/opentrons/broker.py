from __future__ import annotations
import logging
from typing import Callable, Dict, List
from typing_extensions import Literal

from opentrons.commands import types


MODULE_LOG = logging.getLogger(__name__)


class Broker:
    def __init__(self) -> None:
        self.subscriptions: Dict[
            Literal["command"],
            List[Callable[[types.CommandMessage], None]],
        ] = {}
        self.logger = MODULE_LOG

    def subscribe(
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

    def publish(self, topic: Literal["command"], message: types.CommandMessage) -> None:
        [handler(message) for handler in self.subscriptions.get(topic, [])]

    def set_logger(self, logger: logging.Logger) -> None:
        self.logger = logger
