import pytest
from opentrons.util import environment


@pytest.fixture
def config(monkeypatch, tmpdir):
    from opentrons.robot import robot_configs
    from opentrons.util import environment

    monkeypatch.setenv('APP_DATA_DIR', str(tmpdir))
    environment.refresh()

    test_config = robot_configs.load()
    test_config = test_config._replace(name='new-value1')
    robot_configs.save(test_config)

    return robot_configs


def test_clear_config(config):
    # Clear should happen automatically after the following import, resetting
    # the robot config to the default value from robot_configs
    from opentrons.deck_calibration import dc_main
    dc_main.clear_configuration_and_reload()

    from opentrons import robot
    from opentrons.robot import robot_configs

    assert robot.config == robot_configs._get_default()


def test_save_and_clear_config(config):
    # Clear should happen automatically after the following import, resetting
    # the robot config to the default value from robot_configs
    from opentrons.deck_calibration import dc_main
    from opentrons import robot
    import os

    old_config = robot.config
    base_filename = environment.get_path('OT_CONFIG_FILE')

    tag = "testing"
    root, ext = os.path.splitext(base_filename)
    filename = "{}-{}{}".format(root, tag, ext)
    dc_main.backup_configuration_and_reload(tag=tag)

    from opentrons import robot
    from opentrons.robot import robot_configs

    assert robot.config == robot_configs._get_default()

    saved_config = robot_configs.load(filename)
    assert saved_config == old_config
