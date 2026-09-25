from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-30-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C1')
    source_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C2')
    destination_1 = protocol.load_labware('nest_1_reservoir_195ml', 'D1')
    tiprack_200 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B2')

    # Pipette
    p1000s = protocol.load_instrument('flex_1channel_1000', mount='left', tip_racks=[tiprack_200])

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Define liquids
    reagent_1 = protocol.define_liquid(
        name='Reagent 1',
        description='Reagent liquid in source labware 1',
        display_color='#FF0000'
    )
    reagent_2 = protocol.define_liquid(
        name='Reagent 2',
        description='Reagent liquid in source labware 2',
        display_color='#0000FF'
    )

    # Assign liquids to source wells before pipetting
    for well in source_1.wells():
        well.load_liquid(liquid=reagent_1, volume=100)
    for well in source_2.wells():
        well.load_liquid(liquid=reagent_2, volume=100)

    # wells setup
    source_wells_1 = source_1.wells()
    source_wells_2 = source_2.wells()
    destination_well = destination_1.wells_by_name()['A1']

    # volumes setup
    transfer_vol = 100

    # Command 1: pool from source labware 1 into destination well A1
    p1000s.transfer(transfer_vol, source_wells_1, destination_well, new_tip='once')

    # Command 2: pool from source labware 2 into destination well A1
    p1000s.transfer(transfer_vol, source_wells_2, destination_well, new_tip='once')
