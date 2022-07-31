# flake8: noqa
from opentrons import types

# Note that any apiLevel value passed to metadata will be ignored.
# Instead apiVersions from g-code-testing/g_code_test_data/protocol/protocol_configurations.py # noqa: E501
# will be used instead
metadata = {
    "protocolName": "Smoothie Testing",
    "author": "Derek Maggio",
    "apiLevel": "2.0",
}


def run(ctx):
    ctx.home()
    tr = ctx.load_labware("opentrons_96_tiprack_300ul", 1)
    right = ctx.load_instrument("p20_single_gen2", types.Mount.RIGHT, [tr])
    lw = ctx.load_labware("corning_96_wellplate_360ul_flat", 2)
    right.pick_up_tip()
    right.aspirate(10, lw.wells()[0].bottom())
    right.dispense(10, lw.wells()[1].bottom())
    right.drop_tip(tr.wells()[-1].top())
