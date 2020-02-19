import copy
import pytest
import sys
import numpy as np
try:
    import aionotify
except OSError:
    aionotify = None  # type: ignore
from opentrons.config import (CONFIG,
                              robot_configs,
                              advanced_settings as advs)
from opentrons.types import Mount
from opentrons.deck_calibration import dc_main
from opentrons.deck_calibration.dc_main import get_calibration_points
from opentrons.deck_calibration import expected_points


@pytest.fixture
def model1():
    return 'p300_single_v1.4', 'p300_single'


@pytest.fixture
def model2():
    return 'p300_single_v2.0', 'p300_single_gen2'


@pytest.fixture
def hw_with_pipettes(monkeypatch, sync_hardware, model1, model2):
    if model1:
        def fake_gai(expected):
            return {
                Mount.LEFT: {
                    'model': model1[0],
                    'id': 'fakeid'},
                Mount.RIGHT: {
                    'model': model1[0],
                    'id': 'fakeid2'}}
        monkeypatch.setattr(
            sync_hardware._api._backend,
            'get_attached_instruments',
            fake_gai)
    elif model2:

        def fake_gai(expected):
            return {
                Mount.LEFT: {'model': model2[0], 'id': 'fakeid'},
                Mount.RIGHT: {'model': model2[0], 'id': 'fakeid2'}}

        monkeypatch.setattr(
            sync_hardware._api._backend,
            'get_attached_instruments',
            fake_gai)

    yield sync_hardware


async def test_clear_config(mock_config, sync_hardware):
    # Clear should happen automatically after the following import, resetting
    # the robot config to the default value from robot_configs
    from opentrons.deck_calibration import dc_main
    dc_main.clear_configuration_and_reload(sync_hardware)

    config = sync_hardware.config
    assert config == robot_configs.build_config({}, {})


@pytest.mark.skipif(aionotify is None,
                    reason="requires inotify (linux only)")
def test_save_and_clear_config(mock_config, sync_hardware, loop):
    # Clear should happen automatically after the following import, resetting
    # the deck cal to the default value
    hardware = sync_hardware
    from opentrons.deck_calibration import dc_main
    import os

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


def test_new_deck_points():
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
def test_move_output(mock_config, loop, monkeypatch, hw_with_pipettes):
    # Check that the robot moves to the correct locations
    tool = dc_main.CLITool(
        get_calibration_points(), hw_with_pipettes, loop=loop)

    assert tool.hardware is hw_with_pipettes
    # Move to all three calibration points
    expected_pts = tool._expected_points
    for pt in range(3):
        point = pt + 1
        tool.validate(expected_pts[point], point, tool._current_mount)
        assert np.isclose(
            tool._position(), expected_pts[point]).all()


@pytest.mark.skipif(
    sys.platform.startswith("win"), reason="Incompatible with Windows")
@pytest.mark.model2
def test_tip_probe(mock_config, loop, monkeypatch, hw_with_pipettes):
    # Test that tip probe returns successfully

    hw_with_pipettes.home()
    tool = dc_main.CLITool(
        get_calibration_points(), hw_with_pipettes, loop=loop)

    assert tool.hardware is hw_with_pipettes
    point_after = (10, 10, 10)
    output = tool.probe(point_after)
    assert output == 'Tip probe'


@pytest.mark.skipif(
    sys.platform.startswith("win"), reason="Incompatible with Windows")
@pytest.mark.model1
def test_mount_offset(mock_config, hw_with_pipettes, loop, monkeypatch):
    # Check that mount offset gives the expected output when position is
    # slightly changed

    def fake_position(something):
        return [-22.87, 8, 0]
    monkeypatch.setattr(
        hw_with_pipettes._api, '_config', mock_config)

    hw_with_pipettes.home()
    tool = dc_main.CLITool(
        get_calibration_points(), hw_with_pipettes, loop=loop)

    monkeypatch.setattr(
        dc_main.CLITool, '_position', fake_position)
    expected_offset = (1.0, 1.0, 0.0)
    tool.save_mount_offset()
    assert expected_offset == tool.hardware.config.mount_offset


@pytest.mark.skipif(
    sys.platform.startswith("win"), reason="Incompatible with Windows")
@pytest.mark.model1
def test_gantry_matrix_output(
        mock_config, hw_with_pipettes, loop, monkeypatch):
    # Check that the robot moves to the correct locations

    monkeypatch.setattr(hw_with_pipettes, 'config', mock_config)
    hw_with_pipettes.home()
    tool = dc_main.CLITool(
        get_calibration_points(), hw_with_pipettes, loop=loop)

    expected = [
        [1.00, 0.00, 0.00, 0.00],
        [0.00, 0.99852725, 0.00, 0.5132547],
        [0.00, 0.00, 1.00, 0.00],
        [0.00, 0.00, 0.00, 1.00]]

    actual_points = {
        1: (12.13, 9.5),
        2: (380.87, 9.5),
        3: (12.13, 348.5)}
    monkeypatch.setattr(
        dc_main.CLITool, 'actual_points', actual_points)

    assert tool.actual_points == actual_points

    tool.save_transform()
    assert np.allclose(expected, tool.current_transform)


@pytest.mark.skipif(
    sys.platform.startswith("win"), reason="Incompatible with Windows")
@pytest.mark.model2
def test_try_pickup_tip(
        mock_config, hw_with_pipettes, monkeypatch, loop):
    # Check that the robot moves to the correct locations

    hw_with_pipettes.home()
    monkeypatch.setattr(
        hw_with_pipettes._api, '_config', mock_config)

    tool = dc_main.CLITool(
        get_calibration_points(),
        hw_with_pipettes,
        loop=loop)
    output = tool.try_pickup_tip()
    assert output == 'Picked up tip!'
