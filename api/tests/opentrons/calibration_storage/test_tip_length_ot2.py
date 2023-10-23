import pytest
from typing import cast, Any, TYPE_CHECKING

from opentrons.calibration_storage import (
    types as cs_types,
    helpers,
)

from opentrons.calibration_storage.ot2 import (
    create_tip_length_data,
    save_tip_length_calibration,
    tip_lengths_for_pipette,
    load_tip_length_calibration,
    delete_tip_length_calibration,
    clear_tip_length_calibration,
    models,
)

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.pipette.dev_types import LabwareUri


@pytest.fixture
def starting_calibration_data(
    ot_config_tempdir: Any,
    minimal_labware_def: "LabwareDefinition",
    minimal_labware_def2: "LabwareDefinition",
) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    tip_length1 = create_tip_length_data(minimal_labware_def, 22.0)
    tip_length2 = create_tip_length_data(minimal_labware_def, 31.0)
    tip_length3 = create_tip_length_data(minimal_labware_def2, 31.0)
    save_tip_length_calibration("pip1", tip_length1)
    save_tip_length_calibration("pip2", tip_length2)
    save_tip_length_calibration("pip1", tip_length3)


def test_save_tip_length_calibration(
    ot_config_tempdir: Any, minimal_labware_def: "LabwareDefinition"
) -> None:
    """
    Test saving tip length calibrations.
    """
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
    assert len(tip_lengths_for_pipette("pip1").keys()) == 2
    assert tip_lengths_for_pipette("pip2") != {}
    tip_rack_hash = helpers.hash_labware_def(minimal_labware_def)
    delete_tip_length_calibration(tip_rack_hash, "pip1")
    assert len(tip_lengths_for_pipette("pip1").keys()) == 1
    assert tip_lengths_for_pipette("pip2") != {}


def test_delete_all_tip_calibration(starting_calibration_data: Any) -> None:
    """
    Test delete all tip length calibration.
    """
    assert tip_lengths_for_pipette("pip1") != {}
    assert tip_lengths_for_pipette("pip2") != {}
    clear_tip_length_calibration()
    assert tip_lengths_for_pipette("pip1") == {}
    assert tip_lengths_for_pipette("pip2") == {}
