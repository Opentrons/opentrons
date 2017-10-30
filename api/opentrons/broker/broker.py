import asyncio

from asyncio import Queue
from concurrent import futures
from contextlib import contextmanager

subscriptions = {}


class Notifications(object):
    def __init__(self, loop=None):
        self.loop = loop or asyncio.get_event_loop()
        self.queue = Queue(loop=self.loop)
        self.snoozed = False

    @contextmanager
    def snooze(self):
        self.snoozed = True
        try:
            yield
        finally:
            self.snoozed = False

    def on_notify(self, message):
        def thread_has_event_loop():
            try:
                asyncio.get_event_loop()
            except RuntimeError as e:
                return False
            else:
                return True

        if self.snoozed:
            return

        future = asyncio.run_coroutine_threadsafe(
            self.queue.put(message), self.loop)

        if not thread_has_event_loop():
            futures.wait([future])

    async def __anext__(self):
        return await self.queue.get()

    def __aiter__(self):
        return self


def subscribe(topic, handler):
    handlers = subscriptions[topic] = subscriptions.get(topic, [])
    if handler in handlers:
        return

    handlers.append(handler)

    def unsubscribe():
        handlers.remove(handler)

    return unsubscribe


def publish(topic, message):
    [handler(message) for handler in subscriptions.get(topic, [])]
