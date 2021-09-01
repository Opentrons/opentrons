import json
import os

import pytest

from opentrons.config import CONFIG, robot_configs
from opentrons.hardware_control.types import BoardRevision

legacy_dummy_settings = {
    "name": "Rosalind Franklin",
    "version": 42,
    "steps_per_mm": "M92 X80.00 Y80.00 Z400 A400 B768 C768",
    "gantry_steps_per_mm": {"X": 80.00, "Y": 80.00, "Z": 400, "A": 400},
    "acceleration": {"X": 3, "Y": 2, "Z": 15, "A": 15, "B": 2, "C": 2},
    "z_retract_distance": 2,
    "tip_length": 999,
    "left_mount_offset": [-34, 0, 0],
    "serial_speed": 888,
    "default_current": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "low_current": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "high_current": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "default_max_speed": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "default_pipette_configs": {
        "homePosition": 220,
        "maxTravel": 30,
        "stepsPerMM": 768,
    },
    "log_level": "NADA",
}


migrated_dummy_settings = {
    "name": "Rosalind Franklin",
    "version": 4,
    "gantry_steps_per_mm": {"X": 80.0, "Y": 80.0, "Z": 400.0, "A": 400.0},
    "acceleration": {"X": 3, "Y": 2, "Z": 15, "A": 15, "B": 2, "C": 2},
    "z_retract_distance": 2,
    "left_mount_offset": [-34, 0, 0],
    "serial_speed": 888,
    "default_current": {
        "default": {"X": 1.25, "Y": 1.25, "Z": 0.5, "A": 0.5, "B": 0.05, "C": 0.05},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "low_current": {
        "default": {"X": 0.7, "Y": 0.7, "Z": 0.1, "A": 0.1, "B": 0.05, "C": 0.05},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "high_current": {
        "default": {"X": 1.25, "Y": 1.25, "Z": 0.5, "A": 0.5, "B": 0.05, "C": 0.05},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "default_max_speed": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "default_pipette_configs": {
        "homePosition": 220,
        "maxTravel": 30,
        "stepsPerMM": 768,
    },
    "log_level": "NADA",
}


new_dummy_settings = {
    "name": "Marie Curie",
    "version": 4,
    "gantry_steps_per_mm": {"X": 80.0, "Y": 80.0, "Z": 400.0, "A": 400.0},
    "acceleration": {"X": 3, "Y": 2, "Z": 15, "A": 15, "B": 2, "C": 2},
    "z_retract_distance": 2,
    "left_mount_offset": [-34, 0, 0],
    "serial_speed": 888,
    "default_current": {
        "default": {"X": 1.25, "Y": 1.25, "Z": 0.8, "A": 0.8, "B": 0.05, "C": 0.05},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "low_current": {
        "default": {"X": 0.7, "Y": 0.7, "Z": 0.7, "A": 0.7, "B": 0.7, "C": 0.7},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "high_current": {
        "default": {"X": 0.7, "Y": 0.7, "Z": 0.7, "A": 0.7, "B": 0.7, "C": 0.7},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "default_max_speed": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "default_pipette_configs": {
        "homePosition": 220,
        "maxTravel": 30,
        "stepsPerMM": 768,
    },
    "log_level": "NADA",
}


def test_load_corrupt_json():
    filename = os.path.join(os.path.dirname(__file__), "bad_config.json")
    with open(filename, "w") as file:
        file.write("")  # empty config file
    new_setting = robot_configs._load_json(filename)
    c = robot_configs.build_config(new_setting)
    assert c.version == 4
    os.remove(filename)


def test_migrate_config():
    built_config = robot_configs.build_config(legacy_dummy_settings)
    new_config = robot_configs.config_to_save(built_config)
    assert new_config == migrated_dummy_settings


def test_dictify_roundtrip():
    built_config = robot_configs.build_config(new_dummy_settings)
    new_saved_config = robot_configs.config_to_save(built_config)
    assert new_saved_config == new_dummy_settings


def test_load_legacy_gantry_cal():
    filename = CONFIG["deck_calibration_file"]
    with open(filename, "w") as file:
        deck_cal = {"gantry_calibration": [[0, 0, 0, 0]]}
        json.dump(deck_cal, file)

    result_1 = robot_configs.get_legacy_gantry_calibration()
    assert result_1 == [[0, 0, 0, 0]]

    os.remove(filename)
    result_2 = robot_configs.get_legacy_gantry_calibration()
    assert result_2 is None


def test_load_currents():
    legacy = {"X": 2.0, "Y": 0.5, "Z": 0.2, "A": 0.1, "B": 0.5, "C": 0.7}
    default = {
        "default": {"X": 0.1, "Y": 0.3, "Z": 0.1, "A": 0.2, "B": 0.1, "C": 0.2},
        "B": {"X": 0.2, "Y": 0.1, "Z": 0.5, "A": 0.6, "B": 0.7, "C": 0.8},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 7},
    }
    default_different_vals = {
        "default": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
        "2.1": {"X": 0, "Y": 1, "Z": 2, "A": 3, "B": 4, "C": 5},
    }
    from_legacy = {"default": default["default"], "B": default["B"], "2.1": legacy}
    assert (
        robot_configs._build_hw_versioned_current_dict(legacy, default) == from_legacy
    )
    assert (
        robot_configs._build_hw_versioned_current_dict(default_different_vals, default)
        == default_different_vals
    )
    assert robot_configs._build_hw_versioned_current_dict(None, default) == default


@pytest.mark.parametrize(
    "current_dict,board_rev,result",
    [
        ({"default": {"X": 1}, "2.1": {"X": 2}}, BoardRevision.OG, {"X": 2}),
        ({"default": {"X": 1}, "A": {"X": 2}}, BoardRevision.OG, {"X": 1}),
        (
            {"default": {"X": 1}, "A": {"X": 2}, "2.1": {"X": 3}},
            BoardRevision.A,
            {"X": 2},
        ),
    ],
)
def test_current_for_revision(current_dict, board_rev, result):
    assert robot_configs.current_for_revision(current_dict, board_rev) == result
