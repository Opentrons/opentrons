import asyncio
import mock

import pytest
from decoy import Decoy

try:
    import aionotify
except (OSError, ModuleNotFoundError):
    aionotify = None  # type: ignore


from opentrons import types, config
from opentrons.hardware_control import API
from opentrons.hardware_control.types import Axis, OT3Mount


LEFT_PIPETTE_PREFIX = "p10_single"
LEFT_PIPETTE_MODEL = "{}_v1".format(LEFT_PIPETTE_PREFIX)
LEFT_PIPETTE_ID = "testy"


def dummy_instruments_attached():
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
    }


@pytest.fixture
def dummy_instruments():
    return dummy_instruments_attached()


def dummy_instruments_attached_ot3():
    return {
        types.Mount.LEFT: {
            "model": "p1000_single_v3.3",
            "id": "testy",
            "name": "p1000_single_gen3",
        },
        types.Mount.RIGHT: {"model": None, "id": None, "name": None},
        OT3Mount.GRIPPER: None,
    }


@pytest.fixture
def dummy_instruments_ot3():
    return dummy_instruments_attached_ot3()


def wrap_build_ot3_sim():
    from opentrons.hardware_control.ot3api import OT3API

    return OT3API.build_hardware_simulator


@pytest.fixture
def ot3_api_obj(request):
    if request.config.getoption("--ot2-only"):
        pytest.skip("testing ot2 only")
    from opentrons.hardware_control.ot3api import OT3API

    return OT3API.build_hardware_simulator


@pytest.fixture(
    params=[
        (lambda: API.build_hardware_simulator, dummy_instruments_attached),
        (wrap_build_ot3_sim, dummy_instruments_attached_ot3),
    ],
    ids=["ot2", "ot3"],
)
def sim_and_instr(request):
    if (
        request.node.get_closest_marker("ot2_only")
        and request.param[0] == wrap_build_ot3_sim
    ):
        pytest.skip()
    if (
        request.node.get_closest_marker("ot3_only")
        and request.param[0] == API.build_hardware_simulator
    ):
        pytest.skip()
    if request.param[0] == wrap_build_ot3_sim and request.config.getoption(
        "--ot2-only"
    ):
        pytest.skip("testing ot2 only")

    yield (request.param[0](), request.param[1]())


@pytest.fixture
def dummy_backwards_compatibility():
    dummy_instruments_attached = {
        types.Mount.LEFT: {
            "model": "p20_single_v2.0",
            "id": LEFT_PIPETTE_ID,
            "name": "p20_single_gen2",
        },
        types.Mount.RIGHT: {
            "model": "p300_single_v2.0",
            "id": LEFT_PIPETTE_ID + "2",
            "name": "p300_single_gen2",
        },
    }
    return dummy_instruments_attached


def get_plunger_speed(api):
    if isinstance(api, API):
        return api.plunger_speed
    else:
        return api._pipette_handler.plunger_speed


