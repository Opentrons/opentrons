from opentrons import protocol_api
from opentrons.protocol_api import COLUMN, ALL

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.18",
}


def run(ctx: protocol_api.ProtocolContext):

    tiprack1000_1 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B2")
    tiprack1000_2 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "C2")

    pipette = ctx.load_instrument("flex_96channel_1000", mount="left", tip_racks=[tiprack1000_1, tiprack1000_2])

    trashA3 = ctx.load_trash_bin("A3")

    pipette.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tiprack1000_1, tiprack1000_2])

    # pickup and drop all 12 columns of the first tiprack and the first column of the second tiprack using Column A12 of the pipette (Should progress across the tiprack left to right)
    for x in range(13):
        pipette.pick_up_tip()
        pipette.drop_tip()

    pipette.configure_nozzle_layout(style=COLUMN, start="A1", tip_racks=[tiprack1000_1, tiprack1000_2])
    # pickup and drop the remaining 11 columns of the second tiprack using column A1 of the pipette (should progress right to left)
    for x in range(11):
        pipette.pick_up_tip()
        pipette.drop_tip()
