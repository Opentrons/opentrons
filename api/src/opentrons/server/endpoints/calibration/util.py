from typing import Dict, TypeVar, Union

"""
Note, the general types below should be restricted to the following:

stateOutput contrained to int, str and State
stateInput constrained to str (may expand where applicable)

Currently, mypy evaluates TypeVar to be the first class specified when
type checking. See https://github.com/python/mypy/issues/3644
"""
stateInput = TypeVar('stateInput', bound=str)
stateOutput = TypeVar('stateOutput')


class State:
    """
    A class that encapsulates a state and its relationships,
    similar to a directed acyclic graph.
    """
    def __init__(self, name: stateInput, value: stateOutput):
        self.name = name
        self.value = value
        self._relationships: Dict[Union[int, str], stateOutput] = {}

    def add_relationship(self, input: stateInput, output: stateOutput):
        self._relationships[input] = output

    def next(self, input):
        return self._relationships[input]


class StateMachine:
    """
    A class for building a mealy state machine pattern based on
    steps provided to this class.
    """
    def __init__(self):
        self.states = {}
        self._current_state = None

    def add_state(self, state_name: stateInput, state_value: stateOutput):
        self.states[state_name] = State(state_name, state_value)

    def get_state(self, state_name: stateInput) -> 'State':
        return self.states[state_name]

    def update_state(self, state_name: stateInput):
        next_state = self.next_state(state_name)
        self._current_state = next_state

    def next_state(self, input: stateInput) -> 'State':
        next = self._current_state.next(input)
        return self.states[next.name]

    def set_start(self, state_name: stateInput):
        self._current_state = self.states[state_name]

    @property
    def current_state(self):
        return self._current_state


class CalibrationCheckMachine(StateMachine):
    def __init__(self):
        super().__init__()
        self._build_state_machine()

    def _build_state_machine(self):
        self.add_state("sessionStart", 0)
        self.add_state("specifyLabware", 1)
        self.add_state("pickUpTip", 2)
        self.add_state("checkPointOne", 3)
        self.add_state("checkPointTwo", 4)
        self.add_state("checkPointThree", 5)
        self.add_state("checkHeight", 6)
        self.add_state("sessionExit", 7)
        self.add_state("badDeckCalibration", 8)
        self.add_state("noPipettesAttached", 9)

        self._modify_state("sessionStart", "sessionStart", "specifyLabware")
        self._modify_state("sessionStart", "noPipettesAttached", "sessionExit")
        self._modify_state("sessionStart", "badDeckCalibration", "sessionExit")
        self._modify_state("specifyLabware", "specifyLabware", "pickUpTip")
        self._modify_state(
            "specifyLabware", "badDeckCalibration", "sessionExit")
        self._modify_state("pickUpTip", "pickUpTip", "checkPointOne")
        self._modify_state("pickUpTip", "badDeckCalibration", "sessionExit")
        self._modify_state("checkPointOne", "checkPointOne", "checkPointTwo")
        self._modify_state(
            "checkPointOne", "badDeckCalibration", "sessionExit")
        self._modify_state("checkPointTwo", "checkPointTwo", "checkPointThree")
        self._modify_state(
            "checkPointTwo", "badDeckCalibration", "sessionExit")
        self._modify_state(
            "checkPointThree", "checkPointThree", "specifyLabware")
        self._modify_state("checkPointThree", "sessionExit", "sessionExit")

    def _modify_state(
            self,
            state_name: stateInput,
            input: stateInput,
            output: stateInput):
        output_state = self.get_state(output)
        self.get_state(state_name).add_relationship(input, output_state)