async def test_cache_instruments(sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    await hw_api.cache_instruments()

    with pytest.raises(RuntimeError):
        await hw_api.cache_instruments({types.Mount.LEFT: "p400_single_1.0"})
    # TODO (lc 12-5-2022) This is no longer true. We should modify this
    # typecheck once we have static and stateful pipette configurations.
    # typeguard.check_type("left mount dict", attached[types.Mount.LEFT], PipetteDict)


async def test_mismatch_fails(sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    requested_instr = {
        types.Mount.LEFT: "p20_single_gen2",
        types.Mount.RIGHT: "p300_single",
    }
    with pytest.raises(RuntimeError):
        await hw_api.cache_instruments(requested_instr)


@pytest.mark.ot2_only
async def test_backwards_compatibility(dummy_backwards_compatibility, sim_and_instr):
    sim_builder, _ = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_backwards_compatibility,
        loop=asyncio.get_running_loop(),
    )
    requested_instr = {types.Mount.LEFT: "p10_single", types.Mount.RIGHT: "p300_single"}
    volumes = {
        types.Mount.LEFT: {"min": 1, "max": 10},
        types.Mount.RIGHT: {"min": 30, "max": 300},
    }
    await hw_api.cache_instruments(requested_instr)
    attached = hw_api.attached_instruments

    for mount, name in requested_instr.items():
        assert attached[mount]["name"] == dummy_backwards_compatibility[mount]["name"]
        assert attached[mount]["min_volume"] == volumes[mount]["min"]
        assert attached[mount]["max_volume"] == volumes[mount]["max"]


@pytest.mark.skipif(aionotify is None, reason="inotify not available")
async def test_cache_instruments_hc(
    monkeypatch,
    dummy_instruments,
    hardware_controller_lockfile,
    is_robot,
    cntrlr_mock_connect,
):
    hw_api_cntrlr = await API.build_hardware_controller(loop=asyncio.get_running_loop())

    async def mock_driver_model(mount):
        attached_pipette = {"left": LEFT_PIPETTE_MODEL, "right": None}
        return attached_pipette[mount]

    async def mock_driver_id(mount):
        attached_pipette = {"left": LEFT_PIPETTE_ID, "right": None}
        return attached_pipette[mount]

    monkeypatch.setattr(
        hw_api_cntrlr._backend._smoothie_driver, "read_pipette_model", mock_driver_model
    )
    monkeypatch.setattr(
        hw_api_cntrlr._backend._smoothie_driver, "read_pipette_id", mock_driver_id
    )

    await hw_api_cntrlr.cache_instruments()
    # TODO: (ba, 2023-03-08): no longer true, change this
    # attached = hw_api_cntrlr.attached_instruments
    # typeguard.check_type(
    #     "left mount dict default", attached[types.Mount.LEFT], PipetteDict
    # )

    # If we pass a conflicting expectation we should get an error
    with pytest.raises(RuntimeError):
        await hw_api_cntrlr.cache_instruments({types.Mount.LEFT: "p300_multi"})

    # If we pass a matching expects it should work
    await hw_api_cntrlr.cache_instruments({types.Mount.LEFT: LEFT_PIPETTE_PREFIX})
    # TODO: (ba, 2023-03-08): no longer true, change this
    # attached = hw_api_cntrlr.attached_instruments
    # typeguard.check_type(
    #     "left mount dict after expects", attached[types.Mount.LEFT], PipetteDict
    # )


@pytest.mark.ot2_only
async def test_cache_instruments_sim(sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr

    def fake_func1(value):
        return value

    def fake_func2(mount, value):
        return mount, value

    sim = await sim_builder(loop=asyncio.get_running_loop())
    # With nothing specified at init or expected, we should have nothing
    # afterwards and nothing should have been reconfigured
    sim._backend._smoothie_driver.update_steps_per_mm = mock.AsyncMock(fake_func1)
    sim._backend._smoothie_driver.update_pipette_config = mock.AsyncMock(fake_func2)
    sim._backend._smoothie_driver.set_dwelling_current = mock.Mock(fake_func1)

    await sim.cache_instruments()
    attached = sim.attached_instruments
    assert attached == {types.Mount.LEFT: {}, types.Mount.RIGHT: {}}
    sim._backend._smoothie_driver.update_steps_per_mm.assert_not_called()
    sim._backend._smoothie_driver.update_pipette_config.assert_not_called()
    sim._backend._smoothie_driver.set_dwelling_current.assert_not_called()

    sim._backend._smoothie_driver.update_steps_per_mm.reset_mock()
    sim._backend._smoothie_driver.update_pipette_config.reset_mock()
    # When we expect instruments, we should get what we expect since nothing
    # was specified at init time
    await sim.cache_instruments(
        {types.Mount.LEFT: "p10_single", types.Mount.RIGHT: "p300_single_gen2"}
    )
    attached = sim.attached_instruments
    assert attached[types.Mount.LEFT]["model"] == "p10_single_v1"
    assert attached[types.Mount.LEFT]["name"] == "p10_single"

    steps_mm_calls = [mock.call({"B": 768}), mock.call({"C": 3200})]
    pip_config_calls = [
        mock.call("Z", {"home": 220}),
        mock.call("A", {"home": 172.15}),
        mock.call("B", {"max_travel": 30}),
        mock.call("C", {"max_travel": 60}),
    ]
    current_calls = [mock.call({"B": 0.05}), mock.call({"C": 0.05})]
    sim._backend._smoothie_driver.update_steps_per_mm.assert_has_calls(
        steps_mm_calls, any_order=True
    )  # <-- this line
    sim._backend._smoothie_driver.update_pipette_config.assert_has_calls(
        pip_config_calls, any_order=True
    )

    await sim.cache_instruments(
        {types.Mount.LEFT: "p10_single", types.Mount.RIGHT: "p300_multi_gen2"}
    )
    current_calls = [mock.call({"B": 0.05}), mock.call({"C": 0.3})]
    sim._backend._smoothie_driver.set_dwelling_current.assert_has_calls(
        current_calls, any_order=True
    )
    # If we use prefixes, that should work too
    await sim.cache_instruments({types.Mount.RIGHT: "p300_single"})
    attached = sim.attached_instruments
    assert attached[types.Mount.RIGHT]["model"] == "p300_single_v1"
    assert attached[types.Mount.RIGHT]["name"] == "p300_single"
    # If we specify instruments at init time, we should get them without
    # passing an expectation
    sim = await sim_builder(attached_instruments=dummy_instruments)
    await sim.cache_instruments()
    attached = sim.attached_instruments
    # TODO: (ba, 2023-03-08): no longer true, change this
    # typeguard.check_type("after config", attached[types.Mount.LEFT], PipetteDict)

    # If we specify conflicting expectations and init arguments we should
    # get a RuntimeError
    with pytest.raises(RuntimeError):
        await sim.cache_instruments({types.Mount.LEFT: "p300_multi"})
    # Unless we specifically told the simulator to not strictly enforce
    # correspondence between expectations and preconfiguration
    sim = await sim_builder(
        attached_instruments=dummy_instruments,
        loop=asyncio.get_running_loop(),
        strict_attached_instruments=False,
    )
    await sim.cache_instruments({types.Mount.LEFT: "p300_multi"})

    with pytest.raises(RuntimeError):
        # If you pass something that isn't a pipette name it absolutely
        # should not work
        await sim.cache_instruments({types.Mount.LEFT: "p10_sing"})


async def test_prep_aspirate(sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)
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
    await hw_api.aspirate(mount, 1, 1.0)


async def test_aspirate_new(dummy_instruments):
    hw_api = await API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)

    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)
    new_plunger_pos = 6.05285
    pos = await hw_api.current_position(mount)
    assert pos[Axis.B] == pytest.approx(new_plunger_pos)


