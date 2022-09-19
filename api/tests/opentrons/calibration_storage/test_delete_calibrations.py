import pytest
import importlib
from typing import Generator, no_type_check, Any

from types import ModuleType
from opentrons.types import Mount, Point, MountType
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
def cache(request: pytest.FixtureRequest) -> Generator[ModuleType, None, None]:
	"""
    Cache module fixture.

    Returns the correct module based on requested robot type.
    """
	robot_type = request.param
	if robot_type == 'ot3':
		yield importlib.import_module('opentrons.calibration_storage.ot3.cache')
	else:
		yield importlib.import_module('opentrons.calibration_storage.ot2.cache')


@no_type_check
@pytest.fixture
def delete(request: pytest.FixtureRequest) -> Generator[ModuleType, None, None]:
	"""
    Delete module fixture.

    Returns the correct module based on requested robot type.
    """
	robot_type = request.param
	if robot_type == 'ot3':
		yield importlib.import_module('opentrons.calibration_storage.ot3.delete')
	else:
		yield importlib.import_module('opentrons.calibration_storage.ot2.delete')


@no_type_check
@pytest.fixture
def starting_calibration_data(request: pytest.FixtureRequest, ot_config_tempdir: Any) -> None:
	"""
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
	robot_type = request.param

	if robot_type == 'ot3':
		modify = importlib.import_module('opentrons.calibration_storage.ot3.modify')
	else:
		modify = importlib.import_module('opentrons.calibration_storage.ot2.modify')

	tip_length1 = modify.create_tip_length_data(minimalLabwareDef, 22.0)
	tip_length2 = modify.create_tip_length_data(minimalLabwareDef, 31.0)
	modify.save_tip_length_calibration('pip1', tip_length1)
	modify.save_tip_length_calibration('pip2', tip_length2)
	
	if robot_type == "ot3":
		modify.save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'pip1')
		modify.save_pipette_calibration(Point(1, 1, 1), 'pip1', Mount.LEFT)
		modify.save_pipette_calibration(Point(1, 1, 1), 'pip2', Mount.RIGHT)
		modify.save_gripper_calibration(Point(1, 1, 1), 'gripper1')
	else:
		modify.save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'pip1', 'mytiprack')
		modify.save_pipette_calibration(Point(1, 1, 1), 'pip1', Mount.LEFT, 'mytiprack', 'opentrons/tip_rack/1')
		modify.save_pipette_calibration(Point(1, 1, 1), 'pip2', Mount.RIGHT, 'mytiprack', 'opentrons/tip_rack/1')

		

@no_type_check
@pytest.mark.parametrize(
	argnames=["delete", "starting_calibration_data", "cache"],
    argvalues=[["ot3", "ot3", "ot3"]],
    indirect=True)
def test_delete_all_gripper_calibration(starting_calibration_data: Any, delete: ModuleType, cache: ModuleType) -> None:
	"""
    Test delete all gripper calibrations.
    """
	assert cache._gripper_offset_calibrations() != {}
	delete.clear_gripper_calibration_offsets()
	assert cache._gripper_offset_calibrations() == {}


@no_type_check
@pytest.mark.parametrize(
	argnames=["delete", "starting_calibration_data", "cache"],
    argvalues=[["ot3", "ot3", "ot3"]],
    indirect=True)
def test_delete_gripper_calibration(starting_calibration_data: Any, delete: ModuleType, cache: ModuleType) -> None:
	"""
    Test delete a single gripper calibration.
    """
	assert cache._gripper_offset_calibrations() != {}
	delete.delete_gripper_calibration_file('gripper1')
	assert cache._gripper_offset_calibrations() == {}


@no_type_check
@pytest.mark.parametrize(
	argnames=["delete", "starting_calibration_data", "cache"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True)
def test_delete_all_pipette_calibration(starting_calibration_data: Any, delete: ModuleType, cache: ModuleType) -> None:
	"""
    Test delete all pipette calibrations.
    """
	assert cache._pipette_offset_calibrations() != {}
	delete.clear_pipette_offset_calibrations()
	assert cache._pipette_offset_calibrations() == {
        MountType.LEFT: {},
        MountType.RIGHT: {},
    }


@no_type_check
@pytest.mark.parametrize(
	argnames=["delete", "starting_calibration_data", "cache"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True)
def test_delete_specific_pipette_offset(starting_calibration_data: Any, delete: ModuleType, cache: ModuleType) -> None:
	"""
    Test delete a specific pipette calibration.
    """
	assert cache._pipette_offset_calibrations() != {}
	assert cache.pipette_offset_data('pip1', Mount.LEFT) != {}
	delete.delete_pipette_offset_file('pip1', Mount.LEFT)
	assert cache.pipette_offset_data('pip1', Mount.LEFT) == {}


@no_type_check
@pytest.mark.parametrize(
	argnames=["delete", "starting_calibration_data", "cache"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True)
def test_delete_deck_calibration(starting_calibration_data: Any, delete: ModuleType, cache: ModuleType) -> None:
	"""
    Test delete deck calibration.
    """
	assert cache._deck_calibration() != {}
	assert cache._deck_calibration().attitude == [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
	delete.delete_robot_deck_attitude()
	assert cache._deck_calibration() == {}


@no_type_check
@pytest.mark.parametrize(
	argnames=["delete", "starting_calibration_data", "cache"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True)
def test_delete_specific_tip_calibration(starting_calibration_data: Any, delete: ModuleType, cache: ModuleType) -> None:
	"""
    Test delete a specific tip length calibration.
    """
	assert cache._tip_length_calibrations() != {}
	assert cache.tip_lengths_for_pipette('pip1') != {}
	assert cache.tip_lengths_for_pipette('pip2') != {}
	tip_rack_hash = helpers.hash_labware_def(minimalLabwareDef)
	delete.delete_tip_length_calibration(tip_rack_hash, 'pip1')
	assert cache.tip_lengths_for_pipette('pip1') == {}
	assert cache.tip_lengths_for_pipette('pip2') != {}


@no_type_check
@pytest.mark.parametrize(
	argnames=["delete", "starting_calibration_data", "cache"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True)
def test_delete_all_tip_calibration(starting_calibration_data: Any, delete: ModuleType, cache: ModuleType) -> None:
	"""
    Test delete all tip length calibration.
    """
	assert cache._tip_length_calibrations() != {}
	assert cache.tip_lengths_for_pipette('pip1') != {}
	assert cache.tip_lengths_for_pipette('pip2') != {}
	delete.clear_tip_length_calibration()
	assert cache._tip_length_calibrations() == {}
