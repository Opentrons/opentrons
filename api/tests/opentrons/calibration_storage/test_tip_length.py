import pytest
import importlib
from types import ModuleType
from typing import no_type_check, Generator, Any, Tuple

from opentrons.calibration_storage import (
    types as cs_types,
    helpers,
)


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
def _tip_length(
    request: pytest.FixtureRequest,
) -> Generator[Tuple[ModuleType, str], None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module(
            "opentrons.calibration_storage.ot3.tip_length"
        ), robot_type
    else:
        yield importlib.import_module(
            "opentrons.calibration_storage.ot2.tip_length"
        ), robot_type


@no_type_check
@pytest.fixture
def model(
    request: pytest.FixtureRequest,
) -> Generator[ModuleType, None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.models")
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.models")


@no_type_check
@pytest.fixture
def starting_calibration_data(_tip_length, ot_config_tempdir: Any) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    tip_length, robot_type = _tip_length

    tip_length1 = tip_length.create_tip_length_data(minimalLabwareDef, 22.0)
    tip_length2 = tip_length.create_tip_length_data(minimalLabwareDef, 31.0)
    tip_length.save_tip_length_calibration("pip1", tip_length1)
    tip_length.save_tip_length_calibration("pip2", tip_length2)


@no_type_check
@pytest.mark.parametrize(
    argnames=["_tip_length"],
    argvalues=[["ot2"], ["ot3"]],
    indirect=True,
)
def test_save_tip_length_calibration(
    ot_config_tempdir: Any, _tip_length: ModuleType
) -> None:
    """
    Test saving tip length calibrations.
    """
    tip_length, _ = _tip_length
    assert tip_length._tip_length_calibrations() == {}
    tip_rack_hash = helpers.hash_labware_def(minimalLabwareDef)
    tip_length1 = tip_length.create_tip_length_data(minimalLabwareDef, 22.0)
    tip_length2 = tip_length.create_tip_length_data(minimalLabwareDef, 31.0)
    tip_length.save_tip_length_calibration("pip1", tip_length1)
    tip_length.save_tip_length_calibration("pip2", tip_length2)
    assert tip_length._tip_length_calibrations() != {}
    assert (
        tip_length._tip_length_calibrations()["pip1"][tip_rack_hash].tipLength == 22.0
    )
    assert (
        tip_length._tip_length_calibrations()["pip2"][tip_rack_hash].tipLength == 31.0
    )


@no_type_check
@pytest.mark.parametrize(
    argnames=["_tip_length", "starting_calibration_data", "model"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True,
)
def test_get_tip_length_calibration(
    _tip_length: Tuple[ModuleType, str],
    starting_calibration_data: Any,
    model: ModuleType,
) -> None:
    """
    Test ability to get a tip length calibration model.
    """
    tip_length, _ = _tip_length
    tip_length_data = tip_length.load_tip_length_calibration("pip1", minimalLabwareDef)
    assert tip_length_data == model.v1.TipLengthModel(
        tipLength=22.0,
        source=cs_types.SourceType.user,
        lastModified=tip_length_data.lastModified,
        uri="custom/minimal_labware_def/1",
    )

    with pytest.raises(cs_types.TipLengthCalNotFound):
        tip_length.load_tip_length_calibration("nopipette", minimalLabwareDef)


@no_type_check
@pytest.mark.parametrize(
    argnames=["_tip_length", "starting_calibration_data"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_delete_specific_tip_calibration(
    starting_calibration_data: Any, _tip_length: ModuleType
) -> None:
    """
    Test delete a specific tip length calibration.
    """
    tip_length, _ = _tip_length
    assert tip_length._tip_length_calibrations() != {}
    assert tip_length._tip_lengths_for_pipette("pip1") != {}
    assert tip_length._tip_lengths_for_pipette("pip2") != {}
    tip_rack_hash = helpers.hash_labware_def(minimalLabwareDef)
    tip_length.delete_tip_length_calibration(tip_rack_hash, "pip1")
    assert tip_length._tip_lengths_for_pipette("pip1") == {}
    assert tip_length._tip_lengths_for_pipette("pip2") != {}


@no_type_check
@pytest.mark.parametrize(
    argnames=["_tip_length", "starting_calibration_data"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_delete_all_tip_calibration(
    starting_calibration_data: Any, _tip_length: ModuleType
) -> None:
    """
    Test delete all tip length calibration.
    """
    tip_length, _ = _tip_length
    assert tip_length._tip_length_calibrations() != {}
    assert tip_length._tip_lengths_for_pipette("pip1") != {}
    assert tip_length._tip_lengths_for_pipette("pip2") != {}
    tip_length.clear_tip_length_calibration()
    assert tip_length._tip_length_calibrations() == {}
