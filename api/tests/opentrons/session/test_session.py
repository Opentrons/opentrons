import itertools
import pytest

from datetime import datetime
from opentrons.broker import publish
from opentrons.session import Session


async def test_load_from_text(session_manager, protocol):
    session = session_manager.create(name='<blank>', text=protocol.text)
    assert session.name == '<blank>'

    acc = []

    def traverse(commands):
        for command in commands:
            acc.append(command)
            traverse(command['children'])
    traverse(session.commands)

    assert len(acc) == 105


async def test_async_notifications(session_manager):
    publish('session', {'name': 'foo', 'payload': {'bar': 'baz'}})
    # Get async iterator
    aiter = session_manager.notifications.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    assert res == {'name': 'foo', 'payload': {'bar': 'baz'}}


async def test_load_protocol_with_error(session_manager):
    with pytest.raises(Exception) as e:
        session = session_manager.create(name='<blank>', text='blah')
        assert session is None

    args, = e.value.args
    timestamp = args['timestamp']
    exception = args['error']

    assert datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f')
    assert type(exception) == NameError
    assert str(exception) == "name 'blah' is not defined"


async def test_load_and_run(session_manager, protocol):
    session = session_manager.create(name='<blank>', text=protocol.text)
    assert session_manager.notifications.queue.qsize() == 0
    assert session.command_log == {}
    assert session.state == 'loaded'
    session.run(devicename='Virtual Smoothie')
    assert len(session.command_log) == 105

    res = []
    index = 0
    async for notification in session_manager.notifications:
        name, payload = notification['name'], notification['payload']
        if (name == 'state'):
            index += 1  # Command log in sync with add-command events emitted
            state = payload['state']
            res.append(state)
            if payload['state'] == 'finished':
                break

    assert [key for key, _ in itertools.groupby(res)] == \
        ['loaded', 'running', 'finished'], \
        'Run should emit state change to "running" and then to "finished"'
    assert session_manager.notifications.queue.qsize() == 0, 'Notification should be empty after receiving "finished" state change event'  # noqa

    session.run(devicename='Virtual Smoothie')
    assert len(session.command_log) == 105, \
        "Clears command log on the next run"


@pytest.fixture
def run_session():
    with Session('dino', 'from opentrons import robot') as s:
        yield s


def test_init(run_session):
    assert run_session.state == 'loaded'
    assert run_session.name == 'dino'


def test_set_state(run_session):
    states = 'loaded', 'running', 'finished', 'stopped', 'paused'
    for state in states:
        run_session.set_state(state)
        assert run_session.state == state

    with pytest.raises(ValueError):
        run_session.set_state('impossible-state')


def test_log_append(run_session):
    run_session.log_append()
    run_session.log_append()
    run_session.log_append()

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

    errors = [
        value
        for value in run_session.errors
        if datetime.strptime(value.pop('timestamp'), '%Y-%m-%dT%H:%M:%S.%f')
    ]

    assert errors == [
        {'error': foo},
        {'error': bar}
    ]
