from unittest import mock

import pytest

# import opentrons.protocol_api as papi
from numpy import add, subtract, isclose
# from opentrons.legacy_api.containers import unpack_location, Placeable
from opentrons.legacy_api.containers.placeable import Placeable
from opentrons.protocol_api.legacy_wrapper.containers_wrapper import LegacyWell
from opentrons import types

PIPETTES = [
    'P1000_Single',
    'P1000_Single_GEN2',
    'P300_Single',
    'P300_Single_GEN2',
    'P300_Multi',
    'P300_Multi_GEN2',
    'P50_Single',
    'P50_Multi',
    'P20_Single_GEN2',
    'P20_Multi_GEN2',
    'P10_Single',
    'P10_Multi']

TIPRACKS = {
    'P1000_Single': 'opentrons_96_tiprack_1000ul',
    'P1000_Single_GEN2': 'opentrons_96_tiprack_1000ul',
    'P300_Single': 'opentrons_96_tiprack_300ul',
    'P300_Single_GEN2': 'opentrons_96_tiprack_300ul',
    'P300_Multi': 'opentrons_96_tiprack_300ul',
    'P300_Multi_GEN2': 'opentrons_96_tiprack_300ul',
    'P50_Single': 'opentrons_96_tiprack_300ul',
    'P50_Multi': 'opentrons_96_tiprack_300ul',
    'P20_Single_GEN2': 'opentrons_96_tiprack_20ul',
    'P20_Multi_GEN2': 'opentrons_96_tiprack_20ul',
    'P10_Single': 'opentrons_96_tiprack_10ul',
    'P10_Multi': 'opentrons_96_tiprack_10ul'
}


def bind_parameters_to_instruments(additional_args):
    """ If you have a test you want to parametrize with some args, and
    also you want to parametrize it across all the instrument constructors,
    call this with your args and it will add all the instruments. For instance,

    bind_parameters_to_instruments([(None, 1), (2, None)]) -> [
    ('P1000_Single', None, 1),
    ('P1000_Single'), 2, None),
    ('P1000_Single_GEN2'), None, 1),
    ('P1000_Single_GEN2'), 2, None),
    ...]
    """
    params = []
    for pipname in PIPETTES:
        for arg in additional_args:
            params.append((pipname, *arg))
    return params


@pytest.fixture
def load_bc_instrument(robot, instruments, labware, request):
    try:
        which = request.node.getfixturevalue('instrument_ctor')
    except Exception:
        which = 'P10_Single'

    try:
        tr_name = request.node.getfixturevalue('tiprack_name')
    except Exception:
        tr_name = TIPRACKS[which]

    legacy_tr = labware.load(tr_name, '1')
    legacy_instr = getattr(instruments, which)(
        mount='left', tip_racks=[legacy_tr])
    legacy_lw = labware.load('corning_96_wellplate_360ul_flat', '2')
    return robot, legacy_instr, legacy_lw


@pytest.fixture
def load_v1_instrument(virtual_smoothie_env, request):
    from opentrons.legacy_api import api
    robot = api.robot
    robot.connect()
    robot.reset()
    try:
        which = request.node.getfixturevalue('instrument_ctor')
    except Exception:
        which = 'P10_Single'

    try:
        tr_name = request.node.getfixturevalue('tiprack_name')
    except Exception:
        tr_name = TIPRACKS[which]

    instr = api.InstrumentsWrapper(robot)
    lw = api.ContainersWrapper(robot)

    legacy_tr = lw.load(tr_name, '1')
    legacy_instr = getattr(instr, which)(mount='left', tip_racks=[legacy_tr])
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


