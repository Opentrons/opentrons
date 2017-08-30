import pytest
from datetime import datetime

from opentrons.server.session import Session


@pytest.fixture
def run_session():
    return Session('dino', 'from opentrons import robot')


def test_init(run_session):
    assert run_session.state == 'loaded'
    assert run_session.name == 'dino'


def test_set_state(run_session):
    states = 'loaded', 'running', 'error', 'finished', 'stopped', 'paused'
    for state in states:
        run_session.set_state(state)
        assert run_session.state == state

    with pytest.raises(ValueError):
        run_session.set_state('impossible-state')


def test_set_commands(run_session):
    run_session.init_commands([
        (0, 'A'),
        (0, 'B'),
        (0, 'C')
    ])

    assert run_session.commands == [
        {
            'description': 'A',
            'id': 0,
            'children': []
        },
        {
            'description': 'B',
            'id': 1,
            'children': []
        },
        {
            'description': 'C',
            'id': 2,
            'children': []
        },
    ]

    run_session.init_commands([
        (0, 'A'),
        (1, 'B'),
        (2, 'C'),
        (0, 'D'),
    ])

    assert run_session.commands == [
        {
            'description': 'A',
            'id': 0,
            'children': [{
                    'description': 'B',
                    'id': 1,
                    'children': [{
                                'description': 'C',
                                'id': 2,
                                'children': []
                            }]
                    }]
        },
        {
            'description': 'D',
            'id': 3,
            'children': []
        }
    ]


def test_log_append(run_session):
    run_session.log_append('A')
    run_session.log_append('B')
    run_session.log_append('C')

    run_log = [
        (_id, description)
        for _id, timestamp, description in run_session.run_log
        if datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f')]

    assert run_log == [
        (0, 'A'),
        (1, 'B'),
        (2, 'C'),
    ]


def test_error_append(run_session):
    foo = Exception('Foo')
    bar = Exception('Bar')
    run_session.error_append(foo)
    run_session.error_append(bar)

    errors = [
        (error, )
        for timestamp, error in run_session.errors
        if datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f')]

    assert errors == [
        (foo,),
        (bar,)
    ]
