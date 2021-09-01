from unittest.mock import patch
import pytest
from opentrons.config import reset


@pytest.fixture
def mock_reset_boot_scripts():
    with patch("opentrons.config.reset.reset_boot_scripts") as m:
        yield m


@pytest.fixture
def mock_reset_labware_calibration():
    with patch("opentrons.config.reset.reset_labware_calibration") as m:
        yield m


@pytest.fixture
def mock_labware():
    with patch("opentrons.config.reset.delete") as m:
        yield m


@pytest.fixture
def mock_reset_pipette_offset():
    with patch("opentrons.config.reset.reset_pipette_offset") as m:
        yield m


@pytest.fixture
def mock_reset_deck_calibration():
    with patch("opentrons.config.reset.reset_deck_calibration") as m:
        yield m


@pytest.fixture
def mock_reset_tip_length_calibrations():
    with patch("opentrons.config.reset.reset_tip_length_calibrations") as m:
        yield m


@pytest.fixture
def mock_cal_storage_delete():
    with patch("opentrons.config.reset.delete", autospec=True) as m:
        yield m


def test_reset_empty_set(
    mock_reset_boot_scripts,
    mock_reset_labware_calibration,
    mock_reset_pipette_offset,
    mock_reset_deck_calibration,
    mock_reset_tip_length_calibrations,
):
    reset.reset(set())
    mock_reset_labware_calibration.assert_not_called()
    mock_reset_boot_scripts.assert_not_called()
    mock_reset_pipette_offset.assert_not_called()
    mock_reset_deck_calibration.assert_not_called()
    mock_reset_tip_length_calibrations.assert_not_called()


def test_reset_all_set(
    mock_reset_boot_scripts,
    mock_reset_labware_calibration,
    mock_reset_pipette_offset,
    mock_reset_deck_calibration,
    mock_reset_tip_length_calibrations,
):
    reset.reset(
        {
            reset.ResetOptionId.boot_scripts,
            reset.ResetOptionId.labware_calibration,
            reset.ResetOptionId.deck_calibration,
            reset.ResetOptionId.pipette_offset,
            reset.ResetOptionId.tip_length_calibrations,
        }
    )
    mock_reset_labware_calibration.assert_called_once()
    mock_reset_boot_scripts.assert_called_once()
    mock_reset_pipette_offset.assert_called_once()
    mock_reset_deck_calibration.assert_called_once()
    mock_reset_tip_length_calibrations.assert_called_once()


def test_labware_calibration_reset(mock_labware):
    reset.reset_labware_calibration()
    # Check side effecting function calls
    mock_labware.clear_calibrations.assert_called_once()


def test_deck_calibration_reset(mock_cal_storage_delete):
    reset.reset_deck_calibration()
    mock_cal_storage_delete.delete_robot_deck_attitude.assert_called_once()
    mock_cal_storage_delete.clear_pipette_offset_calibrations.assert_called_once()


def test_tip_length_calibrations_reset(mock_cal_storage_delete):
    reset.reset_tip_length_calibrations()
    mock_cal_storage_delete.clear_tip_length_calibration.assert_called_once()
    mock_cal_storage_delete.clear_pipette_offset_calibrations.assert_called_once()


def test_pipette_offset_reset(mock_cal_storage_delete):
    reset.reset_pipette_offset()
    mock_cal_storage_delete.clear_pipette_offset_calibrations.assert_called_once()
