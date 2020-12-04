import copy
import json
import pytest
import os

from opentrons.config import CONFIG, robot_configs

dummy_settings = {
    'name': 'Andy',
    'version': 42,
    'steps_per_mm': 'M92 X80.00 Y80.00 Z400 A400 B768 C768',
    'gantry_steps_per_mm': {
        'X': 80.00, 'Y': 80.00, 'Z': 400, 'A': 400},
    'acceleration': {'X': 3, 'Y': 2, 'Z': 15, 'A': 15, 'B': 2, 'C': 2},
    'z_retract_distance': 2,
    'tip_length': 999,
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


def test_load_corrupt_json():
    filename = os.path.join(os.path.dirname(__file__), 'bad_config.json')
    with open(filename, 'w') as file:
        file.write('')  # empty config file
    new_setting = robot_configs._load_json(filename)
    c = robot_configs.build_config(new_setting)
    assert c.version == 3
    os.remove(filename)


def test_build_config():
    built_config = robot_configs.build_config(dummy_settings)
    assert built_config == dummy_settings


def test_dictify_roundtrip():
    new_settings = copy.deepcopy(dummy_settings)
    built_config = robot_configs.build_config(dummy_settings)
    new_config = robot_configs.config_to_save(built_config)
    assert new_config == new_settings
    new_config = robot_configs.build_config(new_config)
    assert new_config == built_config


def test_load_legacy_gantry_cal():
    filename = CONFIG['deck_calibration_file']
    with open(filename, 'w') as file:
        deck_cal = {
            'gantry_calibration': [[0, 0, 0, 0]]
        }
        json.dump(deck_cal, file)

    result_1 = robot_configs.get_legacy_gantry_calibration()
    assert result_1 == [[0, 0, 0, 0]]

    os.remove(filename)
    result_2 = robot_configs.get_legacy_gantry_calibration()
    assert result_2 is None
