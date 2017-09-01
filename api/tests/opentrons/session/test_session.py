import pytest

from datetime import datetime

from opentrons.session import Session
from opentrons.util.trace import EventBroker


async def test_load_from_text(session_manager, protocol):
    session = session_manager.create(name='<blank>', text=protocol.text)
    assert session.name == '<blank>'
    assert len(session.commands) == 101


async def test_async_notifications(session_manager):
    session_manager.notifications.update_filters(['bar'])
    EventBroker.get_instance().notify({'name': 'bar'})
    # Get async iterator
    aiter = session_manager.notifications.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    # Returns tuple containing message and session
    # Since protocol hasn't been loaded, session is None
    assert res == ({'name': 'bar'}, None)


async def test_load_protocol_with_error(session_manager):
    with pytest.raises(Exception) as e:
        session = session_manager.create(name='<blank>', text='blah')
        assert session is None

    print(e.value.args)

    args, = e.value.args
    timestamp = args['timestamp']
    exception, trace = args['error']

    assert datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f')
    assert type(exception) == NameError
    assert str(exception) == "name 'blah' is not defined"


async def test_load_and_run(session_manager, protocol):
    session = session_manager.create(name='<blank>', text=protocol.text)
    assert session_manager.notifications.queue.qsize() == 0
    assert session.command_log == {}
    assert session.state == 'loaded'
    session.run(devicename='Virtual Smoothie')
    assert len(session.command_log) == 101


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
    run_session.load_commands([
        {'level': 0, 'description': 'A'},
        {'level': 0, 'description': 'B'},
        {'level': 0, 'description': 'C'}
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

    run_session.load_commands([
        {'level': 0, 'description': 'A'},
        {'level': 1, 'description': 'B'},
        {'level': 2, 'description': 'C'},
        {'level': 0, 'description': 'D'},
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

    run_log = {
        _id: value
        for _id, value in run_session.command_log.items()
        if datetime.strptime(value.pop('timestamp'), '%Y-%m-%dT%H:%M:%S.%f')
    }

    assert run_log == {0: {}, 1: {}, 2: {}}


def test_error_append(run_session):
    foo = Exception('Foo')
    bar = Exception('Bar')
    run_session.error_append(foo)
    run_session.error_append(bar)

    errors = {
        _id: value
        for _id, value in run_session.errors.items()
        if datetime.strptime(value.pop('timestamp'), '%Y-%m-%dT%H:%M:%S.%f')
    }

    assert errors == {
        0: {'error': foo},
        1: {'error': bar},
    }
