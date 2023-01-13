import pytest
import mock
from decoy import Decoy
from datetime import datetime
from pathlib import Path
from typing import cast, Any, TYPE_CHECKING

from opentrons.calibration_storage import (
    types as cs_types,
    helpers,
    load_tip_length_calibration,
    create_tip_length_data,
    save_tip_length_calibration,
    delete_tip_length_calibration,
    clear_tip_length_calibration,
)

from . import READ_FUNC_TYPE, SAVE_FUNC_TYPE, DELETE_FUNC_TYPE, MOCK_UTC

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.pipette.dev_types import LabwareUri
    from opentrons_shared_data.deck.dev_types import RobotModel


@pytest.fixture
def tip_length_path(ot_config_tempdir: Any) -> Path:
    return Path(f"{ot_config_tempdir}/tip_lengths")


def test_delete_specific_tip_calibration(
    robot_model: "RobotModel",
    tip_length_path: Path,
    minimal_labware_def: "LabwareDefinition",
    decoy: Decoy,
    mock_timestamp: datetime,
    mock_file_operator_delete: DELETE_FUNC_TYPE,
    mock_file_operator_read: READ_FUNC_TYPE,
    mock_utc_now: MOCK_UTC,
    mock_file_operator_save: SAVE_FUNC_TYPE,
) -> None:
    """
    Test delete a specific tip length calibration.
    """
    tip_rack_hash = helpers.hash_labware_def(minimal_labware_def)
    return_data = {
        tip_rack_hash: {
            "tipLength": 22.0,
            "tiprack": tip_rack_hash,
            "uri": "opentrons/tip_rack/1",
            "lastModified": mock_timestamp,
            "source": "user",
        }
    }
    decoy.when(mock_file_operator_read(tip_length_path / "pip1.json")).then_return(
        return_data
    )

    delete_tip_length_calibration(tip_rack_hash, "pip1")
    decoy.verify(
        mock_file_operator_delete(tip_length_path / "pip1.json"),
        times=1,
    )


def test_delete_all_tip_calibration(
    robot_model: "RobotModel",
    decoy: Decoy,
    tip_length_path: Path,
    mock_file_operator_remove_files: DELETE_FUNC_TYPE,
) -> None:
    """
    Test delete all tip length calibration.
    """

    clear_tip_length_calibration()
    decoy.verify(
        mock_file_operator_remove_files(tip_length_path),
        times=1,
    )


def test_save_tip_length_calibration(
    robot_model: "RobotModel",
    decoy: Decoy,
    tip_length_path: Path,
    mock_file_operator_save: SAVE_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
    minimal_labware_def: "LabwareDefinition",
) -> None:
    """
    Test saving tip length calibrations.
    """
    tip_rack_hash = helpers.hash_labware_def(minimal_labware_def)
    save_data_1 = {
        tip_rack_hash: {
            "tipLength": 22.0,
            "uri": "opentronstest/minimal_labware_def/1",
            "lastModified": mock_timestamp.isoformat(),
            "source": "user",
            "status": {"markedBad": False, "source": None, "markedAt": None},
        }
    }
    save_data_2 = {
        tip_rack_hash: {
            "tipLength": 31.0,
            "uri": "opentronstest/minimal_labware_def/1",
            "lastModified": mock_timestamp.isoformat(),
            "source": "user",
            "status": {"markedBad": False, "source": None, "markedAt": None},
        }
    }

    tip_length1 = create_tip_length_data(minimal_labware_def, 22.0)
    tip_length2 = create_tip_length_data(minimal_labware_def, 31.0)
    decoy.reset()
    save_tip_length_calibration("pip1", tip_length1)
    decoy.verify(
        mock_file_operator_save(tip_length_path, "pip1", save_data_1),
        times=1,
    )

    decoy.reset()
    save_tip_length_calibration("pip2", tip_length2)
    decoy.verify(
        mock_file_operator_save(tip_length_path, "pip2", save_data_2),
        times=1,
    )


def test_get_ot2_tip_length_calibration(
    decoy: Decoy,
    tip_length_path: Path,
    minimal_labware_def: "LabwareDefinition",
    mock_file_operator_read: READ_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
) -> None:
    """
    Test ability to get a tip length calibration model.
    """
    from opentrons.calibration_storage.ot2 import models

    labware_hash = helpers.hash_labware_def(minimal_labware_def)

    return_data = {
        labware_hash: {
            "tipLength": 22.0,
            "uri": "opentronstest/minimal_labware_def/1",
            "lastModified": mock_timestamp.isoformat(),
            "source": "user",
            "status": {"markedBad": False, "source": None, "markedAt": None},
        }
    }
    decoy.when(mock_file_operator_read(tip_length_path / "pip1.json")).then_return(
        return_data
    )
    tip_length_data = load_tip_length_calibration("pip1", minimal_labware_def)
    assert tip_length_data == models.v1.TipLengthModel(
        tipLength=22.0,
        source=cs_types.SourceType.user,
        lastModified=tip_length_data.lastModified,
        uri=cast("LabwareUri", "opentronstest/minimal_labware_def/1"),
    )
    decoy.reset()
    decoy.when(mock_file_operator_read(tip_length_path / "nopipette.json")).then_raise(
        FileNotFoundError  # type: ignore[arg-type]
    )
    with pytest.raises(cs_types.TipLengthCalNotFound):
        load_tip_length_calibration("nopipette", minimal_labware_def)



def test_get_ot3_tip_length_calibration(
    decoy: Decoy,
    tip_length_path: Path,
    minimal_labware_def: "LabwareDefinition",
    mock_file_operator_read: READ_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
    enable_ot3_hardware_controller: Any,
) -> None:
    """
    Test ability to get a tip length calibration model.
    """
    from opentrons.calibration_storage.ot3 import models

    labware_hash = helpers.hash_labware_def(minimal_labware_def)

    return_data = {
        labware_hash: {
            "tipLength": 22.0,
            "uri": "opentronstest/minimal_labware_def/1",
            "lastModified": mock_timestamp.isoformat(),
            "source": "user",
            "status": {"markedBad": False, "source": None, "markedAt": None},
        }
    }
    decoy.when(mock_file_operator_read(tip_length_path / "pip1.json")).then_return(
        return_data
    )
    tip_length_data = load_tip_length_calibration("pip1", minimal_labware_def)
    assert tip_length_data == models.v1.TipLengthModel(
        tipLength=22.0,
        source=cs_types.SourceType.user,
        lastModified=tip_length_data.lastModified,
        uri=cast("LabwareUri", "opentronstest/minimal_labware_def/1"),
    )
    decoy.reset()
    decoy.when(mock_file_operator_read(tip_length_path / "nopipette.json")).then_raise(
        FileNotFoundError  # type: ignore[arg-type]
    )
    with pytest.raises(cs_types.TipLengthCalNotFound):
        load_tip_length_calibration("nopipette", minimal_labware_def)
