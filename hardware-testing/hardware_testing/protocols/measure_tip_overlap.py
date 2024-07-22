"""Measure Tip Overlap."""
from opentrons.protocol_api import ProtocolContext, OFF_DECK

metadata = {"protocolName": "measure-tip-overlap"}
requirements = {"robotType": "Flex", "apiLevel": "2.18"}

TIP_SIZE = 50
PIPETTE_SIZE = 50
PIPETTE_CHANNELS = 1

SLOT_DIAL = 9
SLOT_TIPRACK = 3


def run(ctx: ProtocolContext) -> None:
    """Run."""
    pip_name = f"flex_{PIPETTE_CHANNELS}channel_{PIPETTE_SIZE}"
    rack_name = f"opentrons_flex_96_tiprack_{TIP_SIZE}uL"

    pipette = ctx.load_instrument(pip_name, "left")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)

    # TODO: make this work for 8ch and 96ch
    #       only measure tip-overlap for sensor-channels only
    #       8ch = A1 and H1
    #       96ch = A1 and H12

    ctx.pause("ready to measure NOZZLE...")
    pipette.move_to(dial["A1"].top())
    ctx.pause("record dial position of NOZZLE")

    rack = ctx.load_labware(rack_name, SLOT_TIPRACK)
    for tip in rack:
        ctx.pause("ready to test next tip...")
        pipette.pick_up_tip(tip)
        pipette.move_to(dial["A1"].top())
        ctx.pause("record dial position of TIP")
        pipette.drop_tip(tip)
