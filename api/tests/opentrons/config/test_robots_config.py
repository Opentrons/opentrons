import copy
import pytest

from opentrons.config import robot_configs


dummy_cal = [
    [1.23, 1.23, 1.23,  1.23],
    [1.23, 1.23, 1.23,  1.23],
    [1.23, 1.23, 1.23,  1.23],
    [1.23, 1.23, 1.23,  1.23]
]

DEFAULT_SIMULATION_CALIBRATION = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, -25.0],
    [0.0, 0.0, 0.0, 1.0]
]

dummy_settings = {
    'name': 'Andy',
    'version': 42,
    'steps_per_mm': 'M92 X80.00 Y80.00 Z400 A400 B768 C768',
    'gantry_steps_per_mm': {
        'X': 80.00, 'Y': 80.00, 'Z': 400, 'A': 400},
    'acceleration': {'X': 3, 'Y': 2, 'Z': 15, 'A': 15, 'B': 2, 'C': 2},
    'z_retract_distance': 2,
    'tip_length': 999,
    'mount_offset': [-3, -2, -1],
    'left_mount_offset': [-34, 0, 0],
    'serial_speed': 888,
    'default_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
    'low_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
    'high_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
    'default_max_speed': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
    'default_pipette_configs': {
        'homePosition': 220, 'maxTravel': 30, 'stepsPerMM': 768},
    'log_level': 'NADA',
}


@pytest.mark.xfail
async def test_old_probe_height(short_trash_flag):
    cfg = robot_configs.load()
    assert cfg.gantry_calibration == DEFAULT_SIMULATION_CALIBRATION


def test_default_probe_height():
    cfg = robot_configs.load()
    assert cfg.gantry_calibration == DEFAULT_SIMULATION_CALIBRATION


def test_load_corrupt_json():
    import os
    filename = os.path.join(os.path.dirname(__file__), 'bad_config.json')
    with open(filename, 'w') as file:
        file.write('')  # empty config file
    c = robot_configs.load(filename)
    assert c.version == 3
    os.remove(filename)


def test_build_config():
    built_config = robot_configs.build_config(dummy_cal, dummy_settings)

    assert built_config.gantry_calibration == dummy_cal


def test_dictify_roundtrip():
    new_settings = copy.deepcopy(dummy_settings)
    built_config = robot_configs.build_config(dummy_cal, dummy_settings)
    new_cal, new_config = robot_configs.config_to_save(built_config)
    assert new_cal == dummy_cal
    assert new_config == new_settings
    new_config = robot_configs.build_config(new_cal, new_config)
    assert new_config == built_config
