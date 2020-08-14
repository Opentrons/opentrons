from typing import Set, Dict, Any, Union
from robot_server.service.errors import RobotServerError
from robot_server.service.session.models import CommandDefinition
from .constants import STATE_WILDCARD
from .errors import CalibrationError
from .tip_length.constants import TipCalibrationState
from .deck.constants import DeckCalibrationState

ValidState = Union[TipCalibrationState, DeckCalibrationState]


class StateTransitionError(RobotServerError):
    def __init__(self,
                 action: CommandDefinition,
                 state: ValidState):
        super().__init__(definition=CalibrationError.BAD_STATE_TRANSITION,
                         action=action,
                         state=state.name)


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

        wc_transitions = self._transitions.get(STATE_WILDCARD, {})
        wc_to_state = wc_transitions.get(command, {})

        fs_transitions = self._transitions.get(from_state, {})
        fs_to_state = fs_transitions.get(command, {})

        if wc_to_state:
            return wc_to_state
        elif fs_to_state:
            return fs_to_state
        else:
            return None
