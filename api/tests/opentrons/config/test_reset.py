import pytest
from typing import Generator, TYPE_CHECKING
from unittest.mock import MagicMock, patch

from opentrons.config import reset

if TYPE_CHECKING:
    from opentrons_shared_data.deck.dev_types import RobotModel


@pytest.fixture
def mock_reset_boot_scripts() -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.reset.reset_boot_scripts") as m:
        yield m


@pytest.fixture
def mock_reset_pipette_offset() -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.reset.reset_pipette_offset") as m:
        yield m


@pytest.fixture
def mock_reset_deck_calibration() -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.reset.reset_deck_calibration") as m:
        yield m


@pytest.fixture
def mock_reset_tip_length_calibrations() -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.reset.reset_tip_length_calibrations") as m:
        yield m


@pytest.fixture
def mock_cal_pipette_offset(
    robot_model: "RobotModel",
) -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.reset.clear_pipette_offset_calibrations") as m:
        yield m


@pytest.fixture
def mock_cal_gripper_offset(
    robot_model: "RobotModel",
) -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.reset.reset_gripper_offset") as m:
        yield m


@pytest.fixture
def mock_cal_tip_length(robot_model: "RobotModel") -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.reset.clear_tip_length_calibration") as m:
        yield m


@pytest.fixture
def mock_cal_robot_attitude(
    robot_model: "RobotModel",
) -> Generator[MagicMock, None, None]:
    with patch("opentrons.config.reset.delete_robot_deck_attitude") as m:
        yield m


def test_get_options() -> None:
    options = reset.reset_options("OT-2 Standard")
    assert list(options.keys()) == reset._OT_2_RESET_OPTIONS

    options = reset.reset_options("OT-3 Standard")
    assert list(options.keys()) == reset._FLEX_RESET_OPTIONS


def test_reset_empty_set(
    mock_reset_boot_scripts: MagicMock,
    mock_reset_pipette_offset: MagicMock,
    mock_reset_deck_calibration: MagicMock,
    mock_reset_tip_length_calibrations: MagicMock,
) -> None:
    reset.reset(set())
    mock_reset_boot_scripts.assert_not_called()
    mock_reset_pipette_offset.assert_not_called()
    mock_reset_deck_calibration.assert_not_called()
    mock_reset_tip_length_calibrations.assert_not_called()


def test_reset_all_set(
    mock_reset_boot_scripts: MagicMock,
    mock_reset_pipette_offset: MagicMock,
    mock_reset_deck_calibration: MagicMock,
    mock_reset_tip_length_calibrations: MagicMock,
) -> None:
    reset.reset(
        {
            reset.ResetOptionId.boot_scripts,
            reset.ResetOptionId.deck_calibration,
            reset.ResetOptionId.pipette_offset,
            reset.ResetOptionId.tip_length_calibrations,
        }
    )
    mock_reset_boot_scripts.assert_called_once()
    mock_reset_pipette_offset.assert_called_once()
    mock_reset_deck_calibration.assert_called_once()
    mock_reset_tip_length_calibrations.assert_called_once()


def test_deck_calibration_reset(
    mock_cal_pipette_offset: MagicMock, mock_cal_robot_attitude: MagicMock
) -> None:
    reset.reset_deck_calibration()
    mock_cal_robot_attitude.assert_called_once()
    mock_cal_pipette_offset.assert_called_once()


def test_tip_length_calibrations_reset(
    mock_cal_pipette_offset: MagicMock, mock_cal_tip_length: MagicMock
) -> None:
    reset.reset_tip_length_calibrations()
    mock_cal_tip_length.assert_called_once()
    mock_cal_pipette_offset.assert_called_once()


def test_pipette_offset_reset(mock_cal_pipette_offset: MagicMock) -> None:
    reset.reset_pipette_offset()
    mock_cal_pipette_offset.assert_called_once()


def test_gripper_offset_reset(mock_cal_gripper_offset: MagicMock) -> None:
    reset.reset_gripper_offset()
    mock_cal_gripper_offset.assert_called_once()
