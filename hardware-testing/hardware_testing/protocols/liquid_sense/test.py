from opentrons.protocol_api import ProtocolContext
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

metadata = {
    "name": "lc + lld test"
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23"
}

assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]


def run(ctx: ProtocolContext):
    ctx.load_trash_bin('A3')

    # PIPETTES
    p50s = ctx.load_instrument("flex_1channel_50", "left", tip_racks=[
        ctx.load_labware("opentrons_flex_96_tiprack_50ul", "A1")
    ])
    p1000m = ctx.load_instrument("flex_8channel_1000", "right", tip_racks=[
        ctx.load_labware("opentrons_flex_96_tiprack_200ul", "A2")
    ])

    # LABWARE
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "B1")
    deep_well = ctx.load_labware("nest_96_wellplate_2ml_deep", "B2")
    pcr_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "B3")
    photo_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "C1")
    # load-empty
    reservoir.load_empty(reservoir.wells())
    deep_well.load_empty(deep_well.wells())
    pcr_plate.load_empty(pcr_plate.wells())
    photo_plate.load_empty(photo_plate.wells())

    # LIQUID
    water = ctx.define_liquid("water", "water", "#0000FF")
    reservoir.load_liquid([reservoir["A1"]], 3000 + (199 * 8 * 6), water)  # 12,552 ul
    reservoir.load_liquid([reservoir["A2"]], 3000 + (199 * 8 * 6), water)  # 12,552 ul
    deep_well.load_liquid([deep_well["A2"]], 385.2, water)

    # LIQUID CLASS
    water_class = ctx.define_liquid_class("water")
    tc_p50s = water_class.get_for(p50s, p50s.tip_racks[0])
    tc_p1000m = water_class.get_for(p1000m, p1000m.tip_racks[0])
    # position-reference
    tc_p50s.aspirate.position_reference = "liquid-meniscus"
    tc_p50s.dispense.position_reference = "liquid-meniscus"
    tc_p1000m.aspirate.position_reference = "liquid-meniscus"
    tc_p1000m.dispense.position_reference = "liquid-meniscus"
    # offset.z
    tc_p50s.aspirate.offset.z = -1.5
    tc_p50s.dispense.offset.z = 2.0
    tc_p1000m.aspirate.offset.z = -1.5
    tc_p1000m.dispense.offset.z = 2.0

    # transfer 199 ul
    # from wells [A1, A2] in the 12-row reservoir
    # to all wells in photo-plate
    p1000m.transfer_liquid(
        liquid_class=water_class,
        volume=199,
        source=[reservoir[w] for w in ["A1", "A2"] for _ in range(6)],
        dest=photo_plate.columns(),
        new_tip="once",
    )

    # transfer 62 ul
    # from well [A2] in the 96-deep-well
    # to the first column of the pcr-plate
    p50s.transfer_liquid(
        liquid_class=water_class,
        volume=50 + 12,
        source=[deep_well["A2"]] * 8,
        dest=pcr_plate.columns()[0],
        new_tip="once",
    )

    # transfer 1 ul
    # from well [A1] in the pcr-plate
    # to the first row of the photo-plate
    p50s.transfer_liquid(
        liquid_class=water_class,
        volume=1,
        source=[pcr_plate["A1"]] * 12,
        dest=photo_plate.rows()[0],
        new_tip="always",
    )
