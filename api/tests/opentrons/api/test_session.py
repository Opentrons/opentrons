import itertools
import pytest
import asyncio

from datetime import datetime
from opentrons.broker import publish
from opentrons.api import Session
from opentrons.api.session import _accumulate, _get_labware, _dedupe
from tests.opentrons.conftest import state
from functools import partial

state = partial(state, 'session')


@pytest.fixture
def labware_setup():
    from opentrons import containers, instruments

    tip_racks = \
        [containers.load('tiprack-200ul', slot, slot) for slot in ['A1', 'A2']]
    plates = \
        [containers.load('96-PCR-flat', slot, slot) for slot in ['B1', 'B2']]

    p100 = instruments.Pipette(
        name='p100', mount='right', channels=8, tip_racks=tip_racks)

    p1000 = instruments.Pipette(
        name='p1000', mount='left', channels=8, tip_racks=tip_racks)

    commands = [
        {
            'location': plates[0][0],
            'instrument': p100
        },
        {
            'location': plates[1]
        },
        {
            'locations': [plates[0][0], plates[1]],
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


async def test_async_notifications(main_router):
    publish('session', {'name': 'foo', 'payload': {'bar': 'baz'}})
    # Get async iterator
    aiter = main_router.notifications.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    assert res == {'name': 'foo', 'payload': {'bar': 'baz'}}


async def test_load_protocol_with_error(session_manager):
    with pytest.raises(Exception) as e:
        session = session_manager.create(name='<blank>', text='blah')
        assert session is None

    args, = e.value.args
    assert args == "name 'blah' is not defined"


@pytest.mark.parametrize('protocol_file', ['testosaur.py'])
async def test_load_and_run(
            main_router,
            protocol,
            protocol_file,
            loop
        ):

    async def pause_resume(session, count=5, interval=5.0):
        for _ in range(count):
            await asyncio.sleep(interval)
            print('Pause...')
            session.pause()
            await asyncio.sleep(interval)
            print('Resume...')
            session.resume()

    session = main_router.session_manager.create(
        name='<blank>',
        text=protocol.text)
    assert main_router.notifications.queue.qsize() == 0
    assert session.command_log == {}
    assert session.state == 'loaded'
    main_router.calibration_manager.tip_probe(session.instruments[0])
    task = loop.run_in_executor(executor=None, func=session.run)

    # Uncomment to test pause/resume sequence on a robot
    # await asyncio.sleep(15.0)
    # await pause_resume(session)

    await task
    assert len(session.command_log) == 6

    res = []
    index = 0
    async for notification in main_router.notifications:
        name, payload = notification['name'], notification['payload']
        if (name == 'state'):
            index += 1  # Command log in sync with add-command events emitted
            state = payload.state
            res.append(state)
            if payload.state == 'finished':
                break

    assert [key for key, _ in itertools.groupby(res)] == \
        ['loaded', 'probing', 'ready', 'running', 'finished']
    assert main_router.notifications.queue.qsize() == 0, 'Notification should be empty after receiving "finished" state change event'  # noqa
    session.run()
    assert len(session.command_log) == 6, \
        "Clears command log on the next run"


@pytest.fixture
def run_session(virtual_smoothie_env):
    return Session('dino', 'from opentrons import robot')


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


def test_get_instruments_and_containers(labware_setup, virtual_smoothie_env):
    instruments, tip_racks, plates, commands = labware_setup
    p100, p1000 = instruments

    instruments, containers, interactions = \
        _accumulate([_get_labware(command) for command in commands])

    session = Session(name='', text='')
    # We are calling dedupe directly for testing purposes.
    # Normally it is called from within a session
    session._instruments.extend(_dedupe(instruments))
    session._containers.extend(_dedupe(containers))
    session._interactions.extend(_dedupe(interactions))

    instruments = session.get_instruments()
    containers = session.get_containers()

    assert [i.name for i in instruments] == ['p100', 'p1000']
    assert [i.axis for i in instruments] == ['a', 'b']
    assert [i.id for i in instruments] == [id(p100), id(p1000)]
    assert [[t.slot for t in i.tip_racks] for i in instruments] == \
        [['A1', 'A2'], ['A1', 'A2']]
    assert [[c.slot for c in i.containers] for i in instruments] == \
        [['B1'], ['B1', 'B2']]

    assert [c.slot for c in containers] == ['B1', 'B2']
    assert [[i.id for i in c.instruments] for c in containers] == \
        [[id(p100), id(p1000)], [id(p1000)]]
    assert [c.id for c in containers] == [id(plates[0]), id(plates[1])]


def test_accumulate():
    res = \
        _accumulate([
            (['a'], ['d'], ['g', 'h']),
            (['b', 'c'], ['e', 'f'], ['i'])
        ])

    assert res == (['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i'])
    assert _accumulate([]) == ([], [], [])


def test_dedupe():
    assert ''.join(_dedupe('aaaaabbbbcbbbbcccaa')) == 'abc'


def test_get_labware(labware_setup):
    instruments, tip_racks, plates, commands = labware_setup
    p100, p1000 = instruments

    assert _get_labware(commands[0]) == \
        ([p100], [plates[0]], [(p100, plates[0])])

    assert _get_labware(commands[1]) == \
        ([], [plates[1]], [])

    assert _get_labware(commands[2]) == \
        ([p1000],
         [plates[0], plates[1]],
         [(p1000, plates[0]), (p1000, plates[1])])

    instruments, containers, interactions = \
        _accumulate([_get_labware(command) for command in commands])

    assert \
        [
            list(_dedupe(instruments)),
            list(_dedupe(containers)),
            list(_dedupe(interactions))
        ] == \
        [
            [p100, p1000],
            [plates[0], plates[1]],
            [(p100, plates[0]), (p1000, plates[0]), (p1000, plates[1])]
        ]


async def test_session_model_functional(session_manager, protocol):
    session = session_manager.create(name='<blank>', text=protocol.text)
    assert [container.name for container in session.containers] == \
           ['tiprack', 'trough', 'plate']
    assert [instrument.name for instrument in session.instruments] == ['p200']


# TODO(artyom 20171018): design a small protocol specifically for the test
@pytest.mark.parametrize('protocol_file', ['bradford_assay.py'])
async def test_drop_tip_with_trash(session_manager, protocol, protocol_file):
    """
    Bradford Assay is using drop_tip() with no arguments that assumes
    tip drop into trash-box. In this test we are confirming that
    that trash location is being inferred from a command, and trash
    is listed as a container for a protocol, as well as a container
    instruments are interacting with.
    """
    session = session_manager.create(name='<blank>', text=protocol.text)

    assert 'trash-box' in [c.name for c in session.get_containers()]
    containers = sum([i.containers for i in session.get_instruments()], [])
    assert 'trash-box' in [c.name for c in containers]


async def test_session_create_error(main_router):
    with pytest.raises(SyntaxError):
        main_router.session_manager.create(
            name='<blank>',
            text='syntax error ;(')

    with pytest.raises(TimeoutError):
        # No state change is expected
        await main_router.wait_until(state('loaded'))

    with pytest.raises(ZeroDivisionError):
        main_router.session_manager.create(
            name='<blank>',
            text='1/0')

    with pytest.raises(TimeoutError):
        # No state change is expected
        await main_router.wait_until(state('loaded'))
