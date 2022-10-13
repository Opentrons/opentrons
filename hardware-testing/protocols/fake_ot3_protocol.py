"""Fake OT3 Protocol."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.13"}


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack_50 = ctx.load_labware("opentrons_ot3_96_tiprack_50uL", "5")
    # tiprack_1000 = ctx.load_labware("opentrons_ot3_96_tiprack_1000uL", "6")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "2")

    pipette = ctx.load_instrument("p1000_multi_gen3", "right", tip_racks=[tiprack_50])

    pipette.pick_up_tip()
    pipette.aspirate(50, plate["A1"])
    pipette.dispense(50, plate["A1"])
    pipette.drop_tip()
