import asyncio
import logging

from opentrons import robot
from opentrons.util.trace import EventBroker
from asyncio import Queue


log = logging.getLogger(__name__)


class RobotContainer(object):
    def __init__(self):
        self._globals = {'robot': robot}
        self._locals = {}
        self.notifications = Queue()
        EventBroker.get_instance().add(self.notify)

    def notify(self, info):
        # Use this to transition from non-async to async context
        # This puts the task into event queue
        asyncio.ensure_future(self.notifications.put(info))

    def reset(self):
        # TODO(artyom, 08/11/2017)
        # Replace reset with a switchover of robot connection
        # before new protocol is loaded
        robot.reset()

    def load_protocol(self, text):
        exec(text, self._globals, self._locals)
        return self._globals['robot']

    def load_protocol_file(self, file):
        text = ''
        with open(file) as file:
            text = ''.join(list(file))
        return self.load_protocol(text)

    def get_robot(self):
        return self._globals['robot']

    def __aiter__(self):
        return self

    async def __anext__(self):
        return await self.notifications.get()
