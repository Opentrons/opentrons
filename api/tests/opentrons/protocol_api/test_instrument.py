""" Test the InstrumentContext class and its functions """
import pytest
import opentrons.protocol_api as papi
from opentrons.types import Mount


@pytest.fixture
def _instr_labware(loop):
    ctx = papi.ProtocolContext(loop)
    lw1 = ctx.load_labware('biorad_96_wellplate_200ul_pcr', 1)
    lw2 = ctx.load_labware('corning_96_wellplate_360ul_flat', 2)
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 3)
    tiprack2 = ctx.load_labware('opentrons_96_tiprack_300ul', 4)
    instr = ctx.load_instrument('p300_single', Mount.RIGHT,
                                tip_racks=[tiprack])
    instr_multi = ctx.load_instrument(
        'p300_multi', Mount.LEFT, tip_racks=[tiprack2])

    return {'ctx': ctx, 'instr': instr, 'lw1': lw1, 'lw2': lw2,
            'tiprack': tiprack, 'instr_multi': instr_multi}


def test_blowout_location_invalid(_instr_labware):
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    instr = _instr_labware['instr']
    with pytest.raises(ValueError, match='blowout location should be either'):
        instr.transfer(
            100,
            lw1['A1'],
            lw1['A2'],
            blowout_location='foo nonsense')


def test_source_blowout_location_invalid_for_consolidate(_instr_labware):
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    instr = _instr_labware['instr']
    with pytest.raises(ValueError, match='blowout location for ' +
                       'consolidate cannot be'):
        instr.consolidate(
            100,
            [lw1['A1'], lw1['B1']],
            lw1['A2'],
            blow_out=True,
            blowout_location='source well')


def test_dest_blowout_location_invalid_for_distribute(_instr_labware):
    _instr_labware['ctx'].home()
    lw1 = _instr_labware['lw1']
    instr = _instr_labware['instr']
    with pytest.raises(ValueError, match='blowout location for ' +
                       'distribute cannot be'):
        instr.distribute(
            100,
            lw1['A2'],
            [lw1['A1'], lw1['B1']],
            blow_out=True,
            blowout_location='destination well')
