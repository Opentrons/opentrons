import copy
import pytest
import sys
import numpy as np

from opentrons.config import (CONFIG,
                              robot_configs,
                              advanced_settings as advs)
from opentrons.types import Mount
from opentrons.deck_calibration import dc_main
from opentrons.deck_calibration.dc_main import get_calibration_points
from opentrons.deck_calibration.endpoints import expected_points


@pytest.fixture
def mock_config():
    yield robot_configs.load()
    robot_configs.clear()


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
    # the deck cal to the default value
    from opentrons.deck_calibration import dc_main
    import os

    hardware = async_server['com.opentrons.hardware']

    hardware.config.gantry_calibration[0][3] = 10

    old_gantry = copy.copy(hardware.config.gantry_calibration)
    base_filename = CONFIG['deck_calibration_file']

    tag = "testing"
    root, ext = os.path.splitext(base_filename)
    filename = "{}-{}{}".format(root, tag, ext)

    dc_main.backup_configuration_and_reload(hardware, tag=tag)
    # After reset gantry calibration should be I(4,4)
    assert hardware.config.gantry_calibration\
        == robot_configs.DEFAULT_DECK_CALIBRATION
    # Mount calibration should be defaulted
    assert hardware.config.mount_offset == robot_configs.DEFAULT_MOUNT_OFFSET

    # Check that we properly saved the old deck calibration
    saved_config = robot_configs.load(filename)
    assert saved_config.gantry_calibration == old_gantry
    # XXX This shouldn't be necessary but the config isn't properly cleared
    # otherwise
    hardware.config.gantry_calibration[0][3] = 0


async def test_new_deck_points():
    # Checks that the correct deck calibration points are being used
    # if feature_flag is set (or not)

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


@pytest.mark.skipif(
    sys.platform.startswith("win"), reason="Incompatible with Windows")
@pytest.mark.api1_only
def test_move_output(mock_config, loop, async_server, monkeypatch):
    # Check that the robot moves to the correct locations
    # TODO: Make tests for both APIs
    hardware = async_server['com.opentrons.hardware']

    monkeypatch.setattr(
        dc_main.CLITool, 'hardware', hardware)
    tip_length = 51.7
    tool = dc_main.CLITool(
        point_set=get_calibration_points(), tip_length=tip_length, loop=loop)

    assert tool.hardware is hardware
    # Move to all three calibration points
    expected_pts = tool._expected_points
    for pt in range(3):
        point = pt + 1
        tool.validate(expected_pts[point], point, tool._current_mount)
        assert np.isclose(
            tool._position(), expected_pts[point]).all()


def test_tip_probe(mock_config, async_server):
    # Test that tip probe returns successfully
    hardware = async_server['com.opentrons.hardware']
    version = async_server['api_version']
    tip_length = 51.7  # p300/p50 tip length
    if version == 2:
        mount = Mount.RIGHT
    else:
        mount = 'right'
    output = dc_main.probe(tip_length, hardware, mount)
    assert output == 'Tip probe'


@pytest.mark.skipif(
    sys.platform.startswith("win"), reason="Incompatible with Windows")
@pytest.mark.api1_only
def test_mount_offset(mock_config, loop, monkeypatch, async_server):
    # Check that mount offset gives the expected output when position is
    # slightly changed
    hardware = async_server['com.opentrons.hardware']

    def fake_position(something):
        return [11.13, 8, 51.7]

    monkeypatch.setattr(
        dc_main.CLITool, 'hardware', hardware)

    monkeypatch.setattr(
        hardware, 'config', mock_config)
    tip_length = 51.7
    tool = dc_main.CLITool(
        point_set=get_calibration_points(), tip_length=tip_length, loop=loop)

    monkeypatch.setattr(
        dc_main.CLITool, '_position', fake_position)
    expected_offset = (1.0, 1.0, 0.0)

    tool.save_mount_offset()
    assert expected_offset == tool.hardware.config.mount_offset

    hardware.reset()


@pytest.mark.skipif(
    sys.platform.startswith("win"), reason="Incompatible with Windows")
@pytest.mark.api1_only
def test_gantry_matrix_output(mock_config, loop, async_server, monkeypatch):
    # Check that the robot moves to the correct locations
    # TODO: Make tests for both APIs
    hardware = async_server['com.opentrons.hardware']

    monkeypatch.setattr(
        dc_main.CLITool, 'hardware', hardware)

    monkeypatch.setattr(
        hardware, 'config', mock_config)
    tip_length = 51.7
    tool = dc_main.CLITool(
        point_set=get_calibration_points(), tip_length=tip_length, loop=loop)

    expected = [
        [1.00, 0.00, 0.00,  0.00],
        [0.00, 0.99852725, 0.00,  0.5132547],
        [0.00, 0.00, 1.00,  0.00],
        [0.00, 0.00, 0.00,  1.00]]

    actual_points = {
        1: (12.13, 9.5),
        2: (380.87, 9.5),
        3: (12.13, 348.5)}
    monkeypatch.setattr(
        dc_main.CLITool, 'actual_points', actual_points)

    assert tool.actual_points == actual_points

    tool.save_transform()
    assert np.allclose(expected, tool.current_transform)

    hardware.reset()
