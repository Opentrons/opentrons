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
    destination_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D1')
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D2')

    tiprack_1 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'A1')
    tiprack_2 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'A2')

    # Pipette
    p1000m = protocol.load_instrument(
        'flex_8channel_1000',
        mount='left',
        tip_racks=[tiprack_1, tiprack_2]
    )

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Volumes
    transfer_vol_1 = 50
    transfer_vol_2 = 100

    # Wells setup
    source_well_1 = source_1.columns()[0]
    destination_wells_1 = destination_1.columns()[0]
    destination_wells_2 = destination_2.columns()[0]

    # Liquid definitions
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred from reservoir',
        display_color='#00FFF2',
    )

    # Load liquid into the source reservoir (enough for both transfers: 50*8 + 100*8 = 1200 uL)
    source_1.wells_by_name()['A1'].load_liquid(liquid=reagent_liquid, volume=150000)

    # Commands
    # L: Transfer 50 uL from source column 1 to destination 1 column 1, same tip
    p1000m.transfer(transfer_vol_1, source_well_1, destination_wells_1, new_tip='once')

    # M: Transfer 100 uL from source column 1 to destination 2 column 1, same tip
    p1000m.transfer(transfer_vol_2, source_well_1, destination_wells_2, new_tip='once')
