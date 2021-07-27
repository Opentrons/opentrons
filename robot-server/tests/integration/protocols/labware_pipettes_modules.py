metadata = {
    "protocolName": "Extraction",
    "author": "Opentrons <protocols@opentrons.com>",
    "apiLevel": "2.4",
}


def run(ctx):
    magdeck = ctx.load_module("magnetic module gen2", "6")
    magdeck.load_labware("nest_96_wellplate_2ml_deep", "deepwell plate")
    tempdeck = ctx.load_module("Temperature Module Gen2", "1")
    tempdeck.load_labware(
        "opentrons_96_aluminumblock_nest_wellplate_100ul", "elution plate"
    )
    ctx.load_labware("nest_1_reservoir_195ml", "9", "Liquid Waste")
    ctx.load_labware("nest_12_reservoir_15ml", "3", "reagent reservoir 2")
    ctx.load_labware("nest_12_reservoir_15ml", "2", "reagent reservoir 1")
    [
        ctx.load_labware("opentrons_96_tiprack_300ul", slot, "200µl filtertiprack")
        for slot in ["4", "7", "8", "10", "11"]
    ]
    ctx.load_labware("opentrons_96_tiprack_300ul", "5", "tiprack for parking")
    ctx.load_instrument("p300_multi_gen2", "left")
    ctx.load_instrument("p20_single_gen2", "right")
