import ast
from datetime import datetime
from functools import reduce

from .wrappers import Container, Instrument

from opentrons.broker import publish, subscribe, Notifications
from opentrons.commands import tree, types
from opentrons import robot
from opentrons.robot.robot import Robot
from opentrons.containers import get_container


VALID_STATES = {'loaded', 'running', 'finished', 'stopped', 'paused'}
SESSION_TOPIC = 'session'


class SessionManager(object):
    def __init__(self, loop=None):
        self._notifications = Notifications(loop=loop)
        self._unsubscribe = subscribe(
            SESSION_TOPIC, self._notifications.on_notify)
        self.session = None
        self.robot = Robot()
        # TODO (artyom, 20170918): This is to support the future
        # concept of archived sessions. To be reworked when more details
        # are available
        self.sessions = []

    @property
    def notifications(self):
        return self._notifications

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.clear()
        self._unsubscribe()

    def clear(self):
        for session in self.sessions:
            session.close()
        self.sessions.clear()

    def create(self, name, text):
        self.clear()

        with self._notifications.snooze():
            self.session = Session(name=name, text=text)
            self.sessions.append(self.session)
        # Can't do it from session's __init__ because notifications are snoozed
        self.session.set_state('loaded')
        return self.session

    def get_session(self):
        return self.session


class Session(object):
    def __init__(self, name, text):
        self.name = name
        self.protocol_text = text
        self.protocol = None
        self.state = None
        self._unsubscribe = subscribe(types.COMMAND, self.on_command)
        self.commands = []
        self.command_log = {}
        self.errors = []

        self._containers = set()
        self._instruments = set()
        self._interactions = set()

        try:
            self.refresh()
        except Exception as e:
            self.close()
            raise e

    def get_instruments(self):
        return [
            Instrument(
                instrument=instrument,
                containers=[
                    container
                    for _instrument, container in
                    self._interactions
                    if _instrument == instrument
                ])
            for instrument in self._instruments
        ]

    def get_containers(self):
        return [
            Container(
                container=container,
                instruments=[
                    instrument
                    for instrument, _container in
                    self._interactions
                    if _container == container
                ])
            for container in self._containers
        ]

    def on_command(self, message):
        if message['$'] == 'before':
            self.log_append()

    def close(self):
        self._unsubscribe()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()

    def clear_logs(self):
        self.command_log.clear()
        self.errors.clear()

    def _simulate(self):
        stack = []
        res = []
        commands = []

        self._containers.clear()
        self._instruments.clear()
        self._interactions.clear()

        def on_command(message):
            payload = message['payload']
            description = payload.get('text', '').format(
                **payload
            )

            if message['$'] == 'before':
                commands.append(payload)

                res.append(
                    {
                        'level': len(stack),
                        'description': description,
                        'id': len(res)})
                stack.append(message)
            else:
                stack.pop()

        unsubscribe = subscribe(types.COMMAND, on_command)

        try:
            self.run()
        finally:
            unsubscribe()

            # Accumulate containers, instruments, interactions from commands
            containers, instruments, interactions = _accumulate(
                [_get_labware(command) for command in commands])

            self._containers.update(containers)
            self._instruments.update(instruments)
            self._interactions.update(interactions)

        return res

    def refresh(self):
        self.clear_logs()

        try:
            parsed = ast.parse(self.protocol_text)
            self.protocol = compile(parsed, filename=self.name, mode='exec')
            self.commands = tree.from_list(self._simulate())
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
        self.clear_logs()

        if devicename is not None:
            self.set_state('running')
            robot.connect(devicename)

        try:
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
        self._on_state_changed()

    def log_append(self):
        self.command_log.update({
            len(self.command_log): {
                'timestamp': datetime.utcnow().isoformat()
            }
        })
        self._on_state_changed()

    def error_append(self, error):
        self.errors.append(
            {
                'timestamp': datetime.utcnow().isoformat(),
                'error': error
            }
        )
        self._on_state_changed()

    def _snapshot(self):
        return {
            'name': 'state',
            'payload': {
                'name': self.name,
                'state': self.state,
                'protocol_text': self.protocol_text,
                'commands': self.commands.copy(),
                'command_log': self.command_log.copy(),
                'errors': self.errors.copy()
            }
        }

    def _on_state_changed(self):
        publish(SESSION_TOPIC, self._snapshot())


def _accumulate(iterable):
    return reduce(
        lambda x, y: tuple([x + y for x, y in zip(x, y)]),
        iterable,
        ([], [], []))


def _get_labware(command):
    containers = []
    instruments = []
    interactions = []

    location = command.get('location')
    instrument = command.get('instrument')
    locations = command.get('locations')

    if location:
        containers.append(get_container(location))

    if locations:
        containers.extend(
            [get_container(location) for location in locations])

    containers = [c for c in containers if c is not None]

    if instrument:
        instruments.append(instrument)
        interactions.extend(
            [(instrument, container) for container in containers])

    return instruments, containers, interactions
