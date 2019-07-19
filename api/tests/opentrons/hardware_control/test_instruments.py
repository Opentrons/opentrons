import asyncio
from unittest import mock

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
            'id': LEFT_PIPETTE_ID,
            'name': LEFT_PIPETTE_PREFIX,
        },
        types.Mount.RIGHT: {
            'model': None,
            'id': None,
            'name': None,
        }
    }
    return dummy_instruments_attached


instrument_keys = sorted([
    'name', 'min_volume', 'max_volume', 'aspirate_flow_rate', 'channels',
    'dispense_flow_rate', 'pipette_id', 'current_volume', 'display_name',
    'tip_length', 'has_tip', 'model', 'blow_out_flow_rate',
    'blow_out_speed', 'aspirate_speed', 'dispense_speed'])


async def test_cache_instruments(dummy_instruments, loop):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments,
        loop=loop)
    await hw_api.cache_instruments()
    attached = await hw_api.attached_instruments
    assert sorted(attached[types.Mount.LEFT].keys()) == \
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
    attached = await hw_api_cntrlr.attached_instruments
    assert sorted(
        attached[types.Mount.LEFT].keys()) == \
        instrument_keys

    # If we pass a conflicting expectation we should get an error
    with pytest.raises(RuntimeError):
        await hw_api_cntrlr.cache_instruments({types.Mount.LEFT: 'p300_multi'})

    # If we pass a matching expects it should work
    await hw_api_cntrlr.cache_instruments(
        {types.Mount.LEFT: LEFT_PIPETTE_PREFIX})
    attached = await hw_api_cntrlr.attached_instruments
    assert sorted(
        attached[types.Mount.LEFT].keys()) == \
        instrument_keys


async def test_cache_instruments_sim(loop, dummy_instruments):
    sim = hc.API.build_hardware_simulator(loop=loop)
    # With nothing specified at init or expected, we should have nothing
    await sim.cache_instruments()
    attached = await sim.attached_instruments
    assert attached == {
        types.Mount.LEFT: {}, types.Mount.RIGHT: {}}
    # When we expect instruments, we should get what we expect since nothing
    # was specified at init time
    await sim.cache_instruments({types.Mount.LEFT: 'p10_single_v1.3'})
    attached = await sim.attached_instruments
    assert attached[types.Mount.LEFT]['model']\
        == 'p10_single_v1.3'
    assert attached[types.Mount.LEFT]['name']\
        == 'p10_single'
    # If we use prefixes, that should work too
    await sim.cache_instruments({types.Mount.RIGHT: 'p300_single'})
    attached = await sim.attached_instruments
    assert attached[types.Mount.RIGHT]['model']\
        == 'p300_single_v1'
    assert attached[types.Mount.RIGHT]['name']\
        == 'p300_single'
    # If we specify instruments at init time, we should get them without
    # passing an expectation
    sim = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments)
    await sim.cache_instruments()
    attached = await sim.attached_instruments
    assert sorted(
        attached[types.Mount.LEFT].keys()) == \
        instrument_keys
    # If we specify conflicting expectations and init arguments we should
    # get a RuntimeError
    with pytest.raises(RuntimeError):
        await sim.cache_instruments({types.Mount.LEFT: 'p300_multi'})
    # Unless we specifically told the simulator to not strictly enforce
    # correspondence between expectations and preconfiguration
    sim = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments,
        loop=loop, strict_attached_instruments=False)
    await sim.cache_instruments({types.Mount.LEFT: 'p300_multi'})


async def test_aspirate_new(dummy_instruments, loop):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.home()
    await hw_api.cache_instruments()
    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.aspirate(types.Mount.LEFT, aspirate_ul, aspirate_rate)
    new_plunger_pos = 6.05285
    pos = await hw_api.current_position(types.Mount.LEFT)
    assert pos[Axis.B] == new_plunger_pos


async def test_aspirate_old(dummy_instruments, loop, old_aspiration):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.home()
    await hw_api.cache_instruments()
    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.aspirate(types.Mount.LEFT, aspirate_ul, aspirate_rate)
    new_plunger_pos = 5.660769
    pos = await hw_api.current_position(types.Mount.LEFT)
    assert pos[Axis.B] == new_plunger_pos


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
    assert (await hw_api.current_position(types.Mount.LEFT))[Axis.B]\
        == plunger_pos_1

    await hw_api.dispense(types.Mount.LEFT, rate=2)
    plunger_pos_2 = 2
    assert (await hw_api.current_position(types.Mount.LEFT))[Axis.B]\
        == plunger_pos_2


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


