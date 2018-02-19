import logging
from copy import copy

from opentrons.util import calibration_functions
from opentrons.broker import publish

from .models import Container

log = logging.getLogger(__name__)

VALID_STATES = {'probing', 'moving', 'ready'}


class CalibrationManager:
    """
    Serves endpoints that are primarily used in
    opentrons/app/ui/robot/api-client/client.js
    """
    TOPIC = 'calibration'

    def __init__(self, loop=None, robot=None):
        self._loop = loop
        self.state = None
        self.robot = robot

    def _set_state(self, state):
        if state not in VALID_STATES:
            raise ValueError(
                'State {0} not in {1}'.format(state, VALID_STATES))
        self.state = state
        # if self.robot:
        #     self.robot._use_safest_height = (state in ['probing', 'moving'])
        self._on_state_changed()

    def tip_probe(self, instrument):
        inst = instrument._instrument
        log.info('Probing tip with {}'.format(instrument.name))
        self._set_state('probing')

        measured_center = calibration_functions.probe_instrument(
            instrument=inst,
            robot=inst.robot)

        log.debug('Measured probe top center: {0}'.format(measured_center))

        config = calibration_functions.update_instrument_config(
            instrument=inst,
            measured_center=measured_center
        )

        log.info('New config: {0}'.format(config))

        calibration_functions.move_instrument_for_probing_prep(
            inst, inst.robot
        )

        self._set_state('ready')

    def pick_up_tip(self, instrument, container):
        if not isinstance(container, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(container)))

        inst = instrument._instrument
        log.info('Picking up tip from {} in {} with {}'.format(
            container.name, container.slot, instrument.name))
        self._set_state('moving')
        inst.pick_up_tip(container._container[0])
        self._set_state('ready')

    def drop_tip(self, instrument, container):
        if not isinstance(container, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(container)))

        inst = instrument._instrument
        log.info('Dropping tip from {} in {} with {}'.format(
            container.name, container.slot, instrument.name))
        self._set_state('moving')
        inst.drop_tip(container._container[0], home_after=True)
        self._set_state('ready')

    def return_tip(self, instrument):
        inst = instrument._instrument
        log.info('Returning tip from {}'.format(instrument.name))
        self._set_state('moving')
        inst.return_tip(home_after=True)
        self._set_state('ready')

    def move_to_front(self, instrument):
        inst = instrument._instrument
        log.info('Moving {}'.format(instrument.name))
        self._set_state('moving')
        inst.robot.home()
        calibration_functions.move_instrument_for_probing_prep(
            inst, inst.robot
        )
        self._set_state('ready')

    def move_to(self, instrument, container):
        if not isinstance(container, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(container)))

        inst = instrument._instrument
        log.info('Moving {} to {} in {}'.format(
            instrument.name, container.name, container.slot))
        self._set_state('moving')
        inst.move_to(container._container[0])
        self._set_state('ready')

    def jog(self, instrument, distance, axis):
        inst = instrument._instrument
        log.info('Jogging {} by {} in {}'.format(
            instrument.name, distance, axis))
        self._set_state('moving')
        calibration_functions.jog_instrument(
            instrument=inst,
            distance=distance,
            axis=axis,
            robot=inst.robot
        )
        self._set_state('ready')

    def home(self, instrument):
        inst = instrument._instrument
        log.info('Homing {}'.format(instrument.name))
        self._set_state('moving')
        inst.home()
        self._set_state('ready')

    def update_container_offset(self, container, instrument):
        inst = instrument._instrument
        log.info('Updating {} in {}'.format(container.name, container.slot))
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
        publish(CalibrationManager.TOPIC, self._snapshot())
