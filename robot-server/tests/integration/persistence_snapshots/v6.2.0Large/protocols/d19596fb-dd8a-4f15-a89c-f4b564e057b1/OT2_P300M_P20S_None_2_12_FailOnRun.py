from opentrons import protocol_api

metadata = {
    "protocolName": "Will fail on run",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
    "description": ("A single comment"),
    "apiLevel": "2.12",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""

    # 300ul tips
    tips_300ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_300ul",
            location="1",
            label="300ul tips",
        )
    ]

    # 20ul tips
    tips_20ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_20ul",
            location="2",
            label="20ul tips",
        )
    ]

    # pipettes
    pipette_right = ctx.load_instrument(
        instrument_name="p20_single_gen2", mount="right", tip_racks=tips_20ul
    )

    pipette_left = ctx.load_instrument(
        instrument_name="p300_multi_gen2", mount="left", tip_racks=tips_300ul
    )

    dye_container = ctx.load_labware(
        load_name="nest_12_reservoir_15ml",
        location="3",
        label="dye container",
    )

    dye2_source = dye_container.wells_by_name()["A5"]

    ctx.comment("one comment")

    if not ctx.is_simulating():
        pipette_right.pick_up_tip()
        pipette_right.aspirate(
            volume=40,  # the failure, max volume is 20
            location=dye2_source,
        )
