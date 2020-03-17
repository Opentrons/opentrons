from typing import Dict


class StepStateMachine:
    """
    A class for building a mealy state machine pattern based on
    steps provided to this class.
    """
    def __init__(self):
        self.handlers = {}
        self._current_state = None

    def add_state(self, state: int, handler: 'State'):
        self.handlers[state] = handler

    def update_state(self, input: int):
        next_state = self.next_state(input)
        self._current_state = next_state
        return self._current_state

    def next_state(self, input: int):
        return self.handlers[self._current_state.next(input)]

    def set_start(self, state: int):
        self._current_state = self.handlers[state]

    @property
    def current_state(self):
        return self._current_state


class State:
    """
    A class that encapsulates a state and its relationships,
    similar to a directed acyclic graph.
    """
    def __init__(self, name: str, value: int):
        self.name = name
        self.value = value
        self._relationships: Dict[int, int] = {}

    def add_relationship(self, input: int, output: int):
        self._relationships[input] = output

    def next(self, input):
        return self._relationships[input]
