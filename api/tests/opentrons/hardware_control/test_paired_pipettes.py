from unittest import mock

from opentrons import hardware_control as hc
from opentrons.hardware_control.types import PipettePair, Axis
from opentrons import types


async def test_move_z_axis(hardware_api, monkeypatch):
    mock_be_move = mock.Mock()
    monkeypatch.setattr(hardware_api._backend, 'move', mock_be_move)
    mount = PipettePair.PRIMARY_RIGHT
    await hardware_api.home()
    await hardware_api.move_to(mount,
                               types.Point(0, 0, 0))
    expected = {'X': 0.0, 'Y': 0.0, 'A': 0.0, 'Z': 0.0}
    assert mock_be_move.call_args_list[0][0][0] == expected
    mock_be_move.reset_mock()

    mount = PipettePair.PRIMARY_LEFT
    await hardware_api.home()
    await hardware_api.move_to(mount,
                               types.Point(0, 0, 0))
    expected = {'X': 34.0, 'Y': 0.0, 'A': 0.0, 'Z': 0.0}
    assert mock_be_move.call_args_list[0][0][0] == expected


async def test_move_gantry(hardware_api, is_robot, toggle_new_calibration):
    abs_position = types.Point(30, 20, 10)
    mount = PipettePair.PRIMARY_RIGHT
    target_position1 = {Axis.X: 30,
                        Axis.Y: 20,
                        Axis.Z: 10,
                        Axis.A: 10,
                        Axis.B: 19,
                        Axis.C: 19}
    await hardware_api.home()
    await hardware_api.move_to(mount, abs_position)
    assert hardware_api._current_position == target_position1

    # Relative moves should also move both pipettes at the
    # same time in the z.
    rel_position = types.Point(30, 20, -10)
    mount2 = PipettePair.PRIMARY_LEFT
    target_position2 = {Axis.X: 60,
                        Axis.Y: 40,
                        Axis.Z: 0,
                        Axis.A: 0,
                        Axis.B: 19,
                        Axis.C: 19}
    await hardware_api.move_rel(mount2, rel_position)
    assert hardware_api._current_position == target_position2


async def test_move_currents(smoothie, monkeypatch, loop):
    smoothie.simulating = False
    hardware_api = await hc.API.build_hardware_controller(loop=loop)
    mock_active_axes = mock.Mock()
    monkeypatch.setattr(
        hardware_api._backend._smoothie_driver,
        'activate_axes',
        mock_active_axes)

    mount = PipettePair.PRIMARY_RIGHT
    await hardware_api.home()
    mock_active_axes.reset_mock()
    await hardware_api.move_to(mount,
                               types.Point(0, 0, 0))
    expected_call_list = [mock.call('XYAZ')]
    assert mock_active_axes.call_args_list == expected_call_list
