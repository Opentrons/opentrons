from opentrons import types

metadata = {
    'protocolName': 'Testosaur (custom labware)',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A variant on "Dinosaur" for testing custom labware',
    'source': 'Opentrons Repository',
    'apiLevel': '2.0'
}


def run(ctx):
    ctx.home()
    tr = ctx.load_labware('opentrons_96_tiprack_300ul', 1)
    right = ctx.load_instrument('p300_single_gen2', types.Mount.RIGHT, [tr])
    lw = ctx.load_labware('fixture_96_plate', 2, namespace='fixture')
    right.pick_up_tip()
    right.aspirate(10, lw.wells()[0].bottom())
    right.dispense(10, lw.wells()[1].bottom())
    right.drop_tip(tr.wells()[-1].top())
