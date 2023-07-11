"""Photometric OT3 P1000."""
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "photometric-ot3-p1000-96-1000ul-tip"}
# FIXME: bump to v2.14 to utilize protocol engine
requirements = {"robotType": "OT-3", "apiLevel": "2.13"}

SLOTS_TIPRACK = {
    1000: [5, 6, 8, 9, 11],
}
SLOT_PLATE = 3
SLOT_RESERVOIR = 2

RESERVOIR_LABWARE = "nest_1_reservoir_195ml"
PHOTOPLATE_LABWARE = "corning_96_wellplate_360ul_flat"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tipracks = [
        ctx.load_labware(f"opentrons_ot3_96_tiprack_{size}uL_adp", slot)
        for size, slots in SLOTS_TIPRACK.items()
        for slot in slots
    ]
    reservoir = ctx.load_labware(RESERVOIR_LABWARE, SLOT_RESERVOIR)
    plate = ctx.load_labware(PHOTOPLATE_LABWARE, SLOT_PLATE)
    pipette = ctx.load_instrument("p1000_96", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.aspirate(pipette.min_volume, reservoir["A1"].top())
        pipette.dispense(pipette.min_volume, plate["A1"].top())
        pipette.drop_tip(home_after=False)
