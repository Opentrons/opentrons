import ast
import sys

from opentrons import robot
from opentrons.robot.robot import Robot
from datetime import datetime

from .notifications import Notifications
from opentrons.util.trace import traceable


# TODO: add session variables as per:
# https://docs.google.com/document/d/1fXJBd1SFIqudxdWzyFSHoq5mkER45tr_A5Yx1s-nFQs/edit
VALID_STATES = set(
    ['loaded', 'running', 'error', 'finished', 'stopped', 'paused'])


class SessionManager(object):
    def __init__(self, loop=None, filters=[
            'add-command',
            'session.state.change']):
        self.notifications = Notifications(loop=loop, filters=filters)
        self.robot = Robot()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.notifications.finalize()

    def create(self, name, text):
        with self.notifications.snooze():
            self.session = Session(name=name, text=text)
            self.notifications.bind(self.session)
        return self.session

    def get_session(self):
        return self.session


class Session(object):
    def __init__(self, name, text):
        self.name = name
        self.protocol_text = text
        self.state = None
        self.refresh()

    def reset(self):
        self.command_log = {}
        self.errors = {}

    def refresh(self):
        self.reset()

        try:
            tree = ast.parse(self.protocol_text)
            self.protocol = compile(tree, filename=self.name, mode='exec')
            _, commands = self.run()
            # TODO(artyom, 20170830): this will go away once commands are
            # passed along with their nesting level in command tree
            self.load_commands([
                {'level': 0, 'description': command}
                for command in commands])
            self.command_log.clear()
        finally:
            if self.state == 'error':
                raise Exception(*self.errors.values())
            self.set_state('loaded')
        return self

    def stop(self):
        robot.stop()
        self.set_state('stopped')
        return self

    def pause(self):
        robot.pause()
        self.set_state('paused')
        return self

    def resume(self):
        robot.resume()
        self.set_state('running')
        return self

    def run(self, devicename=None):
        # HACK: hard reset singleton by replacing all of it's attributes
        # with the one from a newly constructed robot
        robot.__dict__ = {**Robot().__dict__}
        self.reset()

        if devicename is not None:
            robot.connect(devicename)

        try:
            self.set_state('running')
            exec(self.protocol, {})
            self.set_state('finished')
        except Exception as e:
            self.set_state('error')
            _, _, traceback = sys.exc_info()
            self.error_append((e, traceback))
        finally:
            robot.disconnect()

        return (self, robot.commands())

    @traceable('session.state.change')
    def set_state(self, state):
        if state not in VALID_STATES:
            raise ValueError('Invalid state: {0}. Valid states are: {1}'
                             .format(state, VALID_STATES))
        self.state = state

    def load_commands(self, commands):
        """
        Given a list of tuples of form (depth, command_text)
        that represents a DFS traversal of a command tree,
        updates self.commands with a dictionary that holds
        a command tree.
        """
        def children(commands, level=0, base_index=0):
            return [
                {
                    'description': command['description'],
                    'children': children(commands[index:], level+1, index),
                    'id': base_index+index
                }
                for index, command in enumerate(commands)
                if command['level'] == level
            ]

        self.commands = children(commands)

    def log_append(self, command):
        self.command_log.update({
            len(self.command_log): {
                'timestamp': datetime.utcnow().isoformat()
            }
        })

    # TODO: make it an array
    def error_append(self, error):
        self.errors.update({
            len(self.errors): {
                'timestamp': datetime.utcnow().isoformat(),
                'error': error
            }
        })
