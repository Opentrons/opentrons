from unittest import mock

import pytest

# import opentrons.protocol_api as papi
from numpy import add, subtract, isclose
# from opentrons.legacy_api.containers import unpack_location, Placeable
from opentrons.legacy_api.containers.placeable import Placeable
from opentrons.protocol_api.legacy_wrapper.containers_wrapper import LegacyWell
from opentrons import types


@pytest.fixture
def load_v1_instrument(virtual_smoothie_env):
    from opentrons.legacy_api import api
    robot = api.robot
    robot.connect()
    robot.reset()

    instr = api.InstrumentsWrapper(robot)
    lw = api.ContainersWrapper(robot)

    legacy_tr = lw.load('opentrons_96_tiprack_10ul', '1')
    legacy_instr = instr.P10_Single(mount='left', tip_racks=[legacy_tr])
    legacy_lw = lw.load('corning_96_wellplate_360ul_flat', '2')
    return robot, legacy_instr, legacy_lw


# @pytest.mark.api2_only
# def test_pick_up_tip(instruments, labware):
#     lw = labware.load('opentrons_96_tiprack_10ul', '1')
#     pip = instruments.P10_Single(mount='left')
#
#     instruments._robot_wrapper.home()
#
#     pip.pick_up_tip(lw.wells(0))
#     assert pip.has_tip
#     assert pip.current_tip() == lw.wells(0)


def get_v1_v2_mock_calls(monkeypatch, v1_api, v2_api, function):
    v1 = mock.Mock()
    v2 = mock.Mock()
    monkeypatch.setattr(v1_api, function, v1)
    monkeypatch.setattr(v2_api, function, v2)
    return v1, v2


def convert_to_deck_coordinates(robot, location, version):
    from opentrons.legacy_api import containers
    from opentrons.trackers import pose_tracker

    placeable, coordinates = containers.unpack_location(location)
    if version == 1:
        offset = subtract(coordinates, placeable.top()[1])
    else:
        offset = subtract(coordinates, placeable.top())
    print("OFFSET")
    print(offset)
    return add(pose_tracker.absolute(robot.poses, placeable),
               offset.coordinates)


@pytest.mark.parametrize('volume,loc,pos,rate', [
    (10, 0, None, 1.0),
    (10, None, None, 1.0),
    (None, 0, None, 1.0),
    (None, None, None, 1.0),
    (10, 0, None, 1000.0),
    (10, 0, None, None),
    (10, 0, 'top', 1.0)])
@pytest.mark.api2_only
def test_aspirate_locations(
        loop, monkeypatch, instruments, labware, load_v1_instrument,
        volume, loc, pos, rate):
    robot, legacy_instr, legacy_lw = load_v1_instrument

    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])
    lw = labware.load('corning_96_wellplate_360ul_flat', '2')

    instruments._robot_wrapper.home()

    legacy_move_to, move_to = get_v1_v2_mock_calls(
        monkeypatch, legacy_instr, pip, 'move_to')

    hw_aspirate_effect = pip._hw._api.aspirate

    def run_aspirate(*args, **kwargs):
        return loop.run_until_complete(hw_aspirate_effect(*args, **kwargs))

    hw_aspirate = mock.Mock()
    hw_aspirate.side_effect = run_aspirate
    monkeypatch.setattr(pip._hw._api, 'aspirate', hw_aspirate)

    legacy_call = {}
    new_call = {}
    if volume is not None:
        legacy_call['volume'] = volume
        new_call['volume'] = volume
    if loc is not None:
        if volume is None:
            kw = 'volume'
        else:
            kw = 'location'
        if pos is not None:
            legacy_call[kw] = getattr(legacy_lw.wells(loc), pos)()
            new_call[kw] = getattr(lw.wells(loc), pos)()
        else:
            legacy_call[kw] = legacy_lw.wells(loc)
            new_call[kw] = lw.wells(loc)

    if rate is not None:
        legacy_call['rate'] = rate
        new_call['rate'] = rate

    pip._set_plunger_max_speed_override(10)
    max_speed = pip._clamp_to_max_plunger_speed(
        pip.speeds['aspirate'] * 1000, 'aspirate rate')
    max_rate = max_speed / pip.speeds['aspirate']

    legacy_instr.aspirate(**legacy_call)
    pip.aspirate(**new_call)

    assert pip.current_volume == volume or pip.max_volume
    assert len(legacy_move_to.call_args_list) == len(move_to.call_args_list)
    for expected_call, call in zip(
            legacy_move_to.call_args_list, move_to.call_args_list):
        expected_args, expected_kwargs = expected_call
        call_args, call_kwargs = call
        assert all(isclose(list(expected_args[0][1]), list(call_args[0][1])))
        assert expected_kwargs == call_kwargs
    hw_aspirate.assert_called_once_with(
        pip._mount,
        volume if volume is not None else 10,
        min(max_rate, rate or 1.0))


