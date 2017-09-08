import asyncio
import functools
import inspect

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


def publish(before, after, name, **decorator_kwargs):
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            _args = _get_args(f, args, kwargs)
            _args.update(decorator_kwargs)

            if before:
                notify(name, {**_args, '$': 'before'})

            res = f(*args, **kwargs)

            if after:
                notify(name, {**_args, '$': 'after', 'return': res})

            return res
        return decorated

    return decorator


def _get_args(f, args, kwargs):
    # Create the initial dictionary with args that have defaults
    res = {}

    if inspect.getargspec(f).defaults:
        res = dict(
            zip(
                reversed(inspect.getargspec(f).args),
                reversed(inspect.getargspec(f).defaults)))

    # Update / insert values for positional args
    res.update(dict(zip(inspect.getargspec(f).args, args)))

    # Update it with values for named args
    res.update(kwargs)
    return res


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


before = functools.partial(publish, before=True, after=False)
after = functools.partial(publish, before=False, after=True)
both = functools.partial(publish, before=True, after=True)
