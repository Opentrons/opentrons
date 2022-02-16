import copy
import json
import os

import pytest

from opentrons.config import CONFIG, robot_configs, defaults_ot2, defaults_ot3
from opentrons.config.types import CurrentDict, PipetteKind, OT3Config
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

ot3_dummy_settings = {
    "name": "Marie Curie",
    "model": "OT-3 Standard",
    "version": 1,
    "speed_settings": {
        "acceleration": {
            "none": {"X": 3, "Y": 2, "Z": 15, "P": 2},
            "low_throughput": {
                "X": 3,
                "Y": 2,
                "Z": 15,
                "P": 15,
            },
            "high_throughput": {
                "X": 3,
                "Y": 2,
                "Z": 15,
                "P": 15,
            },
            "two_low_throughput": {"X": 1.1, "Y": 2.2},
            "gripper": {
                "Z": 2.8,
            },
        },
        "default_max_speed": {
            "none": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 4,
            },
            "low_throughput": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 4,
            },
            "high_throughput": {"X": 1, "Y": 2, "Z": 3, "P": 4},
            "two_low_throughput": {"X": 4, "Y": 3, "Z": 2, "P": 1},
            "gripper": {"Z": 2.8},
        },
        "max_speed_discontinuity": {
            "none": {"X": 10, "Y": 20, "Z": 30, "P": 40},
            "low_throughput": {"X": 1, "Y": 2, "Z": 3, "P": 6},
            "high_throughput": {"X": 1, "Y": 2, "Z": 3, "P": 6},
            "two_low_throughput": {"X": 1, "Y": 2, "Z": 3, "P": 6},
            "gripper": {"Z": 2.8},
        },
        "direction_change_speed_discontinuity": {
            "none": {"X": 5, "Y": 10, "Z": 15, "P": 20},
            "low_throughput": {"X": 0.8, "Y": 1, "Z": 2, "P": 4},
            "high_throughput": {"X": 1, "Y": 2, "Z": 3, "P": 6},
            "two_low_throughput": {"X": 0.5, "Y": 1, "Z": 1.5, "P": 3},
            "gripper": {"Z": 2.8},
        },
    },
    "holding_current": {
        "none": {"X": 0.7, "Y": 0.7, "Z": 0.7, "P": 0.8},
        "low_throughput": {"X": 0.7, "Y": 0.7, "Z": 0.7, "P": 0.8},
        "high_throughput": {"X": 0.7, "Y": 0.7, "Z": 0.7, "P": 0.8},
        "two_low_throughput": {
            "X": 0.7,
            "Y": 0.7,
        },
        "gripper": {
            "Z": 0.7,
        },
    },
    "normal_motion_current": {
        "none": {"X": 7.0, "Y": 7.0, "Z": 7.0, "P": 5.0},
        "low_throughput": {"X": 1, "Y": 2, "Z": 3, "P": 4.0},
        "high_throughput": {"X": 0.2, "Y": 0.5, "Z": 0.4, "P": 2.0},
        "two_low_throughput": {
            "X": 9,
            "Y": 0.1,
        },
        "gripper": {
            "Z": 10,
        },
    },
    "log_level": "NADA",
    "z_retract_distance": 10,
    "deck_transform": [[-0.5, 0, 1], [0.1, -2, 4], [0, 0, -1]],
    "carriage_offset": (1, 2, 3),
    "right_mount_offset": (3, 2, 1),
    "left_mount_offset": (2, 2, 2),
    "gripper_mount_offset": (1, 1, 1),
}


def test_load_corrupt_json(machine_variant_ffs):
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


def test_migrate_config():
    built_config = robot_configs.build_config(legacy_dummy_settings)
    new_config = robot_configs.config_to_save(built_config)
    assert new_config == migrated_dummy_settings


