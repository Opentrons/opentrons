import pytest
from unittest import mock

import opentrons.protocol_api as papi
from opentrons.hardware_control import API
from opentrons.types import Mount, Point
from opentrons.protocol_api import paired_instrument_context as pc
from opentrons.hardware_control.pipette import Pipette


@pytest.fixture
def set_up_paired_instrument(loop):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 1)
    tiprack2 = ctx.load_labware('opentrons_96_tiprack_300ul', 2)
    tiprack3 = ctx.load_labware('opentrons_96_tiprack_300ul', 3)
    right = ctx.load_instrument(
        'p300_multi', Mount.RIGHT, tip_racks=[tiprack, tiprack2])
    left = ctx.load_instrument(
        'p300_multi', Mount.LEFT, tip_racks=[tiprack2, tiprack3])

    return right.pair_with(left), [tiprack, tiprack2, tiprack3]


def test_pick_up_and_drop_tip_with_tipracks(set_up_paired_instrument):
    paired, tipracks = set_up_paired_instrument
    assert paired.tip_racks == [tipracks[1]]
    for col in tipracks[1].columns()[0:4]:
        for well in col:
            second_well = paired._get_secondary_target(tipracks[1], well)
            assert well.has_tip
            assert second_well.has_tip
        paired.pick_up_tip()
        paired.drop_tip()
        for well in col:
            second_well = paired._get_secondary_target(tipracks[1], well)
            assert not well.has_tip
            assert not second_well.has_tip


def test_incompatible_pickup_location(set_up_paired_instrument):
    paired, tipracks = set_up_paired_instrument
    with pytest.raises(pc.PipettePairPickUpTipError):
        paired.pick_up_tip(tipracks[2].columns_by_name()['12'][0])


def test_pick_up_and_drop_tip_no_tipracks(loop):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 1)
    tip_length = tiprack.tip_length
    right = ctx.load_instrument('p300_multi', Mount.RIGHT)
    left = ctx.load_instrument('p300_multi', Mount.LEFT)

    paired = right.pair_with(left)
    r_pip: Pipette =\
        ctx._hw_manager.hardware._attached_instruments[Mount.RIGHT]
    l_pip: Pipette =\
        ctx._hw_manager.hardware._attached_instruments[Mount.LEFT]
    model_offset = Point(*r_pip.config.model_offset)
    assert r_pip.critical_point() == model_offset
    assert l_pip.critical_point() == model_offset
    target_location = tiprack['A1'].top()

    paired.pick_up_tip(target_location)
    assert not tiprack.wells()[0].has_tip
    assert not tiprack.columns()[4][0].has_tip
    overlap = right.hw_pipette['tip_overlap'][tiprack.uri]
    new_offset = model_offset - Point(0, 0,
                                      tip_length-overlap)
    assert r_pip.critical_point() == new_offset
    assert l_pip.critical_point() == new_offset
    assert r_pip.has_tip
    assert l_pip.has_tip

    paired.drop_tip()
    assert not r_pip.has_tip
    assert not l_pip.has_tip


def test_return_tip(set_up_paired_instrument):
    paired, tipracks = set_up_paired_instrument
    paired.pick_up_tip()
    assert not tipracks[1].wells()[0].has_tip
    paired.return_tip()
    # At this point in time we are not returning
    # tips to the tiprack.
    assert not tipracks[1].wells()[0].has_tip


