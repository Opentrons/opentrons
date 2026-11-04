from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-26-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('nest_1_reservoir_195ml', 'B1')
    dest_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D1')
    dest_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D2')
    tiprack_a1 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'A1')
    tiprack_a2 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'A2')

    # Trash bin (Flex, apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipette
    p1000_multi = protocol.load_instrument(
        'flex_8channel_1000', 'left', tip_racks=[tiprack_a1, tiprack_a2]
    )

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred from the reservoir to the destination plates',
        display_color='#0000FF',
    )

    # Load liquid into the source reservoir before it is used as a source.
    # Volume covers 8 channels x (50 + 100) uL = 1200 uL, plus excess.
    source_well = source_1['A1']
    source_well.load_liquid(liquid=reagent, volume=5000)

    # Wells (8-channel pipette: use columns)
    source_col = source_1.columns()[0]
    dest_1_col = dest_1.columns()[0]
    dest_2_col = dest_2.columns()[0]

    # Step L: 50 uL from source column 1 to destination 1 column 1, same tip
    p1000_multi.transfer(50, source_col, dest_1_col, new_tip='once')

    # Step M: 100 uL from source column 1 to destination 2 column 1, same tip
    p1000_multi.transfer(100, source_col, dest_2_col, new_tip='once')
