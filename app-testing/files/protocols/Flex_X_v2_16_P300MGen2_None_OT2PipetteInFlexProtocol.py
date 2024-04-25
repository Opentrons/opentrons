from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Analysis Error - OT-2 Pipette in Flex Protocol",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    tips_300ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_300ul",
            location="A1",
            label="300ul tips",
        )
    ]
    pipette_left = ctx.load_instrument(instrument_name="p300_multi_gen2", mount="left", tip_racks=tips_300ul)
    pipette_left.pick_up_tip()
