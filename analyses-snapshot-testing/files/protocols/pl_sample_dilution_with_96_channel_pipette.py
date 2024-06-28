# flake8: noqa

from opentrons import protocol_api
from opentrons.protocol_api import COLUMN


metadata = {
    "ctx.Name": "microBioID Protocol",
    "author": "Rami Farawi <rami.farawi@opentrons.com",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.16"}


def run(ctx: protocol_api.ProtocolContext):

    # DECK SETUP AND LABWARE

    temp_mod = ctx.load_module("temperature module gen2", "D1")
    temp_adapter = temp_mod.load_adapter("opentrons_96_well_aluminum_block")
    source_plate = temp_adapter.load_labware("biorad_96_wellplate_200ul_pcr")
    dest_plate = ctx.load_labware("biorad_96_wellplate_200ul_pcr", "D3")

    res = ctx.load_labware("agilent_1_reservoir_290ml", "C2")

    tiprack_adapter = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "A1", adapter="opentrons_flex_96_tiprack_adapter")

    trash = ctx.load_trash_bin("A3")

    # LOAD PIPETTES
    pip = ctx.load_instrument("flex_96channel_1000", "left", tip_racks=[tiprack_adapter])

    samples_liq = ctx.define_liquid(
        name="Samples",
        description="Samples",
        display_color="#7EFF42",
    )

    for well in source_plate.wells():
        well.load_liquid(liquid=samples_liq, volume=200)

    water_liq = ctx.define_liquid(
        name="Water",
        description="Water",
        display_color="#50D5FF",
    )

    res.wells()[0].load_liquid(liquid=water_liq, volume=200)

    #
    #
    #
    # num_col = 4
    # dict = {
    #         1: "A12",
    #         2: "A11",
    #         3: "A10",
    #         4: "A9",
    #         5: "A8",
    #         6: "A7",
    #         7: "A6",
    #         8: "A5",
    #         9: "A4",
    #         10: "A3",
    #         11: "A2",
    #         12: "A1"
    # }
    #
    # pip.configure_nozzle_layout(
    #     style=COLUMN,
    #     start=dict[num_col],
    #     tip_racks=[tiprack_direct]
    # )

    # if num_col < 12:
    #     pip.pick_up_tip()
    #     pip.aspirate(40, res['A1'].bottom(z=1.5), rate=0.4)
    #     pip.dispense(40, dest_plate['A1'].top(z=-2))
    #     pip.blow_out()
    #     pip.aspirate(40, source_plate['A1'].bottom(z=-3.8), rate=0.1)
    #     pip.dispense(40, dest_plate['A1'].top(z=-2))
    #     pip.mix(4, 50, dest_plate['A1'].bottom(z=2.3), rate=0.3)
    #     pip.blow_out(dest_plate['A1'].top(z=-1))
    #     pip.drop_tip()

    # else:
    pip.pick_up_tip()
    pip.aspirate(40, res["A1"].bottom(z=1.5), rate=0.4)
    pip.dispense(40, dest_plate["A1"].top(z=-2))
    pip.blow_out()
    pip.aspirate(40, source_plate["A1"].bottom(z=-3.8), rate=0.1)
    pip.dispense(40, dest_plate["A1"].top(z=-2))
    pip.mix(4, 50, dest_plate["A1"].bottom(z=2.3), rate=0.3)
    pip.blow_out(dest_plate["A1"].top(z=-1))
    pip.drop_tip()
