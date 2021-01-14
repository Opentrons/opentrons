from __future__ import annotations
import asyncio
import base64
from copy import copy
from functools import reduce
import logging
from time import time, sleep
from typing import (
    cast, List, Dict, Any, Optional, Set, Sequence, Tuple, TypeVar, Iterator)
from typing_extensions import Final
from uuid import uuid4

from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons.api.util import (RobotBusy, robot_is_busy,
                                requires_http_protocols_disabled)
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieAlarm
from opentrons.broker import Broker
from opentrons.config import feature_flags as ff
from opentrons.commands.util import from_list
from opentrons.commands import types as command_types, introspection
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.implementations.protocol_context import \
    ProtocolContextImplementation
from opentrons.protocols.parse import parse
from opentrons.protocols.types import Protocol
from opentrons.calibration_storage import helpers
from opentrons.protocol_api import (ProtocolContext,
                                    InstrumentContext,
                                    labware)
from opentrons.protocols.geometry import module_geometry
from opentrons.protocols.execution.execute import run_protocol
from opentrons.hardware_control import (API, ThreadManager,
                                        SynchronousAdapter,
                                        ExecutionCancelledError,
                                        ThreadedAsyncLock)
from opentrons.hardware_control.types import (DoorState, HardwareEventType,
                                              HardwareEvent)
from .models import Container, Instrument, Module
from .dev_types import State, StateInfo, Message, LastCommand, Error, CommandShortId

log = logging.getLogger(__name__)

VALID_STATES: Set[State] = {
    'loaded', 'running', 'finished', 'stopped', 'paused', 'error'}


class SessionManager:
    def __init__(
            self,
            hardware: SynchronousAdapter,
            loop: asyncio.AbstractEventLoop = None,
            broker: Broker = None,
            lock: ThreadedAsyncLock = None) -> None:
        self._broker = broker or Broker()
        self._loop = loop or asyncio.get_event_loop()
        self.session: Optional[Session] = None
        self._session_lock = False
        self._hardware = hardware
        self._command_logger = logging.getLogger(
            'opentrons.server.command_logger')
        self._broker.set_logger(self._command_logger)
        self._motion_lock = lock or ThreadedAsyncLock()

    @requires_http_protocols_disabled
    def create(
            self,
            name: str,
            contents: str,
            is_binary: bool = False) -> Session:
        """ Create a protocol session from either

        - a json protocol
        - a python protocol file
        - a zipped protocol bundle (deprecated, for back compat)

        No new code should be written that calls this function with
        ``is_binary=True`` and a base64'd zip in ``contents``; instead,
        use :py:meth:`.create_from_bundle`.

        :param str name: The name of the protocol
        :param str contents: The contents of the protocol; this should be
                             either the contents of the file if it can be
                             parsed directly or a base64d version of the
                             contents if it is a zip. If it is base64,
                             ``is_binary`` must be true. Do not write new
                             code that uses this.
        :param bool is_binary: ``True`` if ``contents`` is a base64'd zip.
                               Do not write new code that uses this.
        :returns Session: The created session.
        :raises Exception: If another session is simulating at the time

        .. note::

            This function is mostly (only) intended to be called via rpc.
        """
        if is_binary:
            log.warning("session.create: called with bundle")

        if self._session_lock:
            raise Exception(
                'Cannot create session while simulation in progress')

        self.clear()
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
                motion_lock=self._motion_lock,
                extra_labware=[])
            return self.session
        finally:
            self._session_lock = False

    @requires_http_protocols_disabled
    def create_from_bundle(self, name: str, contents: str) -> Session:
        """ Create a protocol session from a base64'd zip file.

        :param str name: The name of the protocol
        :param str contents: The contents of the zip file, base64
                             encoded
        :returns Session: The created session
        :raises Exception: If another session is simulating at the time

        .. note::

            This function is mostly (only) intended to be called via rpc.
        """
        if self._session_lock:
            raise Exception(
                'Cannot create session while simulation in progress')

        self.clear()
        self._session_lock = True
        try:
            _contents = base64.b64decode(contents)
            session_short_id = hex(uuid4().fields[0])
            session_logger = self._command_logger.getChild(session_short_id)
            self._broker.set_logger(session_logger)
            self.session = Session.build_and_prep(
                name=name,
                contents=_contents,
                hardware=self._hardware,
                loop=self._loop,
                broker=self._broker,
                motion_lock=self._motion_lock,
                extra_labware=[])
            return self.session
        finally:
            self._session_lock = False

    @requires_http_protocols_disabled
    def create_with_extra_labware(
            self,
            name: str,
            contents: str,
            extra_labware: List[LabwareDefinition]) -> Session:
        """
        Create a protocol session from a python protocol string with a list
        of extra custom labware to make available.

        :param str name: The name of the protocol
        :param str contents: The contents of the protocol file
        :param extra_labware: A list of labware definitions to make available
                              to protocol executions. This should be a list
                              of directly serialized definitions.
        :returns Session: The created session
        :raises Exception: If another session is simulating at the time

        .. note::

            This function is mostly (only) intended to be called via rpc.
        """
        if self._session_lock:
            raise Exception(
                "Cannot create session while simulation in progress")

        self.clear()
        self._session_lock = True
        try:
            session_short_id = hex(uuid4().fields[0])
            session_logger = self._command_logger.getChild(session_short_id)
            self._broker.set_logger(session_logger)
            self.session = Session.build_and_prep(
                name=name,
                contents=contents,
                hardware=self._hardware,
                loop=self._loop,
                broker=self._broker,
                motion_lock=self._motion_lock,
                extra_labware=extra_labware)
            return self.session
        finally:
            self._session_lock = False

    def clear(self) -> None:
        if self._session_lock:
            raise Exception(
                'Cannot clear session while simulation in progress')

        if self.session:
            self.session._remove_hardware_event_watcher()
            self._hardware.reset()
        self.session = None
        self._broker.set_logger(self._command_logger)

    def get_session(self) -> Optional[Session]:
        return self.session


