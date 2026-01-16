import json
import os
from typing import Any, Dict

import pytest

from .ot2_settings import (
    legacy_dummy_settings,
    migrated_dummy_settings,
    new_dummy_settings,
)
from .ot3_settings import ot3_dummy_settings
from opentrons.config import CONFIG, defaults_ot2, defaults_ot3, robot_configs
from opentrons.config.types import CurrentDict
from opentrons.hardware_control.types import BoardRevision


def test_load_corrupt_json(machine_variant_ffs: None) -> None:
    filename = os.path.join(os.path.dirname(__file__), "bad_config.json")
    with open(filename, "w") as file:
        file.write("")  # empty config file
    new_setting = robot_configs._load_json(filename)
    c = robot_configs.build_config(new_setting)
    assert c.version in [
        defaults_ot2.ROBOT_CONFIG_VERSION,
        defaults_ot3.ROBOT_CONFIG_VERSION,
    ]
    os.remove(filename)


def test_migrate_config() -> None:
    built_config = robot_configs.build_config(legacy_dummy_settings)
    new_config = robot_configs.config_to_save(built_config)
    assert new_config == migrated_dummy_settings


@pytest.mark.parametrize("config_dict", [new_dummy_settings, ot3_dummy_settings])
def test_dictify_roundtrip(config_dict: Dict[str, Any]) -> None:
    built_config = robot_configs.build_config(config_dict)
    new_saved_config = robot_configs.config_to_save(built_config)
    assert new_saved_config == config_dict


@pytest.mark.parametrize("config_dict", [new_dummy_settings, ot3_dummy_settings])
def test_json_roundtrip(config_dict: Dict[str, Any]) -> None:
    built_config = robot_configs.build_config(config_dict)
    config_dict = robot_configs.config_to_save(built_config)
    jsonstr = robot_configs.json_to_save(config_dict)
    reloaded = json.loads(jsonstr)
    rebuilt = robot_configs.build_config(reloaded)
    assert built_config == rebuilt


def test_load_legacy_gantry_cal() -> None:
    filename = CONFIG["deck_calibration_file"]
    with open(filename, "w") as file:
        deck_cal = {"gantry_calibration": [[0, 0, 0, 0]]}
        json.dump(deck_cal, file)

    result_1 = robot_configs.get_legacy_gantry_calibration()
    assert result_1 == [[0, 0, 0, 0]]

    os.remove(filename)
    result_2 = robot_configs.get_legacy_gantry_calibration()
    assert result_2 is None


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
def test_current_for_revision(
    current_dict: CurrentDict, board_rev: BoardRevision, result: Dict[str, Any]
) -> None:
    assert robot_configs.current_for_revision(current_dict, board_rev) == result
