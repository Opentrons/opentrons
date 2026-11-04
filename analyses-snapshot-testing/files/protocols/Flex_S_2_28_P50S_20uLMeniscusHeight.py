from opentrons import protocol_api

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}

metadata = {
    "protocolName": "P50 single 20µL meniscus height",
    "description": "measure_liquid_height; aspirate at meniscus.",
}


def run(ctx: protocol_api.ProtocolContext):
    ctx.load_waste_chute()

    tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_20ul", "C1")
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "C2")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D2")

    pipette = ctx.load_instrument("flex_1channel_50", "left", tip_racks=[tip_rack])

    ctx.comment("Measuring liquid height in reservoir A1, then aspirating at the meniscus...")

    source_well = reservoir["A1"]
    dest_well = plate["A5"]

    liquid_1 = ctx.define_liquid(name="liquid_1", display_color="#000000")
    source_well.load_liquid(liquid_1, volume=10000)

    pipette.pick_up_tip()
    pipette.measure_liquid_height(source_well)
    pipette.aspirate(volume=10, location=source_well.meniscus(z=-1))
    pipette.dispense(volume=10, location=dest_well)

    pipette.drop_tip()
