from __future__ import annotations
import asyncio
from asyncio import Queue
from contextlib import contextmanager
import logging
from typing import (
    Any, Callable, Dict, Sequence, overload, Generic, TypeVar,
    cast, TYPE_CHECKING)
from typing_extensions import Literal

from opentrons.commands import types

if TYPE_CHECKING:
    from opentrons.api.dev_types import Message as SessionStateMessage
    from opentrons.api.calibration import Message as CalibrationStateMessage


MODULE_LOG = logging.getLogger(__name__)


UntypedMessage = Dict[str, Any]


_HandledMessages = TypeVar('_HandledMessages')


class Notifications(Generic[_HandledMessages]):
    def __init__(self, topics: Sequence[str], broker: Broker, loop=None):
        self.loop = loop or asyncio.get_event_loop()
        self.queue: Queue[UntypedMessage] = Queue(loop=self.loop)
        self.snoozed = False
        self._unsubscribe = [
            broker.subscribe(topic, self.on_notify) for topic in topics]

    @contextmanager
    def snooze(self):
        self.snoozed = True
        try:
            yield
        finally:
            self.snoozed = False

    def on_notify(self, message: UntypedMessage):
        if self.snoozed:
            return
        self.queue.put_nowait(message)

    async def __anext__(self) -> _HandledMessages:
        msg = await self.queue.get()
        return cast(_HandledMessages, msg)

    def __aiter__(self):
        return self


class Broker:
    def __init__(self):
        self.subscriptions = {}
        self.logger = MODULE_LOG

    @overload
    def subscribe(
            self,
            topic: Literal['command'],
            handler: Callable[[types.CommandMessage], None]) -> Callable[[], None]: ...

    @overload
    def subscribe(
            self,
            topic: Literal['calibration'],
            handler: Callable[[CalibrationStateMessage], None])\
        -> Callable[[], None]: ...

    @overload
    def subscribe(
            self,
            topic: Literal['session'],
            handler: Callable[[SessionStateMessage], None]) -> Callable[[], None]: ...

    @overload
    def subscribe(
            self,
            topic: str,
            handler: Callable[[UntypedMessage], None]) -> Callable[[], None]: ...

    def subscribe(self, topic, handler):
        if handler in self.subscriptions.setdefault(topic, []):
            return
        self.subscriptions[topic].append(handler)

        def unsubscribe():
            self.subscriptions[topic].remove(handler)

        return unsubscribe

    @overload
    def publish(
            self, topic: Literal['command'], message: types.CommandMessage) -> None: ...

    @overload
    def publish(
            self,
            topic: Literal['calibration'],
            message: CalibrationStateMessage) -> None: ...

    @overload
    def publish(
            self, topic: Literal['session'], message: SessionStateMessage) -> None: ...

    @overload
    def publish(self, topic: str, message: UntypedMessage) -> None: ...

    def publish(self, topic, message):
        [handler(message) for handler in self.subscriptions.get(topic, [])]

    def set_logger(self, logger):
        self.logger = logger