class Session(RobotBusy):
    TOPIC: Final = 'session'

    @classmethod
    def build_and_prep(
            cls,
            name: str,
            contents: Any,
            hardware: SynchronousAdapter,
            loop: asyncio.AbstractEventLoop,
            broker: Broker,
            motion_lock: ThreadedAsyncLock,
            extra_labware: List[LabwareDefinition]
    ) -> Session:
        protocol = parse(contents, filename=name,
                         extra_labware={helpers.uri_from_definition(defn): defn
                                        for defn in extra_labware})
        sess = cls(name, protocol, hardware, loop, broker, motion_lock)
        sess.prepare()
        return sess

    def __init__(
            self, name: str, protocol: Protocol,
            hardware: SynchronousAdapter,
            loop: asyncio.AbstractEventLoop,
            broker: Broker,
            motion_lock: ThreadedAsyncLock) -> None:
        self._broker = broker
        self._default_logger = self._broker.logger
        self._sim_logger = self._broker.logger.getChild('sim')
        self._run_logger = self._broker.logger.getChild('run')
        self._loop = loop
        self.name = name
        self._protocol = protocol
        self.api_level = getattr(self._protocol, 'api_level', APIVersion(2, 0))
        self._use_v2 = self.api_level >= APIVersion(2, 0)
        log.info(
            f'Protocol API Version: {self.api_level}; '
            f'Protocol kind: {type(self._protocol)}')

        # self.metadata is exposed via rpc
        self.metadata = getattr(self._protocol, 'metadata', {})

        self._hardware = hardware
        self._simulating_ctx = ProtocolContext.build_using(
            implementation=ProtocolContextImplementation.build_using(
                self._protocol),
            protocol=self._protocol,
            loop=self._loop,
            broker=self._broker
        )

        self.state: 'State' = None
        #: The current state
        self.stateInfo: 'StateInfo' = {}
        #: A message associated with the current state
        self.commands: List[command_types.CommandMessage] = []
        self.command_log: Dict[int, int] = {}
        self.errors: List[Error] = []

        # Underlying objects harvested from commands, internal
        self._containers: List[labware.Labware] = []
        self._instruments: List[InstrumentContext] = []
        self._modules: List[module_geometry.ModuleGeometry] = []
        self._interactions: List[Tuple[InstrumentContext, labware.Labware]] = []

        # RPC-safe models of objects harvested from commands
        self.instruments: Optional[List[Instrument]] = None
        self.containers: Optional[List[Container]] = None
        self.modules: Optional[List[Module]] = None
        self.protocol_text = protocol.text

        self.startTime: Optional[float] = None
        self._motion_lock = motion_lock
        self._event_watcher = None
        self.door_state: Optional[str] = None
        self.blocked: Optional[bool] = None

    @property
    def busy_lock(self) -> ThreadedAsyncLock:
        return self._motion_lock

    def _hw_iface(self) -> SynchronousAdapter:
        return self._hardware

    def prepare(self) -> None:
        self.refresh()

    def get_instruments(self) -> List[Instrument]:
        return [
            Instrument(
                instrument=instrument,
                containers=[
                    container
                    for _instrument, container in
                    self._interactions
                    if _instrument == instrument
                ],
                context=self._use_v2 and self._simulating_ctx)
            for instrument in self._instruments
        ]

    def get_containers(self) -> List[Container]:
        return [
            Container(
                container=container,
                instruments=[
                    instrument
                    for instrument, _container in
                    self._interactions
                    if _container == container
                ],
                context=self._use_v2 and self._simulating_ctx)
            for container in self._containers
        ]

    def get_modules(self) -> List[Module]:
        return [
            Module(module=module,
                   context=self._use_v2 and self._simulating_ctx)
            for module in self._modules
        ]

    def clear_logs(self) -> None:
        self.command_log.clear()
        self.errors.clear()

    @robot_is_busy
    def _simulate(self) -> List[CommandShortId]:
        self._reset()

        stack: List[command_types.CommandMessage] = []
        res: List[CommandShortId] = []
        commands: List[command_types.CommandPayload] = []

        self._containers.clear()
        self._instruments.clear()
        self._modules.clear()
        self._interactions.clear()

        def on_command(message: command_types.CommandMessage) -> None:
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
            self._hardware.cache_instruments()
            instrs = {}
            for mount, pip in self._hardware.attached_instruments.items():
                if pip:
                    instrs[mount] = {'model': pip['model'],
                                     'id': pip.get('pipette_id', '')}
            sync_sim = ThreadManager(
                    API.build_hardware_simulator,
                    instrs,
                    [mod.name()
                        for mod in self._hardware.attached_modules],
                    strict_attached_instruments=False
                    ).sync
            sync_sim.home()
            ctx_impl = ProtocolContextImplementation.build_using(
                self._protocol,
                hardware=sync_sim,
                extra_labware=getattr(self._protocol, 'extra_labware', {}))
            self._simulating_ctx = ProtocolContext.build_using(
                protocol=self._protocol,
                loop=self._loop,
                broker=self._broker,
                implementation=ctx_impl
            )
            run_protocol(self._protocol,
                         context=self._simulating_ctx)

        finally:
            unsubscribe()

            instruments, containers, modules, interactions = _accumulate(
                [_get_labware(command) for command in commands])

            self._containers.extend(_dedupe(containers))
            self._instruments.extend(_dedupe(
                instruments
                + list(self._simulating_ctx.loaded_instruments.values())))
            self._modules.extend(_dedupe(
                modules
                + [m._geometry
                   for m in self._simulating_ctx.loaded_modules.values()]))
            self._interactions.extend(_dedupe(interactions))

            # Labware calibration happens after simulation and before run, so
            # we have to clear the tips if they are left on after simulation
            # to ensure that the instruments are in the expected state at the
            # beginning of the labware calibration flow

        return res

    def refresh(self) -> None:
        self._reset()

        try:
            self._broker.set_logger(self._sim_logger)
            commands = self._simulate()
        except Exception:
            raise
        finally:
            self._broker.set_logger(self._default_logger)

        self.commands = from_list(commands)

        self.containers = self.get_containers()
        self.instruments = self.get_instruments()
        self.modules = self.get_modules()
        self.startTime = None
        self.set_state('loaded')

    def stop(self) -> None:
        self._hw_iface().halt()
        with self._motion_lock.lock():
            try:
                self._hw_iface().stop()
            except asyncio.CancelledError:
                pass
        self.set_state('stopped')

    def pause(self,
              reason: str = None,
              user_message: str = None,
              duration: float = None) -> None:
        self._hardware.pause()
        self.set_state(
            'paused', reason=reason,
            user_message=user_message, duration=duration)

    def resume(self) -> None:
        if not self.blocked:
            self._hardware.resume()
            self.set_state('running')

    def _start_hardware_event_watcher(self) -> None:
        if not callable(self._event_watcher):
            # initialize and update window switch state
            self._update_window_state(self._hardware.door_state)
            log.info('Starting hardware event watcher')
            self._event_watcher = self._hardware.register_callback(
                self._handle_hardware_event)
        else:
            log.warning("Cannot start new hardware event watcher "
                        "when one already exists")

    def _remove_hardware_event_watcher(self) -> None:
        if self._event_watcher and callable(self._event_watcher):
            self._event_watcher()
            self._event_watcher = None

    def _handle_hardware_event(self, hw_event: HardwareEvent) -> None:
        if hw_event.event == HardwareEventType.DOOR_SWITCH_CHANGE:
            self._update_window_state(hw_event.new_state)
            if ff.enable_door_safety_switch() and \
                    hw_event.new_state == DoorState.OPEN and \
                    self.state == 'running':
                self.pause('Robot door is open')
            else:
                self._on_state_changed()

    def _update_window_state(self, state: DoorState) -> None:
        self.door_state = str(state)
        if ff.enable_door_safety_switch() and \
                state == DoorState.OPEN:
            self.blocked = True
        else:
            self.blocked = False

    @robot_is_busy  # noqa(C901)
    def _run(self) -> None:
        def on_command(message: command_types.CommandMessage) -> None:
            if message['$'] == 'before':
                self.log_append()
            if message['name'] == command_types.PAUSE:
                self.set_state('paused',
                               reason='The protocol paused execution',
                               user_message=message['payload']['userMessage'])
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
            self._hardware.cache_instruments()
            self._hardware.reset_instrument()
            ctx_impl = ProtocolContextImplementation.build_using(
                self._protocol,
                extra_labware=getattr(self._protocol, 'extra_labware', {}))
            ctx = ProtocolContext.build_using(
                protocol=self._protocol,
                implementation=ctx_impl,
                loop=self._loop,
                broker=self._broker
            )
            ctx.connect(self._hardware)
            ctx.home()
            run_protocol(self._protocol, context=ctx)

            # If the last command in a protocol was a pause, the protocol
            # will immediately finish executing because there's no smoothie
            # command to block... except the home that's about to happen,
            # which will confuse the app and lock it up. So we need to
            # do our own pause here, and sleep the thread until/unless the
            # app resumes us.
            #
            # Cancelling from the app during this pause will result in the
            # smoothie giving us an error during the subsequent home, which
            # is tragic but expected.
            while self.state == 'paused':
                sleep(0.1)
            self.set_state('finished')
            self._hw_iface().home()
        except (SmoothieAlarm, asyncio.CancelledError,
                ExecutionCancelledError):
            log.info("Protocol cancelled")
        except Exception as e:
            log.exception("Exception during run:")
            self.error_append(e)
            self.set_state('error')
            raise e
        finally:
            _unsubscribe()

    def run(self) -> None:
        if not self.blocked:
            try:
                self._broker.set_logger(self._run_logger)
                self._run()
            except Exception:
                raise
            finally:
                self._broker.set_logger(self._default_logger)
        else:
            raise RuntimeError(
                'Protocol is blocked and cannot run. Make sure robot door '
                'is closed before running.')

    def set_state(self, state: 'State',
                  reason: str = None,
                  user_message: str = None,
                  duration: float = None) -> None:
        log.info(f"Session.set_state state={state} "
                 f"user_message={user_message} duration={duration} "
                 f"reason={reason}")
        if state not in VALID_STATES:
            raise ValueError(
                'Invalid state: {0}. Valid states are: {1}'
                .format(state, VALID_STATES))
        self.state = state
        if user_message:
            self.stateInfo['userMessage'] = user_message
        else:
            self.stateInfo.pop('userMessage', None)
        if reason:
            self.stateInfo['message'] = reason
        else:
            self.stateInfo.pop('message', None)
        if duration:
            self.stateInfo['estimatedDuration'] = duration
        else:
            self.stateInfo.pop('estimatedDuration', None)
        if self.startTime:
            self.stateInfo['changedAt'] = now()-self.startTime
        else:
            self.stateInfo.pop('changedAt', None)
        self._on_state_changed()

    def log_append(self) -> None:
        self.command_log.update({
            len(self.command_log): now()})
        self._on_state_changed()

    def error_append(self, error: Exception) -> None:
        self.errors.append(
            {
                'timestamp': now(),
                'error': error
            }
        )

    def _reset(self) -> None:
        self._hw_iface().reset()
        self.clear_logs()
        # unregister existing event watcher
        self._remove_hardware_event_watcher()
        self._start_hardware_event_watcher()

    def _snapshot(self) -> Message:
        if self.state == 'loaded':
            payload: Any = copy(self)
        else:
            if self.command_log.keys():
                idx = sorted(self.command_log.keys())[-1]
                timestamp = self.command_log[idx]
                last_command: Optional[LastCommand]\
                    = {'id': idx, 'handledAt': timestamp}
            else:
                last_command = None

            payload = {
                'state': self.state,
                'stateInfo': self.stateInfo,
                'startTime': self.startTime,
                'doorState': self.door_state,
                'blocked': self.blocked,
                'errors': self.errors,
                'lastCommand': last_command
            }
        return {
            'topic': Session.TOPIC,
            'payload': payload
        }

    def _on_state_changed(self) -> None:
        snap = self._snapshot()
        self._broker.publish(Session.TOPIC, snap)

    def _pre_run_hooks(self) -> None:
        self._hw_iface().home_z()


