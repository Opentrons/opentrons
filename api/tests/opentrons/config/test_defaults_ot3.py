import copy

from opentrons.config import robot_configs, defaults_ot3
from opentrons.config.types import GantryLoad, OT3Config
from opentrons.hardware_control.types import OT3AxisKind
from .ot3_settings import ot3_dummy_settings


def test_load_calibration_cals() -> None:
    # nothing provided
    assert (
        defaults_ot3._build_default_calibration(
            {}, defaults_ot3.DEFAULT_CALIBRATION_SETTINGS
        )
        == defaults_ot3.DEFAULT_CALIBRATION_SETTINGS
    )

    # some dicts not formatted right
    mostly_right = defaults_ot3.serialize(defaults_ot3.build_with_defaults({}))
    del mostly_right["calibration"]["edge_sense"]["early_sense_tolerance_mm"]
    del mostly_right["calibration"]["z_offset"]["pass_settings"]["prep_distance_mm"]
    assert (
        defaults_ot3._build_default_calibration(
            mostly_right["calibration"], defaults_ot3.DEFAULT_CALIBRATION_SETTINGS
        )
        == defaults_ot3.DEFAULT_CALIBRATION_SETTINGS
    )

    # altered values are preserved
    mostly_right["calibration"]["edge_sense"]["overrun_tolerance_mm"] -= 0.2
    mostly_right["calibration"]["z_offset"]["pass_settings"][
        "max_overrun_distance_mm"
    ] -= 0.5
    built_with_overrides = defaults_ot3._build_default_calibration(
        mostly_right["calibration"], defaults_ot3.DEFAULT_CALIBRATION_SETTINGS
    )
    assert (
        built_with_overrides.edge_sense.overrun_tolerance_mm
        == mostly_right["calibration"]["edge_sense"]["overrun_tolerance_mm"]
    )
    assert (
        built_with_overrides.z_offset.pass_settings.max_overrun_distance_mm
        == mostly_right["calibration"]["z_offset"]["pass_settings"][
            "max_overrun_distance_mm"
        ]
    )


def test_load_per_pipette_vals() -> None:
    # nothing provided
    assert (
        defaults_ot3._build_default_bpk({}, defaults_ot3.DEFAULT_HOLD_CURRENT)
        == defaults_ot3.DEFAULT_HOLD_CURRENT
    )

    # some dicts not formatted right
    mostly_right = defaults_ot3.serialize(defaults_ot3.build_with_defaults({}))
    del mostly_right["motion_settings"]["acceleration"]["low_throughput"]
    assert (
        defaults_ot3._build_default_bpk(
            mostly_right["motion_settings"]["acceleration"],
            defaults_ot3.DEFAULT_ACCELERATIONS,
        ).low_throughput
        == defaults_ot3.DEFAULT_ACCELERATIONS.low_throughput
    )

    # altered values are preserved
    mostly_right["motion_settings"]["acceleration"]["high_throughput"]["X"] -= 2
    assert (
        defaults_ot3._build_default_bpk(
            mostly_right["motion_settings"]["acceleration"],
            defaults_ot3.DEFAULT_ACCELERATIONS,
        ).high_throughput[OT3AxisKind.X]
        == defaults_ot3.DEFAULT_ACCELERATIONS.high_throughput[OT3AxisKind.X] - 2
    )

    # added values are preserved
    altered_default = copy.deepcopy(defaults_ot3.DEFAULT_ACCELERATIONS)
    altered_default.high_throughput.pop(OT3AxisKind.X, None)

    mostly_right["motion_settings"]["acceleration"]["high_throughput"]["X"] = -72
    assert (
        defaults_ot3._build_default_bpk(
            mostly_right["motion_settings"]["acceleration"], altered_default
        ).high_throughput[OT3AxisKind.X]
        == -72
    )


def test_load_offset_vals() -> None:
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


def test_load_transform_vals() -> None:
    # not list
    assert (
        defaults_ot3._build_default_transform(
            None, defaults_ot3.DEFAULT_MACHINE_TRANSFORM
        )
        == defaults_ot3.DEFAULT_MACHINE_TRANSFORM
    )
    # list of not lists
    assert (
        defaults_ot3._build_default_transform(
            [1, 2, 3], defaults_ot3.DEFAULT_MACHINE_TRANSFORM
        )
        == defaults_ot3.DEFAULT_MACHINE_TRANSFORM
    )
    # list of wrong number of lists
    assert (
        defaults_ot3._build_default_transform(
            [[1, 2, 3], [3, 2, 1]], defaults_ot3.DEFAULT_MACHINE_TRANSFORM
        )
        == defaults_ot3.DEFAULT_MACHINE_TRANSFORM
    )
    # list of right number of lists of wrong number of elements
    assert (
        defaults_ot3._build_default_transform(
            [[1, 2, 3], [1, 2, 3], [1, 2, 3, 4]], defaults_ot3.DEFAULT_MACHINE_TRANSFORM
        )
        == defaults_ot3.DEFAULT_MACHINE_TRANSFORM
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
            defaults_ot3.DEFAULT_MACHINE_TRANSFORM,
        )
        == defaults_ot3.DEFAULT_MACHINE_TRANSFORM
    )
    # right shape, different data is preserved
    assert defaults_ot3._build_default_transform(
        [[1, 2, 3], [1, 2, 3], [1, 2, 3]], defaults_ot3.DEFAULT_MACHINE_TRANSFORM
    ) == [[1, 2, 3], [1, 2, 3], [1, 2, 3]]


def test_motion_settings_dataclass() -> None:
    built_config = robot_configs.build_config(ot3_dummy_settings)
    assert isinstance(built_config, OT3Config)
    motion_settings = built_config.motion_settings

    low_setting = motion_settings.by_gantry_load(GantryLoad.LOW_THROUGHPUT)
    assert low_setting["acceleration"] == {
        OT3AxisKind.X: 3,
        OT3AxisKind.Y: 2,
        OT3AxisKind.Z: 15,
        OT3AxisKind.P: 15,
        OT3AxisKind.Z_G: 5,
    }
    assert low_setting["default_max_speed"] == {
        OT3AxisKind.X: 1,
        OT3AxisKind.Y: 2,
        OT3AxisKind.Z: 3,
        OT3AxisKind.P: 4,
        OT3AxisKind.Z_G: 5,
    }
    assert low_setting["max_speed_discontinuity"] == {
        OT3AxisKind.X: 10,
        OT3AxisKind.Y: 20,
        OT3AxisKind.Z: 30,
        OT3AxisKind.P: 40,
        OT3AxisKind.Z_G: 50,
    }
    assert low_setting["direction_change_speed_discontinuity"] == {
        OT3AxisKind.X: 5,
        OT3AxisKind.Y: 10,
        OT3AxisKind.Z: 15,
        OT3AxisKind.P: 20,
        OT3AxisKind.Z_G: 15,
    }
