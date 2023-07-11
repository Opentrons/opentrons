"""Gravimetric OT3 P1000."""
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "gravimetric-ot3-p1000"}
# FIXME: bump to v2.14 to utilize protocol engine
requirements = {"robotType": "Flex", "apiLevel": "2.13"}

SLOT_SCALE = 4
SLOTS_TIPRACK = {
    50: [3],
    200: [6],
    1000: [9],
}
LABWARE_ON_SCALE = "radwag_pipette_calibration_vial"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tipracks = [
        ctx.load_labware(f"opentrons_ot3_96_tiprack_{size}uL", slot)
        for size, slots in SLOTS_TIPRACK.items()
        for slot in slots
    ]
    vial = ctx.load_labware(LABWARE_ON_SCALE, SLOT_SCALE)
    pipette = ctx.load_instrument("p1000_single_gen3", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.aspirate(pipette.min_volume, vial["A1"].top())
        pipette.dispense(pipette.min_volume, vial["A1"].top())
        pipette.drop_tip(home_after=False)
