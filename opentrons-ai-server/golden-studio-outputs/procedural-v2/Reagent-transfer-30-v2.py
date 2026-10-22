from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-30-v2',
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
    source_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C1')
    source_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C2')
    destination_1 = protocol.load_labware('nest_1_reservoir_195ml', 'D1')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B2')

    # Trash bin (Flex, apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack])

    # Liquids
    sample_a = protocol.define_liquid(
        name='Sample A',
        description='Liquid in source labware 1',
        display_color='#FF0000',
    )
    sample_b = protocol.define_liquid(
        name='Sample B',
        description='Liquid in source labware 2',
        display_color='#0000FF',
    )

    # Assign liquids to wells before any pipetting
    for well in source_1.wells():
        well.load_liquid(liquid=sample_a, volume=150)
    for well in source_2.wells():
        well.load_liquid(liquid=sample_b, volume=150)

    # Parameters
    transfer_volume = 100  # uL

    # Wells
    source_wells_1 = source_1.wells()
    source_wells_2 = source_2.wells()
    destination_well = destination_1.wells_by_name()['A1']

    # Step 1: pool all wells of source labware 1 into reservoir A1, same tip
    pipette.transfer(transfer_volume, source_wells_1, destination_well, new_tip='once')

    # Step 2: pool all wells of source labware 2 into reservoir A1, same tip
    pipette.transfer(transfer_volume, source_wells_2, destination_well, new_tip='once')
