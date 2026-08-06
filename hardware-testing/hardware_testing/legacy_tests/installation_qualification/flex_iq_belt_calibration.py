"""Flex IQ: Belt Calibration."""
from opentrons.protocol_api import ProtocolContext


metadata = {"protocolName": "Flex IQ: Belt Calibration"}
requirements = {"robotType": "Flex", "apiLevel": "2.18"}


def run(ctx: ProtocolContext) -> None:
    """Run."""
    plate_a1 = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "A1")
    plate_d3 = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "D3")

    tips = ctx.load_labware("opentrons_flex_96_tiprack_50uL", "C2")
    pipette = ctx.load_instrument("flex_1channel_1000", "right", tip_racks=[tips])

    pipette.pick_up_tip()
    pipette.move_to(plate_a1["A1"].top())
    ctx.pause()
    pipette.move_to(plate_d3["H12"].top())
    ctx.pause()
    pipette.return_tip()
