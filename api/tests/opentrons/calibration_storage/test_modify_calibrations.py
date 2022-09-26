import pytest
import importlib

from types import ModuleType
from opentrons.types import Mount, Point, MountType
from typing import no_type_check, Any, Generator, Tuple

from opentrons.calibration_storage import helpers


minimalLabwareDef = {
    "metadata": {"displayName": "minimal labware"},
    "cornerOffsetFromSlot": {"x": 10, "y": 10, "z": 5},
    "parameters": {
        "isTiprack": True,
        "tipLength": 55.3,
        "tipOverlap": 2.8,
        "loadName": "minimal_labware_def",
    },
    "ordering": [["A1"], ["A2"]],
    "wells": {
        "A1": {
            "depth": 40,
            "totalLiquidVolume": 100,
            "diameter": 30,
            "x": 0,
            "y": 0,
            "z": 0,
            "shape": "circular",
        },
        "A2": {
            "depth": 40,
            "totalLiquidVolume": 100,
            "diameter": 30,
            "x": 10,
            "y": 0,
            "z": 0,
            "shape": "circular",
        },
    },
    "dimensions": {"xDimension": 1.0, "yDimension": 2.0, "zDimension": 3.0},
    "namespace": "custom",
    "version": 1,
}


@no_type_check
@pytest.fixture
def modify(request: pytest.FixtureRequest) -> Generator[ModuleType, None, None]:
    """
    Modify module fixture.

    Returns the correct module based on requested robot type.
    """
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.modify")
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.modify")


@no_type_check
@pytest.fixture
def _cache(
    request: pytest.FixtureRequest,
) -> Generator[Tuple[ModuleType, str], None, None]:
    """
    Cache module fixture.

    Returns the correct module based on requested robot type and the requested
        robot type.
    """
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module(
            "opentrons.calibration_storage.ot3.cache"
        ), robot_type
    else:
        yield importlib.import_module(
            "opentrons.calibration_storage.ot2.cache"
        ), robot_type


@no_type_check
@pytest.mark.parametrize(
    argnames=["modify", "_cache"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_save_deck_attitude(
    ot_config_tempdir: Any, modify: ModuleType, _cache: ModuleType
) -> None:
    """
    Test saving deck attitude calibrations.
    """
    cache, robot_type = _cache
    assert cache._deck_calibration() == None
    if robot_type == "ot3":
        modify.save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1")
    else:
        modify.save_robot_deck_attitude(
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1", "mytiprack"
        )
    assert cache._deck_calibration() != {}


@no_type_check
@pytest.mark.parametrize(
    argnames=["modify", "_cache"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_save_pipette_calibration(
    ot_config_tempdir: Any, modify: ModuleType, _cache: ModuleType
) -> None:
    """
    Test saving pipette calibrations.
    """
    cache, robot_type = _cache
    assert cache._pipette_offset_calibrations() == {
        MountType.LEFT: {},
        MountType.RIGHT: {},
    }
    if robot_type == "ot3":
        modify.save_pipette_calibration(Point(1, 1, 1), "pip1", Mount.LEFT)
        modify.save_pipette_calibration(Point(1, 1, 1), "pip2", Mount.RIGHT)
    else:
        modify.save_pipette_calibration(
            Point(1, 1, 1), "pip1", Mount.LEFT, "mytiprack", "opentrons/tip_rack/1"
        )
        modify.save_pipette_calibration(
            Point(1, 1, 1), "pip2", Mount.RIGHT, "mytiprack", "opentrons/tip_rack/1"
        )
    assert cache._pipette_offset_calibrations() != {}
    assert cache._pipette_offset_calibrations()[MountType.LEFT] != {}
    assert cache._pipette_offset_calibrations()[MountType.RIGHT] != {}
    assert cache._pipette_offset_calibrations()[MountType.LEFT]["pip1"].offset == Point(
        1, 1, 1
    )
    assert cache._pipette_offset_calibrations()[MountType.RIGHT][
        "pip2"
    ].offset == Point(1, 1, 1)


@no_type_check
@pytest.mark.parametrize(
    argnames=["modify", "_cache"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_save_tip_length_calibration(
    ot_config_tempdir: Any, modify: ModuleType, _cache: ModuleType
) -> None:
    """
    Test saving tip length calibrations.
    """
    cache, _ = _cache
    cache._tip_length_calibrations.cache_clear()
    assert cache._tip_length_calibrations() == {}
    tip_rack_hash = helpers.hash_labware_def(minimalLabwareDef)
    tip_length1 = modify.create_tip_length_data(minimalLabwareDef, 22.0)
    tip_length2 = modify.create_tip_length_data(minimalLabwareDef, 31.0)
    modify.save_tip_length_calibration("pip1", tip_length1)
    modify.save_tip_length_calibration("pip2", tip_length2)
    assert cache._tip_length_calibrations() != {}
    assert cache._tip_length_calibrations()["pip1"][tip_rack_hash].tipLength == 22.0
    assert cache._tip_length_calibrations()["pip2"][tip_rack_hash].tipLength == 31.0


@no_type_check
@pytest.mark.parametrize(
    argnames=["modify", "_cache"], argvalues=[["ot3", "ot3"]], indirect=True
)
def test_save_gripper_calibration(
    ot_config_tempdir: Any, modify: ModuleType, _cache: ModuleType
) -> None:
    """
    Test saving gripper calibrations.
    """
    cache, _ = _cache
    assert cache._gripper_offset_calibrations() == {}
    modify.save_gripper_calibration(Point(1, 1, 1), "gripper1")
    assert cache._gripper_offset_calibrations() != {}
    assert cache._gripper_offset_calibrations()["gripper1"].offset == Point(1, 1, 1)
