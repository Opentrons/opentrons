import pytest
from opentrons.config import get_config_index


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


@pytest.fixture
def deck_setup_flag(monkeypatch):
    tmpd = tempfile.TemporaryDirectory()
    monkeypatch.setattr(
        ff, 'SETTINGS_PATH', os.path.join(tmpd.name, 'settings.json'))

    print(tmpd)
    print(os.path.abspath(os.path.join(tmpd.name, 'settings.json')))
    ff.set_feature_flag('dots-deck-type', True)

    print(ff.dots_deck_type())
    yield

    print(ff.dots_deck_type())


async def test_new_deck_points(deck_setup_flag):
    # Checks that the correct deck calibration points are being used
    # if feature_flag is set (or not)
    from opentrons.deck_calibration import dots_set

    slot_1_lower_left,\
        slot_3_lower_right,\
        slot_10_upper_left = dots_set(ff.dots_deck_type())
    # Check when feature_flag is set
    assert slot_1_lower_left == (12.13, 6.0)
    assert slot_3_lower_right == (380.87, 6.0)
    assert slot_10_upper_left == (12.13, 351.5)

    yield
    # Check when feature_flag not set (default should be cross positions)
    assert slot_1_lower_left == (12.13, 9.0)
    assert slot_3_lower_right == (380.87, 9.0)
    assert slot_10_upper_left == (12.13, 348.5)
