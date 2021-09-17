from unittest.mock import patch
import itertools
import copy
import pytest
import base64

from opentrons.api import session
from opentrons.api.session import _accumulate, _dedupe
from opentrons.hardware_control import ThreadedAsyncForbidden

from tests.opentrons.conftest import state
from functools import partial
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocols.execution.errors import ExceptionInProtocolError
from opentrons.protocol_api.labware import load
from opentrons.types import Location, Point

state = partial(state, "session")


async def test_async_notifications(main_router):
    main_router.broker.publish("session", {"name": "foo", "payload": {"bar": "baz"}})
    # Get async iterator
    aiter = main_router.notifications.__aiter__()
    # Then read the first item
    res = await aiter.__anext__()
    assert res == {"name": "foo", "payload": {"bar": "baz"}}


@pytest.mark.parametrize(
    "proto_with_error",
    [
        """
metadata={"apiLevel": "2.0"}
blah
def run(ctx): pass"""
    ],
)
def test_load_protocol_with_error(session_manager, hardware, proto_with_error):
    with pytest.raises(NameError) as e:
        session = session_manager.create(name="<blank>", contents=proto_with_error)
        assert session is None

    (args,) = e.value.args
    assert args == "name 'blah' is not defined"


@pytest.mark.parametrize("protocol_file", ["testosaur_v2.py"])
async def test_load_and_run_v2(main_router, protocol, protocol_file, loop):
    session = main_router.session_manager.create(name="<blank>", contents=protocol.text)
    assert main_router.notifications.queue.qsize() == 1
    assert session.state == "loaded"
    assert session.command_log == {}

    def run():
        session.run()

    await loop.run_in_executor(executor=None, func=run)
    assert session.command_log

    old_log = copy.deepcopy(session.command_log)

    res = []
    index = 0
    async for notification in main_router.notifications:
        payload = notification["payload"]
        index += 1  # Command log in sync with add-command events emitted
        if type(payload) is dict:
            state = payload.get("state")
        else:
            state = payload.state
        res.append(state)
        if state == "finished":
            break

    assert [key for key, _ in itertools.groupby(res)] == [
        "loaded",
        "running",
        "finished",
    ]
    assert (
        main_router.notifications.queue.qsize() == 0
    ), 'Notification should be empty after receiving "finished" event'
    session.run()
    assert len(session.command_log) == len(old_log)
    assert session.protocol_text == protocol.text


def test_accumulate():
    res = _accumulate(
        [
            (["a"], ["d"], ["g", "h"], [("l", "m")]),  # type: ignore[list-item]
            (["b", "c"], ["e", "f"], ["i"], [("m", "n")]),  # type: ignore[list-item]
        ]
    )

    assert res == (
        ["a", "b", "c"],
        ["d", "e", "f"],
        ["g", "h", "i"],
        [("l", "m"), ("m", "n")],
    )
    assert _accumulate([]) == ([], [], [], [])


def test_dedupe():
    first = load(
        "opentrons_96_tiprack_300ul", Location(point=Point(0, 0, 0), labware="1")
    )
    second = load(
        "opentrons_96_tiprack_300ul", Location(point=Point(1, 2, 3), labware="2")
    )
    third = load(
        "opentrons_96_tiprack_20ul", Location(point=Point(4, 5, 6), labware="3")
    )

    iterable = (
        [first] * 10
        + [second] * 10
        # This is the key part of this test. Well.parent now builds a new
        # Labware item that therefore breaks identity checking.
        + [third["A1"].parent for elem in range(10)]
    )
    assert sorted(_dedupe(iterable), key=lambda lw: lw.name) == sorted(
        [first, second, third], key=lambda lw: lw.name
    )


@pytest.mark.parametrize("protocol_file", ["testosaur-gen2-v2.py"])
async def test_requested_as(session_manager, protocol, protocol_file):
    session = session_manager.create(name="<blank>", contents=protocol.text)
    assert session.get_instruments()[0].requested_as == "p300_single_gen2"


async def test_session_metadata_v2(main_router):
    expected = {"hello": "world", "what?": "no", "apiLevel": "2.0"}

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

    session = main_router.session_manager.create(name="<blank>", contents=prot)
    assert session.metadata == expected


async def test_too_high_version(main_router):
    minor_over = APIVersion(
        MAX_SUPPORTED_VERSION.major, MAX_SUPPORTED_VERSION.minor + 1
    )
    minor_over_mdata = {"apiLevel": str(minor_over)}
    proto = (
        "metadata="
        + str(minor_over_mdata)
        + """

def run(ctx):
    pass
"""
    )
    with pytest.raises(RuntimeError):
        main_router.session_manager.create(name="<blank>", contents=proto)


async def test_session_extra_labware(
    main_router, get_labware_fixture, virtual_smoothie_env
):
    proto = """
metadata = {"apiLevel": "2.0"}

def run(ctx):
    tr = ctx.load_labware("fixture_12_trough", "1")
    tiprack = ctx.load_labware("opentrons_96_tiprack_300ul", "2")
    instr = ctx.load_instrument("p300_single", "right",
                                tip_racks=[tiprack])
    instr.pick_up_tip()
    instr.aspirate(300, tr["A1"])
"""
    extra_labware = [get_labware_fixture("fixture_12_trough")]
    session = main_router.session_manager.create_with_extra_labware(
        name="<blank>", contents=proto, extra_labware=extra_labware
    )
    assert not session.errors
    session_conts = session.get_containers()
    for lw in extra_labware:
        assert lw["parameters"]["loadName"] in [c.name for c in session_conts]
    session.run()
    assert not session.errors
    with pytest.raises(ExceptionInProtocolError):
        main_router.session_manager.create(name="<blank>", contents=proto)


