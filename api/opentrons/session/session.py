import ast
import copy
import sys

from opentrons import robot
from opentrons.robot.robot import Robot
from datetime import datetime

from opentrons.broker import notify, subscribe


VALID_STATES = set(
    ['loaded', 'running', 'finished', 'stopped', 'paused'])


class SessionManager(object):
    def __init__(self, loop=None):
        self.unsubscribe, self.notifications = \
            subscribe(['session.state.change'], loop=loop)
        self.robot = Robot()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.unsubscribe()

    def create(self, name, text):
        with self.notifications.snooze():
            self.session = Session(name=name, text=text)
        return self.session

    def get_session(self):
        return self.session


class Session(object):
    def __init__(self, name, text):
        self.name = name
        self.protocol_text = text
        self.state = None
        self.unsubscribe, = subscribe(
            ['robot.command'], self.on_command)
        self.refresh()

    def on_command(self, name, event):
        self.log_append()

    def close(self):
        self.unsubscribe()

    def reset(self):
        self.command_log = {}
        self.errors = []

    def _simulate(self):
        stack = []
        commands = []

        def on_command(name, payload):
            description = payload.get('text', '').format(
                **payload
            )

            if payload['$'] == 'before':
                commands.append(
                    {'level': len(stack), 'description': description})
                stack.append(payload)
            else:
                stack.pop()

        unsubscribe, = subscribe(['robot.command'], on_command)

        try:
            self.run()
        finally:
            unsubscribe()

        return commands

    def refresh(self):
        self.reset()

        try:
            tree = ast.parse(self.protocol_text)
            self.protocol = compile(tree, filename=self.name, mode='exec')
            commands = self._simulate()
            self.load_commands(commands)
            self.command_log.clear()
        finally:
            if self.errors:
                raise Exception(*self.errors)
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
        except Exception as e:
            self.error_append(e)
            raise e
        finally:
            self.set_state('finished')
            robot.disconnect()

        return self

    def set_state(self, state):
        if state not in VALID_STATES:
            raise ValueError('Invalid state: {0}. Valid states are: {1}'
                             .format(state, VALID_STATES))
        self.state = state
        self.on_state_changed()

    def load_commands(self, commands):
        """
        Given a list of tuples of form (depth, command_text)
        that represents a DFS traversal of a command tree,
        updates self.commands with a dictionary that holds
        a command tree.
        """
        print('\n'.join([" " * i['level'] + i['description'] for i in commands]))
        # index = range(len(commands))

        def children(commands, level=0):
            return [
                {
                    'description': command['description'],
                    'children': children(commands[index:], level+1),
                    'id': next(index)
                }
                for command in commands
                if command['level'] == level
            ]

        self.commands = children(commands)

    def log_append(self):
        self.command_log.update({
            len(self.command_log): {
                'timestamp': datetime.utcnow().isoformat()
            }
        })
        self.on_state_changed()

    def error_append(self, error):
        self.errors.append(
            {
                'timestamp': datetime.utcnow().isoformat(),
                'error': error
            }
        )
        self.on_state_changed()

    def on_state_changed(self):
        notify('session.state.change', copy.deepcopy(self))