@pytest.mark.parametrize('volume,loc,pos,rate', [
    (10, 0, None, 1.0),
    (10, None, None, 1.0),
    (None, 0, None, 1.0),
    (None, None, None, 1.0),
    (10, 0, None, 1000.0),
    (10, 0, None, None),
    (10, 0, 'top', 1.0)])
@pytest.mark.api2_only
def test_dispense_locations(
        loop, monkeypatch, instruments, labware, load_v1_instrument,
        volume, loc, pos, rate):

    robot, legacy_instr, legacy_lw = load_v1_instrument

    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])
    lw = labware.load('corning_96_wellplate_360ul_flat', '2')

    instruments._robot_wrapper.home()

    pip._set_plunger_max_speed_override(10)
    max_speed = pip._clamp_to_max_plunger_speed(
        pip.speeds['dispense'] * 1000, 'dispense rate')
    max_rate = max_speed / pip.speeds['dispense']

    legacy_instr.aspirate(10, legacy_lw.wells(1))
    pip.aspirate(10, lw.wells(1))

    legacy_move_to, move_to = get_v1_v2_mock_calls(
        monkeypatch, legacy_instr, pip, 'move_to')

    hw_dispense_effect = pip._hw._api.dispense

    def run_dispense(*args, **kwargs):
        return loop.run_until_complete(hw_dispense_effect(*args, **kwargs))

    hw_dispense = mock.Mock()
    hw_dispense.side_effect = run_dispense
    monkeypatch.setattr(pip._hw._api, 'dispense', hw_dispense)

    legacy_call = {}
    new_call = {}
    if volume is not None:
        legacy_call['volume'] = volume
        new_call['volume'] = volume
    if loc is not None:
        if volume is None:
            kw = 'volume'
        else:
            kw = 'location'
        if pos is not None:
            legacy_call[kw] = getattr(legacy_lw.wells(loc), pos)()
            new_call[kw] = getattr(lw.wells(loc), pos)()
        else:
            legacy_call[kw] = legacy_lw.wells(loc)
            new_call[kw] = lw.wells(loc)
    if rate is not None:
        legacy_call['rate'] = rate
        new_call['rate'] = rate

    legacy_instr.dispense(**legacy_call)
    pip.dispense(**new_call)

    assert pip.current_volume == 0
    assert len(legacy_move_to.call_args_list) == len(move_to.call_args_list)
    for expected_call, call in zip(
            legacy_move_to.call_args_list, move_to.call_args_list):

        expected_args, _ = expected_call
        call_args, _ = call
        assert all(isclose(list(expected_args[0][1]), list(call_args[0][1])))
    hw_dispense.assert_called_once_with(
        pip._mount,
        volume if volume is not None else 10,
        min(max_rate, rate or 1.0))


def convert_well_to_name(item):
    if isinstance(item, Placeable) or isinstance(item, LegacyWell):
        return item.get_name()
    else:
        return item


@pytest.mark.parametrize('reps,volume,loc', [
    (1, 10, 0),
    (1, None, 0),
    (1, 10, None),
    (None, None, None),
    (5, 10, 0),
    (5, None, 0),
    (5, 10, None)])
@pytest.mark.api2_only
def test_mix_locations(monkeypatch, instruments, labware, load_v1_instrument,
                       reps, volume, loc):
    robot, legacy_instr, legacy_lw = load_v1_instrument
    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])
    lw = labware.load('corning_96_wellplate_360ul_flat', '2')

    instruments._robot_wrapper.home()

    legacy_aspirate, aspirate = get_v1_v2_mock_calls(
        monkeypatch, legacy_instr, pip, 'aspirate')

    legacy_dispense, dispense = get_v1_v2_mock_calls(
        monkeypatch, legacy_instr, pip, 'dispense')

    legacy_call = {}
    new_call = {}
    if reps is not None:
        legacy_call['repetitions'] = reps
        new_call['repetitions'] = reps
    if volume is not None:
        legacy_call['volume'] = volume
        new_call['volume'] = volume
    if loc is not None:
        if volume is None:
            kw = 'volume'
        else:
            kw = 'location'
        legacy_call[kw] = legacy_lw.wells(loc)
        new_call[kw] = lw.wells(loc)

    legacy_instr.mix(**legacy_call)
    pip.mix(**new_call)

    assert len(legacy_aspirate.call_args_list) == len(aspirate.call_args_list)

    _, legacy_kwargs = legacy_aspirate.call_args_list[0]
    _, call_kwargs = aspirate.call_args_list[0]
    legacy_aspirate_args_1 = {k: convert_well_to_name(v)
                              for k, v in legacy_kwargs.items()}
    aspirate_args_1 = {k: convert_well_to_name(v)
                       for k, v in call_kwargs.items()}
    assert legacy_aspirate_args_1 == aspirate_args_1

    for expected_call, call in zip(
            legacy_aspirate.call_args_list[1:], aspirate.call_args_list[1:]):
        expected_args, expected_kwargs = expected_call
        call_args, call_kwargs = call
        if expected_args:
            assert len(expected_args) == len(call_args)
            assert expected_args[0] == call_args[0]
        assert expected_kwargs == call_kwargs

    assert len(legacy_dispense.call_args_list) == len(dispense.call_args_list)
    for expected_call, call in zip(
            legacy_dispense.call_args_list, dispense.call_args_list):
        expected_args, _ = expected_call
        call_args, _ = call
        if expected_args:
            assert len(expected_args) == len(call_args)
            assert expected_args[0] == call_args[0]


