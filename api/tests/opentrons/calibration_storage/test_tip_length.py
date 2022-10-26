import pytest
import importlib
import opentrons
from typing import no_type_check, Any, TYPE_CHECKING

from opentrons.calibration_storage import (
    types as cs_types,
    helpers,
)

if TYPE_CHECKING:
    from opentrons_shared_data.deck.dev_types import RobotModel

@pytest.fixture(autouse=True)
def reload_module(robot_model: "RobotModel"):
    importlib.reload(opentrons.calibration_storage)


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
def starting_calibration_data(ot_config_tempdir: Any) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    from opentrons.calibration_storage import (
        create_tip_length_data,
        save_tip_length_calibration,
    )

    tip_length1 = create_tip_length_data(minimalLabwareDef, 22.0)
    tip_length2 = create_tip_length_data(minimalLabwareDef, 31.0)
    save_tip_length_calibration("pip1", tip_length1)
    save_tip_length_calibration("pip2", tip_length2)


def test_save_tip_length_calibration(ot_config_tempdir: Any) -> None:
    """
    Test saving tip length calibrations.
    """
    from opentrons.calibration_storage import (
        tip_lengths_for_pipette,
        create_tip_length_data,
        save_tip_length_calibration,
    )

    assert tip_lengths_for_pipette("pip1") == {}
    assert tip_lengths_for_pipette("pip2") == {}
    tip_rack_hash = helpers.hash_labware_def(minimalLabwareDef)
    tip_length1 = create_tip_length_data(minimalLabwareDef, 22.0)
    tip_length2 = create_tip_length_data(minimalLabwareDef, 31.0)
    save_tip_length_calibration("pip1", tip_length1)
    save_tip_length_calibration("pip2", tip_length2)
    assert tip_lengths_for_pipette("pip1")[tip_rack_hash].tipLength == 22.0
    assert tip_lengths_for_pipette("pip2")[tip_rack_hash].tipLength == 31.0


def test_get_tip_length_calibration(
    starting_calibration_data: Any,
) -> None:
    """
    Test ability to get a tip length calibration model.
    """
    from opentrons.calibration_storage import load_tip_length_calibration, models

    tip_length_data = load_tip_length_calibration("pip1", minimalLabwareDef)
    assert tip_length_data == models.v1.TipLengthModel(
        tipLength=22.0,
        source=cs_types.SourceType.user,
        lastModified=tip_length_data.lastModified,
        uri="custom/minimal_labware_def/1",
    )

    with pytest.raises(cs_types.TipLengthCalNotFound):
        load_tip_length_calibration("nopipette", minimalLabwareDef)


def test_delete_specific_tip_calibration(starting_calibration_data: Any) -> None:
    """
    Test delete a specific tip length calibration.
    """
    from opentrons.calibration_storage import (
        tip_lengths_for_pipette,
        delete_tip_length_calibration,
    )

    assert tip_lengths_for_pipette("pip1") != {}
    assert tip_lengths_for_pipette("pip2") != {}
    tip_rack_hash = helpers.hash_labware_def(minimalLabwareDef)
    delete_tip_length_calibration(tip_rack_hash, "pip1")
    assert tip_lengths_for_pipette("pip1") == {}
    assert tip_lengths_for_pipette("pip2") != {}


def test_delete_all_tip_calibration(starting_calibration_data: Any) -> None:
    """
    Test delete all tip length calibration.
    """
    from opentrons.calibration_storage import (
        tip_lengths_for_pipette,
        clear_tip_length_calibration,
    )

    assert tip_lengths_for_pipette("pip1") != {}
    assert tip_lengths_for_pipette("pip2") != {}
    clear_tip_length_calibration()
    assert tip_lengths_for_pipette("pip1") == {}
    assert tip_lengths_for_pipette("pip2") == {}
