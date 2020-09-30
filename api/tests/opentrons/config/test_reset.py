from collections import namedtuple
from unittest.mock import patch, MagicMock
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
def mock_reset_tip_probe():
    with patch("opentrons.config.reset.reset_tip_probe") as m:
        yield m


@pytest.fixture()
def mock_db():
    with patch("opentrons.config.reset.db") as m:
        yield m


@pytest.fixture()
def mock_labware():
    with patch("opentrons.config.reset.delete") as m:
        yield m


@pytest.fixture()
def mock_robot_config():
    with patch("opentrons.config.reset.rc") as m:
        yield m


def test_reset_empty_set(mock_reset_boot_scripts,
                         mock_reset_labware_calibration,
                         mock_reset_tip_probe):
    reset.reset(set())
    mock_reset_labware_calibration.assert_not_called()
    mock_reset_boot_scripts.assert_not_called()
    mock_reset_tip_probe.assert_not_called()


def test_reset_all_set(mock_reset_boot_scripts,
                       mock_reset_labware_calibration,
                       mock_reset_tip_probe):
    reset.reset({reset.ResetOptionId.boot_scripts,
                 reset.ResetOptionId.tip_probe,
                 reset.ResetOptionId.labware_calibration})
    mock_reset_labware_calibration.assert_called_once()
    mock_reset_boot_scripts.assert_called_once()
    mock_reset_tip_probe.assert_called_once()


def test_labware_calibration_reset(mock_db, mock_labware):
    reset.reset_labware_calibration()
    # Check side effecting function calls
    mock_db.reset.assert_called_once()
    mock_labware.clear_calibrations.assert_called_once()


def test_tip_probe_reset(mock_robot_config):
    # Create a named tuple of the robot_config fields we care about
    FakeRobotConfig = namedtuple("FakeRobotConfig",
                                 ["instrument_offset", "tip_length"])
    # Instantiate with None and a mock.
    obj = FakeRobotConfig(None, MagicMock())
    # Mock out build_fallback_instrument_offset
    mock_robot_config.build_fallback_instrument_offset.return_value = 100
    # Mock out load to return our fake robot config
    mock_robot_config.load.return_value = obj

    # Call the test function
    reset.reset_tip_probe()

    # Check the side effects
    obj.tip_length.clear.assert_called_once_with()

    mock_robot_config.save_robot_settings.assert_called_once_with(
        FakeRobotConfig(100,
                        obj.tip_length))
