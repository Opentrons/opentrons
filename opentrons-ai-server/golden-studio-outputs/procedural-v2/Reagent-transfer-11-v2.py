from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-11-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # labware
    source_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 4)
    source_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 5)
    destination_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)

    tiprack300 = protocol.load_labware('opentrons_96_tiprack_300ul', 8)
    tiprack20 = protocol.load_labware('opentrons_96_tiprack_20ul', 11)

    # pipettes
    p300s = protocol.load_instrument('p300_single_gen2', mount='left', tip_racks=[tiprack300])
    p20s = protocol.load_instrument('p20_single_gen2', mount='right', tip_racks=[tiprack20])

    # well setup
    source_wells_1 = [source_1.wells_by_name()[well] for well in ['A1', 'A2']]
    source_wells_2 = [source_2.wells_by_name()[well] for well in ['C4', 'C6']]
    source_wells_3 = [source_2.wells_by_name()[well] for well in ['B6', 'B7']]
    source_wells_4 = [source_2.wells_by_name()[well] for well in ['C4', 'C6']]
    destination_wells_1 = [source_2.wells_by_name()[well] for well in ['B6', 'B7']]
    destination_wells_2 = [source_1.wells_by_name()[well] for well in ['A3', 'A4']]
    destination_wells_3 = [destination_1.wells_by_name()[well] for well in ['A1', 'B1']]
    destination_wells_4 = [destination_2.wells_by_name()[well] for well in ['A1', 'B1']]

    # volume setup
    transfer_vol_1 = 50
    transfer_vol_2 = 15
    transfer_vol_3 = 10
    transfer_vol_4 = 10

    # liquid definitions
    liquid_source_1 = protocol.define_liquid(
        name='Source Labware 1 Reagent',
        description='Reagent originally present in source labware 1 wells A1, A2',
        display_color='#FF0000'
    )
    liquid_source_2 = protocol.define_liquid(
        name='Source Labware 2 Reagent',
        description='Reagent originally present in source labware 2 wells C4, C6, B6, B7',
        display_color='#00FF00'
    )

    # load liquids into wells before they are used as sources
    for well in source_wells_1:
        well.load_liquid(liquid=liquid_source_1, volume=100)

    for well in [source_2.wells_by_name()[w] for w in ['C4', 'C6', 'B6', 'B7']]:
        well.load_liquid(liquid=liquid_source_2, volume=100)

    # commands
    # O. Transfer 50 uL from source labware 1 (A1, A2) to source labware 2 (B6, B7), reuse tip
    p300s.transfer(transfer_vol_1, source_wells_1, destination_wells_1, new_tip='once')

    # P. Transfer 15 uL from source labware 2 (C4, C6) to source labware 1 (A3, A4), reuse tip
    p20s.transfer(transfer_vol_2, source_wells_2, destination_wells_2, new_tip='once')

    # Q. Transfer 10 uL from source labware 2 (B6, B7) to destination labware 1 (A1, B1), new tip each time
    p20s.transfer(transfer_vol_3, source_wells_3, destination_wells_3, new_tip='always')

    # R. Transfer 10 uL from source labware 2 (C4, C6) to destination labware 2 (A1, B1), new tip each time
    p20s.transfer(transfer_vol_4, source_wells_4, destination_wells_4, new_tip='always')
