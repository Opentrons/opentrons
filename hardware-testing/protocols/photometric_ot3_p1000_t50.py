"""Photometric OT3 P1000 T50."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.13"}

RESERVOIR_DYE_WELL = "A1"
RESERVOIR_DILUENT_WELL = "A2"
COLUMN = 1
TEST_VOLUME = 5


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack_50 = ctx.load_labware("opentrons_ot3_96_tiprack_50uL", "11")
    tiprack_200 = ctx.load_labware("opentrons_ot3_96_tiprack_50uL", "10")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "9")
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "8")
    pipette = ctx.load_instrument("p1000_single_gen3", "left", tip_racks=[tiprack_50])
    multi = ctx.load_instrument("p1000_multi_gen3", "right", tip_racks=[tiprack_200])

    pipette.flow_rate.aspirate = 80
    pipette.flow_rate.dispense = 80

    # DILUENT
    multi.pick_up_tip()
    multi.aspirate(200 - TEST_VOLUME, reservoir[RESERVOIR_DILUENT_WELL])
    multi.dispense(200 - TEST_VOLUME, plate[f"A{COLUMN}"])
    multi.drop_tip()
    # DYE
    wells = [plate[f"{row}{COLUMN}"] for row in "ABCDEFGH"]
    for well in wells:
        pipette.pick_up_tip()
        pipette.aspirate(TEST_VOLUME, reservoir[RESERVOIR_DYE_WELL])
        pipette.dispense(TEST_VOLUME, well)
        pipette.drop_tip()
