import asyncio
from typing import (
    Any,
    Awaitable,
    Callable,
    Coroutine,
    Dict,
    Iterator,
    Optional,
    Tuple,
    TypeAlias,
    Union,
)

import mock
import pytest
from _pytest.fixtures import SubRequest

try:
    import aionotify  # type: ignore[import-untyped]
except (OSError, ModuleNotFoundError):
    aionotify = None


from opentrons_shared_data.errors.exceptions import CommandPreconditionViolated

from opentrons import types
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis, OT3Mount
from opentrons.types import Mount

LEFT_PIPETTE_PREFIX = "p10_single"
LEFT_PIPETTE_MODEL = "{}_v1".format(LEFT_PIPETTE_PREFIX)
LEFT_PIPETTE_ID = "testy"

DummyInstrumentConfig: TypeAlias = Optional[Dict[Mount, Dict[str, Optional[str]]]]
OT3DummyInstrumentConfig: TypeAlias = Dict[
    Union[Mount, OT3Mount], Optional[Dict[str, Optional[str]]]
]
OldDummyInstrumentConfig: TypeAlias = Optional[Dict[Mount, Dict[str, Optional[str]]]]


def dummy_instruments_attached() -> Tuple[DummyInstrumentConfig, int]:
    return {
        types.Mount.LEFT: {
            "model": LEFT_PIPETTE_MODEL,
            "id": LEFT_PIPETTE_ID,
            "name": LEFT_PIPETTE_PREFIX,
        },
        types.Mount.RIGHT: {
            "model": None,
            "id": None,
            "name": None,
        },
    }, 10


@pytest.fixture
def dummy_instruments() -> Tuple[DummyInstrumentConfig, int]:
    return dummy_instruments_attached()


def dummy_instruments_attached_ot3() -> Tuple[OT3DummyInstrumentConfig, int]:
    return {
        types.Mount.LEFT: {
            "model": "p1000_single_v3.3",
            "id": "testy",
            "name": "flex_1channel_1000",
        },
        types.Mount.RIGHT: {"model": None, "id": None, "name": None},
        OT3Mount.GRIPPER: None,
    }, 200


@pytest.fixture
def dummy_instruments_ot3() -> Tuple[OT3DummyInstrumentConfig, int]:
    return dummy_instruments_attached_ot3()


@pytest.fixture
def mock_api_verify_tip_presence_ot3(request: SubRequest) -> Iterator[mock.AsyncMock]:
    if request.config.getoption("--ot2-only"):
        pytest.skip("testing ot2 only")
    from opentrons.hardware_control.ot3api import OT3API

    with mock.patch.object(OT3API, "verify_tip_presence") as mock_tip_presence:
        yield mock_tip_presence


def wrap_build_ot3_sim() -> Callable[[Any], Coroutine[Any, Any, OT3API]]:
    from opentrons.hardware_control.ot3api import OT3API

    with mock.patch.object(OT3API, "verify_tip_presence") as mock_tip_presence:  # noqa: F841
        return OT3API.build_hardware_simulator


@pytest.fixture
def ot3_api_obj(
    request: SubRequest, mock_api_verify_tip_presence_ot3: Iterator[mock.AsyncMock]
) -> Callable[[Any], Coroutine[Any, Any, OT3API]]:
    if request.config.getoption("--ot2-only"):
        pytest.skip("testing ot2 only")
    from opentrons.hardware_control.ot3api import OT3API

    return OT3API.build_hardware_simulator


@pytest.fixture(
    params=[
        (wrap_build_ot3_sim, dummy_instruments_attached_ot3),
    ],
    ids=["ot3"],
)
def sim_and_instr(request: SubRequest) -> Iterator[Tuple[Any, Any]]:
    yield (request.param[0](), request.param[1]())


def get_plunger_speed(api: OT3API) -> Callable[[Any, Any, Any], float]:
    return api._pipette_handler.plunger_speed


