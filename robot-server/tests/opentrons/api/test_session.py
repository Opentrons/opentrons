import itertools
import copy
import pytest
import base64

from opentrons.api.session import (
    _accumulate, _dedupe)
from tests.opentrons.conftest import state
from functools import partial
from opentrons.protocols.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.execute import ExceptionInProtocolError

state = partial(state, 'session')


@pytest.fixture
def run_session(request, session_manager):
    return session_manager.create('dino', 'from opentrons import robot')


async def test_load_from_text(session_manager, protocol):
    session = session_manager.create(name='<blank>', contents=protocol.text)
    assert session.name == '<blank>'

    acc = []

    def traverse(commands):
        for command in commands:
            acc.append(command)
            traverse(command['children'])
    traverse(session.commands)
    # Less commands now that trash is built in
    assert len(acc) == 75


async def test_clear_tips(session_manager, tip_clear_protocol):
    session = session_manager.create(
        name='<blank>', contents=tip_clear_protocol.text)

    assert len(session._instruments) == 1
    for instrument in session._instruments:
        assert not instrument.tip_attached


async def test_async_notifications(main_router):
    main_router.broker.publish(
        'session', {'name': 'foo', 'payload': {'bar': 'baz'}})
    # Get async iterator
    aiter = main_router.notifications.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    assert res == {'name': 'foo', 'payload': {'bar': 'baz'}}


@pytest.mark.parametrize(
    'proto_with_error', [
        'metadata={"apiLevel": "2.0"}; blah',
        'metadata={"apiLevel": "1.0"}; blah',
    ])
def test_load_protocol_with_error(session_manager, hardware,
                                  proto_with_error):
    with pytest.raises(Exception) as e:
        session = session_manager.create(
            name='<blank>', contents=proto_with_error)
        assert session is None

    args, = e.value.args
    assert args == "name 'blah' is not defined"


@pytest.mark.parametrize(
    'protocol_file',
    ['testosaur_v2.py', 'testosaur.py', 'multi-single.py'])
async def test_load_and_run_v2(
        main_router,
        protocol,
        protocol_file,
        loop):
    session = main_router.session_manager.create(
        name='<blank>',
        contents=protocol.text)
    assert main_router.notifications.queue.qsize() == 1
    assert session.state == 'loaded'
    assert session.command_log == {}

    def run():
        session.run()

    await loop.run_in_executor(executor=None, func=run)
    assert session.command_log

    old_log = copy.deepcopy(session.command_log)

    res = []
    index = 0
    async for notification in main_router.notifications:
        payload = notification['payload']
        index += 1  # Command log in sync with add-command events emitted
        if type(payload) is dict:
            state = payload.get('state')
        else:
            state = payload.state
        res.append(state)
        if state == 'finished':
            break

    assert [key for key, _ in itertools.groupby(res)] == \
        ['loaded', 'running', 'finished']
    assert main_router.notifications.queue.qsize() == 0,\
        'Notification should be empty after receiving "finished" event'
    session.run()
    assert len(session.command_log) == len(old_log)
    assert session.protocol_text == protocol.text


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


def test_error_append(run_session):
    foo = Exception('Foo')
    bar = Exception('Bar')
    run_session.error_append(foo)
    run_session.error_append(bar)

    errors = [
        value
        for value in run_session.errors
        if isinstance(value.pop('timestamp'), int)
    ]

    assert errors == [
        {'error': foo},
        {'error': bar}
    ]


def test_accumulate():
    res = \
        _accumulate([
            (['a'], ['d'], ['g', 'h']),
            (['b', 'c'], ['e', 'f'], ['i'])
        ])

    assert res == (['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i'])
    assert _accumulate([]) == ([], [], [], [])


def test_dedupe():
    assert ''.join(_dedupe('aaaaabbbbcbbbbcccaa')) == 'abc'


async def test_session_model_functional(session_manager, protocol):
    session = session_manager.create(name='<blank>', contents=protocol.text)
    assert [container.name for container in session.containers] == \
           ['tiprack', 'trough', 'plate', 'opentrons_1_trash_1100ml_fixed']
    names = [instrument.name for instrument in session.instruments]
    assert names == ['p300_single_v1']


@pytest.mark.parametrize('protocol_file', ['testosaur-gen2.py',
                                           'testosaur-gen2-v2.py'])
async def test_requested_as(session_manager, protocol, protocol_file):
    session = session_manager.create(name='<blank>', contents=protocol.text)
    assert session.get_instruments()[0].requested_as == 'p300_single_gen2'


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
    session = session_manager.create(name='<blank>', contents=protocol.text)

    assert 'opentrons_1_trash_1100ml_fixed' in [
        c.name for c in session.get_containers()]
    containers = sum([i.containers for i in session.get_instruments()], [])
    assert 'opentrons_1_trash_1100ml_fixed' in [c.name for c in containers]


async def test_session_create_error(main_router):
    with pytest.raises(SyntaxError):
        main_router.session_manager.create(
            name='<blank>',
            contents='from opentrons import instruments; syntax error ;(')

    with pytest.raises(TimeoutError):
        # No state change is expected
        await main_router.wait_until(lambda _: True)

    with pytest.raises(ZeroDivisionError):
        main_router.session_manager.create(
            name='<blank>',
            contents='from opentrons import instruments; 1/0')

    with pytest.raises(TimeoutError):
        # No state change is expected
        await main_router.wait_until(lambda _: True)


async def test_session_metadata_v1(main_router):
    expected = {
        'hello': 'world',
        'what?': 'no'
    }

    prot = """
from opentrons import instruments
this = 0
that = 1
metadata = {
'what?': 'no',
'hello': 'world'
}
print('wat?')
"""

    session = main_router.session_manager.create(
        name='<blank>',
        contents=prot)
    assert session.metadata == expected


