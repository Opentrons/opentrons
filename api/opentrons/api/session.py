import ast
from datetime import datetime
from functools import reduce

from .models import Container, Instrument

from opentrons.broker import publish, subscribe
from opentrons.commands import tree, types
from opentrons import robot
from opentrons.robot.robot import Robot
from opentrons.containers import get_container


VALID_STATES = {'loaded', 'running', 'finished', 'stopped', 'paused'}


class SessionManager(object):
    def __init__(self, loop=None):
        self.session = None
        self.robot = Robot()

    def create(self, name, text):
        self.session = Session(name=name, text=text)
        return self.session

    def get_session(self):
        return self.session


class Session(object):
    TOPIC = 'session'

    def __init__(self, name, text):
        self.name = name
        self.protocol_text = text
        self._protocol = None
        self.state = None
        self.commands = []
        self.command_log = {}
        self.errors = []

        self._containers = []
        self._instruments = []
        self._interactions = []

        self.refresh()

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

            self._containers.extend(_dedupe(containers))
            self._instruments.extend(_dedupe(instruments))
            self._interactions.extend(_dedupe(interactions))

        return res

    def refresh(self):
        self.clear_logs()

        try:
            parsed = ast.parse(self.protocol_text)
            self._protocol = compile(parsed, filename=self.name, mode='exec')
            self.commands = tree.from_list(self._simulate())
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
        _unsubscribe = None

        def on_command(message):
            if message['$'] == 'before':
                self.log_append()

        if devicename is not None:
            _unsubscribe = subscribe(types.COMMAND, on_command)
            self.set_state('running')
            robot.connect(devicename)

        try:
            exec(self._protocol, {})
        except Exception as e:
            self.error_append(e)
            raise e
        finally:
            if _unsubscribe:
                _unsubscribe()
            # TODO (artyom, 20170927): we should fully separate
            # run and simulate code
            if devicename is not None:
                self.set_state('finished')
            robot.disconnect()

        return self

    def set_state(self, state):
        if state not in VALID_STATES:
            raise ValueError(
                'Invalid state: {0}. Valid states are: {1}'
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
            'topic': Session.TOPIC,
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
        publish(Session.TOPIC, self._snapshot())


def _accumulate(iterable):
    return reduce(
        lambda x, y: tuple([x + y for x, y in zip(x, y)]),
        iterable,
        ([], [], []))


def _dedupe(iterable):
    acc = set()

    for item in iterable:
        if item not in acc:
            acc.add(item)
            yield item


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
