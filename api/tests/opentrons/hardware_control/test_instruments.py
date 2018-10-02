import pytest
from opentrons import types
from opentrons import hardware_control as hc


async def test_cache_instruments(loop):
    dummy_instruments_attached = {types.Mount.LEFT: 'model_abc',
                                  types.Mount.RIGHT: None}
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments_attached, loop=loop)
    await hw_api.cache_instrument_models()
    assert hw_api._attached_instruments == dummy_instruments_attached


@pytest.mark.skipif(not hc.controller,
                    reason='hardware controller not available '
                           '(probably windows)')
async def test_cache_instruments_hc(monkeypatch, hardware_controller_lockfile,
                                    running_on_pi, loop):
    dummy_instruments_attached = {types.Mount.LEFT: 'model_abc',
                                  types.Mount.RIGHT: None}
    hw_api_cntrlr = hc.API.build_hardware_controller(loop=loop)

    def mock_driver_method(mount):
        attached_pipette = {'left': 'model_abc', 'right': None}
        return attached_pipette[mount]
    monkeypatch.setattr(hw_api_cntrlr._backend._smoothie_driver,
                        'read_pipette_model', mock_driver_method)
    await hw_api_cntrlr.cache_instrument_models()
    assert hw_api_cntrlr._attached_instruments == dummy_instruments_attached
