from opentrons.protocol_api import COLUMN, ALL
from opentrons.protocol_api._nozzle_layout import NozzleLayout

requirements = {"robotType": "Flex", "apiLevel": "2.16"}


def run(ctx):
    tip_rack2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "C3")
    instrument = ctx.load_instrument("flex_96channel_1000", mount="left")

    my_pcr_plate = ctx.load_labware("nest_96_wellplate_200ul_flat", "C2")
    my_other_plate = ctx.load_labware("nest_96_wellplate_200ul_flat", "C1")

    ctx.load_trash_bin("A3")

    instrument.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tip_rack2])

    instrument.pick_up_tip()
    instrument.aspirate(50, my_pcr_plate.wells_by_name()["A4"])
    instrument.dispense(20, my_other_plate.wells_by_name()["A2"])
    instrument.drop_tip()
