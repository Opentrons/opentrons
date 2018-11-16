import ast
import asyncio
import logging
from copy import copy
from time import time
from functools import reduce
import json

from opentrons.broker import publish, subscribe
from opentrons.legacy_api.containers import get_container, location_to_list
from opentrons.legacy_api.containers.placeable import Module as ModulePlaceable
from opentrons.commands import tree, types
from opentrons.protocols import execute_protocol
from opentrons.config import feature_flags as ff

from .models import Container, Instrument, Module

log = logging.getLogger(__name__)

VALID_STATES = {'loaded', 'running', 'finished', 'stopped', 'paused', 'error'}


class SessionManager(object):
    def __init__(self, hardware):
        self.session = None
        self._session_lock = False
        self._hardware = hardware

    async def create(self, name, text):
        if self._session_lock:
            raise Exception(
                'Cannot create session while simulation in progress')

        self._session_lock = True
        try:
            self.session = await Session.build_and_prep(
                name=name, text=text, hardware=self._hardware)
        finally:
            self._session_lock = False

        return self.session

    async def clear(self):
        if self._session_lock:
            raise Exception(
                'Cannot clear session while simulation in progress')

        if self.session:
            self._hardware.reset()
        self.session = None

    def get_session(self):
        return self.session


class Session(object):
    TOPIC = 'session'

    @classmethod
    async def build_and_prep(cls, name, text, hardware):
        sess = cls(name, text, hardware)
        await sess.prepare()
        return sess

    def __init__(self, name, text, hardware):
        self.name = name
        self.protocol_text = text
        self._protocol = None
        self._hardware = hardware
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

    async def prepare(self):
        if ff.use_protocol_api_v2():
            await self._hardware.discover_modules()
        else:
            self._hardware.discover_modules()
        await self.refresh()

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

    async def _simulate(self):
        if ff.use_protocol_api_v2():
            raise NotImplementedError(
                    "Need to implement new api in protocols")
        await self._reset()

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

            self._hardware.cache_instrument_models()

            if not ff.use_protocol_api_v2():
                # TODO (artyom, 20171005): this will go away
                # once robot / driver simulation flow is fixed
                self._hardware.disconnect()
            if self._is_json_protocol:
                execute_protocol(self._protocol)
            else:
                exec(self._protocol, {})
        finally:
            # physically attached pipettes are re-cached during robot.connect()
            # which is important, because during a simulation, the robot could
            # think that it holds a pipette model that it actually does not
            if not ff.use_protocol_api_v2():
                self._hardware.connect()
            unsubscribe()

            instruments, containers, modules, interactions = _accumulate(
                [_get_labware(command) for command in commands])

            self._containers.extend(_dedupe(containers))
            self._instruments.extend(_dedupe(instruments))
            self._modules.extend(_dedupe(modules))
            self._interactions.extend(_dedupe(interactions))

            # Labware calibration happens after simulation and before run, so
            # we have to clear the tips if they are left on after simulation
            # to ensure that the instruments are in the expected state at the
            # beginning of the labware calibration flow
            if not ff.use_protocol_api_v2():
                self._hardware.clear_tips()

        return res

    async def refresh(self):
        await self._reset()
        self._is_json_protocol = self.name.endswith('.json')

        if self._is_json_protocol:
            # TODO Ian 2018-05-16 use protocol JSON schema to raise
            # warning/error here if the protocol_text doesn't follow the schema
            self._protocol = json.loads(self.protocol_text)
        else:
            parsed = ast.parse(self.protocol_text)
            self._protocol = compile(parsed, filename=self.name, mode='exec')
        commands = await self._simulate()
        self.commands = tree.from_list(commands)

        self.containers = self.get_containers()
        self.instruments = self.get_instruments()
        self.modules = self.get_modules()
        self.startTime = None
        self.set_state('loaded')
        return self

    def stop(self):
        self._hardware.stop()
        self.set_state('stopped')
        return self

    def pause(self):
        self._hardware.pause()
        self.set_state('paused')
        return self

    def resume(self):
        self._hardware.resume()
        self.set_state('running')
        return self

    async def run(self):
        def on_command(message):
            if message['$'] == 'before':
                self.log_append()
            if message['name'] == types.PAUSE:
                self.set_state('paused')
            if message['name'] == types.RESUME:
                self.set_state('running')

        if ff.use_protocol_api_v2():
            raise NotImplementedError("Need to implement new API in protocols")

        await self._reset()

        _unsubscribe = subscribe(types.COMMAND, on_command)
        self.startTime = now()
        self.set_state('running')

        try:
            self.resume()
            await self._pre_run_hooks()
            if self._is_json_protocol:
                execute_protocol(self._protocol)
            else:
                exec(self._protocol, {})
            self.set_state('finished')
            self._hardware.home()
        except Exception as e:
            log.exception("Exception during run:")
            self.error_append(e)
            self.set_state('error')
            raise e
        finally:
            _unsubscribe()

        return self

    async def identify(self):
        if ff.use_protocol_api_v2():
            asyncio.ensure_future(self._hardware.identify())
        else:
            self._hardware.identify()

    def turn_on_rail_lights(self):
        self._hardware.set_lights(rails=True)

    def turn_off_rail_lights(self):
        self._hardware.set_lights(rails=False)

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

    async def _reset(self):
        if ff.use_protocol_api_v2():
            await self._hardware.reset()
        else:
            self._hardware.reset()
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

    async def _pre_run_hooks(self):
        if ff.use_protocol_api_v2():
            await self._hardware.home_z()
        else:
            self._hardware.home_z()


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


def _get_parent_module(placeable):
    if isinstance(placeable, ModulePlaceable) or not placeable:
        res = placeable
    else:
        res = _get_parent_module(placeable.parent)
    return res


def _get_labware(command):
    containers = []
    instruments = []
    modules = []
    interactions = []

    location = command.get('location')
    instrument = command.get('instrument')

    placeable = location
    if (type(location) == tuple):
        placeable = location[0]

    maybe_module = _get_parent_module(placeable)
    modules.append(maybe_module)

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
