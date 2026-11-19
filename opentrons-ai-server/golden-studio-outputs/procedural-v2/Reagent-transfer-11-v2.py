from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-11-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 4)
    source_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 5)
    destination_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)
    tiprack_300 = protocol.load_labware('opentrons_96_tiprack_300ul', 8)
    tiprack_20 = protocol.load_labware('opentrons_96_tiprack_20ul', 11)

    # Pipettes
    p300 = protocol.load_instrument('p300_single_gen2', 'left', tip_racks=[tiprack_300])
    p20 = protocol.load_instrument('p20_single_gen2', 'right', tip_racks=[tiprack_20])

    # Liquids
    reagent_a = protocol.define_liquid(
        name='Reagent A',
        description='Reagent in source labware 1',
        display_color='#FF0000',
    )
    reagent_b = protocol.define_liquid(
        name='Reagent B',
        description='Reagent in source labware 2',
        display_color='#0000FF',
    )

    # Label starting liquids before any pipetting
    for well_name in ['A1', 'A2']:
        source_1[well_name].load_liquid(liquid=reagent_a, volume=200)
    for well_name in ['B6', 'B7', 'C4', 'C6']:
        source_2[well_name].load_liquid(liquid=reagent_b, volume=200)

    # Volumes
    vol_o = 50
    vol_p = 15
    vol_q = 10
    vol_r = 10

    # Wells
    src_wells_o = [source_1[w] for w in ['A1', 'A2']]
    dest_wells_o = [source_2[w] for w in ['B6', 'B7']]

    src_wells_p = [source_2[w] for w in ['C4', 'C6']]
    dest_wells_p = [source_1[w] for w in ['A3', 'A4']]

    src_wells_q = [source_2[w] for w in ['B6', 'B7']]
    dest_wells_q = [destination_1[w] for w in ['A1', 'B1']]

    src_wells_r = [source_2[w] for w in ['C4', 'C6']]
    dest_wells_r = [destination_2[w] for w in ['A1', 'B1']]

    # Step O: P300, reuse the same tip
    p300.transfer(vol_o, src_wells_o, dest_wells_o, new_tip='once')

    # Step P: P20, reuse the same tip
    p20.transfer(vol_p, src_wells_p, dest_wells_p, new_tip='once')

    # Step Q: P20, new tip each time
    p20.transfer(vol_q, src_wells_q, dest_wells_q, new_tip='always')

    # Step R: P20, new tip each time
    p20.transfer(vol_r, src_wells_r, dest_wells_r, new_tip='always')
