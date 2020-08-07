import pytest
from typing import List, Tuple
from robot_server.robot.calibration import util


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
        'imaginingTable': {
            'mill': 'millingLumber'
        },
        'millingLumber': {
            'saw': 'sawingToDimensions'
        },
        'sawingToDimensions': {
            'assemble': 'assemblingTable',
            'glueUp': 'gluingUp'
        },
        'assemblingTable': {
            'glueUp': 'gluingUp',
            'sand': 'sandingDown'
        },
        'gluingUp': {
            'assemble': 'assemblingTable',
            'sand': 'sandingDown'
        },
        'sandingDown': {
            'applyFinish': 'applyingFinish'
        },
        'applyingFinish': {
            'admire': 'admiringWork'
        },
        'rethinkingDesign': {
            'saw': 'sawingToDimensions'
        },
        util.STATE_WILDCARD: {
            'rethink': 'rethinkingDesign'
        }
    }

    return util.SimpleStateMachine(states=states,
                                   transitions=transitions)


valid_transitions: List[Tuple[str, str, str]] = [
    ('imaginingTable', 'mill', 'millingLumber'),
    ('millingLumber', 'saw', 'sawingToDimensions'),
    ('sawingToDimensions', 'glueUp', 'gluingUp'),
    ('sawingToDimensions', 'assemble', 'assemblingTable'),
    ('assemblingTable', 'glueUp', 'gluingUp'),
    ('assemblingTable', 'sand', 'sandingDown'),
    ('gluingUp', 'assemble', 'assemblingTable'),
    ('gluingUp', 'sand', 'sandingDown'),
    ('sandingDown', 'applyFinish', 'applyingFinish'),
    ('applyingFinish', 'admire', 'admiringWork'),
    ('rethinkingDesign', 'saw', 'sawingToDimensions'),
    ('imaginingTable', 'rethink', 'rethinkingDesign'),
    ('millingLumber', 'rethink', 'rethinkingDesign'),
    ('sawingToDimensions', 'rethink', 'rethinkingDesign'),
    ('assemblingTable', 'rethink', 'rethinkingDesign'),
    ('gluingUp', 'rethink', 'rethinkingDesign'),
    ('rethinkingDesign', 'rethink', 'rethinkingDesign'),
    ('sandingDown', 'rethink', 'rethinkingDesign'),
    ('applyingFinish', 'rethink', 'rethinkingDesign'),
    ('admiringWork', 'rethink', 'rethinkingDesign'),
]


@pytest.mark.parametrize('from_state,command,to_state', valid_transitions)
async def test_valid_transitions(from_state, command, to_state, machine):
    resulting_state = machine.get_next_state(from_state, command)
    assert resulting_state == to_state


invalid_transitions: List[Tuple[str, str]] = [
    ('imaginingTable', 'glue'),
    ('millingLumber', 'assemble'),
    ('gluingUp', 'doSomethingUnrelatedToWoodworking'),
    ('admiringWork', 'mill'),
    ('admiringWork', '*'),
]


@pytest.mark.parametrize('from_state,command', invalid_transitions)
async def test_invalid_transitions(from_state, command, machine):
    resulting_state = machine.get_next_state(from_state, command)
    assert resulting_state is None
