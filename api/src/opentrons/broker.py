import asyncio
import logging

from asyncio import Queue
from contextlib import contextmanager

MODULE_LOG = logging.getLogger(__name__)


class Notifications(object):
    def __init__(self, topics, broker, loop=None):
        self.loop = loop or asyncio.get_event_loop()
        self.queue = Queue(loop=self.loop)  # type: ignore
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

    def on_notify(self, message):
        if self.snoozed:
            return
        self.queue.put_nowait(message)

    async def __anext__(self):
        return await self.queue.get()

    def __aiter__(self):
        return self


class Broker:

    def __init__(self):
        self.subscriptions = {}
        self.logger = MODULE_LOG

    def subscribe(self, topic, handler):
        if handler in self.subscriptions.setdefault(topic, []):
            return
        self.subscriptions[topic].append(handler)

        def unsubscribe():
            self.subscriptions[topic].remove(handler)

        return unsubscribe

    def publish(self, topic, message):
        [handler(message) for handler in self.subscriptions.get(topic, [])]

    def set_logger(self, logger):
        self.logger = logger