def test_aspirate(set_up_paired_instrument, monkeypatch):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx
    lw = ctx.load_labware('corning_96_wellplate_360ul_flat', 4)

    fake_hw_aspirate = mock.Mock()
    fake_move = mock.Mock()
    monkeypatch.setattr(API, 'aspirate', fake_hw_aspirate)
    monkeypatch.setattr(API, 'move_to', fake_move)

    paired.pick_up_tip()
    paired.aspirate(2.0, lw.wells()[0].bottom())

    fake_hw_aspirate.assert_called_once_with(
        paired._pair_policy, 2.0, 1.0)
    assert fake_move.call_args_list[-1] ==\
        mock.call(paired._pair_policy, lw.wells()[0].bottom().point,
                  critical_point=None, speed=400, max_speeds={})
    fake_move.reset_mock()
    fake_hw_aspirate.reset_mock()
    paired.well_bottom_clearance.aspirate = 1.0
    paired.aspirate(2.0, lw.wells()[0])
    dest_point, dest_lw = lw.wells()[0].bottom()
    dest_point = dest_point._replace(z=dest_point.z + 1.0)
    assert len(fake_move.call_args_list) == 1
    assert fake_move.call_args_list[0] ==\
        mock.call(
            paired._pair_policy, dest_point, critical_point=None,
            speed=400, max_speeds={})
    fake_move.reset_mock()
    ctx._hw_manager.hardware._obj_to_adapt\
                            ._attached_instruments[Mount.RIGHT]\
                            ._current_volume = 1

    paired.aspirate(2.0)
    fake_move.assert_not_called()

    paired.blow_out()
    fake_move.reset_mock()
    paired.aspirate(2.0)
    assert len(fake_move.call_args_list) == 2
    # reset plunger at the top of the well after blowout
    assert fake_move.call_args_list[0] ==\
        mock.call(
            paired._pair_policy, dest_lw.top().point,
            critical_point=None, speed=400, max_speeds={})
    assert fake_move.call_args_list[1] ==\
        mock.call(
            paired._pair_policy, dest_point, critical_point=None,
            speed=400, max_speeds={})


def test_dispense(set_up_paired_instrument, monkeypatch):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx
    lw = ctx.load_labware('corning_96_wellplate_360ul_flat', 4)

    disp_called_with = None

    async def fake_hw_dispense(self, mount, volume=None, rate=1.0):
        nonlocal disp_called_with
        disp_called_with = (mount, volume, rate)

    move_called_with = None

    def fake_move(self, mount, loc, **kwargs):
        nonlocal move_called_with
        move_called_with = (mount, loc, kwargs)

    monkeypatch.setattr(API, 'dispense', fake_hw_dispense)
    monkeypatch.setattr(API, 'move_to', fake_move)
    # paired.pick_up_tip()
    paired.dispense(2.0, lw.wells()[0].bottom())
    # assert disp_called_with == (paired._pair_policy, 2.0, 1.0)
    assert move_called_with == (paired._pair_policy,
                                lw.wells()[0].bottom().point,
                                {'critical_point': None,
                                 'speed': 400,
                                 'max_speeds': {}})

    paired.well_bottom_clearance.dispense = 2.0
    paired.dispense(2.0, lw.wells()[0])
    dest_point, dest_lw = lw.wells()[0].bottom()
    dest_point = dest_point._replace(z=dest_point.z + 2.0)
    assert move_called_with == (paired._pair_policy, dest_point,
                                {'critical_point': None,
                                 'speed': 400,
                                 'max_speeds': {}})

    move_called_with = None
    paired.dispense(2.0)
    assert move_called_with is None


def test_mix(set_up_paired_instrument, monkeypatch):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx
    lw = ctx.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 4)

    paired.pick_up_tip()
    mix_steps = []
    aspirate_called_with = None
    dispense_called_with = None

    def fake_aspirate(vol=None, loc=None, rate=None):
        nonlocal aspirate_called_with
        nonlocal mix_steps
        aspirate_called_with = ('aspirate', vol, loc, rate)
        mix_steps.append(aspirate_called_with)

    def fake_dispense(vol=None, loc=None, rate=None):
        nonlocal dispense_called_with
        nonlocal mix_steps
        dispense_called_with = ('dispense', vol, loc, rate)
        mix_steps.append(dispense_called_with)

    monkeypatch.setattr(paired, 'aspirate', fake_aspirate)
    monkeypatch.setattr(paired, 'dispense', fake_dispense)

    repetitions = 2
    volume = 5
    location = lw.wells()[0]
    rate = 2
    paired.mix(repetitions, volume, location, rate)
    expected_mix_steps = [('aspirate', volume, location, 2),
                          ('dispense', volume, None, 2),
                          ('aspirate', volume, None, 2),
                          ('dispense', volume, None, 2)]

    assert mix_steps == expected_mix_steps


