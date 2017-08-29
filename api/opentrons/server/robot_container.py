import ast
import asyncio
import logging
import sys

from asyncio import Queue
from concurrent import futures
from opentrons.robot.robot import Robot
from opentrons.server.session import Session
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

    def notify(self, info):
        if info.get('name', None) not in self.filters:
            return

        if self.session and info.get('name', '') == 'add-command':
            self.session.add_to_log(info['arguments']['command'])

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
            type, value, traceback = sys.exc_info()
            self.session.add_error((e, traceback))
            self.session.set_state('error')
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
        try:
            tree = ast.parse(text)
            self.protocol = compile(tree, filename=filename, mode='exec')
            self.session = Session(name=filename)

            # Suppress all notifications during protocol simulation
            _filters = self.filters
            self.update_filters([])
            commands = self.run()

            # TODO(artyom, 20170829): remove wrapping command into tuple
            # once commands contain call depth information
            commands = [(0, command) for command in commands]
            self.session.set_commands(commands)
        except Exception as e:
            # Should we create session when protocol has failed to load?!
            type, value, traceback = sys.exc_info()
            self.session.add_error((e, traceback))
            self.set_state('error')
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

        # Keep it as a loop in case there is more than one handler to remove
        for command in [self.notify]:
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
