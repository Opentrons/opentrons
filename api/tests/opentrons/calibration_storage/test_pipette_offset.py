import pytest
import mock
from decoy import Decoy
from datetime import datetime
from pathlib import Path
from typing import Any, TYPE_CHECKING, cast

from opentrons.types import Mount, Point
from opentrons.calibration_storage import (
    types as cs_types,
    save_pipette_calibration,
    get_pipette_offset,
    clear_pipette_offset_calibrations,
    delete_pipette_offset_file,
)

from . import READ_FUNC_TYPE, SAVE_FUNC_TYPE, DELETE_FUNC_TYPE, MOCK_UTC

if TYPE_CHECKING:
    from opentrons_shared_data.deck.dev_types import RobotModel


@pytest.fixture
def pipette_path(ot_config_tempdir: Any) -> Path:
    return Path(f"{ot_config_tempdir}/robot/pipettes")


def test_delete_all_pipette_calibration(
    pipette_path: Path,
    decoy: Decoy,
    robot_model: "RobotModel",
    mock_file_operator_remove_files: DELETE_FUNC_TYPE,
) -> None:
    """
    Test delete all pipette calibrations.
    """

    clear_pipette_offset_calibrations()
    decoy.verify(
        mock_file_operator_remove_files(pipette_path),
        times=1,
    )


def test_delete_specific_pipette_offset(
    pipette_path: Path,
    decoy: Decoy,
    robot_model: "RobotModel",
    mock_file_operator_delete: DELETE_FUNC_TYPE,
) -> None:
    """
    Test delete a specific pipette calibration.
    """

    delete_pipette_offset_file("pip1", Mount.LEFT)
    decoy.verify(
        mock_file_operator_delete(pipette_path / Mount.LEFT.name.lower() / "pip1.json"),
        times=1,
    )


def test_save_ot2_pipette_calibration(
    pipette_path: Path,
    decoy: Decoy,
    mock_file_operator_save: SAVE_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
) -> None:
    """
    Test saving pipette calibrations.
    """
    # needed for proper type checking unfortunately
    from opentrons.calibration_storage.ot2.models.v1 import (
        InstrumentOffsetModel as OT2InstrumentOffset,
    )

    return_data = OT2InstrumentOffset(
        offset=Point(1, 1, 1),
        tiprack="mytiprack",
        uri="opentrons/tip_rack/1",
        last_modified=mock_timestamp,
        source=cs_types.SourceType.user,
    )

    save_pipette_calibration(
        Point(1, 1, 1), "pip1", Mount.LEFT, "mytiprack", "opentrons/tip_rack/1"
    )
    decoy.verify(
        mock_file_operator_save(
            pipette_path / Mount.LEFT.name.lower(), "pip1", return_data
        ),
        times=1,
    )

    save_pipette_calibration(
        Point(1, 1, 1), "pip2", Mount.RIGHT, "mytiprack", "opentrons/tip_rack/1"
    )
    decoy.verify(
        mock_file_operator_save(
            pipette_path / Mount.RIGHT.name.lower(), "pip2", return_data
        ),
        times=1,
    )


def test_get_ot2_pipette_calibration(
    pipette_path: Path,
    decoy: Decoy,
    mock_file_operator_read: READ_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
) -> None:
    """
    Test ability to get a pipette calibration model.
    """
    # needed for proper type checking unfortunately
    from opentrons.calibration_storage.ot2.models.v1 import (
        InstrumentOffsetModel as OT2InstrModel,
    )

    return_data = {
        "offset": [1, 1, 1],
        "tiprack": "mytiprack",
        "uri": "opentrons/tip_rack/1",
        "last_modified": mock_timestamp,
        "source": "user",
    }
    decoy.when(
        mock_file_operator_read(pipette_path / Mount.LEFT.name.lower() / "pip1.json")
    ).then_return(return_data)
    pipette_data = cast(OT2InstrModel, get_pipette_offset("pip1", Mount.LEFT))

    assert pipette_data == OT2InstrModel(
        offset=Point(1, 1, 1),
        tiprack="mytiprack",
        uri="opentrons/tip_rack/1",
        last_modified=pipette_data.last_modified,
        source=cs_types.SourceType.user,
    )


def test_save_ot3_pipette_calibration(
    pipette_path: Path,
    decoy: Decoy,
    mock_file_operator_save: SAVE_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
    enable_ot3_hardware_controller: Any,
) -> None:
    """
    Test saving pipette calibrations.
    """
    from opentrons.calibration_storage.ot3.models.v1 import (
        InstrumentOffsetModel as OT3InstrumentOffset,
    )

    return_data = OT3InstrumentOffset(
        offset=Point(1, 1, 1),
        lastModified=mock_timestamp,
        source=cs_types.SourceType.user,
    )

    save_pipette_calibration(Point(1, 1, 1), "pip1", Mount.LEFT)
    decoy.verify(
        mock_file_operator_save(
            pipette_path / Mount.LEFT.name.lower(), "pip1", return_data
        ),
        times=1,
    )

    save_pipette_calibration(Point(1, 1, 1), "pip2", Mount.RIGHT)
    decoy.verify(
        mock_file_operator_save(
            pipette_path / Mount.RIGHT.name.lower(), "pip2", return_data
        ),
        times=1,
    )


def test_get_ot3_pipette_calibration(
    pipette_path: Path,
    decoy: Decoy,
    mock_file_operator_read: READ_FUNC_TYPE,
    enable_ot3_hardware_controller: Any,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
) -> None:
    """
    Test ability to get a pipette calibration model.
    """
    # needed for proper type checking unfortunately
    from opentrons.calibration_storage.ot3.models.v1 import (
        InstrumentOffsetModel as OT3InstrModel,
    )

    return_data = {
        "offset": [1, 1, 1],
        "source": "user",
        "lastModified": mock_timestamp,
    }
    # Deck calibration data should exist and be equal to what was saved to file
    decoy.when(
        mock_file_operator_read(pipette_path / Mount.LEFT.name.lower() / "pip1.json")
    ).then_return(return_data)

    pipette_data = cast(OT3InstrModel, get_pipette_offset("pip1", Mount.LEFT))
    assert pipette_data == OT3InstrModel(
        offset=Point(1, 1, 1),
        lastModified=pipette_data.lastModified,
        source=cs_types.SourceType.user,
    )
