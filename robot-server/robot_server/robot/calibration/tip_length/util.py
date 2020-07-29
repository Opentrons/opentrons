from enum import Enum

from http import HTTPStatus
from typing import Set, Dict, Any
from robot_server.robot.calibration.tip_length.constants import WILDCARD
from robot_server.service.errors import RobotServerError
from robot_server.service.json_api.errors import Error


class TipCalibrationError(Enum):
    NO_PIPETTE = (
        HTTPStatus.FORBIDDEN,
        'No Pipette Attached',
        'No pipette present on {} mount')
    BAD_DEF = (
        HTTPStatus.UNPROCESSABLE_ENTITY,
        'Bad Labware Definition',
        'Bad definition for tiprack under calibration')


class TipCalibrationException(RobotServerError):
    def __init__(self, whicherror: TipCalibrationError, *fmt_args):
        super().__init__(
            whicherror.value[0],
            Error(
                id=str(whicherror),
                status=str(whicherror.value[0]),
                title=whicherror.value[1],
                detail=whicherror.value[2].format(*fmt_args)
            )
        )


class StateTransitionError(RobotServerError):
    def __init__(self, action, state):
        super().__init__(
            HTTPStatus.CONFLICT,
            Error(
                id='TipLengthCalibration.StateTransitionError',
                status=str(HTTPStatus.CONFLICT),
                title='Illegal State Transition',
                detail=f'The action {action} may not occur in the state '
                       f'{state}')
            )


TransitionMap = Dict[Any, Set[Dict[Any, Any]]]


class SimpleStateMachine:
    def __init__(self,
                 states: Set[Any],
                 transitions: TransitionMap):
        """
        Construct a simple state machine

        :param states: a collection of available states
        :param transitions: the transitions, keyed by "from state",
            with value a dictionary of triggering command to "to state"
        """
        self._states = states
        self._transitions = transitions

    def get_next_state(self, from_state, command):
        """
        Trigger a state transition

        :param from_state: The current state
        :param command: The triggering command
        :param to_state: The desired state
        :return: desired state if successful, None if fails
        """

        wc_transitions = self._transitions.get(WILDCARD, {})
        wc_to_state = wc_transitions.get(command, {})

        fs_transitions = self._transitions.get(from_state, {})
        fs_to_state = fs_transitions.get(command, {})

        if wc_to_state:
            return wc_to_state
        elif fs_to_state:
            return fs_to_state
        else:
            return None
