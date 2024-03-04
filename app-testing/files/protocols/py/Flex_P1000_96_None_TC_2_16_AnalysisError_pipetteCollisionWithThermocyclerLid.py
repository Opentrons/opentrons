# Pulled from: https://github.com/Opentrons/opentrons/pull/14547


from opentrons.protocol_api import COLUMN

requirements = {"robotType": "Flex", "apiLevel": "2.16"}


def run(ctx):
    tip_rack1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B3", adapter="opentrons_flex_96_tiprack_adapter")
    tip_rack2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
    instrument = ctx.load_instrument("flex_96channel_1000", mount="left")

    my_pcr_plate = ctx.load_labware("nest_96_wellplate_200ul_flat", "C2")
    my_other_plate = ctx.load_labware("nest_96_wellplate_200ul_flat", "C1")

    thermocycler = ctx.load_module("thermocyclerModuleV2")
    tc_adjacent_plate = ctx.load_labware("nest_96_wellplate_200ul_flat", "A2")
    ctx.load_trash_bin("A3")

    instrument.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tip_rack2])

    instrument.pick_up_tip()
    instrument.aspirate(50, my_pcr_plate.wells_by_name()["A4"])
    instrument.dispense(20, my_other_plate.wells_by_name()["A2"])

    # Should error out because conflict with thermocycler lid
    instrument.dispense(20, tc_adjacent_plate.wells_by_name()["A1"])

    instrument.drop_tip()
