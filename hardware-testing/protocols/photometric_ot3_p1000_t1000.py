"""Photometric OT3 P1000 T1000."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.13"}

RESERVOIR_DYE_WELL = "A1"
COLUMN = 1  # which column to dispense dye
TEST_VOLUME = 1000
TEST_VOLUME_DIVIDER = 4  # aka: 250uL in each well


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack_1000 = ctx.load_labware("opentrons_ot3_96_tiprack_1000uL", "11")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "9")
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "8")
    pipette = ctx.load_instrument("p1000_single_gen3", "left", tip_racks=[tiprack_1000])

    all_rows = "ABCDEFGH"
    num_samples = int(len(all_rows) / TEST_VOLUME_DIVIDER)

    dispense_volume = TEST_VOLUME / TEST_VOLUME_DIVIDER
    for s in range(num_samples):
        pipette.pick_up_tip()
        pipette.aspirate(TEST_VOLUME, reservoir[RESERVOIR_DYE_WELL])
        for i in range(TEST_VOLUME_DIVIDER):
            row = (s * TEST_VOLUME_DIVIDER) + i + 1
            well = plate[f"{row}{COLUMN}"]
            pipette.dispense(dispense_volume, well)
            pipette.drop_tip()
