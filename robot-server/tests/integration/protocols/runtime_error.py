from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.6"}


def run(ctx: ProtocolContext) -> None:
    tip_rack = ctx.load_labware("opentrons_96_tiprack_300ul", 1)
    pipette = ctx.load_instrument("p300_single", "right", [tip_rack])
    pipette.aspirate(location=tip_rack.wells()[0], volume=100)