async def test_aspirate_old(decoy: Decoy, mock_feature_flags: None, dummy_instruments):
    decoy.when(config.feature_flags.use_old_aspiration_functions()).then_return(True)

    hw_api = await API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)

    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)
    new_plunger_pos = 5.660769
    pos = await hw_api.current_position(mount)
    assert pos[Axis.B] == pytest.approx(new_plunger_pos)


async def test_aspirate_ot3(dummy_instruments_ot3, ot3_api_obj):
    hw_api = await ot3_api_obj(
        attached_instruments=dummy_instruments_ot3, loop=asyncio.get_running_loop()
    )
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)

    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)
    new_plunger_pos = 71.212208
    pos = await hw_api.current_position(mount)
    assert pos[Axis.B] == pytest.approx(new_plunger_pos)


async def test_dispense_ot2(dummy_instruments):
    hw_api = await API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    await hw_api.home()

    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)

    aspirate_ul = 10.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)

    dispense_1 = 3.0
    await hw_api.dispense(mount, dispense_1)
    plunger_pos_1 = 10.810573
    assert (await hw_api.current_position(mount))[Axis.B] == plunger_pos_1

    await hw_api.dispense(mount, rate=2)
    plunger_pos_2 = 2
    assert (await hw_api.current_position(mount))[Axis.B] == plunger_pos_2


async def test_dispense_ot3(dummy_instruments_ot3, ot3_api_obj):
    hw_api = await ot3_api_obj(
        attached_instruments=dummy_instruments_ot3, loop=asyncio.get_running_loop()
    )
    await hw_api.home()

    await hw_api.cache_instruments()

    mount = types.Mount.LEFT
    await hw_api.pick_up_tip(mount, 20.0)

    aspirate_ul = 10.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)

    dispense_1 = 3.0
    await hw_api.dispense(mount, dispense_1)
    plunger_pos_1 = 70.92099
    assert (await hw_api.current_position(mount))[Axis.B] == pytest.approx(
        plunger_pos_1
    )

    await hw_api.dispense(mount, rate=2)
    plunger_pos_2 = 71.5
    assert (await hw_api.current_position(mount))[Axis.B] == pytest.approx(
        plunger_pos_2
    )


async def test_no_pipette(sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    await hw_api.cache_instruments()
    aspirate_ul = 3.0
    aspirate_rate = 2
    with pytest.raises(types.PipetteNotAttachedError):
        await hw_api.aspirate(types.Mount.RIGHT, aspirate_ul, aspirate_rate)
        assert not hw_api._current_volume[types.Mount.RIGHT]


async def test_pick_up_tip(is_robot, sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
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


async def test_pick_up_tip_pos_ot2(is_robot, dummy_instruments):
    hw_api = await API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()
    tip_position = types.Point(12.13, 9, 150)
    await hw_api.move_to(mount, tip_position)
    tip_length = 25.0
    await hw_api.pick_up_tip(mount, tip_length)

    target_position = {
        Axis.Z: 218,  # Z retracts after pick_up
        Axis.A: 218,
        Axis.B: 2,
        Axis.C: 19,
    }
    for k, v in target_position.items():
        assert hw_api._current_position[k] == v, f"{k} position doesnt match"


def assert_move_called(mock_move, speed, lock=None):
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


async def test_aspirate_flow_rate(sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()

    await hw_api.pick_up_tip(mount, 20.0)

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
        assert_move_called(mock_move, pytest.approx(10))

    with mock.patch.object(hw_api, "_move") as mock_move:
        await hw_api.prepare_for_aspirate(types.Mount.LEFT)
        await hw_api.aspirate(types.Mount.LEFT, 1, rate=0.5)
        assert_move_called(mock_move, 5)


async def test_dispense_flow_rate(sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()

    await hw_api.pick_up_tip(mount, 20.0)

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
        await hw_api.dispense(types.Mount.LEFT, 1, rate=0.5)
        assert_move_called(mock_move, 5)


async def test_blowout_flow_rate(sim_and_instr):
    sim_builder, dummy_instruments = sim_and_instr
    hw_api = await sim_builder(
        attached_instruments=dummy_instruments, loop=asyncio.get_running_loop()
    )
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()

    await hw_api.pick_up_tip(mount, 20.0)

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


async def test_reset_instruments(monkeypatch, sim_and_instr):
    instruments = {
        types.Mount.LEFT: {
            "model": "p1000_single_v3.3",
            "id": "testy",
            "name": "p1000_single_gen3",
        },
        types.Mount.RIGHT: {
            "model": "p1000_single_v3.3",
            "id": "testy",
            "name": "p1000_single_gen3",
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
