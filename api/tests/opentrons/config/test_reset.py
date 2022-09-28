import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from typing import Generator
from unittest.mock import MagicMock, patch

from opentrons.config import reset


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


@pytest.mark.parametrize(
    argnames=["mock_cal_storage_delete"],
    argvalues=[
        [lazy_fixture("mock_cal_storage_delete_ot3")],
        [lazy_fixture("mock_cal_storage_delete_ot2")],
    ],
)
def test_deck_calibration_reset(mock_cal_storage_delete: MagicMock) -> None:
    reset.reset_deck_calibration()
    mock_cal_storage_delete.delete_robot_deck_attitude.assert_called_once()
    mock_cal_storage_delete.clear_pipette_offset_calibrations.assert_called_once()


@pytest.mark.parametrize(
    argnames=["mock_cal_storage_delete"],
    argvalues=[
        [lazy_fixture("mock_cal_storage_delete_ot3")],
        [lazy_fixture("mock_cal_storage_delete_ot2")],
    ],
)
def test_tip_length_calibrations_reset(mock_cal_storage_delete: MagicMock) -> None:
    reset.reset_tip_length_calibrations()
    mock_cal_storage_delete.clear_tip_length_calibration.assert_called_once()
    mock_cal_storage_delete.clear_pipette_offset_calibrations.assert_called_once()


@pytest.mark.parametrize(
    argnames=["mock_cal_storage_pipette_offset"],
    argvalues=[
        [lazy_fixture("mock_cal_storage_delete_ot3")],
        [lazy_fixture("mock_cal_storage_delete_ot2")],
    ],
)
def test_pipette_offset_reset(mock_cal_storage_delete: MagicMock) -> None:
    reset.reset_pipette_offset()
    mock_cal_storage_delete.clear_pipette_offset_calibrations.assert_called_once()
