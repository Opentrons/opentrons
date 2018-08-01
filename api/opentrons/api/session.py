import ast
import logging
from copy import copy
from time import time
from functools import reduce
import json

from opentrons.broker import publish, subscribe
from opentrons.containers import get_container, location_to_list
from opentrons.commands import tree, types
from opentrons.protocols import execute_protocol
from opentrons import robot

from .models import Container, Instrument, Module

log = logging.getLogger(__name__)

VALID_STATES = {'loaded', 'running', 'finished', 'stopped', 'paused', 'error'}


class SessionManager(object):
    def __init__(self, loop=None):
        self.session = None

    def create(self, name, text):
        self.session = Session(name=name, text=text)
        return self.session

    def clear(self):
        if self.session:
            self.session.refresh()
        self.session = None

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
        self._modules = []
        self._interactions = []

        self.instruments = None
        self.containers = None
        self.modules = None

        self.startTime = None

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

    def get_modules(self):
        return [
            Module(module=module)
            for module in self._modules
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
        self._modules.clear()
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
            # ensure actual pipettes are cached before driver is disconnected
            robot.cache_instrument_models()

            # TODO (artyom, 20171005): this will go away
            # once robot / driver simulation flow is fixed
            robot.disconnect()
            if self._is_json_protocol:
                execute_protocol(self._protocol)
            else:
                exec(self._protocol, {})
        finally:
            # physically attached pipettes are re-cached during robot.connect()
            # which is important, because during a simulation, the robot could
            # think that it holds a pipette model that it actually does not
            robot.connect()
            unsubscribe()

            instruments, containers, modules, interactions = _accumulate(
                [_get_labware(command) for command in commands])

            self._containers.extend(_dedupe(containers))
            self._instruments.extend(_dedupe(instruments))
            self._modules.extend(_dedupe(modules))
            self._interactions.extend(_dedupe(interactions))

        return res

    def refresh(self):
        self._reset()
        self._is_json_protocol = self.name.endswith('.json')

        if self._is_json_protocol:
            # TODO Ian 2018-05-16 use protocol JSON schema to raise
            # warning/error here if the protocol_text doesn't follow the schema
            self._protocol = json.loads(self.protocol_text)
        else:
            parsed = ast.parse(self.protocol_text)
            self._protocol = compile(parsed, filename=self.name, mode='exec')
        commands = self._simulate()
        self.commands = tree.from_list(commands)

        self.containers = self.get_containers()
        self.instruments = self.get_instruments()
        self.modules = self.get_modules()
        self.startTime = None

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
            if message['name'] == types.PAUSE:
                self.set_state('paused')
            if message['name'] == types.RESUME:
                self.set_state('running')

        self._reset()

        _unsubscribe = subscribe(types.COMMAND, on_command)
        self.startTime = now()
        self.set_state('running')

        try:
            self.resume()
            robot.home_z()
            if self._is_json_protocol:
                execute_protocol(self._protocol)
            else:
                exec(self._protocol, {})
            self.set_state('finished')
            robot.home()
        except Exception as e:
            log.exception("Exception during run:")
            self.error_append(e)
            self.set_state('error')
            raise e
        finally:
            _unsubscribe()

        return self

    def identify(self):
        robot.identify()

    def turn_on_rail_lights(self):
        robot.turn_on_rail_lights()

    def turn_off_rail_lights(self):
        robot.turn_off_rail_lights()

    def set_state(self, state):
        log.debug("State set to {}".format(state))
        if state not in VALID_STATES:
            raise ValueError(
                'Invalid state: {0}. Valid states are: {1}'
                .format(state, VALID_STATES))
        self.state = state
        self._on_state_changed()

    def log_append(self):
        self.command_log.update({
            len(self.command_log): now()})
        self._on_state_changed()

    def error_append(self, error):
        self.errors.append(
            {
                'timestamp': now(),
                'error': error
            }
        )
        # self._on_state_changed()

    def _reset(self):
        robot.reset()
        self.clear_logs()

    def _snapshot(self):
        if self.state == 'loaded':
            payload = copy(self)
        else:
            if self.command_log.keys():
                idx = sorted(self.command_log.keys())[-1]
                timestamp = self.command_log[idx]
                last_command = {'id': idx, 'handledAt': timestamp}
            else:
                last_command = None

            payload = {
                'state': self.state,
                'startTime': self.startTime,
                'lastCommand': last_command
            }
        return {
            'topic': Session.TOPIC,
            'payload': payload
        }

    def _on_state_changed(self):
        publish(Session.TOPIC, self._snapshot())


def _accumulate(iterable):
    return reduce(
        lambda x, y: tuple([x + y for x, y in zip(x, y)]),
        iterable,
        ([], [], [], []))


def _dedupe(iterable):
    acc = set()

    for item in iterable:
        if item not in acc:
            acc.add(item)
            yield item


def now():
    return int(time() * 1000)


def _get_labware(command):
    containers = []
    instruments = []
    modules = []
    interactions = []

    location = command.get('location')
    instrument = command.get('instrument')
    # module = command.get('module')
    locations = command.get('locations')

    if location:
        containers.append(get_container(location))

    if locations:
        list_of_locations = location_to_list(locations)
        containers.extend(
            [get_container(location) for location in list_of_locations])

    containers = [c for c in containers if c is not None]
    modules = [m for m in modules if m is not None]

    if instrument:
        instruments.append(instrument)
        interactions.extend(
            [(instrument, container) for container in containers])

    return instruments, containers, modules, interactions
