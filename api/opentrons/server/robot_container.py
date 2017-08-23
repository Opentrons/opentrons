import asyncio
import logging

from asyncio import Queue
from opentrons.util.trace import EventBroker

log = logging.getLogger(__name__)


class RobotContainer(object):
    def __init__(self, loop=None):
        from opentrons import robot

        self.loop = loop or asyncio.get_event_loop()
        self._globals = {}
        self.notifications = Queue(loop=self.loop)
        EventBroker.get_instance().add(self.notify)

    def finalize(self):
        log.info('Finalizing RobotContainer')
        try:
            EventBroker.get_instance().remove(self.notify)
        except ValueError:
            pass

    @property
    def robot(self):
        return self._globals['robot']

    def set_loop(self, loop):
        self.loop = loop

    def notify(self, info):
        # Use this to turn self into it's id so we don't
        # end up serializing every object that received the call
        arguments = info.get('arguments', {})
        if 'self' in arguments:
            arguments['self'] = id(arguments['self'])

        asyncio.run_coroutine_threadsafe(
                self.notifications.put(info), self.loop)

    def reset(self):
        pass

    def load_protocol(self, text):
        exec(text, self._globals)
        return self.robot

    def load_protocol_file(self, file):
        with open(file) as file:
            text = ''.join(list(file))
            return self.load_protocol(text)

    def get_robot(self):
        return self.robot

    def __aiter__(self):
        return self

    async def __anext__(self):
        return await self.notifications.get()
