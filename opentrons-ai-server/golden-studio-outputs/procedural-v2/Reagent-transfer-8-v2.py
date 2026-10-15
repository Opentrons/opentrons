from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-8-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {'robotType': 'OT-2', 'apiLevel': '2.28'}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_rack = protocol.load_labware('opentrons_15_tuberack_nest_15ml_conical', 5)
    dest_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 1)
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 4)

    # Pipette
    p300 = protocol.load_instrument('p300_single_gen2', 'left', tip_racks=[tiprack])

    # Parameters
    transfer_vol = 90  # uL
    num_dest_wells = len(dest_plate.wells())  # 96
    # 96 x 90 uL = 8640 uL, plus 10% overage; fits in a 15 mL tube
    reagent_volume = transfer_vol * num_dest_wells * 1.1

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be dispensed into the destination plate',
        display_color='#33A1FF',
    )

    # Label liquid in the source tube before it is used as a source
    source_well = source_rack.wells_by_name()['A1']
    source_well.load_liquid(liquid=reagent, volume=reagent_volume)

    # Transfer 90 uL from first tube to every well, same tip throughout
    p300.transfer(
        transfer_vol,
        source_well,
        dest_plate.wells(),
        new_tip='once',
    )