async def test_session_metadata_v2(main_router):
    expected = {
        'hello': 'world',
        'what?': 'no',
        'apiLevel': '2.0'
    }

    prot = """
this = 0
that = 1
metadata = {
'what?': 'no',
'hello': 'world',
'apiLevel': '2.0'
}
print('wat?')

def run(ctx):
    print('hi there')
"""

    session = main_router.session_manager.create(
        name='<blank>',
        contents=prot)
    assert session.metadata == expected


async def test_too_high_version(main_router):
    minor_over = APIVersion(MAX_SUPPORTED_VERSION.major,
                            MAX_SUPPORTED_VERSION.minor + 1)
    minor_over_mdata = {'apiLevel': str(minor_over)}
    proto = 'metadata=' + str(minor_over_mdata) + """

def run(ctx):
    pass
"""
    with pytest.raises(RuntimeError):
        main_router.session_manager.create(
            name='<blank>',
            contents=proto)


@pytest.mark.api2_only
async def test_session_extra_labware(main_router, get_labware_fixture,
                                     virtual_smoothie_env):
    proto = '''
metadata = {"apiLevel": "2.0"}

def run(ctx):
    tr = ctx.load_labware("fixture_12_trough", "1")
    tiprack = ctx.load_labware("opentrons_96_tiprack_300ul", "2")
    instr = ctx.load_instrument("p300_single", "right",
                                tip_racks=[tiprack])
    instr.pick_up_tip()
    instr.aspirate(300, tr["A1"])
'''
    extra_labware = [
        get_labware_fixture('fixture_12_trough')
    ]
    session = main_router.session_manager.create_with_extra_labware(
        name='<blank>',
        contents=proto,
        extra_labware=extra_labware)
    assert not session.errors
    session_conts = session.get_containers()
    for lw in extra_labware:
        assert lw['parameters']['loadName'] in [
            c.name for c in session_conts]
    session.run()
    assert not session.errors
    with pytest.raises(ExceptionInProtocolError):
        main_router.session_manager.create(
            name='<blank>',
            contents=proto)


@pytest.mark.api2_only
async def test_session_bundle(main_router, get_bundle_fixture,
                              virtual_smoothie_env):
    bundle = get_bundle_fixture('simple_bundle')
    b64d = base64.b64encode(bundle['binary_zipfile'])
    session1 = main_router.session_manager.create(name='bundle.zip',
                                                  contents=b64d,
                                                  is_binary=True)
    session2 = main_router.session_manager.create_from_bundle(
        name='bundle.zip',
        contents=b64d)
    assert session1._protocol == session2._protocol


async def test_session_unused_hardware(main_router,
                                       virtual_smoothie_env,
                                       get_json_protocol_fixture):
    # both python v2 and json should have their instruments and modules appear
    # in the session properties even if they are not used
    proto = '''
metadata = {"apiLevel": "2.0"}
def run(ctx):
    rack1 = ctx.load_labware('opentrons_96_tiprack_300ul', '1')
    rack2 = ctx.load_labware('opentrons_96_tiprack_300ul', '2')
    left = ctx.load_instrument('p300_single', 'left', tip_racks=[rack1])
    right = ctx.load_instrument('p10_multi', 'right', tip_racks=[rack2])
    mod = ctx.load_module('magdeck', '4')
    mod2 = ctx.load_module('tempdeck', '5')
    plate = mod2.load_labware('corning_96_wellplate_360ul_flat')
    mod2.set_temperature(60)
    left.pick_up_tip()
    left.aspirate(50, plate['A1'])
    left.dispense(50, plate['A2'])
    left.drop_tip()
    '''
    session = main_router.session_manager.create('dummy-pipette',
                                                 proto)
    assert 'p300_single_v1' in [pip.name for pip in session.instruments]
    assert 'p10_multi_v1' in [pip.name for pip in session.instruments]
    assert 'magdeck' in [mod.name for mod in session.modules]
    assert 'tempdeck' in [mod.name for mod in session.modules]

    v1proto = '''
from opentrons import instruments, modules, labware

racks = [labware.load('opentrons_96_tiprack_300ul', slot)
         for slot in (1, 2)]
magdeck = modules.load('magdeck', '4')
tempdeck = modules.load('tempdeck', '5')
plate = labware.load('corning_96_wellplate_360ul_flat', '5', share=True)
left = instruments.P300_Single('left', tip_racks=[racks[0]])
right = instruments.P10_Multi('right', tip_racks=[racks[1]])

tempdeck.set_temperature(60)
left.pick_up_tip()
left.aspirate(plate.wells(0))
left.dispense(plate.wells(1))
left.drop_tip()
'''

    # json protocols don't support modules so we only have to check pipettes
    jsonp = get_json_protocol_fixture('3', 'unusedPipette', decode=False)
    session2 = main_router.session_manager.create('dummy-pipette-json',
                                                  jsonp)
    assert 'p50_single_v1' in [pip.name for pip in session2.instruments]
    assert 'p10_single_v1' in [pip.name for pip in session2.instruments]

    # do not change behavior for v1: instruments must have interactions
    # to appear
    session3 = main_router.session_manager.create('dummy-pipette_v1',
                                                  v1proto)
    assert ['p300_single_v1'] == [pip.name for pip in session3.instruments]
    assert ['tempdeck'] == [mod.name for mod in session3.modules]


async def test_session_robot_connect_not_allowed(main_router,
                                                 virtual_smoothie_env):
    proto = """
from opentrons import robot
robot.connect()
"""

    with pytest.raises(RuntimeError, match='.*robot.connect.*'):
        main_router.session_manager.create('calls-connect', proto)