def get_common_axes(legacy_axes, new_axes):
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

    # home position -> well should be three moves

    legacy_instr.move_to(legacy_lw['A1'].top())
    pip.move_to(lw['A1'].top())
    assert len(new_move.call_args_list) == 3
    assert len(legacy_move.call_args_list) == len(new_move.call_args_list)
    for legacy_call, new_call in zip(
            legacy_move.call_args_list, new_move.call_args_list):
        largs, lkwargs = legacy_call
        nargs, nkwargs = new_call
        common_lpos, common_npos = get_common_axes(largs[0], nargs[0])
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
    common_lpos, common_npos = get_common_axes(fused_move,
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
    common_lpos, common_npos = get_common_axes(fused_move,
                                               new_move.call_args[0][0])
    assert common_lpos == common_npos


def split_new_moves(call_list):
    split_moves = []
    for call in call_list:
        split_moves.append({k: v for k, v in call[0][0].items() if k in 'XY'})
        split_moves.append({'Z': call[0][0]['Z']})
    return split_moves


@pytest.mark.parametrize('loc,presses,increment', [
    (None, None, None),
    (1, None, None),
    (None, 1, None),
    (None, None, 1)])
@pytest.mark.api2_only
def test_pick_up_tip(
        loop, monkeypatch, instruments, labware, load_v1_instrument,
        loc, presses, increment):
    robot, legacy_instr, legacy_lw = load_v1_instrument
    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])

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

    legacy_tr = legacy_instr.tip_racks[0]

    legacy_kwargs = {}
    new_kwargs = {}
    if loc is not None:
        legacy_kwargs['location'] = legacy_tr.wells(loc)
        new_kwargs['location'] = tr.wells(loc)
    if presses is not None:
        legacy_kwargs['presses'] = presses
        new_kwargs['presses'] = presses
    if increment is not None:
        legacy_kwargs['increment'] = increment
        new_kwargs['increment'] = increment

    legacy_instr.pick_up_tip(**legacy_kwargs)
    pip.pick_up_tip(**new_kwargs)

    # check move to tip
    # ignore moving the pluger to the bottom first
    legacy_call_args = legacy_move.call_args_list[1:4]
    new_call_args = new_move.call_args_list[:3]
    for legacy_call, new_call in zip(
            legacy_call_args, new_call_args):
        largs, lkwargs = legacy_call
        nargs, nkwargs = new_call
        common_lpos, common_npos = get_common_axes(largs[0], nargs[0])
        assert common_lpos == common_npos

    # check move to bottom
    legacy_move_to_b_args = legacy_move.call_args_list[0]
    new_move_to_b_args = new_move.call_args_list[3]
    common_lpos, common_npos = get_common_axes(legacy_move_to_b_args[0][0],
                                               new_move_to_b_args[0][0])
    assert common_lpos == common_npos

    # check pick up tip
    legacy_pick_up_args = legacy_move.call_args_list[4:-1]
    new_pick_up_args = new_move.call_args_list[4:]
    new_moves = split_new_moves(new_pick_up_args)
    legacy_moves = [call[0][0] for call in legacy_pick_up_args]
    assert new_moves == legacy_moves


@pytest.mark.parametrize('loc,home_after', [  # noqa(C901)
    (None, None),
    (None, False),
    (0, None),
    (0, False)
    ])
@pytest.mark.api2_only
def test_drop_tip(
        loop, monkeypatch, instruments, labware, load_v1_instrument,
        loc, home_after):
    robot, legacy_instr, legacy_lw = load_v1_instrument
    tr = labware.load('opentrons_96_tiprack_10ul', '1')
    pip = instruments.P10_Single(mount='left', tip_racks=[tr])

    instruments._robot_wrapper.home()
    robot.home()

    legacy_instr.pick_up_tip()
    pip.pick_up_tip()

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

    legacy_tr = legacy_instr.tip_racks[0]
    legacy_kwargs = {}
    new_kwargs = {}
    if loc is not None:
        legacy_kwargs['location'] = legacy_tr.wells(loc)
        new_kwargs['location'] = tr.wells(loc)
    if home_after is not None:
        legacy_kwargs['home_after'] = home_after
        new_kwargs['home_after'] = home_after

    legacy_instr.drop_tip(**legacy_kwargs)
    pip.drop_tip(**new_kwargs)

    if loc is None:
        # check retract pipette
        assert legacy_move.call_args_list[0][0][0]['Z'] == \
            new_move.call_args_list[0][0][0]['Z']

        # check trash location
        for legacy_call, new_call in zip(legacy_move.call_args_list[1:3],
                                         new_move.call_args_list[1:3]):
            common_lpos, common_npos = get_common_axes(legacy_call[0][0],
                                                       new_call[0][0])
            assert common_lpos == common_npos

        # check drop actual tip
        assert legacy_move.call_args_list[4][0][0]['B'] == \
            new_move.call_args_list[4][0][0]['B']

        # check recovery action
        if home_after is not None:
            legacy_calls = legacy_move.call_args_list[5:]
            new_calls = new_move.call_args_list[5:]
        else:
            legacy_calls = legacy_move.call_args_list[6:]
            new_calls = new_move.call_args_list[5:]
        for legacy_call, new_call in zip(legacy_calls, new_calls):
            common_lpos, common_npos = get_common_axes(legacy_call[0][0],
                                                       new_call[0][0])
            assert common_lpos == common_npos
    else:
        legacy_move.call_args_list = legacy_move.call_args_list[1:]
        new_move.call_args_list = new_move.call_args_list

        # check return tip location
        for legacy_call, new_call in zip(legacy_move.call_args_list[:2],
                                         new_move.call_args_list[:2]):
            common_lpos, common_npos = get_common_axes(legacy_call[0][0],
                                                       new_call[0][0])
            assert common_lpos == common_npos

        # check drop actual tip
        assert legacy_move.call_args_list[3][0][0]['B'] == \
            new_move.call_args_list[2][0][0]['B']

        # check recovery action
        if home_after is not None:
            legacy_calls = legacy_move.call_args_list[4:]
            new_calls = new_move.call_args_list[3:]
        else:
            legacy_calls = legacy_move.call_args_list[5:]
            new_calls = new_move.call_args_list[3:]
        for legacy_call, new_call in zip(legacy_calls, new_calls):
            common_lpos, common_npos = get_common_axes(legacy_call[0][0],
                                                       new_call[0][0])
            assert common_lpos == common_npos