async def test_cache_instruments(
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    await hw_api.cache_instruments()

    with pytest.raises(RuntimeError):
        await hw_api.cache_instruments({types.Mount.LEFT: "p400_single_1.0"})
    # TODO (lc 12-5-2022) This is no longer true. We should modify this
    # typecheck once we have static and stateful pipette configurations.
    # typeguard.check_type("left mount dict", attached[types.Mount.LEFT], PipetteDict)


async def test_mismatch_fails(
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    requested_instr = {
        types.Mount.LEFT: "p20_single_gen2",
        types.Mount.RIGHT: "p300_single",
    }
    with pytest.raises(RuntimeError):
        await hw_api.cache_instruments(requested_instr)


async def test_prep_aspirate(
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]
    dummy_tip_vol = dummy_instruments[1]
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)
    hw_api.set_working_volume(mount, dummy_tip_vol)
    # If we just picked up a new tip, we should be fine
    await hw_api.aspirate(mount, 1)

    # If we just did blow-out and haven't prepared, we should get an error
    await hw_api.blow_out(mount)
    with pytest.raises(RuntimeError):
        await hw_api.aspirate(mount, 1, 1.0)
    # If we're empty and have prepared, we should be fine
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, 1)
    # If we're not empty, we should be fine
    await hw_api.aspirate(mount, 1)

    # If we don't prep_after, we should still be fine
    await hw_api.drop_tip(mount)
    await hw_api.pick_up_tip(mount, 20.0, prep_after=False)
    hw_api.set_working_volume(mount, dummy_tip_vol)
    await hw_api.aspirate(mount, 1, 1.0)


async def test_aspirate_ot3_50(
    dummy_instruments_ot3: Tuple[OT3DummyInstrumentConfig, int],
    ot3_api_obj: Callable[..., Awaitable[Any]],
) -> None:
    assert dummy_instruments_ot3 is not None
    hw_api = await ot3_api_obj(
        attached_instruments=dummy_instruments_ot3[0], loop=asyncio.get_running_loop()
    )
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)
    hw_api.set_working_volume(mount, 50)
    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)
    new_plunger_pos = 71.1968
    pos = await hw_api.current_position(mount)
    assert pos[Axis.B] == pytest.approx(new_plunger_pos)


async def test_aspirate_ot3_1000(
    dummy_instruments_ot3: Tuple[OT3DummyInstrumentConfig, int],
    ot3_api_obj: Callable[..., Awaitable[Any]],
) -> None:
    hw_api = await ot3_api_obj(
        attached_instruments=dummy_instruments_ot3[0], loop=asyncio.get_running_loop()
    )
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)

    hw_api.set_working_volume(mount, 1000)
    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)
    new_plunger_pos = 71.2122
    pos = await hw_api.current_position(mount)
    assert pos[Axis.B] == pytest.approx(new_plunger_pos)


async def test_configure_ot3(ot3_api_obj: Callable[..., Awaitable[Any]]) -> None:
    instrs = {
        types.Mount.LEFT: {
            "model": "p50_multi_v3.3",
            "id": "testy",
            "name": "p50_multi_gen3",
        },
        types.Mount.RIGHT: {"model": None, "id": None, "name": None},
        OT3Mount.GRIPPER: None,
    }
    hw_api = await ot3_api_obj(attached_instruments=instrs)
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)
    hw_api.set_working_volume(mount, 50)
    await hw_api.configure_for_volume(mount, 26)
    await hw_api.prepare_for_aspirate(mount)
    pos = await hw_api.current_position(mount)
    assert pos[Axis.B] == pytest.approx(71.5)
    assert hw_api._pipette_handler.get_pipette(OT3Mount.LEFT).push_out_volume == 2

    await hw_api.set_liquid_class(mount, "lowVolumeDefault")
    await hw_api.prepare_for_aspirate(mount)
    pos = await hw_api.current_position(mount)
    assert pos[Axis.B] == pytest.approx(61.5)
    assert hw_api._pipette_handler.get_pipette(OT3Mount.LEFT).push_out_volume == 7

    await hw_api.set_liquid_class(mount, "default")
    await hw_api.prepare_for_aspirate(mount)
    pos = await hw_api.current_position(mount)
    assert pos[Axis.B] == pytest.approx(71.5)


async def test_dispense_ot3(
    dummy_instruments_ot3: Tuple[OT3DummyInstrumentConfig, int],
    ot3_api_obj: Callable[..., Awaitable[Any]],
) -> None:
    hw_api = await ot3_api_obj(
        attached_instruments=dummy_instruments_ot3[0], loop=asyncio.get_running_loop()
    )
    await hw_api.home()

    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)
    hw_api.set_working_volume(mount, 50)
    aspirate_ul = 50
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)
    dispense_1 = 25
    await hw_api.dispense(mount, dispense_1)
    plunger_pos_1 = 69.705
    assert (await hw_api.current_position(mount))[Axis.B] == pytest.approx(
        plunger_pos_1, 0.1
    )

    with pytest.raises(CommandPreconditionViolated):
        await hw_api.dispense(mount, 5, push_out=10)

    await hw_api.dispense(mount, rate=2, push_out=10, is_full_dispense=True)
    plunger_pos_2 = 72.2715
    assert (await hw_api.current_position(mount))[Axis.B] == pytest.approx(
        plunger_pos_2, 0.1
    )


