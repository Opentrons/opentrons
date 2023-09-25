"""Photometric OT3 P50."""
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "photometric-ot3-p50-multi"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

SLOTS_TIPRACK = {50: [3]}
SLOT_PLATE = 2
SLOT_RESERVOIR = 5

RESERVOIR_LABWARE = "nest_12_reservoir_15ml"
PHOTOPLATE_LABWARE = "corning_96_wellplate_360ul_flat"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tipracks = [
        # FIXME: use official tip-racks once available
        ctx.load_labware(f"opentrons_flex_96_tiprack_{size}uL", slot)
        for size, slots in SLOTS_TIPRACK.items()
        for slot in slots
    ]
    reservoir = ctx.load_labware(RESERVOIR_LABWARE, SLOT_RESERVOIR)
    plate = ctx.load_labware(PHOTOPLATE_LABWARE, SLOT_PLATE)
    pipette = ctx.load_instrument("flex_8channel_50", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.aspirate(10, reservoir["A1"].top())
        pipette.dispense(10, plate["A1"].top())
        pipette.drop_tip(home_after=False)
