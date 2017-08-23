import ast
import asyncio
import logging

from asyncio import Queue
from opentrons.robot.robot import Robot
from opentrons.util.trace import EventBroker


log = logging.getLogger(__name__)


class RobotContainer(object):
    def __init__(self, loop=None):
        self.loop = loop or asyncio.get_event_loop()
        self.protocol_text = None

        self.notifications = Queue(loop=self.loop)
        EventBroker.get_instance().add(self.notify)

    def notify(self, info):
        # TODO(artyom, 2017-08-23): allow filtering to be configured
        if info.get('name', None) != 'add-command':
            return

        # Use this to turn self into it's id so we don't
        # end up serializing every object who's method triggered the event
        arguments = info.get('arguments', {})
        if 'self' in arguments:
            arguments['self_id'] = arguments.pop('self')

        asyncio.run_coroutine_threadsafe(
                self.notifications.put(info), self.loop)

    def reset_robot(self, robot):
        # robot is essentially a signleton
        # throughout the api however we want to reset it
        # in order to do this we call a constructor
        # and then copy over the __dict__ of a newly
        # constructed robot to the one that is a singleton
        _robot = self.new_robot()
        robot.__dict__ = {**_robot.__dict__}

    def run(self, devicename=None):
        from opentrons import robot

        self.reset_robot(robot)

        if devicename is not None:
            robot.connect(devicename)

        try:
            exec(self.protocol_text, {})
        finally:
            robot.disconnect()

        return robot

    def new_robot(self):
        return Robot()

    def load_protocol(self, text, filename):
        tree = ast.parse(text)
        compile(tree, filename=filename, mode='exec')
        self.protocol_text = text
        return self.run()

    def load_protocol_file(self, filename):
        with open(filename) as file:
            text = ''.join(list(file))
            return self.load_protocol(text, filename)

    def __aiter__(self):
        return self

    async def __anext__(self):
        return await self.notifications.get()

    def set_loop(self, loop):
        self.loop = loop

    def finalize(self):
        log.info('Finalizing RobotContainer')
        try:
            EventBroker.get_instance().remove(self.notify)
        except ValueError:
            log.debug(
                "Tried removing notification handler that wasn't registered")
