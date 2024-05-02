"""Liquid Sense OT3."""
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "liquid_sense-ot3-p50-multi-50ul-tip"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

SLOT_SCALE = 4
SLOT_DIAL = 5
SLOTS_TIPRACK = {
    50: [3],
}
LABWARE_ON_SCALE = "nest_1_reservoir_195ml"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tipracks = [
        ctx.load_labware(f"opentrons_flex_96_tiprack_{size}uL", slot)
        for size, slots in SLOTS_TIPRACK.items()
        for slot in slots
    ]
    vial = ctx.load_labware(LABWARE_ON_SCALE, SLOT_SCALE)
    pipette = ctx.load_instrument("flex_8channel_50", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.aspirate(pipette.min_volume, vial["A1"].top())
        pipette.dispense(pipette.min_volume, vial["A1"].top())
        pipette.drop_tip(home_after=False)
