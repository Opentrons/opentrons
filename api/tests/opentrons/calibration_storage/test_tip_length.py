import pytest
import importlib
import opentrons
from typing import cast, Any, TYPE_CHECKING

from opentrons.calibration_storage import (
    types as cs_types,
    helpers,
)

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.pipette.dev_types import LabwareUri
    from opentrons_shared_data.deck.dev_types import RobotModel


@pytest.fixture(autouse=True)
def reload_module(robot_model: "RobotModel") -> None:
    importlib.reload(opentrons.calibration_storage)


@pytest.fixture
def starting_calibration_data(
    ot_config_tempdir: Any, minimal_labware_def: "LabwareDefinition"
) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    from opentrons.calibration_storage import (
        create_tip_length_data,
        save_tip_length_calibration,
    )

    tip_length1 = create_tip_length_data(minimal_labware_def, 22.0)
    tip_length2 = create_tip_length_data(minimal_labware_def, 31.0)
    save_tip_length_calibration("pip1", tip_length1)
    save_tip_length_calibration("pip2", tip_length2)


def test_save_tip_length_calibration(
    ot_config_tempdir: Any, minimal_labware_def: "LabwareDefinition"
) -> None:
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
    tip_rack_hash = helpers.hash_labware_def(minimal_labware_def)
    tip_length1 = create_tip_length_data(minimal_labware_def, 22.0)
    tip_length2 = create_tip_length_data(minimal_labware_def, 31.0)
    save_tip_length_calibration("pip1", tip_length1)
    save_tip_length_calibration("pip2", tip_length2)
    assert tip_lengths_for_pipette("pip1")[tip_rack_hash].tipLength == 22.0
    assert tip_lengths_for_pipette("pip2")[tip_rack_hash].tipLength == 31.0


def test_get_tip_length_calibration(
    starting_calibration_data: Any, minimal_labware_def: "LabwareDefinition"
) -> None:
    """
    Test ability to get a tip length calibration model.
    """
    from opentrons.calibration_storage import load_tip_length_calibration, models

    tip_length_data = load_tip_length_calibration("pip1", minimal_labware_def)
    assert tip_length_data == models.v1.TipLengthModel(
        tipLength=22.0,
        source=cs_types.SourceType.user,
        lastModified=tip_length_data.lastModified,
        uri=cast("LabwareUri", "opentronstest/minimal_labware_def/1"),
    )

    with pytest.raises(cs_types.TipLengthCalNotFound):
        load_tip_length_calibration("nopipette", minimal_labware_def)


def test_delete_specific_tip_calibration(
    starting_calibration_data: Any, minimal_labware_def: "LabwareDefinition"
) -> None:
    """
    Test delete a specific tip length calibration.
    """
    from opentrons.calibration_storage import (
        tip_lengths_for_pipette,
        delete_tip_length_calibration,
    )

    assert tip_lengths_for_pipette("pip1") != {}
    assert tip_lengths_for_pipette("pip2") != {}
    tip_rack_hash = helpers.hash_labware_def(minimal_labware_def)
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
