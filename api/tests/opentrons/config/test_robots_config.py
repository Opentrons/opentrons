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
    'instrument_offset': {
        'left': {
            'single': [1, 2, 3],
            'multi': [4, 5, 6]
        },
        'right': {
            'single': [7, 8, 9],
            'multi': [10, 11, 12]
        }
    },
    'z_retract_distance': 2,
    'tip_length': 999,
    'mount_offset': [-3, -2, -1],
    'serial_speed': 888,
    'default_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
    'low_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
    'high_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
    'default_max_speed': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
    'default_pipette_configs': {
        'homePosition': 220, 'maxTravel': 30, 'stepsPerMM': 768},
    'log_level': 'NADA',
    'tip_probe': {
        'bounce_distance': 5.0,
        'switch_offset': [2.0, 5.0, 5.0],
        'switch_clearance': 7.5,
        'z_clearance': {
            'normal': 5.0,
            'deck': 5.0,
            'crossover': 35.0,
            'start': 20.0
        }
    }
}


@pytest.mark.xfail
async def test_old_probe_height(short_trash_flag):
    cfg = robot_configs.load()

    assert cfg.tip_probe.center[2] == 55.0
    assert cfg.tip_probe.dimensions[2] == 60.0
    assert cfg.gantry_calibration == DEFAULT_SIMULATION_CALIBRATION


def test_default_probe_height():
    cfg = robot_configs.load()
    assert cfg.tip_probe.center[2] == 74.3
    assert cfg.tip_probe.dimensions[2] == 79.3
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
    for key in [k for k in dummy_settings.keys() if k != 'tip_probe']:
        assert getattr(built_config, key) == dummy_settings[key]
    for key in [k for k in dummy_settings['tip_probe'].keys()
                if k != 'z_clearance']:
        assert getattr(built_config.tip_probe, key)\
            == dummy_settings['tip_probe'][key]
    for key in [k for k in dummy_settings['tip_probe']['z_clearance'].keys()]:
        assert getattr(built_config.tip_probe.z_clearance, key)\
            == dummy_settings['tip_probe']['z_clearance'][key]

    settings = copy.deepcopy(dummy_settings)
    settings['instrument_offset'].update({'right': {}})

    built_config = robot_configs.build_config(dummy_cal, settings)
    expected = {
            'left': {
                'single': [1, 2, 3],
                'multi': [4, 5, 6]
            },
            'right': {
                'single': [0, 0, 0],
                'multi': [0, 0, 0]
            }
        }
    assert built_config.instrument_offset == expected


def test_dictify_roundtrip():
    new_settings = copy.deepcopy(dummy_settings)
    new_settings['tip_probe']['dimensions']\
        = robot_configs._default_probe_dimensions()
    new_settings['tip_probe']['center']\
        = robot_configs._default_probe_center()
    built_config = robot_configs.build_config(dummy_cal, dummy_settings)
    new_cal, new_config = robot_configs.config_to_save(built_config)
    assert new_cal == dummy_cal
    assert new_config == new_settings
    new_config = robot_configs.build_config(new_cal, new_config)
    assert new_config == built_config
