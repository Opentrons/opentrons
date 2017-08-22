import asyncio
import logging

from asyncio import Queue
from opentrons.util.trace import EventBroker

log = logging.getLogger(__name__)


class RobotContainer(object):
    def __init__(self, loop=None):
        from opentrons import robot

        self.loop = loop or asyncio.get_event_loop()
        self._globals = {'robot': robot}
        self._locals = {}
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
        asyncio.run_coroutine_threadsafe(
                self.notifications.put(info), self.loop)

    def reset(self):
        # TODO(artyom, 08/11/2017)
        # Replace reset with a switchover of robot connection
        # before new protocol is loaded
        self.robot.reset()

    def load_protocol(self, text):
        exec(text, self._globals, self._locals)
        return self.robot

    def load_protocol_file(self, file):
        text = ''
        with open(file) as file:
            text = ''.join(list(file))
        return self.load_protocol(text)

    def get_robot(self):
        return self.robot

    def __aiter__(self):
        return self

    async def __anext__(self):
        return await self.notifications.get()
