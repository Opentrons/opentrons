import ast
import asyncio
from copy import copy
from functools import reduce, wraps
import json
import logging
from time import time
from uuid import uuid4

from opentrons.broker import Broker
from opentrons.legacy_api.containers import get_container, location_to_list
from opentrons.legacy_api.containers.placeable import (
    Module as ModulePlaceable, Placeable)
from opentrons.commands import tree, types as command_types
from opentrons.commands.commands import is_new_loc, listify
from opentrons.protocols import execute_protocol
from opentrons.config import feature_flags as ff
from opentrons.protocol_api import (ProtocolContext,
                                    labware,
                                    run_protocol)
from opentrons.hardware_control import adapters, API
from opentrons.types import Location, Point

from .models import Container, Instrument, Module

log = logging.getLogger(__name__)

VALID_STATES = {'loaded', 'running', 'finished', 'stopped', 'paused', 'error'}


def _motion_lock(func):
    """ Decorator to make a function require a lock. Only works for instance
    methods of Session (or SessionManager) """
    @wraps(func)
    def decorated(*args, **kwargs):
        self = args[0]
        if self._motion_lock:
            with self._motion_lock:
                return func(*args, **kwargs)
        else:
            return func(*args, **kwargs)
    return decorated


class SessionManager(object):
    def __init__(self, hardware, loop=None, broker=None, lock=None):
        self._broker = broker or Broker()
        self._loop = loop or asyncio.get_event_loop()
        self.session = None
        self._session_lock = False
        self._hardware = hardware
        self._command_logger = logging.getLogger(
            'opentrons.server.command_logger')
        self._broker.set_logger(self._command_logger)
        self._motion_lock = lock

    def __del__(self):
        if isinstance(getattr(self, '_hardware', None),
                      adapters.SynchronousAdapter):
            self._hardware.join()

    def create(self, name, text):
        if self._session_lock:
            raise Exception(
                'Cannot create session while simulation in progress')

        self._session_lock = True
        try:
            session_short_id = hex(uuid4().fields[0])
            session_logger = self._command_logger.getChild(session_short_id)
            self._broker.set_logger(session_logger)
            self.session = Session.build_and_prep(
                name=name,
                text=text,
                hardware=self._hardware,
                loop=self._loop,
                broker=self._broker,
                motion_lock=self._motion_lock)
        finally:
            self._session_lock = False

        return self.session

    def clear(self):
        if self._session_lock:
            raise Exception(
                'Cannot clear session while simulation in progress')

        if self.session:
            self._hardware.reset()
        self.session = None
        self._broker.set_logger(self._command_logger)

    def get_session(self):
        return self.session


class Session(object):
    TOPIC = 'session'

    @classmethod
    def build_and_prep(cls, name, text, hardware, loop, broker, motion_lock):
        sess = cls(name, text, hardware, loop, broker, motion_lock)
        sess.prepare()
        return sess

    def __init__(self, name, text, hardware, loop, broker, motion_lock):
        self._broker = broker
        self._default_logger = self._broker.logger
        self._sim_logger = self._broker.logger.getChild('sim')
        self._run_logger = self._broker.logger.getChild('run')
        self._loop = loop
        self.name = name
        self.protocol_text = text
        self._protocol = None
        self._hardware = hardware
        self._simulating_ctx = ProtocolContext(
            loop=self._loop, broker=self._broker)
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
        self.metadata = {}

        self.startTime = None
        self._motion_lock = motion_lock

    def prepare(self):
        self._hardware.discover_modules()
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
                ],
                context=self._simulating_ctx)
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
                ],
                context=self._simulating_ctx)
            for container in self._containers
        ]

    def get_modules(self):
        return [
            Module(module=module, context=self._simulating_ctx)
            for module in self._modules
        ]

    def clear_logs(self):
        self.command_log.clear()
        self.errors.clear()

    @_motion_lock
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

        unsubscribe = self._broker.subscribe(command_types.COMMAND, on_command)

        try:
            # ensure actual pipettes are cached before driver is disconnected
            if ff.use_protocol_api_v2():
                self._hardware.cache_instruments()
                instrs = {}
                for mount, pip in self._hardware.attached_instruments.items():
                    if pip:
                        instrs[mount] = {'model': pip['model'],
                                         'id': pip.get('pipette_id', '')}
                sim = adapters.SynchronousAdapter.build(
                    API.build_hardware_simulator,
                    instrs,
                    [mod.name()
                     for mod in self._hardware.attached_modules.values()],
                    strict_attached_instruments=False)
                sim.home()
                self._simulating_ctx = ProtocolContext(self._loop,
                                                       sim,
                                                       self._broker)
                if self._is_json_protocol:
                    run_protocol(protocol_json=self._protocol,
                                 simulate=True,
                                 context=self._simulating_ctx)
                else:
                    run_protocol(protocol_code=self._protocol,
                                 simulate=True,
                                 context=self._simulating_ctx)
            else:
                self._hardware.broker = self._broker
                self._hardware.cache_instrument_models()
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

    def refresh(self):
        self._reset()
        self._is_json_protocol = self.name.endswith('.json')

        if self._is_json_protocol:
            # TODO Ian 2018-05-16 use protocol JSON schema to raise
            # warning/error here if the protocol_text doesn't follow the schema
            self._protocol = json.loads(self.protocol_text)
            version = 'JSON'
        else:
            parsed = ast.parse(self.protocol_text, filename=self.name)
            self.metadata = extract_metadata(parsed)
            self._protocol = compile(parsed, filename=self.name, mode='exec')
            version = infer_version(self.metadata, parsed)

        log.info(f"Protocol API version: {version}")

        try:
            self._broker.set_logger(self._sim_logger)
            commands = self._simulate()
        except Exception:
            raise
        finally:
            self._broker.set_logger(self._default_logger)

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

    @_motion_lock  # noqa(C901)
    def _run(self):
        def on_command(message):
            if message['$'] == 'before':
                self.log_append()
            if message['name'] == command_types.PAUSE:
                self.set_state('paused')
            if message['name'] == command_types.RESUME:
                self.set_state('running')

        self._reset()

        _unsubscribe = self._broker.subscribe(
            command_types.COMMAND, on_command)

        self.startTime = now()
        self.set_state('running')

        try:
            self.resume()
            self._pre_run_hooks()
            if ff.use_protocol_api_v2():
                self._hardware.cache_instruments()
                ctx = ProtocolContext(loop=self._loop, broker=self._broker)
                ctx.connect(self._hardware)
                ctx.home()
                if self._is_json_protocol:
                    run_protocol(protocol_json=self._protocol, context=ctx)
                else:
                    run_protocol(protocol_code=self._protocol, context=ctx)
            else:
                self._hardware.broker = self._broker
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

    def run(self):
        try:
            self._broker.set_logger(self._run_logger)
            self._run()
        except Exception:
            raise
        finally:
            self._broker.set_logger(self._default_logger)
        return self

    def identify(self):
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

    def _reset(self):
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
        snap = self._snapshot()
        self._broker.publish(Session.TOPIC, snap)

    def _pre_run_hooks(self):
        self._hardware.home_z()


