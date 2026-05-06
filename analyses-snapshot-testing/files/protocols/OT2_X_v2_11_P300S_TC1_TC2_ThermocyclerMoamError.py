metadata = {"apiLevel": "2.11"}


def run(protocol_context):
    # Labware Setup
    rt_reagents = protocol_context.load_labware("nest_12_reservoir_15ml", "2")
    p20rack = protocol_context.load_labware("opentrons_96_tiprack_300ul", "3")

    # p300racks = [protocol_context.load_labware(
    # 'opentrons_96_tiprack_20ul', slot) for slot in ['5', '6',]]
    # Pipette Setup
    # p20 = protocol_context.load_instrument('p20_single_gen2', 'left',
    # tip_racks=[p300racks])
    p300 = protocol_context.load_instrument("p300_single_gen2", "right", tip_racks=[p20rack])

    thermocycler = protocol_context.load_module("thermocycler module gen2")
    reaction_plate = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")

    thermocycler_1 = protocol_context.load_module("thermocycler module")
    reaction_plate_1 = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")

    p300.pick_up_tip()
    p300.aspirate(30, reaction_plate["A1"])

    thermocycler.set_block_temperature(70)
    thermocycler.open_lid()
    thermocycler.close_lid()

    protocol_context.delay(minutes=1)