@pytest.mark.api2_only
def test_move_to(monkeypatch, instruments, labware, load_v1_instrument):
    robot, legacy_instr, legacy_lw = load_v1_instrument
    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])
    lw = labware.load('corning_96_wellplate_360ul_flat', '2')

    instruments._robot_wrapper.home()
    robot.home()

    new_actual_move = pip._ctx._hw_manager.hardware._api._backend.move

    def new_passthru(*args, **kwargs):
        new_actual_move(*args, **kwargs)
    new_move = mock.Mock()
    new_move.side_effect = new_passthru
    monkeypatch.setattr(
        pip._ctx._hw_manager.hardware._api._backend, 'move', new_move)

    legacy_actual_move = robot._driver.move

    def legacy_passthru(*args, **kwargs):
        legacy_actual_move(*args, **kwargs)
    legacy_move = mock.Mock()
    legacy_move.side_effect = legacy_passthru
    monkeypatch.setattr(robot._driver, 'move', legacy_move)

    def _get_common_axes(legacy_axes, new_axes):
        # API.move_to doesn't supply axis commands that haven't changed, so
        # we have to check only the common axes.
        common_axes = set(legacy_axes.keys())\
            .intersection(set(new_axes.keys()))
        common_lpos = {k: v
                       for k, v in legacy_axes.items()
                       if k in common_axes}
        common_npos = {k: v
                       for k, v in new_axes.items()
                       if k in common_axes}
        return common_lpos, common_npos

    # home position -> well should be three moves

    legacy_instr.move_to(legacy_lw['A1'].top())
    pip.move_to(lw['A1'].top())
    assert len(new_move.call_args_list) == 3
    assert len(legacy_move.call_args_list) == len(new_move.call_args_list)
    for legacy_call, new_call in zip(
            legacy_move.call_args_list, new_move.call_args_list):
        largs, lkwargs = legacy_call
        nargs, nkwargs = new_call
        common_lpos, common_npos = _get_common_axes(largs[0], nargs[0])
        assert common_lpos == common_npos

    legacy_move.reset_mock()
    new_move.reset_mock()

    # well -> higher in the well should be one move

    old_pos = pip._ctx._hw_manager.hardware.gantry_position(types.Mount.LEFT)
    legacy_instr.move_to(legacy_lw['A1'].top(z=10))
    pip.move_to(lw['A1'].top(z=10))
    new_pos = pip._ctx._hw_manager.hardware.gantry_position(types.Mount.LEFT)
    assert old_pos[:2] == new_pos[:2]

    assert len(new_move.call_args_list) == 1
    # the robot always calls driver.move separately for xy and for z, even if
    # one of those doesn't have motion. the gantry_position assertions above
    # make sure we're not being too generous, and that the x and y in fact
    # should not be moving
    fused_move = legacy_move.call_args_list[0][0][0]
    fused_move.update(legacy_move.call_args_list[1][0][0])
    common_lpos, common_npos = _get_common_axes(fused_move,
                                                new_move.call_args[0][0])
    assert common_lpos == common_npos

    # same deal when using a well alone (should go to top, should be direct,
    # robot singleton still calls move() twice)

    new_move.reset_mock()
    legacy_move.reset_mock()

    old_pos = pip._ctx._hw_manager.hardware.gantry_position(types.Mount.LEFT)
    legacy_instr.move_to(legacy_lw['A1'])
    pip.move_to(lw['A1'])
    new_pos = pip._ctx._hw_manager.hardware.gantry_position(types.Mount.LEFT)
    assert old_pos[:2] == new_pos[:2]

    fused_move = legacy_move.call_args_list[0][0][0]
    fused_move.update(legacy_move.call_args_list[1][0][0])
    common_lpos, common_npos = _get_common_axes(fused_move,
                                                new_move.call_args[0][0])
    assert common_lpos == common_npos
