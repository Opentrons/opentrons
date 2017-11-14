from copy import copy

from opentrons.util import calibration_functions
from opentrons.broker import publish

from .models import Container


VALID_STATES = {'probing', 'moving', 'ready'}


class CalibrationManager:
    TOPIC = 'calibration'

    def __init__(self, loop=None):
        self._loop = loop
        self.state = None

    def _set_state(self, state):
        if state not in VALID_STATES:
            raise ValueError(
                'State {0} not in {1}'.format(state, VALID_STATES))
        self.state = state
        self._on_state_changed()

    def tip_probe(self, instrument):
        self._set_state('probing')
        calibration_functions.probe_instrument(
            instrument._instrument, instrument._instrument.robot)
        self._set_state('ready')

    def move_to_front(self, instrument):
        self._set_state('moving')
        inst = instrument._instrument
        inst.robot.home()
        calibration_functions.move_instrument_for_probing_prep(
            inst, inst.robot
        )
        self._set_state('ready')

    def move_to(self, instrument, obj):
        if not isinstance(obj, Container):
            raise ValueError(
                'Invalid object type {0}. Expected models.Container'
                .format(type(obj)))

        self._set_state('moving')
        instrument._instrument.move_to(obj._container[0])
        self._set_state('ready')

    def jog(self, instrument, distance, axis):
        self._set_state('moving')
        calibration_functions.jog_instrument(
            instrument=instrument._instrument,
            distance=distance,
            axis=axis,
            robot=instrument._instrument.robot
        )
        self._set_state('ready')

    def update_container_offset(self, container, instrument):
        inst = instrument._instrument
        inst.robot.calibrate_container_with_instrument(
            container=container._container,
            instrument=inst,
            save=True
        )
        inst.robot.max_deck_height.cache_clear()

    # TODO (artyom, 20171003): along with session, consider extracting this
    # into abstract base class or find any other way to keep notifications
    # consistent across all managers
    def _snapshot(self):
        return {
            'topic': CalibrationManager.TOPIC,
            'name': 'state',
            'payload': copy(self)
        }

    def _on_state_changed(self):
        publish(CalibrationManager.TOPIC, self._snapshot())
