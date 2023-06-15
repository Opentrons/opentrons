"""Photometric OT3 P1000."""
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "gravimetric-ot3-p1000-96-50ul-tip"}
# FIXME: bump to v2.14 to utilize protocol engine
requirements = {"robotType": "OT-3", "apiLevel": "2.13"}

SLOT_SCALE = 4
SLOTS_TIPRACK = {
    # TODO: add slot 12 when tipracks are disposable
    1000: [2, 3, 5, 6, 7, 8, 9, 10, 11],
}
LABWARE_ON_SCALE = "nest_1_reservoir_195ml"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tipracks = [
        ctx.load_labware(f"opentrons_ot3_96_tiprack_{size}uL_adp", slot)
        for size, slots in SLOTS_TIPRACK.items()
        for slot in slots
    ]
    scale_labware = ctx.load_labware(LABWARE_ON_SCALE, SLOT_SCALE)
    pipette = ctx.load_instrument("p1000_96", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.aspirate(pipette.min_volume, scale_labware["A1"].top())
        pipette.dispense(pipette.min_volume, scale_labware["A1"].top())
        pipette.drop_tip(home_after=False)
