"""Photometric OT3 M1000 T200."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.13"}

RESERVOIR_DYE_WELL_A = "A1"  # 12.6 mL
RESERVOIR_DYE_WELL_B = "A2"  # 12.6 mL
START_COLUMN = 1
END_COLUMN = 12
TEST_VOLUME = 200


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack_200 = ctx.load_labware("opentrons_ot3_96_tiprack_200uL", "11")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "9")
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "8")
    pipette = ctx.load_instrument("p1000_multi_gen3", "left", tip_racks=[tiprack_200])

    columns = [plate[f"A{col}"] for col in range(START_COLUMN, END_COLUMN + 1)]
    count = 0
    for column_first_well in columns:
        if count < 6:
            res_well = reservoir[RESERVOIR_DYE_WELL_A]
        else:
            res_well = reservoir[RESERVOIR_DYE_WELL_B]
        pipette.pick_up_tip()
        pipette.aspirate(TEST_VOLUME, res_well.bottom(3))
        pipette.dispense(TEST_VOLUME, column_first_well.bottom(5))
        pipette.blow_out(column_first_well.top())
        pipette.drop_tip()
        count += 1
