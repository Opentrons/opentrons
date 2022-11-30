"""Photometric OT3 M50 T50."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.13"}

RESERVOIR_DYE_WELL = "A4"
RESERVOIR_DILUENT_WELL_A = "A2"
RESERVOIR_DILUENT_WELL_B = "A3"
START_COLUMN = 1
END_COLUMN = 12
TEST_VOLUME = 5


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack_50_a = ctx.load_labware("opentrons_ot3_96_tiprack_50uL", "11")
    tiprack_50_b = ctx.load_labware("opentrons_ot3_96_tiprack_200uL", "10")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "9")
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "8")
    pipette = ctx.load_instrument("p50_multi_gen3", "left", tip_racks=[tiprack_50_a])

    columns = [plate[f"A{col}"] for col in range(START_COLUMN, END_COLUMN + 1)]
    # DILUENT
    pipette.pick_up_tip(tiprack_50_b["A1"])
    count = 0
    for column_first_well in columns:
        if count < 6:
            res_well = reservoir[RESERVOIR_DILUENT_WELL_A]
        else:
            res_well = reservoir[RESERVOIR_DILUENT_WELL_B]
        pipette.aspirate(200 - TEST_VOLUME, res_well.bottom(3))
        pipette.dispense(200 - TEST_VOLUME, column_first_well.bottom(5))
        pipette.blow_out(column_first_well.top())
        count += 1
    pipette.drop_tip()
    # DYE
    for column_first_well in columns:
        pipette.pick_up_tip()
        pipette.aspirate(TEST_VOLUME, reservoir[RESERVOIR_DYE_WELL].bottom(3))
        pipette.dispense(TEST_VOLUME, column_first_well.bottom(5))
        pipette.blow_out(column_first_well.top())
        pipette.drop_tip()