async def test_no_pipette(
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    await hw_api.cache_instruments()
    aspirate_ul = 3.0
    aspirate_rate = 2
    with pytest.raises(types.PipetteNotAttachedError):
        await hw_api.aspirate(types.Mount.RIGHT, aspirate_ul, aspirate_rate)
        assert not hw_api._current_volume[types.Mount.RIGHT]


async def test_tip_pickup_moves(
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    """Make sure that tip_pickup_moves does not add a tip to the instrument."""
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]

    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()

    config = hw_api.get_config()

    if config.model == "OT-2 Standard":
        spec, _ = hw_api.plan_check_pick_up_tip(
            mount=mount, tip_length=40.0, presses=None, increment=None
        )
        await hw_api.tip_pickup_moves(mount=mount)
    else:
        await hw_api.tip_pickup_moves(mount)

    assert not hw_api.hardware_instruments[mount].has_tip


async def test_pick_up_tip(
    is_robot: bool,
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()
    tip_position = types.Point(12.13, 9, 150)
    await hw_api.move_to(mount, tip_position)

    # Note: pick_up_tip without a tip_length argument requires the pipette on
    # the associated mount to have an associated tip rack from which to infer
    # the tip length. That behavior is not tested here.
    tip_length = 25.0
    await hw_api.pick_up_tip(mount, tip_length)
    assert hw_api.hardware_instruments[mount].has_tip
    assert hw_api.hardware_instruments[mount].current_volume == 0


def assert_move_called(mock_move: mock.Mock, speed: float, lock: Any = None) -> None:
    if lock is not None:
        mock_move.assert_called_with(
            mock.ANY,
            speed=speed,
            home_flagged_axes=False,
            acquire_lock=lock,
        )
    else:
        mock_move.assert_called_with(
            mock.ANY,
            speed=speed,
            home_flagged_axes=False,
        )


async def test_aspirate_flow_rate(
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]
    tip_vol = dummy_instruments[1]
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()

    await hw_api.pick_up_tip(mount, 20.0)
    hw_api.set_working_volume(mount, tip_vol)

    pip = hw_api.hardware_instruments[mount]
    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(types.Mount.LEFT)
        await hw_api.aspirate(types.Mount.LEFT, 2)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, pip.aspirate_flow_rate, "aspirate"),
        )

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(types.Mount.LEFT)
        await hw_api.aspirate(types.Mount.LEFT, 2, rate=0.5)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, pip.aspirate_flow_rate * 0.5, "aspirate"),
        )

    hw_api.set_flow_rate(mount, aspirate=1)
    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(types.Mount.LEFT)
        await hw_api.aspirate(types.Mount.LEFT, 2)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, 1, "aspirate"),
        )

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(types.Mount.LEFT)
        await hw_api.aspirate(types.Mount.LEFT, 2, rate=0.5)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, 0.5, "aspirate"),
        )

    hw_api.set_pipette_speed(mount, aspirate=10)
    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(types.Mount.LEFT)
        await hw_api.aspirate(types.Mount.LEFT, 1)
        assert_move_called(mock_move, pytest.approx(10))  # type: ignore[arg-type]

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(types.Mount.LEFT)
        await hw_api.aspirate(types.Mount.LEFT, 1, rate=0.5)
        assert_move_called(mock_move, 5)


async def test_dispense_flow_rate(
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]
    tip_vol = dummy_instruments[1]
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()

    await hw_api.pick_up_tip(mount, 20.0)
    hw_api.set_working_volume(mount, tip_vol)

    await hw_api.prepare_for_aspirate(types.Mount.LEFT)
    await hw_api.aspirate(mount, 10)

    pip = hw_api.hardware_instruments[mount]

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.dispense(types.Mount.LEFT, 2)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, pip.dispense_flow_rate, "dispense"),
        )

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.dispense(types.Mount.LEFT, 2, rate=0.5)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, pip.dispense_flow_rate * 0.5, "dispense"),
        )

    hw_api.set_flow_rate(mount, dispense=3)
    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.dispense(types.Mount.LEFT, 2)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, 3, "dispense"),
        )

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.dispense(types.Mount.LEFT, 2, rate=0.5)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, 1.5, "dispense"),
        )

    hw_api.set_pipette_speed(mount, dispense=10)
    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.dispense(types.Mount.LEFT, 1)
        assert_move_called(mock_move, 10)

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.dispense(types.Mount.LEFT, 1, rate=0.5, is_full_dispense=True)
        assert_move_called(mock_move, 5)


