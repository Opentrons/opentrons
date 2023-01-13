import pytest
from decoy import Decoy
from datetime import datetime
from typing import Any, cast, TYPE_CHECKING
from pathlib import Path
from opentrons.calibration_storage import (
    save_robot_deck_attitude,
    get_robot_deck_attitude,
    delete_robot_deck_attitude,
    types as cs_types
)

from . import READ_FUNC_TYPE, SAVE_FUNC_TYPE, DELETE_FUNC_TYPE, MOCK_UTC

if TYPE_CHECKING:
    from opentrons_shared_data.deck.dev_types import RobotModel


@pytest.fixture
def robot_path(ot_config_tempdir: Any) -> Path:
    return Path(f"{ot_config_tempdir}/robot")


def test_no_file_found_deck_calibration(
    robot_model: "RobotModel",
    robot_path: Path,
    decoy: Decoy,
    mock_file_operator_read: READ_FUNC_TYPE,
) -> None:
    decoy.when(
        mock_file_operator_read(robot_path / "deck_calibration.json")
    ).then_raise(FileNotFoundError)   # type: ignore[arg-type]
    # Check nothing is stored when a FileNotFoundError called
    assert get_robot_deck_attitude() is None


def test_get_ot2_deck_calibration_available_data(
    robot_path: Path,
    decoy: Decoy,
    mock_file_operator_read: READ_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
) -> None:
    # needed for proper type checking unfortunately
    from opentrons.calibration_storage.ot2.models.v1 import (
        DeckCalibrationModel as OT2DeckCalModel,
    )

    return_data = {
        "attitude": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        "last_modified": mock_timestamp,
        "source": "user",
        "pipette_calibrated_with": "pip1",
        "tiprack": "mytiprack",
    }
    # Deck calibration data should exist and be equal to what was saved to file
    decoy.when(
        mock_file_operator_read(robot_path / "deck_calibration.json")
    ).then_return(return_data)
    robot_deck = cast(OT2DeckCalModel, get_robot_deck_attitude())
    assert robot_deck == OT2DeckCalModel(
        attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        last_modified=robot_deck.last_modified,
        source=robot_deck.source,
        pipette_calibrated_with="pip1",
        tiprack="mytiprack",
    )


def test_save_ot2_deck_calibration(
    robot_path: Path,
    decoy: Decoy,
    mock_file_operator_save: SAVE_FUNC_TYPE,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
) -> None:

    from opentrons.calibration_storage.ot2.models.v1 import (
        DeckCalibrationModel as OT2DeckCalModel,
    )

    return_data = OT2DeckCalModel(
        attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        last_modified=mock_timestamp,
        source=cs_types.SourceType.user,
        pipette_calibrated_with="pip1",
        tiprack="mytiprack",
    )

    # Save calibration data
    save_robot_deck_attitude(
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1", lw_hash="mytiprack"
    )
    decoy.verify(
        mock_file_operator_save(robot_path, "deck_calibration", return_data), times=1
    )


def test_delete_ot2_deck_calibration(
    ot_config_tempdir: Any,
    decoy: Decoy,
    mock_file_operator_delete: DELETE_FUNC_TYPE,
) -> None:

    delete_robot_deck_attitude()
    decoy.verify(
        mock_file_operator_delete(Path(f"{ot_config_tempdir}/deck_calibration.json")),
        times=1,
    )
    decoy.verify(
        mock_file_operator_delete(
            Path(f"{ot_config_tempdir}/robot/deck_calibration.json")
        ),
        times=1,
    )


def test_get_ot3_deck_calibration_available_data(
    robot_path: Path,
    decoy: Decoy,
    mock_file_operator_read: READ_FUNC_TYPE,
    enable_ot3_hardware_controller: Any,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
) -> None:
    # needed for proper type checking unfortunately
    from opentrons.calibration_storage.ot3.models.v1 import (
        DeckCalibrationModel as OT3DeckCalModel,
    )

    return_data = {
        "attitude": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        "lastModified": mock_timestamp,
        "source": "user",
        "pipetteCalibratedWith": "pip1",
    }
    # Deck calibration data should exist and be equal to what was saved to file
    decoy.when(
        mock_file_operator_read(robot_path / "deck_calibration.json")
    ).then_return(return_data)

    robot_deck = cast(OT3DeckCalModel, get_robot_deck_attitude())
    assert robot_deck == OT3DeckCalModel(
        attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        lastModified=robot_deck.lastModified,
        source=robot_deck.source,
        pipetteCalibratedWith="pip1",
    )


def test_save_ot3_deck_calibration(
    robot_path: Path,
    decoy: Decoy,
    mock_file_operator_save: SAVE_FUNC_TYPE,
    enable_ot3_hardware_controller: Any,
    mock_timestamp: datetime,
    mock_utc_now: MOCK_UTC,
) -> None:
    from opentrons.calibration_storage.ot3.models.v1 import (
        DeckCalibrationModel as OT3DeckCalModel,
    )

    return_data = OT3DeckCalModel(
        attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        lastModified=mock_timestamp,
        source=cs_types.SourceType.user,
        pipetteCalibratedWith="pip1",
    )

    # Save calibration data
    save_robot_deck_attitude(
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1", lw_hash="mytiprack"
    )
    decoy.verify(
        mock_file_operator_save(robot_path, "deck_calibration", return_data), times=1
    )


def test_delete_ot3_deck_calibration(
    robot_path: Path,
    decoy: Decoy,
    mock_file_operator_delete: DELETE_FUNC_TYPE,
    enable_ot3_hardware_controller: Any,
) -> None:
    delete_robot_deck_attitude()
    decoy.verify(
        mock_file_operator_delete(robot_path / "deck_calibration.json"),
        times=1,
    )
