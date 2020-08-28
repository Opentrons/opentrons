import pytest
from unittest import mock

from opentrons import hardware_control as hc
from opentrons.hardware_control.types import PipettePair, Axis
from opentrons import types


@pytest.fixture
def dummy_instruments():
    dummy_instruments_attached = {
        types.Mount.LEFT: {
            'model': 'p300_single_v2.0',
            'id': 'fake',
            'name': 'p300_single_gen2'
        },
        types.Mount.RIGHT: {
            'model': 'p20_single_v2.0',
            'id': 'fake2',
            'name': 'p20_single_gen2',
        }
    }
    return dummy_instruments_attached


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


async def test_pick_up_tip(
        dummy_instruments, loop, is_robot, toggle_new_calibration):
    hw_api = await hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    mount = PipettePair.PRIMARY_RIGHT
    await hw_api.home()
    await hw_api.cache_instruments()
    tip_position = types.Point(12.13, 9, 150)
    target_position = {Axis.X: 12.13,
                       Axis.Y: 9.0,
                       Axis.Z: 218.0,     # Z retracts after pick_up
                       Axis.A: 218.0,
                       Axis.B: -14.5,
                       Axis.C: -8.5}
    await hw_api.move_to(mount, tip_position)

    # Note: pick_up_tip without a tip_length argument requires the pipette on
    # the associated mount to have an assoc=iated tip rack from which to infer
    # the tip length. That behavior is not tested here.
    tip_length = 25.0
    await hw_api.pick_up_tip(mount, tip_length)
    assert hw_api._attached_instruments[mount.primary].has_tip
    assert hw_api._attached_instruments[mount.primary].current_volume == 0
    second = mount.secondary
    assert hw_api._attached_instruments[second].has_tip
    assert hw_api._attached_instruments[second].current_volume == 0
    assert hw_api._current_position == target_position


async def test_drop_tip(
        dummy_instruments, loop, is_robot, toggle_new_calibration):
    hw_api = await hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    mount = PipettePair.PRIMARY_RIGHT
    await hw_api.home()
    await hw_api.cache_instruments()
    tip_position = types.Point(12.13, 9, 150)

    await hw_api.move_to(mount, tip_position)

    tip_length = 25.0
    await hw_api.pick_up_tip(mount, tip_length)
    await hw_api.drop_tip(mount)
    assert not hw_api._attached_instruments[mount.primary].has_tip
    assert hw_api._attached_instruments[mount.primary].current_volume == 0
    assert not hw_api._attached_instruments[mount.secondary].has_tip
    assert hw_api._attached_instruments[mount.secondary].current_volume == 0


async def test_prep_aspirate(
        dummy_instruments, loop, toggle_new_calibration):
    hw_api = await hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = PipettePair.PRIMARY_RIGHT
    await hw_api.pick_up_tip(mount, 20.0)

    # If we're empty and haven't prepared, we should get an error
    with pytest.raises(RuntimeError):
        await hw_api.aspirate(mount, 1, 1.0)
    # If we're empty and have prepared, we should be fine
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, 1)
    # If we're not empty, we should be fine
    await hw_api.aspirate(mount, 1)


async def test_aspirate_new(dummy_instruments, loop):
    hw_api = await hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = PipettePair.PRIMARY_RIGHT
    await hw_api.pick_up_tip(mount, 20.0)

    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)
    plunger_left = -14.142003
    plunger_right = -4.2254

    pos = hw_api._current_position
    assert pos[Axis.B] == plunger_left
    assert pos[Axis.C] == plunger_right


async def test_aspirate_old(dummy_instruments, loop, old_aspiration):
    hw_api = await hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.home()
    await hw_api.cache_instruments()

    mount = PipettePair.PRIMARY_RIGHT
    await hw_api.pick_up_tip(mount, 20.0)

    aspirate_ul = 3.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)
    plunger_left = -14.142003
    plunger_right = -4.2254

    pos = hw_api._current_position
    assert pos[Axis.B] == plunger_left
    assert pos[Axis.C] == plunger_right


async def test_dispense(dummy_instruments, loop):
    hw_api = await hc.API.build_hardware_simulator(
        attached_instruments=dummy_instruments, loop=loop)
    await hw_api.home()

    await hw_api.cache_instruments()

    mount = PipettePair.PRIMARY_RIGHT
    await hw_api.pick_up_tip(mount, 20.0)

    aspirate_ul = 10.0
    aspirate_rate = 2
    await hw_api.prepare_for_aspirate(mount)
    await hw_api.aspirate(mount, aspirate_ul, aspirate_rate)

    dispense_1 = 3.0
    await hw_api.dispense(mount, dispense_1)
    plunger_left_1 = -13.67942
    plunger_right_1 = 1.062058

    pos1 = hw_api._current_position
    assert pos1[Axis.B] == plunger_left_1
    assert pos1[Axis.C] == plunger_right_1

    await hw_api.dispense(mount, rate=2)
    plunger_left_2 = -14.5
    plunger_right_2 = -8.5
    pos2 = hw_api._current_position
    assert pos2[Axis.B] == plunger_left_2
    assert pos2[Axis.C] == plunger_right_2


async def test_tip_action_currents(
        dummy_instruments, smoothie, monkeypatch, loop):
    smoothie.simulating = False
    hardware_api = await hc.API.build_hardware_controller(loop=loop)
    mock_active_current = mock.Mock()
    monkeypatch.setattr(
        hardware_api._backend._smoothie_driver,
        'set_active_current',
        mock_active_current)

    def fake_attached(stuff):
        return dummy_instruments
    monkeypatch.setattr(
        hardware_api._backend, 'get_attached_instruments', fake_attached)

    mount = PipettePair.PRIMARY_RIGHT
    await hardware_api.home()
    await hardware_api.cache_instruments()
    mock_active_current.reset_mock()

    tip_length = 25.0
    await hardware_api.pick_up_tip(mount, tip_length)

    expected_call_list = [
        mock.call({'C': 1.0, 'B': 1.0}),
        mock.call({'A': 0.1, 'Z': 0.125}),
        mock.call({
            'X': 1.25, 'Y': 1.25, 'Z': 0.8,
            'A': 0.8, 'B': 0.05, 'C': 0.05})]
    assert mock_active_current.call_args_list == expected_call_list
    mock_active_current.reset_mock()

    await hardware_api.drop_tip(mount)

    expected_call_list = [
        mock.call({'C': 1.0, 'B': 1.0}),
        mock.call({'C': 1.0, 'B': 1.25}),
        mock.call({'C': 1.0, 'B': 1.0}),
        mock.call({'C': 1.0, 'B': 1.0})]
    assert mock_active_current.call_args_list == expected_call_list
