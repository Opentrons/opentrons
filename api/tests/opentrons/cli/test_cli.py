import pytest


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
    from opentrons.cli.main import main  # NOQA

    from opentrons import robot
    from opentrons.robot.robot_configs import default

    assert robot.config == default
