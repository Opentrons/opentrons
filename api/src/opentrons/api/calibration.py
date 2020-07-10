import functools
import logging
from copy import copy
from typing import Optional

from opentrons.util import calibration_functions
from opentrons.config import feature_flags as ff
from opentrons.calibration_storage import modify
from opentrons.broker import Broker
from opentrons.types import Point, Mount, Location
from opentrons.protocol_api import labware
from opentrons.hardware_control import CriticalPoint, ThreadedAsyncLock

from .models import Container
from .util import robot_is_busy, RobotBusy


log = logging.getLogger(__name__)

VALID_STATES = {'probing', 'moving', 'ready'}


# This hack is because if you have an old container that uses Placeable with
# just one well, Placeable.wells() returns the Well rather than [Well].
# Passing the well as an argument, though, will always return the well.
def _well0(cont):
    if isinstance(cont, labware.Labware):
        return cont.wells()[0]
    else:
        return cont.wells(0)


def _home_if_first_call(func):
    """ Decorator to make a function home if it is the first one called in
    this session."""
    @functools.wraps(func)
    def decorated(*args, **kwargs):
        self = args[0]
        if not self._has_homed:
            log.info("this is the first calibration action, homing")
            self._hardware.home()
            self._has_homed = True
        return func(*args, **kwargs)
    return decorated


class CalibrationManager(RobotBusy):
    """
    Serves endpoints that are primarily used in
    opentrons/app/ui/robot/api-client/client.js
    """
    TOPIC = 'calibration'

    def __init__(self, hardware, loop=None, broker=None, lock=None):
        self._broker = broker or Broker()
        self._hardware = hardware
        self._loop = loop
        self.state = None
        self._lock = lock
        self._has_homed = False

    @property
    def busy_lock(self) -> ThreadedAsyncLock:
        return self._lock

    def _set_state(self, state):
        if state not in VALID_STATES:
            raise ValueError(
                'State {0} not in {1}'.format(state, VALID_STATES))
        self.state = state
        self._on_state_changed()

    @robot_is_busy
    @_home_if_first_call
    def tip_probe(self, instrument):
        inst = instrument._instrument
        log.info('Probing tip with {}'.format(instrument.name))
        self._set_state('probing')

        if instrument._context:
            instrument._context.location_cache = None
            mount = Mount[instrument._instrument.mount.upper()]
            assert instrument.tip_racks,\
                'No known tipracks for {}'.format(instrument)
            tip_length = inst._tip_length_for(
                instrument.tip_racks[0]._container)
            # TODO (tm, 2019-04-22): This warns "coroutine not awaited" in
            # TODO: test. The test fixture probably needs to be modified to get
            # TODO: a synchronous adapter instead of a raw hardware_control API
            #             finally:
            measured_center = self._hardware.locate_tip_probe_center(
                mount, tip_length)
        else:
            measured_center = calibration_functions.probe_instrument(
                instrument=inst,
                robot=inst.robot)

        log.info('Measured probe top center: {0}'.format(measured_center))

        if instrument._context:
            self._hardware.update_instrument_offset(
                Mount[instrument._instrument.mount.upper()],
                from_tip_probe=measured_center)
            config = self._hardware.config
        else:
            config = calibration_functions.update_instrument_config(
                instrument=inst,
                measured_center=measured_center)

        log.info('New config: {0}'.format(config))

        self._move_to_front(instrument)
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def pick_up_tip(self, instrument, container):
        if not isinstance(container, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(container)))

        inst = instrument._instrument
        log.info('Picking up tip from {} in {} with {}'.format(
            container.name, container.slot, instrument.name))
        self._set_state('moving')
        if instrument._context:
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
        else:
            inst.pick_up_tip(_well0(container._container))
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def drop_tip(self, instrument, container):
        if not isinstance(container, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(container)))

        inst = instrument._instrument
        log.info('Dropping tip from {} in {} with {}'.format(
            container.name, container.slot, instrument.name))
        self._set_state('moving')
        if instrument._context:
            with instrument._context.temp_connect(self._hardware):
                instrument._context.location_cache = None
                inst.drop_tip(_well0(container._container))
        else:
            inst.drop_tip(_well0(container._container))
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def return_tip(self, instrument):
        inst = instrument._instrument
        log.info('Returning tip from {}'.format(instrument.name))
        self._set_state('moving')
        if instrument._context:
            with instrument._context.temp_connect(self._hardware):
                instrument._context.location_cache = None
                inst.return_tip()
        else:
            inst.return_tip()
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def move_to_front(self, instrument):
        """Public face of move_to_front"""
        self._move_to_front(instrument)

    def _move_to_front(self, instrument):
        """Private move_to_front that can be called internally"""
        inst = instrument._instrument
        log.info('Moving {}'.format(instrument.name))
        self._set_state('moving')
        if instrument._context:
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
        else:
            calibration_functions.move_instrument_for_probing_prep(
                inst, inst.robot)
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def move_to(self, instrument, container):
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

        if instrument._context:
            with instrument._context.temp_connect(self._hardware):
                instrument._context.location_cache = None
                inst.move_to(target)
        else:
            inst.move_to(target)

        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def jog(self, instrument, distance, axis):
        inst = instrument._instrument
        log.info('Jogging {} by {} in {}'.format(
            instrument.name, distance, axis))
        self._set_state('moving')
        if instrument._context:
            self._hardware.move_rel(
                Mount[inst.mount.upper()], Point(**{axis: distance}))
        else:
            calibration_functions.jog_instrument(
                instrument=inst,
                distance=distance,
                axis=axis,
                robot=inst.robot)
        self._set_state('ready')

    @robot_is_busy
    @_home_if_first_call
    def home(self, instrument):
        inst = instrument._instrument
        log.info('Homing {}'.format(instrument.name))
        self._set_state('moving')
        if instrument._context:
            with instrument._context.temp_connect(self._hardware):
                instrument._context.location_cache = None
                inst.home()
        else:
            inst.home()
        self._set_state('ready')

    @robot_is_busy
    def home_all(self, instrument):
        # NOTE: this only takes instrument as a param, because we need
        # its reference to the ProtocolContext. This is code smell that
        # will be removed once sessions are managed better
        log.info('Homing via Calibration Manager')
        self._set_state('moving')
        if instrument._context:
            with instrument._context.temp_connect(self._hardware):
                instrument._context.home()
        else:
            self._hardware.home()
        self._set_state('ready')

    @robot_is_busy
    def update_container_offset(self, container, instrument):
        inst = instrument._instrument
        log.info('Updating {} in {}'.format(container.name, container.slot))
        if instrument._context:
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
                orig = _well0(container._container)._bottom().point
            else:
                orig = _well0(container._container)._top().point
            delta = here - orig
            modify.save_calibration(container._container, delta)
        else:
            inst.robot.calibrate_container_with_instrument(
                container=container._container,
                instrument=inst,
                save=True
            )

    def _snapshot(self):
        return {
            'topic': CalibrationManager.TOPIC,
            'name': 'state',
            'payload': copy(self)
        }

    def _on_state_changed(self):
        self._hardware._use_safest_height = (self.state in
                                             ['probing', 'moving'])
        self._broker.publish(CalibrationManager.TOPIC, self._snapshot())