async def test_aspirate_flow_rate(dummy_instruments, loop, monkeypatch):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()
    mock_move_plunger = mock.Mock()

    def instant_future(mount, distance, speed):
        fut = asyncio.Future()
        fut.set_result(None)
        return fut

    mock_move_plunger.side_effect = instant_future
    monkeypatch.setattr(hw_api, '_move_plunger', mock_move_plunger)
    pip = hw_api._attached_instruments[mount]
    await hw_api.aspirate(types.Mount.LEFT, 2)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 2, 'aspirate'),
        speed=hw_api._plunger_speed(
            pip, pip.config.aspirate_flow_rate, 'aspirate')
    )
    mock_move_plunger.reset_mock()
    await hw_api.aspirate(types.Mount.LEFT, 2, rate=0.5)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 4, 'aspirate'),
        speed=hw_api._plunger_speed(
            pip, pip.config.aspirate_flow_rate * 0.5, 'aspirate')
    )
    mock_move_plunger.reset_mock()
    hw_api.set_flow_rate(mount, aspirate=1)
    await hw_api.aspirate(types.Mount.LEFT, 2)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 6, 'aspirate'),
        speed=hw_api._plunger_speed(pip, 2, 'aspirate')
    )
    mock_move_plunger.reset_mock()
    await hw_api.aspirate(types.Mount.LEFT, 2, rate=0.5)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 8, 'aspirate'),
        speed=hw_api._plunger_speed(pip, 1, 'aspirate')
    )
    mock_move_plunger.reset_mock()
    hw_api.set_pipette_speed(mount, aspirate=10)
    await hw_api.aspirate(types.Mount.LEFT, 1)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 8, 'aspirate'),
        speed=10
    )
    mock_move_plunger.reset_mock()
    await hw_api.aspirate(types.Mount.LEFT, 1, rate=0.5)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 8, 'aspirate'),
        speed=5
    )


async def test_dispense_flow_rate(dummy_instruments, loop, monkeypatch):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()
    await hw_api.aspirate(mount, 10)
    mock_move_plunger = mock.Mock()

    def instant_future(mount, distance, speed):
        fut = asyncio.Future()
        fut.set_result(None)
        return fut

    mock_move_plunger.side_effect = instant_future
    monkeypatch.setattr(hw_api, '_move_plunger', mock_move_plunger)
    pip = hw_api._attached_instruments[mount]
    await hw_api.dispense(types.Mount.LEFT, 2)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 8, 'dispense'),
        speed=hw_api._plunger_speed(
            pip, pip.config.dispense_flow_rate, 'dispense')
    )
    mock_move_plunger.reset_mock()
    await hw_api.dispense(types.Mount.LEFT, 2, rate=0.5)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 6, 'dispense'),
        speed=hw_api._plunger_speed(
            pip, pip.config.dispense_flow_rate * 0.5, 'dispense')
    )
    mock_move_plunger.reset_mock()
    hw_api.set_flow_rate(mount, dispense=3)
    await hw_api.dispense(types.Mount.LEFT, 2)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 4, 'dispense'),
        speed=hw_api._plunger_speed(pip, 3, 'dispense')
    )
    mock_move_plunger.reset_mock()
    await hw_api.dispense(types.Mount.LEFT, 2, rate=0.5)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 2, 'dispense'),
        speed=hw_api._plunger_speed(pip, 1.5, 'dispense')
    )
    mock_move_plunger.reset_mock()
    hw_api.set_pipette_speed(mount, dispense=10)
    await hw_api.dispense(types.Mount.LEFT, 1)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 1, 'dispense'),
        speed=10
    )
    mock_move_plunger.reset_mock()
    await hw_api.dispense(types.Mount.LEFT, 1, rate=0.5)
    assert mock_move_plunger.called_with(
        mount,
        hw_api._plunger_position(pip, 0, 'dispense'),
        speed=5
    )


async def test_blowout_flow_rate(dummy_instruments, loop, monkeypatch):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    mount = types.Mount.LEFT
    await hw_api.home()
    await hw_api.cache_instruments()

    mock_move_plunger = mock.Mock()

    def instant_future(mount, distance, speed):
        fut = asyncio.Future()
        fut.set_result(None)
        return fut

    mock_move_plunger.side_effect = instant_future
    monkeypatch.setattr(hw_api, '_move_plunger', mock_move_plunger)
    pip = hw_api._attached_instruments[mount]

    await hw_api.aspirate(mount, 10)
    mock_move_plunger.reset_mock()
    await hw_api.blow_out(mount)
    assert mock_move_plunger.called_with(
        mount,
        pip.config.blow_out,
        speed=hw_api._plunger_speed(
            pip, pip.config.blow_out_flow_rate, 'dispense')
    )
    mock_move_plunger.reset_mock()

    hw_api.set_flow_rate(mount, blow_out=2)
    await hw_api.aspirate(mount, 10)
    mock_move_plunger.reset_mock()
    await hw_api.blow_out(types.Mount.LEFT)
    assert mock_move_plunger.called_with(
        mount,
        pip.config.blow_out,
        speed=hw_api._plunger_speed(pip, 2, 'dispense')
    )
    mock_move_plunger.reset_mock()

    hw_api.set_pipette_speed(mount, blow_out=15)
    await hw_api.aspirate(types.Mount.LEFT, 10)
    mock_move_plunger.reset_mock()
    await hw_api.blow_out(types.Mount.LEFT)
    assert mock_move_plunger.called_with(
        mount,
        pip.config.blow_out,
        speed=15
    )
