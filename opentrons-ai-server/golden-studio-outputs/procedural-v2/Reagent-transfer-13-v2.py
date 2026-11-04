from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-13-v2',
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
    destination_1 = protocol.load_labware('nest_1_reservoir_195ml', 1)
    tiprack_1 = protocol.load_labware('opentrons_96_tiprack_300ul', 8)

    # Pipette
    p300 = protocol.load_instrument('p300_single_gen2', 'left', tip_racks=[tiprack_1])

    # Liquids
    sample_a = protocol.define_liquid(
        name='Sample A',
        description='Liquid in source labware 1 (slot 4)',
        display_color='#FF0000',
    )
    sample_b = protocol.define_liquid(
        name='Sample B',
        description='Liquid in source labware 2 (slot 5)',
        display_color='#0000FF',
    )
    pooled = protocol.define_liquid(
        name='Pooled liquid',
        description='Pool of Sample A and Sample B in the reservoir',
        display_color='#8000FF',
    )

    # Assumed starting volumes (uL) - labels only, adjust to actual volumes
    source_1.load_liquid(wells=source_1.wells(), volume=200, liquid=sample_a)
    source_2.load_liquid(wells=source_2.wells(), volume=200, liquid=sample_b)
    destination_1.load_liquid(wells=[destination_1['A1']], volume=0, liquid=pooled)

    # Volumes and wells
    transfer_vol = 100
    pool_well = destination_1.wells_by_name()['A1']

    # Step L: pool source labware 1 into first well of destination, same tip
    p300.transfer(transfer_vol, source_1.wells(), pool_well, new_tip='once')

    # Step M: pool source labware 2 into first well of destination, same tip
    p300.transfer(transfer_vol, source_2.wells(), pool_well, new_tip='once')
