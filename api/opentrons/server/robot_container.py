import ast
import asyncio
import logging

from asyncio import Queue
from concurrent import futures
from opentrons.robot.robot import Robot
from opentrons.util.trace import MessageBroker
from opentrons.pubsub_utils import topics

log = logging.getLogger(__name__)


class RobotContainer(object):
    def __init__(self, loop=None, filters=['add-command']):
        self.loop = loop or asyncio.get_event_loop()
        self.protocol = None
        self.update_filters(filters)

        self.notifications = Queue(loop=self.loop)
        MessageBroker.get_instance().subscribe(topics.MISC, self.notify)

    def same_thread(self):
        try:
            return asyncio.get_event_loop() == self.loop
        except RuntimeError:
            return True

    def update_filters(self, filters):
        def update():
            self.filters = set(filters)

        # If same thread, just call the function,
        # without wrapping it into threadsafe call
        if self.same_thread():
            update()
        else:
            self.loop.call_soon_threadsafe(update)

    def notify(self, info):
        if info.get('name', None) not in self.filters:
            return

        # Use this to turn self into it's id so we don't
        # end up serializing every object who's method
        # triggered the event
        arguments = info.get('arguments', {})
        if 'self' in arguments:
            arguments['self_id'] = arguments.pop('self')

        future = asyncio.run_coroutine_threadsafe(
                self.notifications.put(info), self.loop)

        # If same thread, don't wait, will freeze otherwise
        if not self.same_thread():
            futures.wait([future])

    def reset_robot(self, robot):
        # robot is essentially a singleton
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
            exec(self.protocol, {})
        finally:
            robot.disconnect()

        return robot

    def new_robot(self):
        return Robot()

    def load_protocol(self, text, filename):
        tree = ast.parse(text)
        self.protocol = compile(tree, filename=filename, mode='exec')
        # Suppress all notifications during protocol simulation
        try:
            _filters = self.filters
            self.update_filters([])
            res = self.run()
        finally:
            self.update_filters(_filters)
            return res

    def load_protocol_file(self, filename):
        with open(filename) as file:
            text = ''.join(list(file))
            return self.load_protocol(text, filename)

    def __aiter__(self):
        return self

    async def __anext__(self):
        return await self.notifications.get()

    def finalize(self):
        log.info('Finalizing RobotContainer')
        try:
            EventBroker.get_instance().remove(self.notify)
        except ValueError:
            log.debug(
                "Tried removing notification handler that wasn't registered")
