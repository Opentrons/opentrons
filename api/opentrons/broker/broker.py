import asyncio

from asyncio import Queue
from concurrent import futures
from contextlib import contextmanager

listeners = []


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

    def on_notify(self, name, payload):
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
                self.queue.put((name, payload)), self.loop)

        if not thread_has_event_loop():
            futures.wait([future])

    async def __anext__(self):
        return await self.queue.get()

    def __aiter__(self):
        return self


def subscribe(topics, handler=None, loop=None):
    notifications = None

    if handler is None:
        notifications = Notifications(loop)
        handler = notifications.on_notify

    listener = [set(topics), handler]
    listeners.append(listener)

    def unsubscribe():
        listeners.remove(listener)

    if notifications:
        return (unsubscribe, notifications)
    return (unsubscribe,)


def notify(name, payload):
    for topics, listener in listeners:
        if name in topics:
            listener(name, payload)
