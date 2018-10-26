import pytest
from opentrons import types
from opentrons import hardware_control as hc
from opentrons.hardware_control.types import Axis


LEFT_PIPETTE_MODEL = 'p10_single_v1'
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


async def test_cache_instruments(dummy_instruments, loop):
    expected_keys = [
        'name', 'min_volume', 'max_volume', 'aspirate_flow_rate',
        'dispense_flow_rate', 'pipette_id']

    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments,
        loop=loop)
    await hw_api.cache_instruments()
    assert sorted(hw_api.attached_instruments[types.Mount.LEFT].keys()) == \
        sorted(expected_keys)


@pytest.mark.skipif(not hc.Controller,
                    reason='hardware controller not available '
                           '(probably windows)')
async def test_cache_instruments_hc(monkeypatch, dummy_instruments,
                                    hardware_controller_lockfile,
                                    running_on_pi, cntrlr_mock_connect, loop):
    expected_keys = [
        'name', 'min_volume', 'max_volume', 'aspirate_flow_rate',
        'dispense_flow_rate', 'pipette_id']

    hw_api_cntrlr = hc.API.build_hardware_controller(loop=loop)

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
        sorted(expected_keys)


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
    with pytest.raises(hc.PipetteNotAttachedError):
        await hw_api.aspirate(types.Mount.RIGHT, aspirate_ul, aspirate_rate)
        assert not hw_api._current_volume[types.Mount.RIGHT]
