"""Photometric OT3 M1000 T50."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.13"}

RESERVOIR_DYE_WELL = "A1"
RESERVOIR_DILUENT_WELL = "A2"
START_COLUMN = 1
END_COLUMN = 12
TEST_VOLUME = 5


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack_50 = ctx.load_labware("opentrons_ot3_96_tiprack_50uL", "11")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "9")
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "8")
    pipette = ctx.load_instrument("p1000_multi_gen3", "left", tip_racks=[tiprack_50])

    pipette.flow_rate.aspirate = 80
    pipette.flow_rate.dispense = 80

    columns = [plate[f"A{col}"] for col in range(START_COLUMN, END_COLUMN + 1)]
    # DILUENT
    pipette.pick_up_tip()
    for column_first_well in columns:
        pipette.aspirate(200 - TEST_VOLUME, reservoir[RESERVOIR_DILUENT_WELL])
        pipette.dispense(200 - TEST_VOLUME, column_first_well)
    pipette.drop_tip()
    # DYE
    for column_first_well in columns:
        pipette.pick_up_tip()
        pipette.aspirate(TEST_VOLUME, reservoir[RESERVOIR_DYE_WELL])
        pipette.dispense(TEST_VOLUME, column_first_well)
        pipette.drop_tip()
