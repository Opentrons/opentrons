from __future__ import annotations
import asyncio
import functools
import logging
from copy import copy
from typing import Any, cast, Callable, Optional, Union, Set, TypeVar
from typing_extensions import TypedDict, Literal, Final

from opentrons.config import feature_flags as ff
from opentrons.broker import Broker
from opentrons.types import Point, Mount, Location
from opentrons.protocol_api import labware
from opentrons.hardware_control import CriticalPoint, ThreadedAsyncLock
from opentrons.hardware_control.types import OutOfBoundsMove, MotionChecks
from opentrons.hardware_control.adapters import SynchronousAdapter

from .models import Container, Instrument
from .util import robot_is_busy, RobotBusy


log = logging.getLogger(__name__)

State = Union[Literal['moving'], Literal['ready']]
VALID_STATES: Set[State] = {'moving', 'ready'}


def _well0(cont: labware.Labware) -> labware.Well:
    return cont.wells()[0]


Func = TypeVar('Func', bound=Callable)


def _home_if_first_call(func: Func) -> Func:
    """ Decorator to make a function home if it is the first one called in
    this session."""
    @functools.wraps(func)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        self = args[0]
        if not self._has_homed:
            log.info("this is the first calibration action, homing")
            self._hardware.home()
            self._has_homed = True
        return func(*args, **kwargs)
    return cast(Func, decorated)


class Message(TypedDict):
    topic: Literal['calibration']
    name: Literal['state']
    payload: CalibrationManager


