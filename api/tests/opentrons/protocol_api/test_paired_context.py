import pytest

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


def test_aspirate(set_up_paired_instrument):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx
    lw = ctx.load_labware('corning_96_wellplate_360ul_flat', 4)

    fake_hw_aspirate = mock.Mock()
    fake_move = mock.Mock()
    monkeypatch.setattr(API, 'aspirate', fake_hw_aspirate)
    monkeypatch.setattr(API, 'move_to', fake_move)

    instr.pick_up_tip()
    instr.aspirate(2.0, lw.wells()[0].bottom())

    fake_hw_aspirate.assert_called_once_with(Mount.RIGHT, 2.0, 1.0)
    assert fake_move.call_args_list[-1] ==\
        mock.call(Mount.RIGHT, lw.wells()[0].bottom().point,
                  critical_point=None, speed=400, max_speeds={})
    fake_move.reset_mock()
    fake_hw_aspirate.reset_mock()
    instr.well_bottom_clearance.aspirate = 1.0
    instr.aspirate(2.0, lw.wells()[0])
    dest_point, dest_lw = lw.wells()[0].bottom()
    dest_point = dest_point._replace(z=dest_point.z + 1.0)
    assert len(fake_move.call_args_list) == 1
    assert fake_move.call_args_list[0] ==\
        mock.call(
            Mount.RIGHT, dest_point, critical_point=None, speed=400,
            max_speeds={})
    fake_move.reset_mock()
    ctx._hw_manager.hardware._obj_to_adapt\
                            ._attached_instruments[Mount.RIGHT]\
                            ._current_volume = 1

    instr.aspirate(2.0)
    fake_move.assert_not_called()

    instr.blow_out()
    fake_move.reset_mock()
    instr.aspirate(2.0)
    assert len(fake_move.call_args_list) == 2
    # reset plunger at the top of the well after blowout
    assert fake_move.call_args_list[0] ==\
        mock.call(
            Mount.RIGHT, dest_lw.top().point, critical_point=None,
            speed=400, max_speeds={})
    assert fake_move.call_args_list[1] ==\
        mock.call(
            Mount.RIGHT, dest_point, critical_point=None,
            speed=400, max_speeds={})


def test_dispense(set_up_paired_instrument):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx
    lw = ctx.load_labware('corning_96_wellplate_360ul_flat', 1)

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

    instr.dispense(2.0, lw.wells()[0].bottom())
    assert 'dispensing' in ','.join([cmd.lower() for cmd in ctx.commands()])
    assert disp_called_with == (Mount.RIGHT, 2.0, 1.0)
    assert move_called_with == (Mount.RIGHT, lw.wells()[0].bottom().point,
                                {'critical_point': None,
                                 'speed': 400,
                                 'max_speeds': {}})

    instr.well_bottom_clearance.dispense = 2.0
    instr.dispense(2.0, lw.wells()[0])
    dest_point, dest_lw = lw.wells()[0].bottom()
    dest_point = dest_point._replace(z=dest_point.z + 2.0)
    assert move_called_with == (Mount.RIGHT, dest_point,
                                {'critical_point': None,
                                 'speed': 400,
                                 'max_speeds': {}})

    move_called_with = None
    instr.dispense(2.0)
    assert move_called_with is None


def test_mix(set_up_paired_instrument, monkeypatch):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx
    lw = ctx.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 4)


    instr.pick_up_tip()
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

    monkeypatch.setattr(instr, 'aspirate', fake_aspirate)
    monkeypatch.setattr(instr, 'dispense', fake_dispense)

    repetitions = 2
    volume = 5
    location = lw.wells()[0]
    rate = 2
    instr.mix(repetitions, volume, location, rate)
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
    instr.pick_up_tip()
    instr.aspirate(10, lw.wells()[0])

    def fake_move(loc):
        nonlocal move_location
        move_location = loc

    monkeypatch.setattr(instr, 'move_to', fake_move)

    instr.blow_out()
    # pipette should not move, if no location is passed
    assert move_location is None

    instr.aspirate(10)
    instr.blow_out(lw.wells()[0])
    # pipette should blow out at the top of the well as default
    assert move_location == lw.wells()[0].top()

    instr.aspirate(10)
    instr.blow_out(lw.wells()[0].bottom())
    # pipette should blow out at the location defined
    assert move_location == lw.wells()[0].bottom()


def test_air_gap(set_up_paired_instrument):
    paired, _ = set_up_paired_instrument
    ctx = paired.paired_instrument_obj._ctx
    lw = ctx.load_labware(
        'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 4)
