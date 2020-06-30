import typing

WILDCARD = '*'


class SimpleStateMachine:
    def __init__(self,
                 states: typing.Set[str],
                 transitions: typing.Dict[str, typing.Set[str]]):
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
        if to_state in self._transitions.get(WILDCARD, {}) or \
                to_state in self._transitions.get(from_state, {}):
            return to_state
        else:
            return None