async def test_session_bundle(main_router, get_bundle_fixture, virtual_smoothie_env):
    bundle = get_bundle_fixture("simple_bundle")
    b64d = base64.b64encode(bundle["binary_zipfile"])
    session1 = main_router.session_manager.create(
        name="bundle.zip", contents=b64d, is_binary=True
    )
    session2 = main_router.session_manager.create_from_bundle(
        name="bundle.zip", contents=b64d
    )
    assert session1._protocol == session2._protocol


async def test_session_unused_hardware(
    main_router, virtual_smoothie_env, get_json_protocol_fixture
):
    # both python v2 and json should have their instruments and modules appear
    # in the session properties even if they are not used
    proto = """
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
    """
    session = main_router.session_manager.create("dummy-pipette", proto)
    assert "p300_single_v1" in [pip.name for pip in session.instruments]
    assert "p10_multi_v1" in [pip.name for pip in session.instruments]
    assert "magdeck" in [mod.name for mod in session.modules]
    assert "magneticModuleV1" in [mod.model for mod in session.modules]
    assert "temperatureModuleV1" in [mod.model for mod in session.modules]
    assert "tempdeck" in [mod.name for mod in session.modules]

    # json protocols don't support modules so we only have to check pipettes
    jsonp = get_json_protocol_fixture("3", "unusedPipette", decode=False)
    session2 = main_router.session_manager.create("dummy-pipette-json", jsonp)
    assert "p50_single_v1" in [pip.name for pip in session2.instruments]
    assert "p10_single_v1" in [pip.name for pip in session2.instruments]


async def test_session_move_to_labware(main_router, virtual_smoothie_env):
    proto = """
metadata = {"apiLevel": "2.0"}
def run(ctx):
    rack1 = ctx.load_labware('opentrons_96_tiprack_300ul', '1')
    rack2 = ctx.load_labware('opentrons_96_tiprack_300ul', '2')
    left = ctx.load_instrument('p300_single', 'left', tip_racks=[rack1])
    plate = ctx.load_labware('corning_96_wellplate_360ul_flat', '4')
    left.pick_up_tip()
    left.move_to(plate['A1'].top())
    left.move_to(plate['A2'].top())
    left.drop_tip()
    """
    session = main_router.session_manager.create("dummy-pipette", proto)
    assert "p300_single_v1" in [pip.name for pip in session.instruments]

    # Labware that does not have a liquid handling event, but is interacted
    # with using a pipette should still show up in the list of labware.
    assert "corning_96_wellplate_360ul_flat" in [lw.type for lw in session.containers]


async def test_session_run_concurrently(
    main_router, get_labware_fixture, virtual_smoothie_env
):
    """This test proves that we are not able to start a protocol run while
    one is active.

    This cross boundaries into the RPC because it emulates how the RPC server
    handles requests. It uses a thread executor with two threads.

    This test was added to prove that there's a deadlock if a protocol with
    a pause is started twice.
    """
    # Create a protocol that does nothing but pause.
    proto = """
metadata = {"apiLevel": "2.0"}

def run(ctx):
    ctx.pause()
"""
    session = main_router.session_manager.create_with_extra_labware(
        name="<blank>", contents=proto, extra_labware=[]
    )

    from concurrent.futures import ThreadPoolExecutor, as_completed
    from time import sleep

    def run_while_running():
        """The entry point to threads that try to run while a protocol is
        running"""
        with pytest.raises(ThreadedAsyncForbidden):
            session.run()

    # Do this twice to prove we run again after completion.
    for _ in range(2):
        # Use two as the max workers, just like RPC.
        max_workers = 2
        with ThreadPoolExecutor(max_workers=max_workers) as m:
            tasks = list()
            # Start the run.
            tasks.append(m.submit(lambda: session.run()))
            # Try to start running the protocol a whole bunch of times.
            for _ in range(max_workers * 5):
                tasks.append(m.submit(run_while_running))
            # wait to enter pause
            while session.state != "paused":
                sleep(0.05)
            # Now resume
            tasks.append(m.submit(lambda: session.resume()))

            for future in as_completed(tasks):
                future.result()


@pytest.mark.parametrize(
    argnames="create_func,extra_kwargs",
    argvalues=[
        [session.SessionManager.create, {}],
        [session.SessionManager.create_from_bundle, {}],
        [session.SessionManager.create_with_extra_labware, {"extra_labware": {}}],
    ],
)
def test_http_protocol_sessions_disabled(
    session_manager, protocol, create_func, extra_kwargs
):
    """Test that we can create a session if enableHttpProtocolSessions is
    disabled."""
    with patch.object(session.Session, "build_and_prep") as mock_build:
        with patch("opentrons.api.util.enable_http_protocol_sessions") as m:
            m.return_value = False
            create_func(
                session_manager, name="<blank>", contents=protocol.text, **extra_kwargs
            )
            mock_build.assert_called_once()


@pytest.mark.parametrize(
    argnames="create_func,extra_kwargs",
    argvalues=[
        [session.SessionManager.create, {}],
        [session.SessionManager.create_from_bundle, {}],
        [session.SessionManager.create_with_extra_labware, {"extra_labware": {}}],
    ],
)
async def test_http_protocol_sessions_enabled(
    session_manager, protocol, create_func, extra_kwargs
):
    """Test that we cannot create a session if enableHttpProtocolSessions is
    enabled."""
    with patch.object(session.Session, "build_and_prep"):
        with patch("opentrons.api.util.enable_http_protocol_sessions") as m:
            m.return_value = True
            with pytest.raises(
                RuntimeError,
                match="Please disable the 'Enable Experimental HTTP "
                "Protocol Sessions' advanced setting for this robot "
                "if you'd like to upload protocols from the "
                "Opentrons App",
            ):
                session_manager.create(name="<blank>", contents=protocol.text)
