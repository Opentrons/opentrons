import pytest
from opentrons import types
from opentrons import hardware_control as hc
from opentrons.hardware_control.types import Axis


LEFT_PIPETTE_PREFIX = 'p10_single'
LEFT_PIPETTE_MODEL = '{}_v1'.format(LEFT_PIPETTE_PREFIX)
LEFT_PIPETTE_ID = 'testy'


@pytest.fixture
def dummy_instruments():
    dummy_instruments_attached = {
        types.Mount.LEFT: {
            'model': LEFT_PIPETTE_MODEL,
            'id': LEFT_PIPETTE_ID
        },
        types.Mount.RIGHT: {
            'model': None,
            'id': None
        }
    }
    return dummy_instruments_attached


instrument_keys = sorted([
    'name', 'min_volume', 'max_volume', 'aspirate_flow_rate', 'channels',
    'dispense_flow_rate', 'pipette_id', 'current_volume', 'display_name',
    'tip_length', 'has_tip'])


async def test_cache_instruments(dummy_instruments, loop):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments,
        loop=loop)
    await hw_api.cache_instruments()
    assert sorted(hw_api.attached_instruments[types.Mount.LEFT].keys()) == \
        instrument_keys


@pytest.mark.skipif(not hc.Controller,
                    reason='hardware controller not available '
                           '(probably windows)')
async def test_cache_instruments_hc(monkeypatch, dummy_instruments,
                                    hardware_controller_lockfile,
                                    running_on_pi, cntrlr_mock_connect, loop):
    hw_api_cntrlr = await hc.API.build_hardware_controller(loop=loop)

    def mock_driver_model(mount):
        attached_pipette = {'left': LEFT_PIPETTE_MODEL, 'right': None}
        return attached_pipette[mount]

    def mock_driver_id(mount):
        attached_pipette = {'left': LEFT_PIPETTE_ID, 'right': None}
        return attached_pipette[mount]

    monkeypatch.setattr(hw_api_cntrlr._backend._smoothie_driver,
                        'read_pipette_model', mock_driver_model)
    monkeypatch.setattr(hw_api_cntrlr._backend._smoothie_driver,
                        'read_pipette_id', mock_driver_id)

    await hw_api_cntrlr.cache_instruments()

    assert sorted(
        hw_api_cntrlr.attached_instruments[types.Mount.LEFT].keys()) == \
        instrument_keys

    # If we pass a conflicting expectation we should get an error
    with pytest.raises(RuntimeError):
        await hw_api_cntrlr.cache_instruments({types.Mount.LEFT: 'p300_multi'})

    # If we pass a matching expects it should work
    await hw_api_cntrlr.cache_instruments(
        {types.Mount.LEFT: LEFT_PIPETTE_PREFIX})
    assert sorted(
        hw_api_cntrlr.attached_instruments[types.Mount.LEFT].keys()) == \
        instrument_keys


async def test_cache_instruments_sim(loop, dummy_instruments):
    sim = hc.API.build_hardware_simulator(loop=loop)
    # With nothing specified at init or expected, we should have nothing
    await sim.cache_instruments()
    assert sim.attached_instruments == {
        types.Mount.LEFT: {}, types.Mount.RIGHT: {}}
    # When we expect instruments, we should get what we expect since nothing
    # was specified at init time
    await sim.cache_instruments({types.Mount.LEFT: 'p10_single_v1.3'})
    assert sim.attached_instruments[types.Mount.LEFT]['name']\
        == 'p10_single_v1.3'
    # If we use prefixes, that should work too
    await sim.cache_instruments({types.Mount.RIGHT: 'p300_single'})
    assert sim.attached_instruments[types.Mount.RIGHT]['name']\
        == 'p300_single_v1'
    # If we specify instruments at init time, we should get them without
    # passing an expectation
    sim = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments)
    await sim.cache_instruments()
    assert sorted(
        sim.attached_instruments[types.Mount.LEFT].keys()) == \
        instrument_keys
    # If we specify conflicting expectations and init arguments we should
    # get a RuntimeError
    with pytest.raises(RuntimeError):
        await sim.cache_instruments({types.Mount.LEFT: 'p300_multi'})


async def test_aspirate(dummy_instruments, loop):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.home()
    await hw_api.cache_instruments()
    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.aspirate(types.Mount.LEFT, aspirate_ul, aspirate_rate)
    new_plunger_pos = 5.660769
    assert hw_api.current_position(types.Mount.LEFT)[Axis.B] == new_plunger_pos


async def test_dispense(dummy_instruments, loop):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.home()

    await hw_api.cache_instruments()
    aspirate_ul = 10.0
    aspirate_rate = 2
    await hw_api.aspirate(types.Mount.LEFT, aspirate_ul, aspirate_rate)

    dispense_1 = 3.0
    await hw_api.dispense(types.Mount.LEFT, dispense_1)
    plunger_pos_1 = 10.810573
    assert hw_api.current_position(types.Mount.LEFT)[Axis.B] == plunger_pos_1

    await hw_api.dispense(types.Mount.LEFT, rate=2)
    plunger_pos_2 = 2
    assert hw_api.current_position(types.Mount.LEFT)[Axis.B] == plunger_pos_2


async def test_no_pipette(dummy_instruments, loop):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.cache_instruments()
    aspirate_ul = 3.0
    aspirate_rate = 2
    with pytest.raises(types.PipetteNotAttachedError):
        await hw_api.aspirate(types.Mount.RIGHT, aspirate_ul, aspirate_rate)
        assert not hw_api._current_volume[types.Mount.RIGHT]


async def test_pick_up_tip(dummy_instruments, loop):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()
    tip_position = types.Point(12.13, 9, 150)
    target_position = {Axis.X: 46.13,   # Left mount offset
                       Axis.Y: 9,
                       Axis.Z: 218,     # Z retracts after pick_up
                       Axis.A: 218,
                       Axis.B: 2,
                       Axis.C: 19}
    await hw_api.move_to(mount, tip_position)

    # Note: pick_up_tip without a tip_length argument requires the pipette on
    # the associated mount to have an associated tip rack from which to infer
    # the tip length. That behavior is not tested here.
    tip_length = 25.0
    await hw_api.pick_up_tip(mount, tip_length)
    assert hw_api._attached_instruments[mount].has_tip
    assert hw_api._attached_instruments[mount].current_volume == 0
    assert hw_api._current_position == target_position
