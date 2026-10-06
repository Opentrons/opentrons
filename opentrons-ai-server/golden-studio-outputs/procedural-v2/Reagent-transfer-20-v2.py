from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-20-v2',
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
    source_1 = protocol.load_labware('nest_1_reservoir_195ml', 'B1')
    source_2 = protocol.load_labware('biorad_384_wellplate_50ul', 'B2')
    source_3 = protocol.load_labware('biorad_96_wellplate_200ul_pcr', 'B3')
    destination_1 = protocol.load_labware('corning_384_wellplate_112ul_flat', 'D1')
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D2')

    tiprack_200 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'A1')
    tiprack_50 = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'A2')

    # Pipettes
    p1000s = protocol.load_instrument('flex_1channel_1000', mount='right', tip_racks=[tiprack_200])
    p50s = protocol.load_instrument('flex_1channel_50', mount='left', tip_racks=[tiprack_50])

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Define liquids
    reagent_1 = protocol.define_liquid(
        name='Reagent 1',
        description='Reagent in source labware 1 reservoir',
        display_color='#33FF33'
    )
    reagent_2 = protocol.define_liquid(
        name='Reagent 2',
        description='Reagent in source labware 2 (384-well plate)',
        display_color='#FF5733'
    )
    reagent_3 = protocol.define_liquid(
        name='Reagent 3',
        description='Reagent in source labware 3 (96-well PCR plate)',
        display_color='#3357FF'
    )

    # Load liquids into wells before pipetting
    source_1.wells_by_name()['A1'].load_liquid(liquid=reagent_1, volume=180000)

    for well in source_2.wells():
        well.load_liquid(liquid=reagent_2, volume=45)

    for well in source_3.wells():
        well.load_liquid(liquid=reagent_3, volume=180)

    # wells setup
    source_wells_1 = source_1.wells_by_name()['A1']
    source_wells_2 = source_2.wells()
    source_wells_3 = source_3.wells()
    destination_wells_1 = destination_1.wells()
    destination_wells_2 = destination_2.wells()
    all_destinations = destination_wells_1 + destination_wells_2

    # Commands
    # P: transfer 15 uL from source 1 to all wells in dest 1 and dest 2, same tip
    p50s.transfer(15, source_wells_1, all_destinations, new_tip='once')

    # Q: transfer 20 uL from each well in source 2 to each well in dest 1, same tip
    p50s.transfer(20, source_wells_2, destination_wells_1, new_tip='once')

    # R: transfer 100 uL from each well in source 3 to each well in dest 2, new tip each time
    p1000s.transfer(100, source_wells_3, destination_wells_2, new_tip='always')
