import asyncio

from asyncio import Queue
from concurrent import futures
from contextlib import contextmanager
from opentrons.util.trace import EventBroker


class Notifications(object):
    def __init__(self, loop=None, filters=['add-command']):
        self.loop = loop or asyncio.get_event_loop()
        self.update_filters(filters)
        self.queue = Queue(loop=self.loop)
        self.session = None

        EventBroker.get_instance().add(self.on_notify)

    @contextmanager
    def snooze(self):
        _filters = self.filters
        self.update_filters([])
        try:
            yield
        finally:
            self.update_filters(_filters)

    def bind(self, session):
        """
        Binds notifications object to a Session object
        representing a running protocol
        """
        self.session = session

    def update_filters(self, filters):
        self.filters = set(filters)

    def on_notify(self, event):
        def thread_has_event_loop():
            try:
                asyncio.get_event_loop()
            except RuntimeError as e:
                return False
            else:
                return True

        if event.get('name', None) not in self.filters:
            return

        # Use this to turn self into it's id so we don't
        # end up serializing every object who's method
        # triggered the event
        arguments = event.get('arguments', {})
        if 'self' in arguments:
            arguments['self_id'] = arguments.pop('self')

        payload = (event, self.session)
        future = asyncio.run_coroutine_threadsafe(
                self.queue.put(payload), self.loop)

        # TODO (artyom, 20170829): this block ensures proper sequencing
        # of notification, also covering the scenario of being called from
        # unit test where MainThread has no event loop associated with it
        if not thread_has_event_loop():
            futures.wait([future])

    def finalize(self):
        EventBroker.get_instance().remove(self.on_notify)

    async def __anext__(self):
        return await self.queue.get()

    def __aiter__(self):
        return self
