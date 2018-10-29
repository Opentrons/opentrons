import pytest
from opentrons import types
from opentrons import hardware_control as hc
from opentrons.hardware_control.types import Axis
from opentrons.hardware_control.pipette import Pipette


@pytest.fixture
def dummy_instruments():
    dummy_instruments_attached = {types.Mount.LEFT: 'p10_single_v1',
                                  types.Mount.RIGHT: None}
    return dummy_instruments_attached


def attached_instruments(inst):
    """
    Format inst dict like the public 'attached_instruments' property
    """
    configs = ['name', 'min_volume', 'max_volume',
               'aspirate_flow_rate', 'dispense_flow_rate']
    instr_objects = {mount: Pipette(model) if model else None
                     for mount, model in inst.items()}
    instruments = {types.Mount.LEFT: {}, types.Mount.RIGHT: {}}
    for mount in types.Mount:
        if not instr_objects[mount]:
            continue
        for key in configs:
            instruments[mount][key] = instr_objects[mount].as_dict()[key]
    return instruments


async def test_cache_instruments(dummy_instruments, loop):
    hw_api = hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments,
        loop=loop)
    await hw_api.cache_instruments()
    assert hw_api.attached_instruments == attached_instruments(
        dummy_instruments)


@pytest.mark.skipif(not hc.Controller,
                    reason='hardware controller not available '
                           '(probably windows)')
async def test_cache_instruments_hc(monkeypatch, dummy_instruments,
                                    hardware_controller_lockfile,
                                    running_on_pi, cntrlr_mock_connect, loop):

    hw_api_cntrlr = hc.API.build_hardware_controller(loop=loop)

    def mock_driver_method(mount):
        attached_pipette = {'left': 'p10_single_v1', 'right': None}
        return attached_pipette[mount]
    monkeypatch.setattr(hw_api_cntrlr._backend._smoothie_driver,
                        'read_pipette_model', mock_driver_method)
    await hw_api_cntrlr.cache_instruments()
    assert hw_api_cntrlr.attached_instruments == attached_instruments(
        dummy_instruments)
    # If we pass a conflicting expectation we should get an error
    with pytest.raises(RuntimeError):
        await hw_api_cntrlr.cache_instruments({types.Mount.LEFT: 'p300_multi'})
    # If we pass a matching expects it should work
    await hw_api_cntrlr.cache_instruments({types.Mount.LEFT: 'p10_single'})
    assert hw_api_cntrlr.attached_instruments\
        == attached_instruments(dummy_instruments)


async def test_cache_instruments_sim(loop, dummy_instruments):
    sim = hc.API.build_hardware_simulator(loop=loop)
    # With nothing specified at init or expected, we should have nothing
    await sim.cache_instruments()
    assert sim.attached_instruments == {types.Mount.LEFT: {},
                                        types.Mount.RIGHT: {}}
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
    assert sim.attached_instruments == attached_instruments(dummy_instruments)
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
    with pytest.raises(hc.PipetteNotAttachedError):
        await hw_api.aspirate(types.Mount.RIGHT, aspirate_ul, aspirate_rate)
        assert not hw_api._current_volume[types.Mount.RIGHT]