def extract_metadata(parsed):
    metadata = {}
    assigns = [
        obj for obj in parsed.body if isinstance(obj, ast.Assign)]
    for obj in assigns:
        if isinstance(obj.targets[0], ast.Name) \
                and obj.targets[0].id == 'metadata' \
                and isinstance(obj.value, ast.Dict):
            keys = [k.s for k in obj.value.keys]
            values = [v.s for v in obj.value.values]
            metadata = dict(zip(keys, values))
    return metadata


def infer_version_from_imports(parsed):
    # Imports in the form of `import opentrons.robot` will have an entry in
    # parsed.body[i].names[0].name in the form "opentrons.robot"
    ot_imports = list(filter(
        lambda x: 'opentrons' in x,
        [obj.names[0].name for obj in parsed.body
         if isinstance(obj, ast.Import)]))

    # Imports in the form of `from opentrons import robot` (with or without an
    # `as ___` statement) will have an entry in parsed.body[i].module
    # containing "opentrons"
    ot_from_imports = [
        obj.names[0].name for obj in parsed.body
        if isinstance(obj, ast.ImportFrom) and 'opentrons' in obj.module]

    # If any of these are populated, filter for entries with v1-specific terms
    opentrons_imports = ot_imports + ot_from_imports
    v1evidence = ['robot' in i or 'instruments' in i or 'modules' in i
                  for i in opentrons_imports]
    if any(v1evidence):
        return '1'
    else:
        return '2'


def infer_version(metadata, parsed):
    """
    Infer protocol API version based on a combination of metadata and imports.

    If a protocol specifies its API version using the 'apiLevel' key of a top-
    level dict variable named `metadata`, the value for that key will be
    returned as the version (the value will be stringified, so numeric or
    string values can be used).

    If that variable does not exist or if it does not contain the 'apiLevel'
    key, the API version will be inferred from the imports. A script with an
    import containing 'robot', 'instruments', or 'modules' will be assumed to
    be an APIv1 protocol. If none of these are present, it is assumed to be an
    APIv2 protocol (note that 'labware' is not in this list, as there is a
    valid APIv2 import named 'labware').
    """
    if metadata and \
            'apiLevel' in metadata and str(metadata['apiLevel']) in ['1', '2']:
        return str(metadata['apiLevel'])
    return infer_version_from_imports(parsed)


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
    if not placeable or isinstance(placeable, (Point, str)):
        res = None
    elif isinstance(placeable,
                    (ModulePlaceable, labware.ModuleGeometry)):
        res = placeable
    else:
        res = _get_parent_module(placeable.parent)
    return res


def _get_new_labware(loc):
    if isinstance(loc, Location):
        return _get_new_labware(loc.labware)
    elif isinstance(loc, labware.Well):
        return loc.parent
    elif isinstance(loc, labware.Labware):
        return loc
    else:
        raise TypeError(loc)


def _get_labware(command):
    containers = []
    instruments = []
    modules = []
    interactions = []

    location = command.get('location')
    instrument = command.get('instrument')

    placeable = location
    if isinstance(location, Location):
        placeable = location.labware
    elif isinstance(location, tuple):
        placeable = location[0]

    maybe_module = _get_parent_module(placeable)
    modules.append(maybe_module)

    locations = command.get('locations')

    if location:
        if isinstance(location, (Placeable)) or type(location) == tuple:
            # type()== used here instead of isinstance because a specific
            # named tuple like location descends from tuple and therefore
            # passes the check
            containers.append(get_container(location))
        elif isinstance(location, (Location, labware.Well, labware.Labware)):
            containers.append(_get_new_labware(location))

    if locations:
        if is_new_loc(locations):
            list_of_locations = listify(locations)
            containers.extend(
                [_get_new_labware(loc) for loc in list_of_locations])
        else:
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
