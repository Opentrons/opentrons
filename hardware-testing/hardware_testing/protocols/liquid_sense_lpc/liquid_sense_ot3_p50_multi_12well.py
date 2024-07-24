"""Liquid Sense OT3 P1000."""
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "liquid-sense-ot3-p50-multi"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

SLOT_SCALE = 1
SLOT_DIAL = 9
SLOTS_TIPRACK = {50: [3]}
LABWARE_ON_SCALE = "nest_12_reservoir_15ml"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    trash = ctx.load_trash_bin("A3")
    tipracks = [
        ctx.load_labware(f"opentrons_flex_96_tiprack_{size}uL", slot)
        for size, slots in SLOTS_TIPRACK.items()
        for slot in slots
    ]
    vial = ctx.load_labware(LABWARE_ON_SCALE, SLOT_SCALE)
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)
    pipette = ctx.load_instrument("flex_8channel_50", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.aspirate(10, vial["A1"].top())
        pipette.dispense(10, vial["A1"].top())
        pipette.aspirate(1, dial["A1"].top())
        pipette.dispense(1, dial["A1"].top())
        pipette.drop_tip(trash)
