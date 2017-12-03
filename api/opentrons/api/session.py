import ast
from copy import copy
from datetime import datetime
from functools import reduce

from opentrons.broker import publish, subscribe
from opentrons.containers import get_container
from opentrons.commands import tree, types
from opentrons import robot

from .models import Container, Instrument


VALID_STATES = {'loaded', 'running', 'finished', 'stopped', 'paused'}


class SessionManager(object):
    def __init__(self, loop=None):
        self.session = None

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

        self.instruments = None
        self.containers = None

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
        self._reset()

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
                level = len(stack)

                stack.append(message)
                commands.append(payload)

                res.append(
                    {
                        'level': level,
                        'description': description,
                        'id': len(res)})
            else:
                stack.pop()

        unsubscribe = subscribe(types.COMMAND, on_command)

        try:
            # TODO (artyom, 20171005): this will go away
            # once robot / driver simulation flow is fixed
            prev_simulate_state = robot._driver.simulating
            robot._driver.simulating = True
            exec(self._protocol, {})
        finally:
            robot._driver.simulating = prev_simulate_state
            unsubscribe()

            # Accumulate containers, instruments, interactions from commands
            instruments, containers, interactions = _accumulate(
                [_get_labware(command) for command in commands])

            self._containers.extend(_dedupe(containers))
            self._instruments.extend(_dedupe(instruments))
            self._interactions.extend(_dedupe(interactions))

        return res

    def refresh(self):
        self._reset()

        parsed = ast.parse(self.protocol_text)
        self._protocol = compile(parsed, filename=self.name, mode='exec')
        commands = self._simulate()
        self.commands = tree.from_list(commands)

        self.containers = self.get_containers()
        self.instruments = self.get_instruments()

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

    def run(self):
        def on_command(message):
            if message['$'] == 'before':
                self.log_append()

        self._reset()

        _unsubscribe = subscribe(types.COMMAND, on_command)
        self.set_state('running')

        try:
            self.resume()
            robot.home()
            exec(self._protocol, {})
        except Exception as e:
            self.error_append(e)
            raise e
        finally:
            _unsubscribe()
            self.set_state('finished')

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

    def _reset(self):
        robot.reset()
        self.clear_logs()

    # TODO (artyom, 20171003): along with calibration, consider extracting this
    # into abstract base class or find any other way to keep notifications
    # consistent across all managers
    def _snapshot(self):
        return {
            'topic': Session.TOPIC,
            'name': 'state',
            # we are making a copy to avoid the scenario
            # when object state is updated elsewhere before
            # it is serialized and transferred
            'payload': copy(self)

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
