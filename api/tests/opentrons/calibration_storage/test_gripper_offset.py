import pytest
import mock
from datetime import datetime
from typing import Any, cast
from pathlib import Path
from decoy import Decoy
from opentrons.types import Point
from opentrons.calibration_storage import (
    types as cs_types,
    ot3_gripper_offset as gripper,
)
from opentrons.calibration_storage.ot3 import models
from . import READ_FUNC_TYPE, SAVE_FUNC_TYPE, DELETE_FUNC_TYPE, MOCK_UTC


@pytest.fixture
def gripper_path(ot_config_tempdir: Any) -> Path:
    return Path(f"{ot_config_tempdir}/robot/gripper")


def test_delete_all_gripper_calibration(
    gripper_path: Path, decoy: Decoy, mock_file_operator_remove_files: DELETE_FUNC_TYPE
) -> None:
    """
    Test delete all gripper calibrations.
    """
    gripper.clear_gripper_calibration_offsets()
    decoy.verify(
        mock_file_operator_remove_files(gripper_path),
        times=1,
    )


def test_delete_gripper_calibration(
    gripper_path: Path, decoy: Decoy, mock_file_operator_delete: DELETE_FUNC_TYPE
) -> None:
    """
    Test delete a single gripper calibration.
    """
    gripper.delete_gripper_calibration_file("gripper1")
    decoy.verify(
        mock_file_operator_delete(gripper_path / "gripper1.json"),
        times=1,
    )


def test_save_gripper_calibration(
    gripper_path: Path,
    decoy: Decoy,
    mock_file_operator_save: SAVE_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
    enable_ot3_hardware_controller: Any,
) -> None:
    """
    Test saving gripper calibrations.
    """
    return_data = models.v1.InstrumentOffsetModel(
        offset=Point(1, 1, 1),
        lastModified=mock_timestamp,
        source=cs_types.SourceType.user,
    )

    gripper.save_gripper_calibration(Point(1, 1, 1), "gripper1")

    decoy.verify(
        mock_file_operator_save(gripper_path, "gripper1", return_data), times=1
    )


def test_get_gripper_calibration(
    gripper_path: Path,
    decoy: Decoy,
    mock_file_operator_read: READ_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
    enable_ot3_hardware_controller: Any,
) -> None:
    """
    Test ability to get a gripper calibration schema.
    """
    return_data = {
        "offset": [1, 1, 1],
        "lastModified": mock_timestamp,
        "source": "user",
    }
    decoy.when(mock_file_operator_read(gripper_path / "gripper1.json")).then_return(
        return_data
    )
    gripper_data = cast(models.v1.InstrumentOffsetModel, gripper.get_gripper_calibration_offset("gripper1"))
    assert gripper_data == models.v1.InstrumentOffsetModel(
        offset=Point(1, 1, 1),
        lastModified=gripper_data.lastModified,
        source=cs_types.SourceType.user,
    )
