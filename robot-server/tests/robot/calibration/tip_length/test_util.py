import pytest
from typing import List, Tuple
from robot_server.robot.calibration.tip_length import util


@pytest.fixture
def machine(loop):
    states = {
              'imaginingTable',
              'millingLumber',
              'sawingToDimensions',
              'assemblingTable'
              'gluingUp'
              'rethinkingDesign',
              'sandingDown',
              'applyingFinish',
              'admiringWork'}
    transitions = {
      'imaginingTable': {'millingLumber'},
      'millingLumber': {'sawingToDimensions'},
      'sawingToDimensions': {'assemblingTable', 'gluingUp'},
      'assemblingTable': {'gluingUp', 'sandingDown'},
      'gluingUp': {'assemblingTable', 'sandingDown'},
      'sandingDown': {'applyingFinish'},
      'applyingFinish': {'admiringWork'},
      'rethinkingDesign': {'sawingToDimensions'},
      util.WILDCARD: {'rethinkingDesign'}
    }

    return util.SimpleStateMachine(states=states,
                                   transitions=transitions)


valid_transitions: List[Tuple[str, str]] = [
    ('imaginingTable', 'millingLumber'),
    ('millingLumber', 'sawingToDimensions'),
    ('sawingToDimensions', 'gluingUp'),
    ('sawingToDimensions', 'assemblingTable'),
    ('assemblingTable', 'gluingUp'),
    ('assemblingTable', 'sandingDown'),
    ('gluingUp', 'assemblingTable'),
    ('gluingUp', 'sandingDown'),
    ('sandingDown', 'applyingFinish'),
    ('applyingFinish', 'admiringWork'),
    ('rethinkingDesign', 'sawingToDimensions'),
    ('imaginingTable', 'rethinkingDesign'),
    ('millingLumber', 'rethinkingDesign'),
    ('sawingToDimensions', 'rethinkingDesign'),
    ('assemblingTable', 'rethinkingDesign'),
    ('gluingUp', 'rethinkingDesign'),
    ('rethinkingDesign', 'rethinkingDesign'),
    ('sandingDown', 'rethinkingDesign'),
    ('applyingFinish', 'rethinkingDesign'),
    ('admiringWork', 'rethinkingDesign'),
]


@pytest.mark.parametrize('from_state,to_state', valid_transitions)
async def test_valid_transitions(from_state, to_state, machine):
    resulting_state = machine.trigger_transition(from_state, to_state)
    assert resulting_state == to_state


invalid_transitions: List[Tuple[str, str]] = [
    ('imaginingTable', 'gluingUp'),
    ('millingLumber', 'imaginingTable'),
    ('gluingUp', 'millingLumber'),
    ('admiringWork', 'millingLumber'),
    ('admiringWork', '*'),
]


@pytest.mark.parametrize('from_state,to_state', invalid_transitions)
async def test_invalid_transitions(from_state, to_state, machine):
    resulting_state = machine.trigger_transition(from_state, to_state)
    assert resulting_state is None
