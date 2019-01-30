import pytest
from opentrons.config import (CONFIG,
                              robot_configs,
                              advanced_settings as advs)


@pytest.fixture
def mock_config():
    test_config = robot_configs.load()
    test_config = test_config._replace(name='new-value1')
    robot_configs.save_robot_settings(test_config)

    return robot_configs


@pytest.mark.api1_only
def test_clear_config(mock_config, async_server):
    # Clear should happen automatically after the following import, resetting
    # the robot config to the default value from robot_configs
    from opentrons.deck_calibration import dc_main
    hardware = async_server['com.opentrons.hardware']
    dc_main.clear_configuration_and_reload(hardware)

    assert hardware.config == robot_configs._build_config({}, {})


def test_save_and_clear_config(mock_config, async_server):
    # Clear should happen automatically after the following import, resetting
    # the robot config to the default value from robot_configs
    from opentrons.deck_calibration import dc_main
    import os

    hardware = async_server['com.opentrons.hardware']
    hardware.update_config(name='Ada Lovelace')
    old_config = hardware.config
    base_filename = CONFIG['deck_calibration_file']

    tag = "testing"
    root, ext = os.path.splitext(base_filename)
    filename = "{}-{}{}".format(root, tag, ext)
    dc_main.backup_configuration_and_reload(hardware, tag=tag)

    assert hardware.config == robot_configs._build_config({}, {})

    saved_config = robot_configs.load(filename)
    assert saved_config == old_config


async def test_new_deck_points():
    # Checks that the correct deck calibration points are being used
    # if feature_flag is set (or not)
    from opentrons.deck_calibration.dc_main import get_calibration_points
    from opentrons.deck_calibration.endpoints import expected_points
    advs.set_adv_setting('deckCalibrationDots', True)
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

    advs.set_adv_setting('deckCalibrationDots', False)
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
