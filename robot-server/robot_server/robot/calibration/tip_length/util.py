from typing import Set, Dict, Any
from robot_server.robot.calibration.tip_length.constants import WILDCARD


class TipCalibrationError(Exception):
    pass


class SimpleStateMachine:
    def __init__(self,
                 states: Set[Any],
                 transitions: Dict[Any, Set[Any]]):
        """
        Construct a simple state machine

        :param states: a collection of available states
        :param transitions: the transitions to desired to_states
                            keyed by from_state
        """
        self._states = states
        self._transitions = transitions

    def trigger_transition(self, from_state, to_state):
        """
        Trigger a state transition

        :param from_state: The current state
        :param to_state: The desired state
        :return: desired state if successful, None if fails
        """
        inaccessible = (
                to_state not in self._transitions.get(WILDCARD, {}) and
                to_state not in self._transitions.get(from_state, {}))
        if to_state == WILDCARD or inaccessible:
            return None
        else:
            return to_state
