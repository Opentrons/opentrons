import asyncio
import base64
from copy import copy
from functools import reduce, wraps
import logging
from time import time
from uuid import uuid4
from opentrons.broker import Broker
from opentrons.commands import tree, types as command_types
from opentrons.commands.commands import is_new_loc, listify
from opentrons.config import feature_flags as ff
from opentrons.protocols.types import JsonProtocol, PythonProtocol
from opentrons.protocols.parse import parse
from opentrons.types import Location, Point
from opentrons.protocol_api import (ProtocolContext,
                                    labware)
from opentrons.protocol_api.execute import run_protocol
from opentrons.hardware_control import adapters, API
from .models import Container, Instrument, Module

from opentrons.legacy_api.containers.placeable import (
    Module as ModulePlaceable, Placeable)
if not ff.use_protocol_api_v2():
    from opentrons.legacy_api.containers import get_container, location_to_list

    from opentrons.legacy_api.protocols import execute_protocol

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
    def __init__(
            self, hardware, loop=None, broker=None, lock=None):
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

    def create(self, name, contents, is_binary=False):
        if self._session_lock:
            raise Exception(
                'Cannot create session while simulation in progress')

        self._session_lock = True
        try:
            _contents = base64.b64decode(contents) if is_binary else contents
            session_short_id = hex(uuid4().fields[0])
            session_logger = self._command_logger.getChild(session_short_id)
            self._broker.set_logger(session_logger)
            self.session = Session.build_and_prep(
                name=name,
                contents=_contents,
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
    def build_and_prep(
        cls, name, contents, hardware, loop, broker, motion_lock
    ):
        protocol = parse(contents, filename=name)
        sess = cls(name, protocol, hardware, loop, broker, motion_lock)
        sess.prepare()
        return sess

    def __init__(self, name, protocol, hardware, loop, broker, motion_lock):
        self._broker = broker
        self._default_logger = self._broker.logger
        self._sim_logger = self._broker.logger.getChild('sim')
        self._run_logger = self._broker.logger.getChild('run')
        self._loop = loop
        self.name = name
        self._protocol = protocol
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
        self.api_level = None
        self.protocol_text = protocol.text

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
                self._simulating_ctx = ProtocolContext(
                    loop=self._loop,
                    hardware=sim,
                    broker=self._broker)
                run_protocol(self._protocol,
                             simulate=True,
                             context=self._simulating_ctx)
            else:
                self._hardware.broker = self._broker
                self._hardware.cache_instrument_models()
                self._hardware.disconnect()
                if isinstance(self._protocol, JsonProtocol):
                    execute_protocol(self._protocol)
                else:
                    exec(self._protocol.contents, {})
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
        self.api_level = 2 if ff.use_protocol_api_v2() else 1
        # self.metadata is exposed via jrpc
        if isinstance(self._protocol, PythonProtocol):
            self.metadata = self._protocol.metadata
            if ff.use_protocol_api_v2()\
               and self._protocol.api_level == '1'\
               and not ff.enable_back_compat():
                raise RuntimeError(
                    'This protocol targets Protocol API V1, but the robot is '
                    'set to Protocol API V2. If this is actually a V2 '
                    'protocol, please set the \'apiLevel\' to \'2\' in the '
                    'metadata. If you do not want to be on API V2, please '
                    'disable the \'Use Protocol API version 2\' toggle in the '
                    'robot\'s Advanced Settings and restart the robot.')

            log.info(f"Protocol API version: {self._protocol.api_level}")
        else:
            self.metadata = {}
            log.info(f"JSON protocol")

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
        self._hardware.halt()
        self._hardware.stop()
        self.set_state('stopped')
        return self

    def pause(self):
        if ff.use_protocol_api_v2():
            self._hardware.pause()
        # robot.pause in the legacy API will publish commands to the broker
        # use the broker-less execute_pause instead
        else:
            self._hardware.execute_pause()

        self.set_state('paused')
        return self

    def resume(self):
        if ff.use_protocol_api_v2():
            self._hardware.resume()
        # robot.resume in the legacy API will publish commands to the broker
        # use the broker-less execute_resume instead
        else:
            self._hardware.execute_resume()

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
                bundled_data = None
                bundled_labware = None
                if isinstance(self._protocol, PythonProtocol):
                    bundled_data = self._protocol.bundled_data
                    bundled_labware = self._protocol.bundled_labware
                self._hardware.cache_instruments()
                ctx = ProtocolContext(loop=self._loop,
                                      broker=self._broker,
                                      bundled_labware=bundled_labware,
                                      bundled_data=bundled_data)
                ctx.connect(self._hardware)
                ctx.home()
                run_protocol(self._protocol, context=ctx)
            else:
                self._hardware.broker = self._broker
                if isinstance(self._protocol, JsonProtocol):
                    execute_protocol(self._protocol)
                else:
                    exec(self._protocol.contents, {})
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
