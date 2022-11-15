"""Photometric OT3 P1000 T200."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.13"}

RESERVOIR_DYE_WELL = "A1"
COLUMN = 1  # which column to dispense dye
TEST_VOLUME = 200


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack_200 = ctx.load_labware("opentrons_ot3_96_tiprack_200uL", "11")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "9")
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "8")
    pipette = ctx.load_instrument("p1000_single_gen3", "left", tip_racks=[tiprack_200])

    wells = [plate[f"{row}{COLUMN}"] for row in "ABCDEFGH"]
    for well in wells:
        pipette.pick_up_tip()
        pipette.aspirate(TEST_VOLUME, reservoir[RESERVOIR_DYE_WELL])
        pipette.dispense(TEST_VOLUME, well)
        pipette.drop_tip()