CommandReferents = Tuple[
    List[InstrumentContext], List[labware.Labware],
    List[module_geometry.ModuleGeometry],
    List[Tuple[InstrumentContext, labware.Labware]]]


def _accumulate(iterable: Sequence[CommandReferents]) -> CommandReferents:

    def _reducer(acc: CommandReferents, item: CommandReferents) -> CommandReferents:
        return (acc[0] + item[0],
                acc[1] + item[1],
                acc[2] + item[2],
                acc[3] + item[3])

    return reduce(
        _reducer,
        iterable,
        cast(CommandReferents, ([], [], [], [])))


It = TypeVar('It')


def _dedupe(iterable: Sequence[It]) -> Iterator[It]:
    acc: Set[It] = set()

    for item in iterable:
        if item not in acc:
            acc.add(item)
            yield item


def now() -> int:
    return int(time() * 1000)


def _get_labware(
        command: command_types.CommandPayload) -> CommandReferents:
    interactions: List[Tuple[InstrumentContext, labware.Labware]] = []

    try:
        instruments, containers, modules = introspection.get_referred_objects(command)
    except ValueError:
        log.exception(f'Cant handle location in command {command!r}')
        instruments = []
        containers = []
        modules = []

    for instrument in instruments:
        interactions.extend([(instrument, container) for container in containers])

    return instruments, containers, modules, interactions
