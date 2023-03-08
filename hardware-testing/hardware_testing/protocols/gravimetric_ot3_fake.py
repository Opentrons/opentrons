"""Fake Gravimetric OT3."""
from opentrons.protocol_api import ProtocolContext

# FIXME: bump to v2.14 to utilize protocol engine
metadata = {"apiLevel": "2.13", "protocolName": "gravimetric-ot3-fake"}

SLOT_VIAL = 4
SLOTS_TIPRACK = {
    50: [3],
    200: [4],
    1000: [5],
}


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tipracks = [
        ctx.load_labware(f"opentrons_ot3_96_tiprack_{size}uL", slot)
        for size, slots in SLOTS_TIPRACK.items()
        for slot in slots
    ]
    vial = ctx.load_labware("radwag_pipette_calibration_vial", SLOT_VIAL)
    pipette = ctx.load_instrument("p1000_single_gen3", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.aspirate(pipette.min_volume, vial["A1"])
        pipette.dispense(pipette.min_volume, vial["A1"])
        pipette.drop_tip()
