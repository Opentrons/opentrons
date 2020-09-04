import pytest

import opentrons.protocol_api as papi
from opentrons.types import Mount, Point

def set_up_paired_instrument(loop):
    ctx = papi.ProtocolContext(loop)
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 1)
    tiprack2 = ctx.load_labware('opentrons_96_tiprack_300ul', 2)
    tiprack3 = ctx.load_labware('opentrons_96_tiprack_300ul', 2)
    right = ctx.load_instrument(
        'p300_multi', Mount.RIGHT, tip_racks=[tiprack, tiprack2])
    left = ctx.load_instrument(
        'p300_multi', Mount.LEFT, tip_racks=[tiprack2, tiprack3])

    return right.pair_with(left)

def test_pick_up_and_drop_tip_with_tipracks(set_up_paired_instrument):
    paired = set_up_paired_instrument
    paired.pick_up_tip()

def test_pick_up_and_drop_tip_no_tipracks(loop):
    ctx = papi.ProtocolContext(loop)
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 1)
    right = ctx.load_instrument('p300_multi', Mount.RIGHT)
    left = ctx.load_instrument('p300_multi', Mount.LEFT)

    paired = right.pair_with(left)
    r_pip: Pipette = ctx._hw_manager.hardware._attached_instruments[Mount.RIGHT]
    model_offset = Point(*r_pip.config.model_offset)
    assert r_pip.critical_point() == model_offset
    target_location = tiprack['A1'].top()

    paired.pick_up_tip(target_location)
    assert not tiprack.wells()[0].has_tip
    overlap = instr.hw_pipette['tip_overlap'][tiprack.uri]
    new_offset = model_offset - Point(0, 0,
                                      tip_length-overlap)
    assert r_pip.critical_point() == new_offset
    assert r_pip.has_tip


def test_return_tip(set_up_paired_instrument):
    paired = set_up_paired_instrument
    paired.pick_up_tip()
    paired.return_tip()