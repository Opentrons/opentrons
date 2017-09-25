import itertools
import pytest

from datetime import datetime
from opentrons.broker import publish
from opentrons.session import Session
from opentrons.session import accumulate, get_labware


@pytest.fixture
def labware_setup():
    from opentrons import containers, instruments

    tip_racks = \
        [containers.load('tiprack-200ul', slot) for slot in ['A1', 'A2']]
    plates = \
        [containers.load('96-PCR-flat', slot) for slot in ['B1', 'B2']]

    p100 = instruments.Pipette(
        name='p100', axis='a', channels=8, tip_racks=tip_racks)

    p1000 = instruments.Pipette(
        name='p1000', axis='a', channels=8, tip_racks=tip_racks)

    commands = [
        {
            'location': plates[0][0],
            'instrument': p100
        },
        {
            'location': plates[1]
        },
        {
            'locations': [plates[1], plates[0][0]],
            'instrument': p1000
        }
    ]

    return (p100, p1000), tip_racks, plates, commands


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


def test_get_instruments_and_containers(labware_setup):
    def get_item_id(item):
        return item['id']

    instruments, tip_racks, plates, commands = labware_setup
    p100, p1000 = instruments

    instruments, containers, interactions = \
        accumulate([get_labware(command) for command in commands])

    session = Session(name='', text='')
    session._instruments.update(set(instruments))
    session._containers.update(set(containers))
    session._interactions.update(set(interactions))

    assert \
        sorted(session.get_instruments(), key=get_item_id) == \
        sorted([{
            'tip_racks': tip_racks,
            'name': 'p100',
            'channels': 8,
            'containers': {id(plates[0])},
            'id': id(p100)
        }, {
            'tip_racks': tip_racks,
            'name': 'p1000',
            'channels': 8,
            'containers': {id(plates[1]), id(plates[0])},
            'id': id(p1000)
        }], key=get_item_id)

    assert \
        sorted(session.get_containers(), key=get_item_id) == \
        sorted([{
            'id': id(plates[0]),
            'name': '96-PCR-flat',
            'instruments': {id(p100), id(p1000)},
            'type': '96-PCR-flat',
            'slot': 'B1'
        }, {
            'id': id(plates[1]),
            'name': '96-PCR-flat',
            'instruments': {id(p1000)},
            'type': '96-PCR-flat',
            'slot': 'B2'
        }], key=get_item_id)


def test_accumulate():
    res = \
        accumulate([
            (['a'], ['d'], ['g', 'h']),
            (['b', 'c'], ['e', 'f'], ['i'])
        ])

    assert res == (['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i'])
    assert accumulate([]) == ([], [], [])


def test_get_labware(labware_setup):
    instruments, tip_racks, plates, commands = labware_setup
    p100, p1000 = instruments

    assert get_labware(commands[0]) == \
        ([p100], [plates[0]], [(p100, plates[0])])

    assert get_labware(commands[1]) == \
        ([], [plates[1]], [])

    assert get_labware(commands[2]) == \
        ([p1000],
         [plates[1], plates[0]],
         [(p1000, plates[1]), (p1000, plates[0])])

    res = accumulate([get_labware(command) for command in commands])

    assert [set(item) for item in res] == \
        [
            {p1000, p100},
            {plates[0], plates[1]},
            {(p1000, plates[1]), (p1000, plates[0]), (p100, plates[0])}
        ]