def mock_atomics(instr, monkeypatch):
    top_mock = mock.Mock()
    monkeypatch.setattr(instr, 'aspirate', top_mock.aspirate)
    monkeypatch.setattr(instr, 'dispense', top_mock.dispense)
    monkeypatch.setattr(instr, 'air_gap', top_mock.air_gap)
    monkeypatch.setattr(instr, 'blow_out', top_mock.blow_out)
    monkeypatch.setattr(instr, 'pick_up_tip', top_mock.pick_up_tip)
    monkeypatch.setattr(instr, 'drop_tip', top_mock.drop_tip)
    monkeypatch.setattr(instr, 'return_tip', top_mock.return_tip)
    return instr, top_mock


def method_names(call_list):
    return [
        str(call).split('(')[0] for call in call_list
    ]


@pytest.mark.parametrize(
    'instrument_ctor',
    [
        ('P1000_Single',),
        ('P1000_Single_GEN2',),
        ('P300_Single',),
        ('P300_Single_GEN2',),
        ('P300_Multi',),
        ('P300_Multi_GEN2',),
        ('P50_Single',),
        ('P50_Multi',),
        ('P20_Single_GEN2',),
        ('P20_Multi_GEN2',),
        ('P10_Single',),
        ('P10_Multi',),
    ]
)
@pytest.mark.api2_only
def test_basic_transfer(
        monkeypatch, instruments, labware, load_v1_instrument,
        load_bc_instrument,
        instrument_ctor):
    robot, legacy_instr, legacy_lw = load_v1_instrument
    new_robot, new_instr, new_lw = load_bc_instrument
    legacy_instr, legacy_mock = mock_atomics(legacy_instr, monkeypatch)
    new_instr, new_mock = mock_atomics(new_instr, monkeypatch)

    legacy_instr.transfer(legacy_instr.max_volume / 2,
                          legacy_lw.well('A1'),
                          legacy_lw.well('A2'))
    new_instr.transfer(new_instr.max_volume / 2,
                       new_lw.well('A1'),
                       new_lw.well('A2'))
    assert method_names(new_mock.method_calls)\
        == method_names(legacy_mock.method_calls)

    legacy_instr.transfer(legacy_instr.max_volume / 2,
                          legacy_lw[:16],
                          legacy_lw[16:32])
    new_instr.transfer(new_instr.max_volume / 2,
                       new_lw[:16],
                       new_lw[16:32])
    assert method_names(new_mock.method_calls)\
        == method_names(legacy_mock.method_calls)

    legacy_instr.transfer(legacy_instr.max_volume * 2,
                          legacy_lw[:16],
                          legacy_lw[16:32])
    new_instr.transfer(new_instr.max_volume * 2,
                       new_lw[:16],
                       new_lw[16:32])
    assert method_names(new_mock.method_calls)\
        == method_names(legacy_mock.method_calls)

    legacy_instr.transfer(legacy_instr.max_volume,
                          legacy_lw[:16],
                          legacy_lw[16:32])
    new_instr.transfer(new_instr.max_volume,
                       new_lw[:16],
                       new_lw[16:32])
    assert method_names(new_mock.method_calls)\
        == method_names(legacy_mock.method_calls)