def test_blow_out(set_up_paired_instrument, monkeypatch):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx
    lw = ctx.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 4)

    move_location = None
    paired.pick_up_tip()
    paired.aspirate(10, lw.wells()[0])

    def fake_move(loc):
        nonlocal move_location
        move_location = loc

    monkeypatch.setattr(paired.paired_instrument_obj, 'move_to', fake_move)

    paired.blow_out()
    # pipette should not move, if no location is passed
    assert move_location is None

    paired.aspirate(10)
    paired.blow_out(lw.wells()[0])
    # pipette should blow out at the top of the well as default
    assert move_location == lw.wells()[0].top()

    paired.aspirate(10)
    paired.blow_out(lw.wells()[0].bottom())
    # pipette should blow out at the location defined
    assert move_location == lw.wells()[0].bottom()


def test_air_gap(set_up_paired_instrument, monkeypatch):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx

    r_pip: Pipette =\
        ctx._hw_manager.hardware._attached_instruments[Mount.RIGHT]
    l_pip: Pipette =\
        ctx._hw_manager.hardware._attached_instruments[Mount.LEFT]

    paired.pick_up_tip()
    assert r_pip.current_volume == 0
    assert l_pip.current_volume == 0
    paired.air_gap(20)

    assert r_pip.current_volume == 20
    assert l_pip.current_volume == 20
    paired.air_gap()

    assert r_pip.current_volume == 300
    assert l_pip.current_volume == 300
    paired.dispense()
    paired.drop_tip()

    aspirate_mock = mock.Mock()
    monkeypatch.setattr(API, 'aspirate', aspirate_mock)

    paired.pick_up_tip()
    paired.air_gap(20)

    assert aspirate_mock.call_args_list ==\
        [mock.call(paired._pair_policy, 20, 1.0)]
    aspirate_mock.reset_mock()
    paired.air_gap()
    assert aspirate_mock.call_args_list ==\
        [mock.call(paired._pair_policy, None, 1.0)]


def test_touch_tip_new_default_args(loop, monkeypatch):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    lw = ctx.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 1)
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 3)
    right = ctx.load_instrument('p300_single', Mount.RIGHT,
                                tip_racks=[tiprack])
    left = ctx.load_instrument('p300_single', Mount.LEFT,
                               tip_racks=[tiprack])

    paired = left.pair_with(right)

    paired.pick_up_tip()
    total_hw_moves = []

    async def fake_hw_move(self, mount, abs_position, speed=None,
                           critical_point=None, max_speeds=None):
        nonlocal total_hw_moves
        total_hw_moves.append((abs_position, speed))

    paired.aspirate(10, lw.wells()[0])
    monkeypatch.setattr(API, 'move_to', fake_hw_move)
    paired.touch_tip()
    z_offset = Point(0, 0, 1)   # default z offset of 1mm
    speed = 60                  # default speed
    edges = [lw.wells()[0]._from_center_cartesian(1, 0, 1) - z_offset,
             lw.wells()[0]._from_center_cartesian(-1, 0, 1) - z_offset,
             lw.wells()[0]._from_center_cartesian(0, 0, 1) - z_offset,
             lw.wells()[0]._from_center_cartesian(0, 1, 1) - z_offset,
             lw.wells()[0]._from_center_cartesian(0, -1, 1) - z_offset]
    for i in range(1, 5):
        assert total_hw_moves[i] == (edges[i - 1], speed)

    # Check that the new api version initial well move has the same z height
    # as the calculated edges.
    total_hw_moves.clear()
    paired.touch_tip(v_offset=1)
    assert total_hw_moves[0][0].z == total_hw_moves[1][0].z


def test_touch_tip_disabled(loop, monkeypatch, get_labware_fixture):
    ctx = papi.ProtocolContext(loop)
    ctx.home()
    trough1 = get_labware_fixture('fixture_12_trough')
    trough_lw = ctx.load_labware_from_definition(trough1, '1')
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 3)
    right = ctx.load_instrument('p300_single', Mount.RIGHT,
                                tip_racks=[tiprack])
    left = ctx.load_instrument('p300_single', Mount.LEFT,
                               tip_racks=[tiprack])

    paired = left.pair_with(right)
    paired.pick_up_tip()
    move_mock = mock.Mock()
    monkeypatch.setattr(API, 'move_to', move_mock)
    paired.touch_tip(trough_lw['A1'])
    move_mock.assert_not_called()