class CalibrationManager(RobotBusy):
    """
    Serves endpoints that are primarily used in
    opentrons/app/ui/robot/api-client/client.js
    """
    TOPIC: Final = 'calibration'

    def __init__(
            self,
            hardware: SynchronousAdapter,
            loop: asyncio.AbstractEventLoop = None,
            broker: Broker = None,
            lock: ThreadedAsyncLock = None) -> None:
        self._broker = broker or Broker()
        self._hardware = hardware
        self._loop = loop
        self.state = 'ready'
        self._lock = lock or ThreadedAsyncLock()
        self._has_homed = False

    @property
    def busy_lock(self) -> ThreadedAsyncLock:
        return self._lock

    def _set_state(self, state: State) -> None:
        if state not in VALID_STATES:
            raise ValueError(
                'State {0} not in {1}'.format(state, VALID_STATES))
        self.state = state
        self._on_state_changed()

    @robot_is_busy
    @_home_if_first_call
    def tip_probe(self, instrument: Instrument) -> None:
        log.warning("Deprecated call to tip_probe, update app")
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def pick_up_tip(self, instrument: Instrument, container: Container) -> None:
        if not isinstance(container, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(container)))

        inst = instrument._instrument
        log.info('Picking up tip from {} in {} with {}'.format(
            container.name, container.slot, instrument.name))
        self._set_state('moving')
        with instrument._context.temp_connect(self._hardware):
            loc = _well0(container._container)
            instrument._context.location_cache =\
                Location(self._hardware.gantry_position(
                    Mount[inst.mount.upper()],
                    critical_point=CriticalPoint.NOZZLE,
                    refresh=True),
                    loc)
            loc_leg = _well0(container._container)
            inst.pick_up_tip(loc_leg)
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def drop_tip(self, instrument: Instrument, container: Container) -> None:
        if not isinstance(container, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(container)))

        inst = instrument._instrument
        log.info('Dropping tip from {} in {} with {}'.format(
            container.name, container.slot, instrument.name))
        self._set_state('moving')
        with instrument._context.temp_connect(self._hardware):
            instrument._context.location_cache = None
            inst.drop_tip(_well0(container._container))
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def return_tip(self, instrument: Instrument) -> None:
        inst = instrument._instrument
        log.info('Returning tip from {}'.format(instrument.name))
        self._set_state('moving')
        with instrument._context.temp_connect(self._hardware):
            instrument._context.location_cache = None
            inst.return_tip()
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def move_to_front(self, instrument: Instrument) -> None:
        """Public face of move_to_front"""
        self._move_to_front(instrument)

    def _move_to_front(self, instrument: Instrument) -> None:
        """Private move_to_front that can be called internally"""
        inst = instrument._instrument
        log.info('Moving {}'.format(instrument.name))
        self._set_state('moving')
        current = self._hardware.gantry_position(
            Mount[inst.mount.upper()],
            critical_point=CriticalPoint.NOZZLE,
            refresh=True)
        dest = instrument._context.deck.position_for(5) \
            .point._replace(z=150)
        self._hardware.move_to(Mount[inst.mount.upper()],
                               current,
                               critical_point=CriticalPoint.NOZZLE)
        self._hardware.move_to(Mount[inst.mount.upper()],
                               dest._replace(z=current.z),
                               critical_point=CriticalPoint.NOZZLE)
        self._hardware.move_to(Mount[inst.mount.upper()],
                               dest, critical_point=CriticalPoint.NOZZLE)
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def move_to(self, instrument: Instrument, container: Container) -> None:
        if not isinstance(container, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(container)))

        inst = instrument._instrument
        cont = container._container
        target = _well0(cont).top()

        log.info('Moving {} to {} in {}'.format(
            instrument.name, container.name, container.slot))
        self._set_state('moving')

        with instrument._context.temp_connect(self._hardware):
            instrument._context.location_cache = None
            inst.move_to(target)

        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def jog(self, instrument: Instrument, distance: float, axis: str) -> None:
        inst = instrument._instrument
        log.info('Jogging {} by {} in {}'.format(
            instrument.name, distance, axis))
        self._set_state('moving')
        try:
            self._hardware.move_rel(
                Mount[inst.mount.upper()], Point(**{axis: distance}),
                check_bounds=MotionChecks.HIGH)
        except OutOfBoundsMove:
            log.exception('Out of bounds jog')
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def home(self, instrument: Instrument) -> None:
        inst = instrument._instrument
        log.info('Homing {}'.format(instrument.name))
        self._set_state('moving')
        with instrument._context.temp_connect(self._hardware):
            instrument._context.location_cache = None
            inst.home()
        self._set_state('ready')

    @robot_is_busy
    def home_all(self, instrument: Instrument) -> None:
        # NOTE: this only takes instrument as a param, because we need
        # its reference to the ProtocolContext. This is code smell that
        # will be removed once sessions are managed better
        log.info('Homing via Calibration Manager')
        self._set_state('moving')
        with instrument._context.temp_connect(self._hardware):
            instrument._context.home()
        self._set_state('ready')

    @robot_is_busy
    def update_container_offset(
            self, container: Container, instrument: Instrument) -> None:
        inst = instrument._instrument
        log.info('Updating {} in {}'.format(container.name, container.slot))
        if 'centerMultichannelOnWells' in container._container.quirks:
            cp: Optional[CriticalPoint] = CriticalPoint.XY_CENTER
        else:
            cp = None
        here = self._hardware.gantry_position(Mount[inst.mount.upper()],
                                              critical_point=cp,
                                              refresh=True)
        # Reset calibration so we don’t actually calibrate the offset
        # relative to the old calibration
        container._container.set_calibration(Point(0, 0, 0))
        if ff.calibrate_to_bottom() and not (
                container._container.is_tiprack):
            orig = _well0(container._container).geometry.bottom()
        else:
            orig = _well0(container._container).geometry.top()
        delta = here - orig
        labware.save_calibration(container._container, delta)

    def _snapshot(self) -> Message:
        return {
            'topic': CalibrationManager.TOPIC,
            'name': 'state',
            'payload': copy(self)
        }

    def _on_state_changed(self) -> None:
        self._broker.publish(CalibrationManager.TOPIC, self._snapshot())
