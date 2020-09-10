import pytest

import opentrons.protocol_api as papi
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
    paired.return_tip()
    assert not tiprack.wells()[0].has_tip
