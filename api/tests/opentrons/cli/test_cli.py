import pytest
from opentrons.config import get_config_index
from opentrons.config import feature_flags as ff


@pytest.fixture
def mock_config():
    from opentrons.robot import robot_configs

    test_config = robot_configs.load()
    test_config = test_config._replace(name='new-value1')
    robot_configs.save(test_config)

    return robot_configs


def test_clear_config(mock_config):
    # Clear should happen automatically after the following import, resetting
    # the robot config to the default value from robot_configs
    from opentrons.deck_calibration import dc_main
    dc_main.clear_configuration_and_reload()

    from opentrons import robot
    from opentrons.robot import robot_configs

    assert robot.config == robot_configs._get_default()


def test_save_and_clear_config(mock_config):
    # Clear should happen automatically after the following import, resetting
    # the robot config to the default value from robot_configs
    from opentrons.deck_calibration import dc_main
    from opentrons import robot
    import os

    old_config = robot.config
    base_filename = get_config_index().get('deckCalibrationFile')

    tag = "testing"
    root, ext = os.path.splitext(base_filename)
    filename = "{}-{}{}".format(root, tag, ext)
    dc_main.backup_configuration_and_reload(tag=tag)

    from opentrons import robot
    from opentrons.robot import robot_configs

    assert robot.config == robot_configs._get_default()

    saved_config = robot_configs.load(filename)
    assert saved_config == old_config


async def test_new_deck_points():
    # Checks that the correct deck calibration points are being used
    # if feature_flag is set (or not)
    from opentrons.deck_calibration.dc_main import get_calibration_points
    from opentrons.deck_calibration.endpoints import expected_points
    ff.set_feature_flag('dots-deck-type', True)
    calibration_points = get_calibration_points()
    expected_points1 = expected_points()
    # Check that old calibration points are used in cli
    assert calibration_points[1] == (12.13, 6.0)
    assert calibration_points[2] == (380.87, 6.0)
    assert calibration_points[3] == (12.13, 351.5)
    # Check that endpoints are now using slot 7 for dots
    assert expected_points1['1'] == (12.13, 6.0)
    assert expected_points1['2'] == (380.87, 6.0)
    assert expected_points1['3'] == (12.13, 261.0)

    ff.set_feature_flag('dots-deck-type', False)
    calibration_points2 = get_calibration_points()
    expected_points2 = expected_points()
    # Check that new calibration points are used
    assert calibration_points2[1] == (12.13, 9.0)
    assert calibration_points2[2] == (380.87, 9.0)
    assert calibration_points2[3] == (12.13, 348.5)
    # Check that endpoints are now using slot 7 for crosses
    assert expected_points2['1'] == (12.13, 9.0)
    assert expected_points2['2'] == (380.87, 9.0)
    assert expected_points2['3'] == (12.13, 258.0)
