from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-3-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}

def run(protocol: protocol_api.ProtocolContext):
    # Labware
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 2)
    source_rack = protocol.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 3)
    dest_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 9)

    # Pipette
    p20 = protocol.load_instrument('p20_single_gen2', mount='right', tip_racks=[tiprack])

    # Wells
    source_well = source_rack.wells_by_name()['A1']
    destination_wells = dest_plate.wells()

    # Define liquid
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination plate',
        display_color='#FF0000'
    )

    # Load liquid into source well (1 ul per well x 96 wells + buffer)
    source_well.load_liquid(liquid=reagent_liquid, volume=200)

    # Commands
    p20.transfer(
        1,
        source_well,
        destination_wells,
        new_tip='once'
    )