async def test_blowout_flow_rate(
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    sim_builder = sim_and_instr[0]
    assert sim_and_instr[1] is not None
    dummy_instruments = sim_and_instr[1]
    tip_vol = dummy_instruments[1]
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments[0], loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()

    await hw_api.pick_up_tip(mount, 20.0)
    hw_api.set_working_volume(mount, tip_vol)

    pip = hw_api.hardware_instruments[mount]

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(mount)
        await hw_api.aspirate(mount, 10)
        await hw_api.blow_out(mount)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, pip.blow_out_flow_rate, "blowout"),
        )

    hw_api.set_flow_rate(mount, blow_out=2)
    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(mount)
        await hw_api.aspirate(mount, 10)
        await hw_api.blow_out(types.Mount.LEFT)
        assert_move_called(
            mock_move,
            get_plunger_speed(hw_api)(pip, 2, "blowout"),
        )

    hw_api.set_pipette_speed(mount, blow_out=15)
    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(mount)
        await hw_api.aspirate(types.Mount.LEFT, 10)
        await hw_api.blow_out(types.Mount.LEFT)
        assert_move_called(mock_move, 15)


async def test_reset_instruments(
    monkeypatch: pytest.MonkeyPatch,
    sim_and_instr: Tuple[
        Callable[..., Awaitable[Any]], Tuple[DummyInstrumentConfig, float]
    ],
) -> None:
    instruments = {
        types.Mount.LEFT: {
            "model": "p1000_single_v3.3",
            "id": "testy",
        },
        types.Mount.RIGHT: {
            "model": "p1000_single_v3.3",
            "id": "testy",
        },
    }
    sim_builder, _ = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=instruments, loop=asyncio.get_running_loop()
    )
    hw_api.set_flow_rate(types.Mount.LEFT, 15)
    hw_api.set_flow_rate(types.Mount.RIGHT, 50)
    # gut check
    assert hw_api.attached_instruments[types.Mount.LEFT]["aspirate_flow_rate"] == 15
    assert hw_api.attached_instruments[types.Mount.RIGHT]["aspirate_flow_rate"] == 50
    old_l = hw_api.hardware_instruments[types.Mount.LEFT]
    old_r = hw_api.hardware_instruments[types.Mount.RIGHT]

    assert old_l.aspirate_flow_rate == 15
    assert old_r.aspirate_flow_rate == 50
    hw_api.reset_instrument(types.Mount.LEFT)

    # after the reset, the left should be more or less the same
    assert old_l.pipette_id == hw_api.hardware_instruments[types.Mount.LEFT].pipette_id
    assert hw_api.hardware_instruments[types.Mount.LEFT].aspirate_flow_rate != 15
    assert hw_api.hardware_instruments[types.Mount.RIGHT].aspirate_flow_rate == 50
    # but non-default configs should be changed
    assert hw_api.attached_instruments[types.Mount.LEFT]["aspirate_flow_rate"] != 15
    # and the right pipette remains the same
    assert hw_api.attached_instruments[types.Mount.RIGHT]["aspirate_flow_rate"] == 50

    # set the flowrate on the left again
    hw_api.set_flow_rate(types.Mount.LEFT, 50)
    assert hw_api.attached_instruments[types.Mount.LEFT]["aspirate_flow_rate"] == 50
    # reset the configurations of both pipettes
    hw_api.reset_instrument()
    assert hw_api.attached_instruments[types.Mount.LEFT]["aspirate_flow_rate"] != 15
    assert hw_api.attached_instruments[types.Mount.RIGHT]["aspirate_flow_rate"] != 50

    assert hw_api.hardware_instruments[types.Mount.LEFT].aspirate_flow_rate != 15
    assert hw_api.hardware_instruments[types.Mount.LEFT].aspirate_flow_rate != 50
