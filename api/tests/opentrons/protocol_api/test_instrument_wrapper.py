from unittest import mock

import pytest

# import opentrons.protocol_api as papi
from numpy import add, subtract, isclose
# from opentrons.legacy_api.containers import unpack_location, Placeable
from opentrons.legacy_api.containers.placeable import Placeable
from opentrons.protocol_api.legacy_wrapper.containers_wrapper import LegacyWell


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


@pytest.mark.parametrize('volume,loc,rate', [
    (10, 0, 1.0),
    (10, None, 1.0),
    (None, 0, 1.0),
    (None, None, 1.0),
    (10, 0, 1000.0),
    (10, 0, None)])
@pytest.mark.api2_only
def test_aspirate_locations(
        monkeypatch, instruments, labware, load_v1_instrument,
        volume, loc, rate):
    robot, legacy_instr, legacy_lw = load_v1_instrument

    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])
    lw = labware.load('corning_96_wellplate_360ul_flat', '2')

    instruments._robot_wrapper.home()

    legacy_move_to, move_to = get_v1_v2_mock_calls(
        monkeypatch, legacy_instr, pip, 'move_to')
    # import pdb; pdb.set_trace()
    hw_aspirate = mock.Mock()
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
        legacy_call[kw] = legacy_lw.wells(loc)
        new_call[kw] = lw.wells(loc)
    if rate is not None:
        legacy_call['rate'] = rate
        new_call['rate'] = rate

    pip._set_plunger_max_speed_override(10)

    legacy_instr.aspirate(**legacy_call)
    pip.aspirate(**new_call)
    
    max_speed = pip._clamp_to_max_plunger_speed(
        pip.speeds['aspirate'] * 1000, 'aspirate rate')
    max_rate = max_speed / pip.speeds['aspirate']

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


@pytest.mark.api2_only
def test_dispense_locations(
        monkeypatch, instruments, labware, load_v1_instrument):
    robot, legacy_instr, legacy_lw = load_v1_instrument

    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])
    lw = labware.load('corning_96_wellplate_360ul_flat', '2')

    instruments._robot_wrapper.home()

    legacy_move_to, move_to = get_v1_v2_mock_calls(
        monkeypatch, legacy_instr, pip, 'move_to')

    legacy_instr.dispense(legacy_lw.wells(1))
    pip.dispense(lw.wells(1))

    assert pip.current_volume == 0
    assert len(legacy_move_to.call_args_list) == len(move_to.call_args_list)
    for expected_call, call in zip(
            legacy_move_to.call_args_list, move_to.call_args_list):
        expected_args, _ = expected_call
        call_args, _ = call
        assert all(isclose(list(expected_args[0][1]), list(call_args[0][1])))


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
