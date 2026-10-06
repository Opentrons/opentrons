from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-28-v2',
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
    destination_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D1')
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D2')

    tiprack200 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B2')
    tiprack50 = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'A2')

    # Pipettes
    p1000s = protocol.load_instrument('flex_1channel_1000', mount='left', tip_racks=[tiprack200])
    p50s = protocol.load_instrument('flex_1channel_50', mount='right', tip_racks=[tiprack50])

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Well setup
    source_wells_1 = [source_1.wells_by_name()[well] for well in ['A1', 'A2']]
    source_wells_2 = [source_2.wells_by_name()[well] for well in ['C4', 'C6']]
    source_wells_3 = [source_2.wells_by_name()[well] for well in ['B6', 'B7']]
    source_wells_4 = [source_2.wells_by_name()[well] for well in ['C4', 'C6']]
    destination_wells_1 = [source_2.wells_by_name()[well] for well in ['B6', 'B7']]
    destination_wells_2 = [source_1.wells_by_name()[well] for well in ['A3', 'A4']]
    destination_wells_3 = [destination_1.wells_by_name()[well] for well in ['A1', 'B1']]
    destination_wells_4 = [destination_2.wells_by_name()[well] for well in ['A1', 'B1']]

    # Volume setup
    transfer_vol_1 = 50
    transfer_vol_2 = 15
    transfer_vol_3 = 10
    transfer_vol_4 = 10

    # Liquid definitions
    reagent_1 = protocol.define_liquid(
        name='Reagent 1',
        description='Reagent starting in source labware 1, wells A1 and A2',
        display_color='#FF0000'
    )
    reagent_2 = protocol.define_liquid(
        name='Reagent 2',
        description='Reagent starting in source labware 2, wells C4 and C6',
        display_color='#00FF00'
    )

    # Load liquids into wells before they are used as sources
    for well in source_wells_1:
        well.load_liquid(liquid=reagent_1, volume=100)

    for well in source_wells_2:
        well.load_liquid(liquid=reagent_2, volume=100)

    # Commands
    # O: Transfer 50 uL from source labware 1 (A1, A2) to source labware 2 (B6, B7), same tip
    p1000s.transfer(transfer_vol_1, source_wells_1, destination_wells_1, new_tip='once')

    # P: Transfer 15 uL from source labware 2 (C4, C6) to source labware 1 (A3, A4), same tip
    p50s.transfer(transfer_vol_2, source_wells_2, destination_wells_2, new_tip='once')

    # Q: Transfer 10 uL from source labware 2 (B6, B7) to destination labware 1 (A1, B1), new tip each
    p50s.transfer(transfer_vol_3, source_wells_3, destination_wells_3, new_tip='always')

    # R: Transfer 10 uL from source labware 2 (C4, C6) to destination labware 2 (A1, B1), new tip each
    p50s.transfer(transfer_vol_4, source_wells_4, destination_wells_4, new_tip='always')
