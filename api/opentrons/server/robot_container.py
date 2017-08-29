import ast
import asyncio
import logging

from asyncio import Queue
from concurrent import futures
from opentrons.robot.robot import Robot
from opentrons.util.trace import EventBroker

log = logging.getLogger(__name__)


class RobotContainer(object):
    def __init__(self, loop=None, filters=['add-command']):
        self.loop = loop or asyncio.get_event_loop()
        self.protocol = None
        self.session = None
        self.update_filters(filters)

        self.notifications = Queue(loop=self.loop)

        EventBroker.get_instance().add(self.notify)
        EventBroker.get_instance().add(self.add_command)

    def update_filters(self, filters):
        def update():
            self.filters = set(filters)

        # If same thread, just call the function,
        # without wrapping it into threadsafe call
        # to prevent freezing during test run
        if self.same_thread():
            update()
        else:
            self.loop.call_soon_threadsafe(update)

    def add_command(self, info):
        if self.session and info.get('name', '') == 'add-command':
            # TODO(artyom, 2017-08-29): pass command object directly to
            # add_to_log, once robot is capable of tracking
            # command's nesting level in call tree and thus contains
            # level as the first item of a tuple
            item = (0, info['arguments']['command'])
            self.session.add_to_log(item)

    def notify(self, info):
        if info.get('name', None) not in self.filters:
            return

        # Use this to turn self into it's id so we don't
        # end up serializing every object who's method
        # triggered the event
        arguments = info.get('arguments', {})
        if 'self' in arguments:
            arguments['self_id'] = arguments.pop('self')

        payload = (info, self.session)
        future = asyncio.run_coroutine_threadsafe(
                self.notifications.put(payload), self.loop)

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
            self.session.set_state('running')
            exec(self.protocol, {})
            self.session.set_state('finished')
        except Exception as e:
            self.session.add_error(e)
            self.session.set_state('error')
            raise
        finally:
            robot.disconnect()

        return robot.commands()

    def stop(self):
        from opentrons import robot
        robot.stop()
        self.session.set_state('stopped')

    def pause(self):
        from opentrons import robot
        robot.pause()
        self.session.set_state('paused')

    def resume(self):
        from opentrons import robot
        robot.resume()
        self.session.set_state('running')

    def new_robot(self):
        return Robot()

    def load_protocol(self, text, filename):
        tree = ast.parse(text)
        self.protocol = compile(tree, filename=filename, mode='exec')
        # Suppress all notifications during protocol simulation
        try:
            self.session = Session(name=filename)
            _filters = self.filters
            self.update_filters([])
            commands = self.run()
            self.session.set_commands(commands)
        except Exception as e:
            self.session.add_error(e)
            self.set_state('error')
            raise
        finally:
            self.update_filters(_filters)
            return self.session

    def load_protocol_file(self, filename):
        with open(filename) as file:
            text = ''.join(list(file))
            return self.load_protocol(text, filename)

    def get_session(self):
        return self.session

    def __aiter__(self):
        return self

    async def __anext__(self):
        return await self.notifications.get()

    def finalize(self):
        log.info('Finalizing RobotContainer')
        for command in [self.add_command, self.notify]:
            try:
                EventBroker.get_instance().remove(command)
            except ValueError:
                log.debug(
                    "Tried removing notification handler that wasn't registered")  # NOQA

    def same_thread(self):
        try:
            return asyncio.get_event_loop() == self.loop
        except RuntimeError:
            return True
