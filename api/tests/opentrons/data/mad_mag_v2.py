from opentrons import types

metadata = {
    'protocolName': 'Mad Mag',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A Magnetic Module Test',
    'source': 'Opentrons Repository',
    'apiLevel': '2.2'
}


def run(ctx):
    ctx.home()
    tr = ctx.load_labware('opentrons_96_tiprack_300ul', 1)
    mm = ctx.load_module('magnetic module', 4)
    lw = mm.load_labware('nest_96_wellplate_100ul_pcr_fullskirt')
    right = ctx.load_instrument('p300_single_gen2', types.Mount.RIGHT, [tr])

    mm.disengage()

    right.transfer(30, lw.wells()[0].bottom(1), lw.wells()[1].bottom(1))

    mm.engage()
    mm.disengage()

    mm.engage(height=30)
    mm.disenage()

    mm.engage(offset=-10)
    mm.disengage()

    mm.engage(height_from_base=15)
    mm.disengage()
