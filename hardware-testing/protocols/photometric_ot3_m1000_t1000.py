"""Photometric OT3 M1000 T1000."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.13"}

RESERVOIR_DYE_WELL = "A1"
TEST_VOLUME = 1000
TEST_VOLUME_DIVIDER = 4  # aka: 250uL in each well


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack_1000 = ctx.load_labware("opentrons_ot3_96_tiprack_1000uL", "11")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "9")
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "8")
    pipette = ctx.load_instrument("p1000_multi_gen3", "left", tip_racks=[tiprack_1000])

    pipette.flow_rate.aspirate = 80
    pipette.flow_rate.dispense = 80

    dispense_volume = TEST_VOLUME / TEST_VOLUME_DIVIDER
    assert 200 <= dispense_volume <= 250, f"dispense volume ({dispense_volume}) must be between 200-250 uL"

    num_samples = int(12 / TEST_VOLUME_DIVIDER)
    for s in range(num_samples):
        pipette.pick_up_tip()
        pipette.aspirate(TEST_VOLUME, reservoir[RESERVOIR_DYE_WELL])
        for i in range(TEST_VOLUME_DIVIDER):
            column = f"A{(s * TEST_VOLUME_DIVIDER) + i + 1}"
            pipette.dispense(dispense_volume, plate[column])
        pipette.drop_tip()