@pytest.mark.parametrize("config_dict", [new_dummy_settings, ot3_dummy_settings])
def test_dictify_roundtrip(config_dict):
    built_config = robot_configs.build_config(config_dict)
    new_saved_config = robot_configs.config_to_save(built_config)
    assert new_saved_config == config_dict


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
    default: CurrentDict = {
        "default": {"X": 0.1, "Y": 0.3, "Z": 0.1, "A": 0.2, "B": 0.1, "C": 0.2},
        "B": {"X": 0.2, "Y": 0.1, "Z": 0.5, "A": 0.6, "B": 0.7, "C": 0.8},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 7},
    }
    default_different_vals = {
        "default": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
        "2.1": {"X": 0, "Y": 1, "Z": 2, "A": 3, "B": 4, "C": 5},
    }
    from_legacy = {"default": default["default"], "B": default["B"], "2.1": legacy}
    assert defaults_ot2._build_hw_versioned_current_dict(legacy, default) == from_legacy
    assert (
        defaults_ot2._build_hw_versioned_current_dict(default_different_vals, default)
        == default_different_vals
    )
    assert (
        robot_configs.defaults_ot2._build_hw_versioned_current_dict(None, default)
        == default
    )


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


def test_load_per_pipette_vals():
    # nothing provided
    assert (
        defaults_ot3._build_default_bpk({}, defaults_ot3.DEFAULT_HOLDING_CURRENT)
        == defaults_ot3.DEFAULT_HOLDING_CURRENT
    )

    # some dicts not formatted right
    mostly_right = defaults_ot3.serialize(defaults_ot3.build_with_defaults({}))
    del mostly_right["speed_settings"]["acceleration"]["low_throughput"]
    assert (
        defaults_ot3._build_default_bpk(
            mostly_right["speed_settings"]["acceleration"],
            defaults_ot3.DEFAULT_ACCELERATIONS,
        ).low_throughput
        == defaults_ot3.DEFAULT_ACCELERATIONS.low_throughput
    )

    # altered values aare preserved
    mostly_right["speed_settings"]["acceleration"]["high_throughput"]["X"] -= 2
    assert (
        defaults_ot3._build_default_bpk(
            mostly_right["speed_settings"]["acceleration"],
            defaults_ot3.DEFAULT_ACCELERATIONS,
        ).high_throughput["X"]
        == defaults_ot3.DEFAULT_ACCELERATIONS.high_throughput["X"] - 2
    )

    # added values are preserved
    altered_default = copy.deepcopy(defaults_ot3.DEFAULT_ACCELERATIONS)
    altered_default.two_low_throughput.pop("X", None)

    mostly_right["speed_settings"]["acceleration"]["two_low_throughput"]["X"] = -72
    assert (
        defaults_ot3._build_default_bpk(
            mostly_right["speed_settings"]["acceleration"], altered_default
        ).two_low_throughput["X"]
        == -72
    )


def test_load_offset_vals():
    # nothing provided
    assert (
        defaults_ot3._build_default_offset([], defaults_ot3.DEFAULT_RIGHT_MOUNT_OFFSET)
        == defaults_ot3.DEFAULT_RIGHT_MOUNT_OFFSET
    )
    # wrong shape
    assert (
        defaults_ot3._build_default_offset(
            [
                1,
            ],
            defaults_ot3.DEFAULT_RIGHT_MOUNT_OFFSET,
        )
        == defaults_ot3.DEFAULT_RIGHT_MOUNT_OFFSET
    )
    # absolutely wrong type
    assert (
        defaults_ot3._build_default_offset(2, defaults_ot3.DEFAULT_RIGHT_MOUNT_OFFSET)
        == defaults_ot3.DEFAULT_RIGHT_MOUNT_OFFSET
    )
    # right shape, different values
    assert defaults_ot3._build_default_offset([1, 2, 3], (0, 0, 0)) == (1, 2, 3)


