# flake8: noqa
from opentrons import types

# Pulled from reporting bug https://github.com/Opentrons/opentrons/issues/8436

# Note that any apiLevel value passed to metadata will be ignored.
# Instead apiVersions from g-code-testing/g_code_test_data/protocol/protocol_configurations.py # noqa: E501
# will be used instead
metadata = {
    "protocolName": "Set Max Speeds",
    "author": "Derek Maggio",
    "apiLevel": "2.0",
}


def run(ctx):
    ctx.home()
    reagent_dwp = ctx.load_labware(
        'corning_384_wellplate_112ul_flat', 2, 'Reagent Deep Well')
    tiprack_1 = ctx.load_labware(
        'opentrons_96_tiprack_300ul', 5, '300 tiprack')
    pipette = ctx.load_instrument(
        "p300_multi_gen2", "right", tip_racks=[tiprack_1])
    pipette.pick_up_tip()
    ctx.max_speeds['Z'] = 18
    pipette.aspirate(10, reagent_dwp['A1'])
