from opentrons.protocol_api import ProtocolContext

requirements = {"apiLevel": "2.16", "robotType": "Flex"}


def run(ctx: ProtocolContext) -> None:
    tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1")
    plate = ctx.load_labware("biorad_96_wellplate_200ul_pcr", "A2")
    pipette = ctx.load_instrument("flex_1channel_1000", "right", [tip_rack])
    pipette.aspirate(location=plate.wells()[0], volume=100)