def test_load_transform_vals():
    # not list
    assert (
        defaults_ot3._build_default_transform(None, defaults_ot3.DEFAULT_DECK_TRANSFORM)
        == defaults_ot3.DEFAULT_DECK_TRANSFORM
    )
    # list of not lists
    assert (
        defaults_ot3._build_default_transform(
            [1, 2, 3], defaults_ot3.DEFAULT_DECK_TRANSFORM
        )
        == defaults_ot3.DEFAULT_DECK_TRANSFORM
    )
    # list of wrong number of lists
    assert (
        defaults_ot3._build_default_transform(
            [[1, 2, 3], [3, 2, 1]], defaults_ot3.DEFAULT_DECK_TRANSFORM
        )
        == defaults_ot3.DEFAULT_DECK_TRANSFORM
    )
    # list of right number of lists of wrong number of elements
    assert (
        defaults_ot3._build_default_transform(
            [[1, 2, 3], [1, 2, 3], [1, 2, 3, 4]], defaults_ot3.DEFAULT_DECK_TRANSFORM
        )
        == defaults_ot3.DEFAULT_DECK_TRANSFORM
    )
    # list of right number of lists of right number of elements of wrong type
    assert (
        defaults_ot3._build_default_transform(
            [
                [
                    1,
                    2,
                    3,
                ],
                [1, "hi", 3],
                [1, 2, {}],
            ],
            defaults_ot3.DEFAULT_DECK_TRANSFORM,
        )
        == defaults_ot3.DEFAULT_DECK_TRANSFORM
    )
    # right shape, different data is preserved
    assert defaults_ot3._build_default_transform(
        [[1, 2, 3], [1, 2, 3], [1, 2, 3]], defaults_ot3.DEFAULT_DECK_TRANSFORM
    ) == [[1, 2, 3], [1, 2, 3], [1, 2, 3]]


def test_speed_settings_dataclass():
    built_config = robot_configs.build_config(ot3_dummy_settings)
    assert isinstance(built_config, OT3Config)
    speed_settings = built_config.speed_settings

    none_setting = speed_settings.by_pipette_kind(PipetteKind.NONE)
    assert none_setting["acceleration"] == {"X": 3, "Y": 2, "Z": 15, "P": 2}
    assert none_setting["default_max_speed"] == {"X": 1, "Y": 2, "Z": 3, "P": 4}
    assert none_setting["max_speed_discontinuity"] == {
        "X": 10,
        "Y": 20,
        "Z": 30,
        "P": 40,
    }
    assert none_setting["direction_change_speed_discontinuity"] == {
        "X": 5,
        "Y": 10,
        "Z": 15,
        "P": 20,
    }

    gripper_setting = speed_settings.by_pipette_kind(PipetteKind.GRIPPER)
    assert gripper_setting["acceleration"] == {"X": 3, "Y": 2, "Z": 2.8, "P": 2}
    assert gripper_setting["default_max_speed"] == {"X": 1, "Y": 2, "Z": 2.8, "P": 4}
    assert gripper_setting["max_speed_discontinuity"] == {
        "X": 10,
        "Y": 20,
        "Z": 2.8,
        "P": 40,
    }
    assert gripper_setting["direction_change_speed_discontinuity"] == {
        "X": 5,
        "Y": 10,
        "Z": 2.8,
        "P": 20,
    }

    two_low_setting = speed_settings.by_pipette_kind(PipetteKind.TWO_LOW_THROUGHPUT)
    assert two_low_setting["acceleration"] == {"X": 1.1, "Y": 2.2, "Z": 15, "P": 2}
    assert two_low_setting["default_max_speed"] == {"X": 4, "Y": 3, "Z": 2, "P": 1}
    assert two_low_setting["max_speed_discontinuity"] == {
        "X": 1,
        "Y": 2,
        "Z": 3,
        "P": 6,
    }
    assert two_low_setting["direction_change_speed_discontinuity"] == {
        "X": 0.5,
        "Y": 1,
        "Z": 1.5,
        "P": 3,
    }
