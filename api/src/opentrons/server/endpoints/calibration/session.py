import typing
from uuid import uuid4
from pydantic import UUID4

from opentrons.hardware_control.types import Axis

from .models import (
    CalibrationCheckStates,
    CalibrationErrorStates,
    CalibrationCheckStateMap,
    AttachedPipette)
from .util import StepStateMachine, State

if typing.TYPE_CHECKING:
    from opentrons.hardware_control import ThreadManager  # noqa(F501)

"""
A set of endpoints that can be used to create a session for any deck
calibration tasks such as checking your calibration data, performing mount
offset or a deck transform.
"""


class SessionManager:
    """Small wrapper to keep track of deck calibration sessions created."""
    def __init__(self):
        self._sessions = {}

    @property
    def sessions(self):
        return self._sessions

    @sessions.setter
    def sessions(self, key: str, value: 'CalibrationSession'):
        self._sessions[key] = value


class CalibrationSession:
    """Class that controls state of the current deck calibration session"""
    def __init__(
            self,
            hardware: 'ThreadManager',
            steps: 'CalibrationCheckStates',
            errors: 'CalibrationErrorStates'):
        self.token = uuid4()
        self._pipettes = self._key_by_uuid(hardware.get_attached_instruments())
        self._hardware = hardware
        self.state_machine = self._build_state_machine(steps, errors)
        self.state_machine.set_start(0)

    def _key_by_uuid(self, new_pipettes: dict) -> dict:
        pipette_dict = {}
        for mount, data in new_pipettes.items():
            token = uuid4()
            data['mount_axis'] = str(Axis.by_mount(mount)).lower()
            data['plunger_axis'] = str(Axis.of_plunger(mount)).lower()
            pipette_dict[token] = {**data}
        return pipette_dict

    def _build_state_machine(
            self,
            available_actions: 'CalibrationCheckStates',
            errors: 'CalibrationErrorStates') -> 'StepStateMachine':
        sm = StepStateMachine()
        for error in errors:  # type: ignore
            sm.add_state(error.name, State(error.name, error.value))
        for action in available_actions:  # type: ignore
            if hasattr(CalibrationCheckStateMap, action.name):
                input = getattr(CalibrationCheckStateMap, action.name)
            else:
                input = None
            state_obj = State(action.name, action.value)
            state_obj.add_relationship(action.value, input)
            exit_code = available_actions.sessionExit
            if action.value == 0:
                no_pips = errors.noPipettesAttached
                state_obj.add_relationship(no_pips.value, exit_code.value)  # type: ignore # noqa(E501)
            bad_cal = errors.badDeckCalibration
            state_obj.add_relationship(bad_cal.value, exit_code.value)  # type: ignore # noqa(E501)
            sm.add_state(action.value, state_obj)
        return sm

    async def cache_instruments(self):
        await self.hardware.cache_instruments()
        new_dict = self._key_by_uuid(self.hardware.get_attached_instruments())
        self._pipettes.update(new_dict)

    @property
    def hardware(self):
        return self._hardware

    def current_pipette(self, uuid: UUID4) -> 'AttachedPipette':
        return self._pipettes[uuid]
