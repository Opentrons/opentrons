import pytest
from opentrons.types import Point
from opentrons.hardware_control import pipette, types
from opentrons.config import pipette_config


def test_tip_tracking():
    pip = pipette.Pipette('p10_single_v1',
                          {'single': [0, 0, 0],
                           'multi': [0, 0, 0]},
                          'testID')
    with pytest.raises(AssertionError):
        pip.remove_tip()
    assert not pip.has_tip
    tip_length = 25.0
    pip.add_tip(tip_length)
    assert pip.has_tip
    with pytest.raises(AssertionError):
        pip.add_tip(tip_length)
    pip.remove_tip()
    assert not pip.has_tip
    with pytest.raises(AssertionError):
        pip.remove_tip()


@pytest.mark.parametrize('model', pipette_config.config_models)
def test_critical_points(model):
    loaded = pipette_config.load(model)
    pip = pipette.Pipette(model,
                          {'single': [0, 0, 0], 'multi': [0, 0, 0]},
                          'testID')
    mod_offset = Point(*loaded.model_offset)
    assert pip.critical_point() == mod_offset
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == mod_offset
    assert pip.critical_point(types.CriticalPoint.TIP) == mod_offset
    tip_length = 25.0
    pip.add_tip(tip_length)
    new = mod_offset._replace(z=mod_offset.z
                              - tip_length)
    assert pip.critical_point() == new
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == mod_offset
    assert pip.critical_point(types.CriticalPoint.TIP) == new
    pip.remove_tip()
    assert pip.critical_point() == mod_offset
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == mod_offset
    assert pip.critical_point(types.CriticalPoint.TIP) == mod_offset


@pytest.mark.parametrize('model', pipette_config.config_models)
def test_critical_point_tiplength(use_new_calibration, model):
    loaded = pipette_config.load(model)
    instr_z = 25
    pip = pipette.Pipette(
        model,
        {'single': [0, 0, instr_z], 'multi': [0, 0, instr_z]},
        'testID')
    mod_plus_instr = Point(*loaded.model_offset) + Point(0, 0, instr_z)
    assert pip.critical_point() == mod_plus_instr
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == mod_plus_instr
    assert pip.critical_point(types.CriticalPoint.TIP) == mod_plus_instr
    tip_length = 25.0
    pip.add_tip(tip_length)
    # unlike the above case, mod offset should not change
    assert pip.critical_point() == mod_plus_instr - Point(0, 0, tip_length)
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == mod_plus_instr
    # if there is a tip, we should see it here added
    assert pip.critical_point(types.CriticalPoint.TIP)\
        == mod_plus_instr - Point(0, 0, tip_length)
    pip.remove_tip()
    assert pip.critical_point() == mod_plus_instr
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == mod_plus_instr
    assert pip.critical_point(types.CriticalPoint.TIP) == mod_plus_instr


def test_volume_tracking():
    for config in pipette_config.config_models:
        loaded = pipette_config.load(config)
        pip = pipette.Pipette(config,
                              {'single': [0, 0, 0], 'multi': [0, 0, 0]},
                              'testID')
        assert pip.current_volume == 0.0
        assert pip.available_volume == loaded.max_volume
        assert pip.ok_to_add_volume(loaded.max_volume - 0.1)
        pip.set_current_volume(0.1)
        with pytest.raises(AssertionError):
            pip.set_current_volume(loaded.max_volume + 0.1)
        with pytest.raises(AssertionError):
            pip.set_current_volume(-1)
        assert pip.current_volume == 0.1
        pip.remove_current_volume(0.1)
        with pytest.raises(AssertionError):
            pip.remove_current_volume(0.1)
        assert pip.current_volume == 0.0
        pip.set_current_volume(loaded.max_volume)
        assert not pip.ok_to_add_volume(0.1)
        with pytest.raises(AssertionError):
            pip.add_current_volume(0.1)
        assert pip.current_volume == loaded.max_volume


def test_config_update():
    for config in pipette_config.config_models:
        pip = pipette.Pipette(config,
                              {'single': [0, 0, 0], 'multi': [0, 0, 0]},
                              'testID')
        sample_plunger_pos = {'top': 19.5}
        pip.update_config_item('top', sample_plunger_pos.get('top'))
        assert pip.config.top == sample_plunger_pos.get('top')


def test_smoothie_config_update(monkeypatch):
    for config in pipette_config.config_models:
        assert config == config


@pytest.mark.parametrize('config_model', pipette_config.config_models)
def test_tip_overlap(config_model):
    pip = pipette.Pipette(config_model,
                          {'single': [0, 0, 0], 'multi': [0, 0, 0]},
                          'testId')
    assert pip.config.tip_overlap\
        == pipette_config.configs[config_model]['tipOverlap']
