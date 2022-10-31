import pytest
from opentrons.calibration_storage import types as cal_types
from opentrons.types import Point
from opentrons.hardware_control.instruments.ot2 import pipette, instrument_calibration
from opentrons.hardware_control import types
from opentrons.config import pipette_config

PIP_CAL = instrument_calibration.PipetteOffsetByPipetteMount(
    offset=[0, 0, 0],
    source=cal_types.SourceType.user,
    status=cal_types.CalibrationStatus(),
)


def test_tip_tracking():
    pip = pipette.Pipette(pipette_config.load("p10_single_v1"), PIP_CAL, "testID")
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


@pytest.mark.parametrize("model", pipette_config.config_models)
def test_critical_points_nozzle_offset(model):
    loaded = pipette_config.load(model)
    pip = pipette.Pipette(loaded, PIP_CAL, "testID")
    # default pipette offset is[0, 0, 0], only nozzle offset would be used
    # to determine critical point
    nozzle_offset = Point(*loaded.nozzle_offset)
    assert pip.critical_point() == nozzle_offset
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == nozzle_offset
    assert pip.critical_point(types.CriticalPoint.TIP) == nozzle_offset
    tip_length = 25.0
    pip.add_tip(tip_length)
    new = nozzle_offset._replace(z=nozzle_offset.z - tip_length)
    assert pip.critical_point() == new
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == nozzle_offset
    assert pip.critical_point(types.CriticalPoint.TIP) == new
    pip.remove_tip()
    assert pip.critical_point() == nozzle_offset
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == nozzle_offset
    assert pip.critical_point(types.CriticalPoint.TIP) == nozzle_offset


@pytest.mark.parametrize("model", pipette_config.config_models)
def test_critical_points_pipette_offset(model):
    loaded = pipette_config.load(model)
    # set pipette offset calibration
    pip_cal = instrument_calibration.PipetteOffsetByPipetteMount(
        offset=[10, 10, 10],
        source=cal_types.SourceType.user,
        status=cal_types.CalibrationStatus(),
    )
    pip = pipette.Pipette(loaded, pip_cal, "testID")
    # pipette offset + nozzle offset to determine critical point
    offsets = Point(*pip_cal.offset) + Point(*pip.nozzle_offset)
    assert pip.critical_point() == offsets
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == offsets
    assert pip.critical_point(types.CriticalPoint.TIP) == offsets
    tip_length = 25.0
    pip.add_tip(tip_length)
    new = offsets._replace(z=offsets.z - tip_length)
    assert pip.critical_point() == new
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == offsets
    assert pip.critical_point(types.CriticalPoint.TIP) == new
    pip.remove_tip()
    assert pip.critical_point() == offsets
    assert pip.critical_point(types.CriticalPoint.NOZZLE) == offsets
    assert pip.critical_point(types.CriticalPoint.TIP) == offsets


@pytest.mark.parametrize("config_model", pipette_config.config_models)
def test_volume_tracking(config_model):
    loaded = pipette_config.load(config_model)
    pip = pipette.Pipette(loaded, PIP_CAL, "testID")
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


@pytest.mark.parametrize("config_model", pipette_config.config_models)
def test_config_update(config_model):
    loaded = pipette_config.load(config_model)
    pip = pipette.Pipette(loaded, PIP_CAL, "testID")
    sample_plunger_pos = {"top": 19.5}
    pip.update_config_item("top", sample_plunger_pos.get("top"))
    assert pip.config.top == sample_plunger_pos.get("top")


def test_smoothie_config_update(monkeypatch):
    for config in pipette_config.config_models:
        assert config == config


@pytest.mark.parametrize("config_model", pipette_config.config_models)
def test_tip_overlap(config_model):
    loaded = pipette_config.load(config_model)
    pip = pipette.Pipette(loaded, PIP_CAL, "testId")
    assert pip.config.tip_overlap == pipette_config.configs[config_model]["tipOverlap"]


def test_flow_rate_setting():
    pip = pipette.Pipette(pipette_config.load("p300_single_v2.0"), PIP_CAL, "testId")
    # pipettes should load settings from config at init time
    assert pip.aspirate_flow_rate == pip.config.default_aspirate_flow_rates["2.0"]
    assert pip.dispense_flow_rate == pip.config.default_dispense_flow_rates["2.0"]
    assert pip.blow_out_flow_rate == pip.config.default_blow_out_flow_rates["2.0"]
    # changing flow rates with normal property access shouldn't touch
    # config or other flow rates
    config = pip.config
    pip.aspirate_flow_rate = 2
    assert pip.aspirate_flow_rate == 2
    assert pip.dispense_flow_rate == pip.config.default_dispense_flow_rates["2.0"]
    assert pip.blow_out_flow_rate == pip.config.default_blow_out_flow_rates["2.0"]
    assert pip.config is config
    pip.dispense_flow_rate = 3
    assert pip.aspirate_flow_rate == 2
    assert pip.dispense_flow_rate == 3
    assert pip.blow_out_flow_rate == pip.config.default_blow_out_flow_rates["2.0"]
    assert pip.config is config
    pip.blow_out_flow_rate = 4
    assert pip.aspirate_flow_rate == 2
    assert pip.dispense_flow_rate == 3
    assert pip.blow_out_flow_rate == 4
    assert pip.config is config


@pytest.mark.parametrize("config_model", pipette_config.config_models)
def test_xy_center(config_model):
    loaded = pipette_config.load(config_model)
    pip = pipette.Pipette(loaded, PIP_CAL, "testId")
    if loaded.channels == 8:
        cp_y_offset = 9 * 3.5
    else:
        cp_y_offset = 0
    assert pip.critical_point(types.CriticalPoint.XY_CENTER) == Point(
        loaded.nozzle_offset[0],
        loaded.nozzle_offset[1] - cp_y_offset,
        loaded.nozzle_offset[2],
    )
